const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const frontendDir = path.join(rootDir, "frontend-react");
const isWindows = process.platform === "win32";

const children = [];
let shuttingDown = false;

function runProcess(name, command, args, cwd, extraOptions = {}) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: extraOptions.shell || false,
    env: { ...process.env, ...(extraOptions.env || {}) },
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;

    const reason = signal
      ? `${name} stopped with signal ${signal}`
      : `${name} exited with code ${code}`;

    console.log(`\n[dev] ${reason}`);
    shutdown(code || 0);
  });

  child.on("error", (error) => {
    if (shuttingDown) return;
    console.error(`\n[dev] Failed to start ${name}:`, error.message);
    shutdown(1);
  });

  children.push(child);
  return child;
}

function killChild(child) {
  if (!child || child.killed) return;

  if (isWindows) {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      shell: false,
    });
    return;
  }

  child.kill("SIGINT");
}

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    killChild(child);
  }

  setTimeout(() => process.exit(exitCode), 400);
}

if (process.argv.includes("--help")) {
  console.log("Starts backend and React frontend together for local development.");
  console.log("Usage: npm run dev");
  process.exit(0);
}

console.log("[dev] Starting backend on http://localhost:3000");
runProcess("backend", process.execPath, ["backend/server.js"], rootDir);

console.log("[dev] Starting React frontend on http://localhost:3001 (default CRA port)");
if (isWindows) {
  runProcess("frontend", "npm", ["start"], frontendDir, {
    shell: true,
    env: { PORT: process.env.PORT || "3001" },
  });
} else {
  runProcess("frontend", "npm", ["start"], frontendDir, {
    env: { PORT: process.env.PORT || "3001" },
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
