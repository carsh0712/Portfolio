import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const clientDir = path.join(rootDir, "portfolio_project_client_vite");
const serverDir = path.join(rootDir, "portfolio_project_server_flask");
const isWindows = process.platform === "win32";

const commonEnv = {
  ...process.env,
  APP_ENV: process.env.APP_ENV || "development",
  PYTHONIOENCODING: "utf-8",
  PYTHONUTF8: "1",
};

function prefixOutput(stream, prefix, target) {
  let pending = "";

  stream.on("data", (chunk) => {
    pending += chunk.toString("utf8");
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() || "";

    for (const line of lines) {
      target.write(`[${prefix}] ${line}\n`);
    }
  });

  stream.on("end", () => {
    if (pending) {
      target.write(`[${prefix}] ${pending}\n`);
    }
  });
}

function startProcess(label, command, args, cwd, options = {}) {
  const child = spawn(command, args, {
    cwd,
    env: commonEnv,
    shell: options.shell || false,
    stdio: ["inherit", "pipe", "pipe"],
  });

  prefixOutput(child.stdout, label, process.stdout);
  prefixOutput(child.stderr, label, process.stderr);

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.log(`[dev] ${label} exited with ${reason}`);
    stopAll(code || 1);
  });

  child.on("error", (error) => {
    console.error(`[dev] failed to start ${label}: ${error.message}`);
    stopAll(1);
  });

  children.push(child);
  return child;
}

function backendCommand() {
  if (isWindows) {
    return {
      command: "cmd.exe",
      args: ["/d", "/c", path.join(rootDir, "scripts", "dev_backend.bat")],
    };
  }

  const pythonPath = path.join(serverDir, ".venv", "bin", "python");
  return existsSync(pythonPath)
    ? { command: pythonPath, args: ["app.py"] }
    : { command: "python", args: ["app.py"] };
}

function startFrontend() {
  if (isWindows) {
    return startProcess("frontend", "cmd.exe", ["/d", "/c", "npm run dev"], clientDir);
  }

  return startProcess("frontend", "npm", ["run", "dev"], clientDir);
}

function startBackend() {
  const { command, args } = backendCommand();
  return startProcess("backend", command, args, serverDir);
}

function stopAll(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  setTimeout(() => process.exit(exitCode), 200);
}

const children = [];
let shuttingDown = false;
const target = process.argv[2] || "all";

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

if (target === "backend") {
  startBackend();
} else {
  console.log("[dev] starting frontend and backend");
  console.log(`[dev] APP_ENV=${commonEnv.APP_ENV}`);
  startFrontend();
  startBackend();
}
