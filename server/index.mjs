import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { pathToFileURL } from "node:url";
import { GameEngine } from "./engine.mjs";

export function createApp({
  now,
  random,
  origins = process.env.ALLOWED_ORIGINS || "",
  maxRooms = 3,
  tick = true,
} = {}) {
  const app = express(),
    http = createServer(app);
  const allowed = origins
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = (requestOrigin, done) =>
    done(
      null,
      !requestOrigin ||
        allowed.includes(requestOrigin) ||
        (!allowed.length &&
          /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(requestOrigin)),
    );
  const io = new Server(http, {
    cors: { origin, methods: ["GET", "POST"] },
    maxHttpBufferSize: 8 * 1024 * 1024,
    perMessageDeflate: false,
    allowRequest: (req, done) =>
      origin(req.headers.origin, (err, ok) => done(err, ok)),
  });
  const engine = new GameEngine({
    now,
    random,
    maxRooms,
    onChange: (code) => {
      for (const socket of io.sockets.sockets.values())
        if (socket.data.code === code && socket.data.token) {
          try {
            const next = engine.snapshot(socket.data.token),
              previous = socket.data.lastState;
            if (!previous || previous.code !== next.code)
              socket.emit("room:state", next);
            else {
              const oldTickets = new Map(
                previous.tickets.map((t) => [t.id, JSON.stringify(t)]),
              );
              const patch = {
                code,
                baseRevision: previous.revision,
                revision: next.revision,
                elapsedMs: next.elapsedMs,
                remainingMs: next.remainingMs,
                nextArrivalAt: next.nextArrivalAt,
                status: next.status,
                tickets: next.tickets.filter(
                  (t) => oldTickets.get(t.id) !== JSON.stringify(t),
                ),
              };
              if (
                JSON.stringify(previous.players) !==
                JSON.stringify(next.players)
              )
                patch.players = next.players;
              if (
                JSON.stringify(previous.config) !== JSON.stringify(next.config)
              )
                patch.config = next.config;
              if (next.deck) { patch.deck = next.deck; patch.serial = next.serial; }
              socket.emit("room:patch", patch);
            }
            socket.data.lastState = next;
          } catch {}
        }
    },
  });
  app.disable("x-powered-by");
  app.get("/health", (_req, res) =>
    res.json({ ok: true, rooms: engine.rooms.size }),
  );
  const timer = tick ? setInterval(() => engine.tick(), 250) : null;
  timer?.unref();
  io.on("connection", (socket) => {
    let budget = { at: Date.now(), count: 0 };
    const run = (event, fn, needsAuth = true) =>
      socket.on(event, async (data = {}, ack) => {
        try {
          if (Date.now() - budget.at > 10000)
            budget = { at: Date.now(), count: 0 };
          if (++budget.count > 80)
            throw new Error("Aguarde um instante antes de tentar novamente.");
          if (needsAuth && !socket.data.token)
            throw new Error("Entre na sala primeiro.");
          const result = await fn(data);
          if (typeof ack === "function") ack({ ok: true, data: result });
        } catch (error) {
          if (typeof ack === "function")
            ack({
              ok: false,
              error: error.message,
              code: error.code || "INVALID",
            });
        }
      });
    function attach(session) {
      if (socket.data.token && socket.data.token !== session.token)
        engine.setOnline(socket.data.token, false);
      // A reconnect replaces the old transport, keeping one online identity.
      for (const peer of io.sockets.sockets.values())
        if (peer.id !== socket.id && peer.data.token === session.token) {
          peer.data.token = null;
          peer.disconnect(true);
        }
      socket.data.token = session.token;
      socket.data.code = session.code;
      engine.setOnline(session.token, true);
      const state = engine.snapshot(session.token);
      socket.data.lastState = state;
      return { ...session, state };
    }
    run("room:create", (d) => attach(engine.create(d.name, d.config)), false);
    run("room:join", (d) => attach(engine.reclaim(d.name, d.code)), false);
    run(
      "room:restore",
      (d) => attach(engine.restore(d.name, d.checkpoint)),
      false,
    );
    run(
      "session:resume",
      (d) => {
        engine.authenticate(d.token);
        return attach({
          token: d.token,
          code: engine.authenticate(d.token).room.code,
          playerId: engine.authenticate(d.token).player.id,
        });
      },
      false,
    );
    run("room:sync", () => {
      const state = engine.snapshot(socket.data.token);
      socket.data.lastState = state;
      return state;
    });
    run("room:start", (d) => engine.start(socket.data.token, d.config));
    run("room:pause", () => engine.pause(socket.data.token));
    run("room:resume", () => engine.resume(socket.data.token));
    run("room:end", () => engine.end(socket.data.token));
    run("room:export", () => engine.checkpoint(socket.data.token));
    run("ticket:claim", (d) => engine.claim(socket.data.token, d.id));
    run("ticket:complete", (d) => engine.complete(socket.data.token, d.id, d));
    run("help:invite", (d) =>
      engine.invite(socket.data.token, d.id, d.helperId),
    );
    run("help:answer", (d) =>
      engine.answerInvite(socket.data.token, d.id, d.accept),
    );
    run("help:leave", (d) => engine.leaveHelp(socket.data.token, d.id));
    run("help:message", (d) => engine.message(socket.data.token, d.id, d.text));
    socket.on("disconnect", () => {
      if (socket.data.token) engine.setOnline(socket.data.token, false);
    });
  });
  return {
    app,
    http,
    io,
    engine,
    close: async () => {
      clearInterval(timer);
      await new Promise((resolve) => io.close(resolve));
    },
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { http } = createApp();
  http.listen(Number(process.env.PORT) || 3001, "0.0.0.0", () =>
    console.log("TechManager realtime ready"),
  );
}
