import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const serverDir = path.join(rootDir, "portfolio_project_server_flask");
const clientDir = path.join(rootDir, "portfolio_project_client_vite");
const envPath = path.join(rootDir, ".env");
const clientEnvPath = path.join(clientDir, ".env.development");
const isWindows = process.platform === "win32";

const defaultEnv = `APP_ENV=development
SERVER_CODE=PORTFOLIO_API

# Docker MySQL published to the host
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=portfolio
MYSQL_USER=carsh0712
MYSQL_PASSWORD=dsc111march03

JWT_SECRET_KEY=dev-local-portfolio-secret-change-before-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

UPLOAD_DIR=./uploads
CLIENT_DIST_DIR=../portfolio_project_client_vite/dist
MANUAL_PUBLIC=true
MAX_FILE_SIZE=10485760

DB_MAX_RETRIES=2
DB_RETRY_DELAY=3
DB_POOL_RECYCLE=1800
DB_SQL_ECHO=false
`;

const defaultClientEnv = `VITE_API_BASE_URL=http://localhost:8000
`;

function log(message) {
  console.log(`[setup] ${message}`);
}

function parseEnv(content) {
  const values = new Map();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }
  return values;
}

function parseEnvLines(content) {
  const values = new Map();
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, { index, value });
  });

  return { lines, values };
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`$ ${[command, ...args].join(" ")}`);
    const child = spawn(command, args, {
      cwd: options.cwd || rootDir,
      env: { ...process.env, ...(options.env || {}) },
      shell: options.shell || false,
      stdio: options.stdio || "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

async function commandSucceeds(command, args, options = {}) {
  try {
    await run(command, args, { ...options, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function ensureEnvDefaults(filePath, defaults, label) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, defaults, "utf8");
    log(`created ${label}: ${path.relative(rootDir, filePath)}`);
    return true;
  }

  const defaultsMap = parseEnv(defaults);
  const currentContent = readFileSync(filePath, "utf8");
  const { lines, values } = parseEnvLines(currentContent);
  const missing = [];
  const filled = [];

  for (const [key, defaultValue] of defaultsMap.entries()) {
    const current = values.get(key);
    if (!current) {
      missing.push(`${key}=${defaultValue}`);
      continue;
    }

    if (current.value === "") {
      lines[current.index] = `${key}=${defaultValue}`;
      filled.push(key);
    }
  }

  if (missing.length === 0 && filled.length === 0) {
    log(`${label} already exists: ${path.relative(rootDir, filePath)}`);
    return false;
  }

  let nextContent = lines.join("\n").replace(/\s*$/, "\n");
  if (missing.length > 0) {
    nextContent += `\n# Added by npm run setup\n${missing.join("\n")}\n`;
  }

  writeFileSync(filePath, nextContent, "utf8");

  const changes = [
    missing.length > 0 ? `${missing.length} missing value(s)` : "",
    filled.length > 0 ? `${filled.length} empty value(s)` : "",
  ].filter(Boolean).join(", ");
  log(`updated ${label}: ${changes}`);
  return true;
}

function pythonExecutable() {
  const venvPython = isWindows
    ? path.join(serverDir, ".venv", "Scripts", "python.exe")
    : path.join(serverDir, ".venv", "bin", "python");
  return venvPython;
}

async function ensureBackendVenv() {
  const python = pythonExecutable();
  if (!existsSync(python)) {
    const candidates = isWindows ? ["py", "python"] : ["python3", "python"];
    let created = false;
    for (const candidate of candidates) {
      if (await commandSucceeds(candidate, ["-m", "venv", ".venv"], { cwd: serverDir })) {
        created = true;
        break;
      }
    }
    if (!created) {
      throw new Error("Python was not found. Install Python and rerun npm run setup.");
    }
  } else {
    log("backend virtualenv already exists");
  }

  await run(python, ["-m", "pip", "install", "-r", "requirements.txt"], { cwd: serverDir });
}

async function ensureFrontendDependencies() {
  const nodeModulesPath = path.join(clientDir, "node_modules");
  if (existsSync(nodeModulesPath)) {
    log("frontend node_modules already exists");
    return;
  }

  await run("npm", ["install"], { cwd: clientDir });
}

async function waitForMysql(envValues) {
  const rootPassword = envValues.get("MYSQL_PASSWORD") || "dsc111march03";
  const attempts = 40;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const ready = await commandSucceeds(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "mysql8",
        "mysqladmin",
        "ping",
        "-h",
        "127.0.0.1",
        "-uroot",
        `-p${rootPassword}`,
        "--silent",
      ],
      { cwd: rootDir }
    );

    if (ready) {
      log("MySQL is ready");
      return;
    }

    log(`waiting for MySQL (${attempt}/${attempts})`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("MySQL did not become ready in time.");
}

async function main() {
  log("preparing local development environment");

  ensureEnvDefaults(envPath, defaultEnv, ".env");
  mkdirSync(clientDir, { recursive: true });
  ensureEnvDefaults(clientEnvPath, defaultClientEnv, "frontend .env.development");

  const envValues = parseEnv(readFileSync(envPath, "utf8"));

  await ensureFrontendDependencies();
  await run("docker", ["compose", "up", "-d", "mysql8"], { cwd: rootDir });
  await waitForMysql(envValues);
  await ensureBackendVenv();

  const setupEnv = {
    APP_ENV: envValues.get("APP_ENV") || "development",
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1",
  };
  await run(pythonExecutable(), ["scripts/reset_db.py"], { cwd: rootDir, env: setupEnv });

  log("setup complete");
  log("run npm run dev to start the app");
}

main().catch((error) => {
  console.error(`[setup] ${error.message}`);
  process.exit(1);
});
