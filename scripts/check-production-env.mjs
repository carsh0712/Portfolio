import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const defaultEnvFile = path.join(rootDir, "portfolio_project_server_flask", ".env.production");

const placeholders = new Set([
  "",
  "change-this-password",
  "use-a-secure-password",
  "change-this-to-a-long-random-secret",
  "use-a-long-random-production-secret",
  "fallback-secret-change-me",
  "dsc111",
  "your-production-db-host",
]);

function parseArgs(argv) {
  const args = {
    envFile: defaultEnvFile,
    corsOrigins: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--env-path") {
      args.envFile = path.resolve(argv[index + 1] || "");
      index += 1;
    } else if (arg === "--cors-origin") {
      args.corsOrigins.push(argv[index + 1] || "");
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/check-production-env.mjs
  node scripts/check-production-env.mjs --env-path portfolio_project_server_flask/.env.production
  node scripts/check-production-env.mjs --cors-origin https://portfolio.example.com

Options:
  --env-path       Environment file to validate
  --cors-origin    Required public origin. Repeat for multiple origins.`);
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const env = {};
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }
    const [key, ...valueParts] = line.split("=");
    env[key.trim()] = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function mergedEnv(envFile) {
  return {
    ...process.env,
    ...parseEnvFile(envFile),
  };
}

function isSet(value) {
  return typeof value === "string" && value.trim() !== "" && !placeholders.has(value.trim());
}

function isInt(value, min, max = Number.MAX_SAFE_INTEGER) {
  if (!/^\d+$/.test(String(value || ""))) {
    return false;
  }
  const parsed = Number(value);
  return parsed >= min && parsed <= max;
}

function isAbsoluteUploadPath(value) {
  return isSet(value) && path.isAbsolute(value);
}

function addRequired(errors, env, key, message, validator = isSet) {
  if (!validator(env[key])) {
    errors.push(`${key}: ${message}`);
  }
}

function validate(env, corsOrigins) {
  const errors = [];
  const warnings = [];

  addRequired(errors, env, "APP_ENV", "production으로 설정해야 합니다.", (value) => value === "production");
  addRequired(errors, env, "SERVER_CODE", "CORS 조회에 사용할 서버 코드를 설정해야 합니다.");

  addRequired(errors, env, "MYSQL_HOST", "운영 DB host를 설정해야 합니다.");
  addRequired(errors, env, "MYSQL_PORT", "1~65535 범위의 포트를 설정해야 합니다.", (value) => isInt(value, 1, 65535));
  addRequired(errors, env, "MYSQL_DB", "운영 DB 이름을 설정해야 합니다.");
  addRequired(errors, env, "MYSQL_USER", "운영 DB 사용자를 설정해야 합니다.");
  addRequired(errors, env, "MYSQL_PASSWORD", "실제 운영 DB 비밀번호를 설정해야 합니다.");

  addRequired(errors, env, "JWT_SECRET_KEY", "32자 이상의 안전한 JWT secret을 설정해야 합니다.", (value) => isSet(value) && value.length >= 32);
  addRequired(errors, env, "JWT_ALGORITHM", "JWT 알고리즘을 설정해야 합니다.");
  addRequired(errors, env, "JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "양의 정수로 설정해야 합니다.", (value) => isInt(value, 1));
  addRequired(errors, env, "JWT_REFRESH_TOKEN_EXPIRE_DAYS", "양의 정수로 설정해야 합니다.", (value) => isInt(value, 1));

  addRequired(errors, env, "UPLOAD_DIR", "운영 업로드 경로를 절대 경로로 설정해야 합니다.", isAbsoluteUploadPath);
  addRequired(errors, env, "MAX_FILE_SIZE", "양의 정수 byte 값으로 설정해야 합니다.", (value) => isInt(value, 1));
  addRequired(errors, env, "DB_MAX_RETRIES", "양의 정수로 설정해야 합니다.", (value) => isInt(value, 1));
  addRequired(errors, env, "DB_RETRY_DELAY", "0 이상의 정수로 설정해야 합니다.", (value) => isInt(value, 0));

  if (env.CLIENT_DIST_DIR && !isSet(env.CLIENT_DIST_DIR)) {
    errors.push("CLIENT_DIST_DIR: placeholder가 아닌 실제 클라이언트 빌드 경로를 설정해야 합니다.");
  }
  if (!env.CLIENT_DIST_DIR) {
    warnings.push("CLIENT_DIST_DIR이 설정되지 않았습니다. 기본값 portfolio_project_client_vite/dist를 사용합니다.");
  } else if (!path.isAbsolute(env.CLIENT_DIST_DIR)) {
    warnings.push("CLIENT_DIST_DIR이 상대 경로입니다. 프로젝트 루트 기준으로 해석됩니다.");
  }

  const origins = corsOrigins.filter(Boolean);
  if (origins.length === 0) {
    errors.push("CORS: 운영 공개 origin을 --cors-origin으로 1개 이상 지정해야 합니다.");
  }
  for (const origin of origins) {
    try {
      const parsed = new URL(origin);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        errors.push(`CORS: origin은 http 또는 https URL이어야 합니다. (${origin})`);
      }
    } catch {
      errors.push(`CORS: origin URL 형식이 올바르지 않습니다. (${origin})`);
    }
  }

  if (env.MYSQL_HOST === "localhost" || env.MYSQL_HOST === "127.0.0.1") {
    warnings.push("MYSQL_HOST가 localhost입니다. 운영 서버에서 의도한 설정인지 확인하세요.");
  }
  if (env.JWT_ALGORITHM && env.JWT_ALGORITHM !== "HS256") {
    warnings.push("JWT_ALGORITHM이 HS256이 아닙니다. 서버 코드와 호환되는지 확인하세요.");
  }

  return { errors, warnings, origins };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = mergedEnv(args.envFile);
  const { errors, warnings, origins } = validate(env, args.corsOrigins);

  console.log(`Environment file: ${args.envFile}`);

  if (warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of warnings) {
      console.log(`  - ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.log("\nDeployment environment check failed:");
    for (const error of errors) {
      console.log(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log("\nDeployment environment check passed.");
  console.log("\nCORS registration SQL:");
  for (const origin of origins) {
    console.log(`  INSERT INTO cors_origin (server_code, origin, created_at) VALUES ('${env.SERVER_CODE}', '${origin}', NOW());`);
  }
}

main();
