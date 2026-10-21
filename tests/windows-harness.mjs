import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
export function windowsHarness(def) {
  let now = 1000;
  const values = {},
    timers = new Map(),
    records = new Map(),
    events = [];
  let serial = 0;
  class Clock extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
    static now() {
      return now;
    }
  }
  const O = {
    remoteContext: {},
    storage: {
      getItem: (k) => values[k] || null,
      setItem: (k, v) => (values[k] = v),
      removeItem: (k) => delete values[k],
    },
    events: {
      emit(type, detail = {}) {
        events.push({ type, detail });
      },
    },
    ui: { notify() {}, escapeHtml: (x) => String(x) },
    icons: { get: () => "" },
    users: {
      getCurrent: () => ({ id: "user-aluno" }),
      getSelected: () => ({ id: "user-aluno" }),
      isAdministrator: () => true,
      getPublicItems: () => [],
    },
    runtimeNow: () => now,
  };
  const global = {
    OSLab: O,
    Date: Clock,
    crypto: webcrypto,
    TextEncoder,
    setInterval: (fn) => {
      const id = ++serial;
      timers.set(id, fn);
      return id;
    },
    clearInterval: (id) => timers.delete(id),
    setTimeout: (fn) => fn(),
    clearTimeout() {},
    document: { documentElement: { classList: { toggle() {} } } },
  };
  global.window = global;
  const context = vm.createContext(global);
  const load = (name) =>
    vm.runInContext(
      readFileSync(
        new URL("../public/windows/" + name, import.meta.url),
        "utf8",
      ),
      context,
      { filename: name },
    );
  for (const name of [
    "js/core/file-system.js",
    "js/core/process-manager.js",
    "js/core/network-manager.js",
    "js/core/system-state.js",
    "js/browser/browser-state.js",
    "js/install/software-state.js",
    "js/digital/digital-content.js",
    "js/digital/digital-life.js",
  ])
    load(name);
  O.fileSystem.bind(
    { version: 3, fileSystem: { version: 1, items: [] } },
    () => {},
  );
  O.network.bind({}, () => {});
  const shell = { wallpaperId: "1", volume: 100, muted: false };
  function openApp(id) {
    if (records.has(id)) return records.get(id);
    const p = O.processManager.createProcess({
        appId: id,
        windowId: id,
        name: id,
      }),
      r = {
        appId: id,
        windowId: id,
        pid: p.pid,
        element: { classList: { add() {} } },
      };
    if (["google", "firefox"].includes(id))
      r.browserState = O.browserState.create();
    records.set(id, r);
    O.software.markOpened(id);
    return r;
  }
  O.shell = {
    openApp,
    refreshDesktop() {},
    refreshPrograms() {},
    setVolume: (volume, muted) => Object.assign(shell, { volume, muted }),
    setWallpaper: (id) => (shell.wallpaperId = id),
    closeApp(id) {
      records.delete(id);
      O.processManager.endByWindow(id);
    },
  };
  O.windowManager = { forceCloseById: (id) => records.delete(id) };
  O.browserApp = {
    navigate(r, url) {
      O.browserState.navigate(r.browserState, url);
      O.events.emit("browser:action", { action: "navigate", value: url });
    },
    render() {},
  };
  load("tech-cases.js");
  const bridge = readFileSync(
      new URL("../public/windows/remote-bridge.js", import.meta.url),
      "utf8",
    ),
    fragment = bridge.slice(
      bridge.indexOf("  function file("),
      bridge.indexOf("  function snapshot("),
    );
  vm.runInContext(
    "var fs=OSLab.fileSystem, GB=1024**3, context=" +
      JSON.stringify({
        clientId: "test-" + def.id,
        name: def.name,
        seed: def.seed,
      }) +
      ";\n" +
      fragment +
      "\nseed();",
    context,
  );
  events.length = 0;
  const snapshot = () =>
    JSON.parse(
      JSON.stringify({
        files: O.fileSystem.snapshot(),
        network: O.network.getSnapshot(),
        processes: O.processManager.snapshot(),
        software: O.software.getState(),
        shell,
        digital: O.digitalLife.snapshot(),
        runtime: O.systemState.snapshot().runtime,
        browsers: Object.fromEntries(
          [...records]
            .filter(([, r]) => r.browserState)
            .map(([id, r]) => [id, r.browserState]),
        ),
        techEvents: events,
      }),
    );
  return {
    O,
    events,
    records,
    snapshot,
    advance(ms) {
      now += ms;
      for (const fn of [...timers.values()]) fn();
    },
  };
}
