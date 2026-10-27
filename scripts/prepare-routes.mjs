import { mkdir, readFile, writeFile } from "node:fs/promises";

// GitHub Pages needs a real directory to serve direct visits and refreshes.
const html = await readFile("dist/client/index.html", "utf8");
await mkdir("dist/client/slide", { recursive: true });
await writeFile(
  "dist/client/slide/index.html",
  html.replace(
    "<title>TechManager — Central de chamados</title>",
    "<title>Conheça o TechManager — Aula prática</title>",
  ),
);
console.log("Prepared direct lesson route: /slide/");
