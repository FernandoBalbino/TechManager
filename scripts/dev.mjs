import { spawn } from "node:child_process";
const children = [
  spawn(process.execPath, ["server/index.mjs"], { stdio: "inherit" }),
  spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "0.0.0.0"],
    { stdio: "inherit" },
  ),
];
for (const event of ["SIGINT", "SIGTERM"])
  process.on(event, () => {
    children.forEach((c) => c.kill());
    process.exit();
  });
children.forEach((c) =>
  c.on("exit", (code) => {
    if (code) {
      children.forEach((x) => x.kill());
      process.exit(code);
    }
  }),
);
