import test from "node:test";
import assert from "node:assert/strict";
import { io } from "socket.io-client";
import { createApp } from "../server/index.mjs";

test("professor + 15 sockets locais: disputa atômica, alterações incrementais, reconexão e encerramento", async (t) => {
  let now = 0;
  const app = createApp({ now: () => now, tick: false });
  await new Promise((resolve) => app.http.listen(0, "127.0.0.1", resolve));
  const url = "http://127.0.0.1:" + app.http.address().port,
    sockets = [];
  let bytes = 0;
  async function connect() {
    const s = io(url, { transports: ["websocket"], reconnection: false });
    sockets.push(s);
    s.onAny((_event, data) => {
      bytes += Buffer.byteLength(JSON.stringify(data));
    });
    await new Promise((resolve, reject) => {
      s.once("connect", resolve);
      s.once("connect_error", reject);
    });
    return s;
  }
  const send = (socket, event, data = {}) =>
    new Promise((resolve) => socket.emit(event, data, resolve));
  t.after(async () => {
    sockets.forEach((s) => s.disconnect());
    await app.close();
  });
  const teacher = await connect(),
    created = (await send(teacher, "room:create", { name: "Professor" })).data;
  const students = await Promise.all(
    Array.from({ length: 15 }, async (_, i) => {
      const socket = await connect(),
        joined = (
          await send(socket, "room:join", {
            name: "Aluno " + i,
            code: created.code,
          })
        ).data;
      return { socket, ...joined };
    }),
  );
  await send(teacher, "room:start");
  const state = (await send(teacher, "room:sync")).data;
  assert.equal(state.tickets.length, 15);
  const id = state.tickets[0].id;
  const race = await Promise.all(
    students.map((s) => send(s.socket, "ticket:claim", { id })),
  );
  assert.equal(race.filter((r) => r.ok).length, 1);
  const winner = students[race.findIndex((r) => r.ok)];
  let delta;
  students[14].socket.once("room:patch", (patch) => (delta = patch));
  await send(teacher, "room:pause");
  await new Promise((resolve) => setImmediate(resolve));
  assert.ok(delta);
  assert.equal(delta.status, "paused");
  assert.equal(delta.tickets.length, 0);
  const token = winner.token;
  winner.socket.disconnect();
  const reconnect = await connect();
  const resumed = await send(reconnect, "session:resume", { token });
  assert.equal(resumed.ok, true);
  assert.equal(
    resumed.data.state.tickets.find((t) => t.id === id).ownerId,
    winner.playerId,
  );
  now = 3600000;
  app.engine.tick();
  assert.equal(app.engine.room(created.code).tickets.length, 15);
  await send(teacher, "room:resume");
  now += 60000;
  app.engine.tick();
  assert.equal(app.engine.room(created.code).tickets.length, 16);
  await send(teacher, "room:end");
  assert.equal((await send(teacher, "room:sync")).data.status, "ended");
  console.log(
    `Local test application payload received: ${bytes} bytes; no Render requests.`,
  );
});
