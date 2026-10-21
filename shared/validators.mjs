import { validatePc } from "./legacy/validators.mjs";
import { CASE_BY_ID } from "./catalog.mjs";
const norm = (s) =>
  String(s || "")
    .trim()
    .toLocaleLowerCase("pt-BR");
export function validateCase(id, pc) {
  const def = CASE_BY_ID[id];
  if (!pc || !def) return false;
  if (def.legacy) return validatePc(def.validation || def.seed, pc);
  const items = pc.files?.items || [],
    live = (i) => i && !i.trashedAt;
  const byId = (key) => items.find((i) => i.id === "tech-" + key);
  const at = (key, parent) =>
    live(byId(key)) && byId(key).parentId === "root-" + parent;
  const named = (name, parent, kind) =>
    items.find(
      (i) =>
        live(i) &&
        norm(i.name) === norm(name) &&
        i.parentId ===
          (parent.startsWith("root-") || parent.startsWith("tech-")
            ? parent
            : "root-" + parent) &&
        (!kind || i.kind === kind),
    );
  const original = (key, parent, name) =>
    at(key, parent) && (!name || byId(key).name === name);
  const browsers = Object.values(pc.browsers || {}),
    browser = pc.browsers?.google || {};
  const tabs = browser.tabs || [],
    favorites = browser.favorites || [];
  const hasTab = (address) =>
    tabs.some(
      (t) =>
        String(t.url)
          .replace(/^https?:\/\//, "")
          .replace(/\/$/, "") === address,
    );
  const fav = (address) => favorites.some((t) => t.url === address);
  const note = named("Anotações.txt", "desktop", "file");
  const digital = pc.digital || {},
    account = (service) => digital.accounts?.[service]?.data || {};
  const logged = (service) =>
    Boolean(
      digital.sessions?.[service] &&
      digital.sessions[service] === digital.accounts?.[service]?.email,
    );
  const events = pc.techEvents || [],
    event = (type, action, value) =>
      events.some(
        (e) =>
          e.type === type &&
          e.detail?.action === action &&
          (!value || e.detail.value === value),
      );
  const watching = () =>
    tabs.some((t) =>
      /^netflix\.oslab\.local\/watch\?id=movie-1(?:&|$)/.test(t.url),
    );
  switch (id) {
    case "wallpaper":
      return pc.shell?.wallpaperId === "3";
    case "volume25":
      return pc.shell?.volume === 25 && !pc.shell.muted;
    case "rename-folder":
      return (
        original("folder", "documents", "Atividades 2026") &&
        named("Plano.txt", "tech-folder")
      );
    case "note":
      return Boolean(note?.content?.includes("Atendimento confirmado"));
    case "restore-folder":
      return (
        original("folder", "documents", "Materiais da Turma") &&
        named("Plano.txt", "tech-folder")
      );
    case "copy-two":
      return ["agenda", "notice"].every(
        (key) =>
          at(key, "documents") &&
          items.some(
            (i) =>
              live(i) &&
              i.parentId === "root-desktop" &&
              i.sourceId === byId(key)?.id &&
              i.name === byId(key)?.name,
          ),
      );
    case "organize-downloads":
      return (
        at("project", "documents") && at("poster", "pictures") && !byId("old")
      );
    case "trash-clean":
      return at("report", "documents") && !byId("cache") && !byId("video");
    case "frozen-app":
      return (
        !pc.processes?.processes?.some((p) => p.appId === "texteditor") &&
        pc.processes?.processes?.some((p) => p.appId === "google") &&
        ["explorer-system", "antimalware", "dwm"].every((id) =>
          pc.processes?.processes?.some((p) => p.appId === id),
        ) &&
        events.some(
          (e) =>
            e.type === "process:ended" &&
            e.detail.appId === "texteditor" &&
            e.detail.reason === "task-manager",
        )
      );
    case "wifi-auto":
      return (
        pc.network?.connectedSsid === "Escola_Alunos" &&
        pc.network.knownNetworks?.Escola_Alunos?.autoConnect === true
      );
    case "airplane":
      return (
        !pc.network?.airplaneMode &&
        pc.network?.wifiEnabled &&
        pc.network?.connectedSsid === "Escola_Alunos"
      );
    case "guest-auto":
      return (
        pc.network?.connectedSsid === "Escola_Alunos" &&
        pc.network?.knownNetworks?.Escola_Visitantes?.autoConnect === false
      );
    case "office":
      return ["word", "excel", "slides"].every(
        (id) =>
          pc.software?.installedPrograms?.[id]?.installed &&
          (pc.software?.openedPrograms?.[id] ||
            Object.keys(pc.software?.openedPrograms || {}).some((k) =>
              k.endsWith(":" + id),
            )),
      );
    case "folder-shortcut": {
      const f = named("Reunião", "documents", "folder");
      return Boolean(
        f &&
        live(byId("agenda")) &&
        byId("agenda").parentId === f.id &&
        items.some(
          (i) =>
            live(i) &&
            i.parentId === "root-desktop" &&
            i.shortcutTargetId === f.id,
        ),
      );
    }
    case "two-tabs":
      return (
        hasTab("hardware.oslab.local") && hasTab("componentes.oslab.local")
      );
    case "two-favorites":
      return fav("hardware.oslab.local") && fav("componentes.oslab.local");
    case "remove-favorite":
      return !fav("antigo.escola.local") && fav("hardware.oslab.local");
    case "history":
      return (
        hasTab("componentes.oslab.local") &&
        event("browser:action", "history-select", "componentes.oslab.local")
      );
    case "cancel-download":
      return (
        pc.software?.downloads?.appjavafx?.status === "cancelled" &&
        pc.software?.downloads?.office?.status === "completed"
      );
    case "pdf":
      return original("pdf", "documents", "Regulamento.pdf");
    case "url-note":
      return (
        hasTab("hardware.oslab.local") &&
        Boolean(note?.content?.includes("hardware.oslab.local"))
      );
    case "gmail-login":
      return (
        logged("google") &&
        tabs.some((t) => t.url.startsWith("gmail.oslab.local/inbox"))
      );
    case "outlook-login":
      return (
        logged("outlook") &&
        tabs.some((t) => t.url.startsWith("outlook.oslab.local/inbox"))
      );
    case "yahoo-login":
      return (
        logged("yahoo") &&
        tabs.some((t) => t.url.startsWith("yahoo.oslab.local/inbox"))
      );
    case "gmail-message":
      return (
        logged("google") &&
        digital.messages?.google?.some(
          (m) => m.id === "meeting" && m.read === true,
        )
      );
    case "netflix-login":
      return logged("netflix") && account("netflix").entered === true;
    case "netflix-rename":
      return logged("netflix") && account("netflix").profile === "Família";
    case "netflix-watch":
      return logged("netflix") && watching();
    case "netflix-combo":
      return (
        logged("netflix") &&
        account("netflix").profile === "Família" &&
        watching()
      );
    case "spotify-login":
      return logged("spotify");
    case "spotify-favorite":
      return (
        logged("spotify") && account("spotify").favorites?.includes("song-1")
      );
    case "spotify-open":
      return (
        logged("spotify") &&
        account("spotify").favorites?.includes("song-1") &&
        event("digital-life:action", "open-favorite", "song-1")
      );
    case "drive-folder":
      return (
        logged("google") &&
        account("google").folders?.includes("Meus Documentos")
      );
    case "discord-name":
      return (
        logged("discord") &&
        account("discord").displayName === "Técnico da Escola"
      );
    case "discord-community":
      return (
        logged("discord") && account("discord").community === "Comunidade OSLab"
      );
    default:
      return false;
  }
}
