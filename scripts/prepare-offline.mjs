import { readdir, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
const files = [];
async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = folder + "/" + entry.name;
    if (entry.isDirectory()) await walk(path);
    else if (
      /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(entry.name) &&
      !path.includes("service-worker") &&
      !path.includes("/docs/") &&
      !path.includes("pwa.js")
    )
      files.push(path.replace(/^public\//, ""));
  }
}
await walk("public/windows");
await walk("public/assets");
files.push("windows/index.html");
files.sort();
const hash = createHash("sha256");
let bytes = 0;
for (const file of files) {
  hash.update(await readFile("public/" + file));
  bytes += (await stat("public/" + file)).size;
}
await writeFile(
  "public/offline-manifest.json",
  JSON.stringify({ version: hash.digest("hex").slice(0, 12), bytes, files }),
);
console.log(
  `Offline bundle: ${files.length} resources, ${(bytes / 1048576).toFixed(2)} MiB, served by Pages`,
);
