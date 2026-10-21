import test from "node:test";
import assert from "node:assert/strict";
import { CASES } from "../shared/catalog.mjs";
import { validateCase } from "../shared/validators.mjs";
import { windowsHarness } from "./windows-harness.mjs";

async function solve(def, h) {
  const { O, records, events } = h,
    f = O.fileSystem,
    b = O.browserState;
  const item = (key) => f.get("tech-" + key),
    move = (key, parent) => f.move(item(key).id, f.roots[parent]);
  const file = (name, parent = "desktop", content = "") =>
    f.create({
      name,
      kind: "file",
      parentId: f.roots[parent],
      content,
      mime: "text/plain",
    });
  const browser = () => O.shell.openApp("google"),
    navigate = (url) => O.browserApp.navigate(browser(), url);
  const favorite = (url) => {
    navigate(url);
    b.favorite(browser().browserState);
  };
  const login = (service) =>
    O.digitalLife.login(
      service,
      "cliente.teste@" +
        ({ outlook: "outlook.com", yahoo: "yahoo.com" }[service] ||
          "gmail.com"),
      "Cliente2026!",
    );
  const download = (id) => {
    O.software.startDownload(id);
    h.advance(60000);
  };
  const install = (id) => {
    download(id);
    O.software.installBundle(id, { desktopShortcut: true });
    O.shell.openApp(id);
  };
  if (def.legacy) {
    switch (def.seed) {
      case "network":
        O.network.setWifi(true);
        O.network.connectWifi("Escola_WiFi", { password: "oslab2026" });
        break;
      case "install":
        install("appjavafx");
        break;
      case "uninstall":
        O.software.uninstall("appjavafx");
        break;
      case "folder":
        f.create({
          name: "Documentos da Escola",
          kind: "folder",
          parentId: f.roots.documents,
        });
        break;
      case "favorite":
        favorite("hardware.oslab.local");
        break;
      case "audio":
        O.shell.setVolume(60, false);
        break;
      case "find-file":
        f.move("pedro-work", f.roots.documents);
        break;
      case "shortcut":
        f.create({
          name: "Materiais da Escola - Atalho",
          kind: "shortcut",
          parentId: f.roots.desktop,
          shortcutTargetId: "juliana-materials",
        });
        break;
      case "restore":
        f.restore("bruno-report");
        break;
      case "rename":
        f.rename("tiago-task", "Atividade de Informática.docx");
        break;
      case "copy":
        f.copy("beatriz-notice", f.roots.desktop);
        break;
      case "pictures":
        f.move("diego-photo", f.roots.pictures);
        break;
      case "tabs":
        for (const t of [...browser().browserState.tabs])
          if (t.url === "youtube.com") b.close(browser().browserState, t.id);
        break;
      case "browser-install":
        install("firefox");
        break;
      case "storage":
        f.delete("fernanda-cache");
        f.delete("fernanda-video");
        f.emptyRecycleBin();
        break;
    }
    return;
  }
  switch (def.id) {
    case "wallpaper":
      O.shell.setWallpaper("3");
      break;
    case "volume25":
      O.shell.setVolume(25, false);
      break;
    case "rename-folder":
      f.rename(item("folder").id, "Atividades 2026");
      break;
    case "note":
      file("Anotações.txt", "desktop", "Atendimento confirmado");
      break;
    case "restore-folder":
      f.restore(item("folder").id);
      break;
    case "copy-two":
      f.copy(item("agenda").id, f.roots.desktop);
      f.copy(item("notice").id, f.roots.desktop);
      break;
    case "organize-downloads":
      move("project", "documents");
      move("poster", "pictures");
      f.delete(item("old").id);
      f.emptyRecycleBin();
      break;
    case "trash-clean":
      f.restore(item("report").id);
      f.emptyRecycleBin();
      break;
    case "frozen-app":
      O.processManager.endProcess(records.get("texteditor").pid);
      break;
    case "wifi-auto":
      O.network.setWifiProperty("Escola_Alunos", "autoConnect", true);
      break;
    case "airplane":
      O.network.setAirplaneMode(false);
      O.network.setWifi(true);
      O.network.connectWifi("Escola_Alunos", { password: "Alunos2026!" });
      break;
    case "guest-auto":
      O.network.setWifiProperty("Escola_Visitantes", "autoConnect", false);
      O.network.connectWifi("Escola_Alunos", { password: "Alunos2026!" });
      break;
    case "office":
      download("office");
      O.software.installBundle("office");
      for (const id of ["word", "excel", "slides"]) O.shell.openApp(id);
      break;
    case "folder-shortcut": {
      const folder = f.create({
        name: "Reunião",
        kind: "folder",
        parentId: f.roots.documents,
      });
      f.move(item("agenda").id, folder.id);
      f.create({
        name: "Reunião - Atalho",
        kind: "shortcut",
        parentId: f.roots.desktop,
        shortcutTargetId: folder.id,
      });
      break;
    }
    case "two-tabs":
      navigate("hardware.oslab.local");
      b.open(browser().browserState, "componentes.oslab.local");
      break;
    case "two-favorites":
      favorite("hardware.oslab.local");
      favorite("componentes.oslab.local");
      break;
    case "remove-favorite":
      browser().browserState.favorites =
        browser().browserState.favorites.filter(
          (x) => x.url !== "antigo.escola.local",
        );
      break;
    case "history":
      b.openHistory(browser().browserState);
      navigate("componentes.oslab.local");
      O.events.emit("browser:action", {
        action: "history-select",
        value: "componentes.oslab.local",
      });
      break;
    case "cancel-download":
      O.software.cancelDownload("appjavafx");
      download("office");
      break;
    case "pdf":
      f.create({
        id: "tech-pdf",
        name: "Regulamento.pdf",
        kind: "file",
        parentId: f.roots.downloads,
      });
      f.move("tech-pdf", f.roots.documents);
      break;
    case "url-note":
      navigate("hardware.oslab.local");
      file("Anotações.txt", "desktop", "https://hardware.oslab.local");
      break;
    case "gmail-login":
      await login("gmail");
      navigate("gmail.oslab.local/inbox");
      break;
    case "outlook-login":
      await login("outlook");
      navigate("outlook.oslab.local/inbox");
      break;
    case "yahoo-login":
      await login("yahoo");
      navigate("yahoo.oslab.local/inbox");
      break;
    case "gmail-message":
      O.digitalLife.readMessage("gmail", "meeting");
      break;
    case "netflix-login":
      await login("netflix");
      O.digitalLife.action("netflix", "profile", "Visitante");
      break;
    case "netflix-rename":
      O.digitalLife.action("netflix", "rename-profile", "Família");
      break;
    case "netflix-watch":
      O.digitalLife.action("netflix", "profile", "Visitante");
      navigate("netflix.oslab.local/watch?id=movie-1");
      break;
    case "netflix-combo":
      await login("netflix");
      O.digitalLife.action("netflix", "rename-profile", "Família");
      O.digitalLife.action("netflix", "profile", "Família");
      navigate("netflix.oslab.local/watch?id=movie-1");
      break;
    case "spotify-login":
      await login("spotify");
      break;
    case "spotify-favorite":
      O.digitalLife.action("spotify", "favorite", "song-1");
      break;
    case "spotify-open":
      O.digitalLife.action("spotify", "open-favorite", "song-1");
      break;
    case "drive-folder":
      await login("drive");
      O.digitalLife.action("drive", "folder", "Meus Documentos");
      break;
    case "discord-name":
      O.digitalLife.action("discord", "display-name", "Técnico da Escola");
      break;
    case "discord-community":
      await login("discord");
      O.digitalLife.action("discord", "community");
      break;
    default:
      throw Error("Missing solution for " + def.id);
  }
}
for (const def of CASES)
  test(`cenário ${def.id}: estado inicial falha, operações reais do OSLab resolvem`, async () => {
    const h = windowsHarness(def);
    assert.equal(
      Boolean(validateCase(def.id, h.snapshot())),
      false,
      "não pode começar resolvido",
    );
    await solve(def, h);
    const pc = h.snapshot();
    assert.equal(
      Boolean(validateCase(def.id, pc)),
      true,
      "objetivo após operações",
    );
    const restored = JSON.parse(JSON.stringify(pc));
    assert.equal(
      Boolean(validateCase(def.id, restored)),
      true,
      "snapshot serializado",
    );
    assert.equal(validateCase(def.id, null), false);
  });
test("PCs e credenciais fictícias são isolados entre instâncias", async () => {
  const def = CASES.find((x) => x.id === "gmail-login"),
    a = windowsHarness(def),
    b = windowsHarness(def);
  await a.O.digitalLife.login(
    "gmail",
    "cliente.teste@gmail.com",
    "Cliente2026!",
  );
  assert.ok(a.O.digitalLife.session("gmail"));
  assert.equal(b.O.digitalLife.session("gmail"), null);
  await assert.rejects(() =>
    b.O.digitalLife.login("gmail", "cliente.teste@gmail.com", "errada"),
  );
  a.O.fileSystem.create({
    name: "Privado.txt",
    kind: "file",
    parentId: a.O.fileSystem.roots.desktop,
  });
  assert.equal(
    b.O.fileSystem.find(b.O.fileSystem.roots.desktop, "Privado.txt"),
    null,
  );
});
