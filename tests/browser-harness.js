// This entry is available in Vite dev only; it is not an entry of the production build.
import { CASES } from "../shared/catalog.mjs";
import { validateCase } from "../shared/validators.mjs";
const select = document.querySelector("#scenario"),
  frame = document.querySelector("#pc"),
  status = document.querySelector("#status"),
  pcs = new Map();
let elapsed = 0,
  id = CASES[0].id,
  last = id;
CASES.forEach((c) => select.add(new Option(c.id + " — " + c.title, c.id)));
function persist() {
  if (frame.contentWindow.OSLab?.remote)
    pcs.set(id, frame.contentWindow.OSLab.remote.snapshot());
}
function show(next) {
  persist();
  last = id;
  id = next;
  select.value = id;
  status.textContent = "Carregando";
  frame.src = "/windows/index.html?client=qa-" + id + "&session=local-qa";
}
window.HelpDeskRemoteHost = {
  initial() {
    const c = CASES.find((c) => c.id === id);
    return {
      clientId: "qa-" + id,
      name: c.name,
      seed: c.seed,
      pc: pcs.get(id),
    };
  },
  now: () => elapsed,
  changed(_source, client, pc) {
    if (client === "qa-" + id) pcs.set(id, pc);
  },
  ready() {
    status.textContent = "Ambiente pronto";
  },
};
select.addEventListener("change", () => show(select.value));
document.querySelector("#advance").onclick = () => {
  elapsed += 60000;
  status.textContent = "Relógio avançado";
};
document.querySelector("#validate").onclick = () => {
  persist();
  status.textContent = validateCase(id, pcs.get(id))
    ? "Objetivos concluídos"
    : "Objetivos pendentes";
};
document.querySelector("#switch").onclick = () =>
  show(id === last ? (id === "note" ? "volume25" : "note") : last);
show(id);
