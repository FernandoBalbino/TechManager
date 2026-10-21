import { randomBytes, randomUUID } from "node:crypto";
import { CASES, CASE_BY_ID, DEFAULTS } from "../shared/catalog.mjs";

export class GameError extends Error {
  constructor(message, code = "INVALID") {
    super(message);
    this.code = code;
  }
}
const fail = (message, code) => {
  throw new GameError(message, code);
};
const clean = (value, max = 60) =>
  String(value || "")
    .trim()
    .slice(0, max);
const clone = (value) => structuredClone(value);
export class GameEngine {
  constructor({
    now = () => Date.now(),
    random = Math.random,
    onChange = () => {},
    maxRooms = 3,
  } = {}) {
    this.now = now;
    this.random = random;
    this.onChange = onChange;
    this.maxRooms = maxRooms;
    this.rooms = new Map();
    this.sessions = new Map();
  }
  elapsed(room) {
    return (
      room.elapsedMs +
      (room.status === "running" ? Math.max(0, this.now() - room.resumedAt) : 0)
    );
  }
  room(code) {
    return (
      this.rooms.get(String(code || "").toUpperCase()) ||
      fail("Sala não encontrada.", "ROOM_NOT_FOUND")
    );
  }
  authenticate(token) {
    const s = this.sessions.get(token);
    if (!s)
      fail(
        "Sua sessão não está disponível. Entre novamente.",
        "SESSION_NOT_FOUND",
      );
    const room = this.room(s.code),
      player = room.players.find((p) => p.id === s.playerId);
    if (!player) fail("Participante não encontrado.", "SESSION_NOT_FOUND");
    return { room, player, session: s };
  }
  teacher(player) {
    if (player.role !== "teacher")
      fail("Esta ação é exclusiva do professor.", "FORBIDDEN");
  }
  changed(room) {
    room.revision++;
    room.lastActivity = this.now();
    this.onChange(room.code);
  }
  session(room, player) {
    const token = randomBytes(24).toString("hex");
    this.sessions.set(token, { code: room.code, playerId: player.id });
    return { token, code: room.code, playerId: player.id };
  }
  config(input = {}) {
    const durationMinutes = Math.max(
      5,
      Math.min(120, Number(input.durationMinutes) || 45),
    );
    const deadlines = Object.fromEntries(
      [1, 2, 3].map((l) => [
        l,
        Math.max(
          1,
          Math.min(60, Number(input.deadlines?.[l]) || DEFAULTS.deadlines[l]),
        ),
      ]),
    );
    return { durationMinutes, deadlines, capacity: DEFAULTS.capacity };
  }
  create(name, config) {
    if (this.rooms.size >= this.maxRooms)
      fail(
        "Todas as salas estão ocupadas. Aguarde um expediente terminar.",
        "CAPACITY",
      );
    let code;
    do {
      code = randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
    } while (this.rooms.has(code));
    const player = {
      id: randomUUID(),
      name: clean(name) || "Professor",
      role: "teacher",
      online: true,
      points: 0,
      solo: 0,
      duo: 0,
      assists: 0,
    };
    const room = {
      code,
      status: "lobby",
      config: this.config(config),
      players: [player],
      tickets: [],
      elapsedMs: 0,
      resumedAt: this.now(),
      nextArrivalAt: 60000,
      deck: [],
      serial: 0,
      revision: 0,
      lastActivity: this.now(),
    };
    this.rooms.set(code, room);
    const session = this.session(room, player);
    this.changed(room);
    return session;
  }
  join(name, code) {
    const room = this.room(code);
    const label = clean(name);
    if (!label) fail("Informe seu nome.");
    if (room.status === "ended") fail("O expediente desta sala já terminou.");
    if (
      room.players.filter((p) => p.role === "student").length >=
      room.config.capacity
    )
      fail("A sala está cheia.", "CAPACITY");
    if (
      room.players.some(
        (p) =>
          p.name.toLocaleLowerCase("pt-BR") ===
          label.toLocaleLowerCase("pt-BR"),
      )
    )
      fail("Esse nome já está na sala. Use nome e sobrenome.");
    const player = {
      id: randomUUID(),
      name: label,
      role: "student",
      online: true,
      points: 0,
      solo: 0,
      duo: 0,
      assists: 0,
    };
    room.players.push(player);
    const session = this.session(room, player);
    this.changed(room);
    return session;
  }
  setOnline(token, online) {
    try {
      const { room, player } = this.authenticate(token);
      if (player.online !== online) {
        player.online = online;
        this.changed(room);
      }
    } catch {}
  }
  shuffle() {
    const a = CASES.map((c) => c.id);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  addTicket(room, at) {
    if (!room.deck.length) room.deck = this.shuffle();
    const caseId = room.deck.pop(),
      def = CASE_BY_ID[caseId];
    const ticket = {
      id: room.code + "-" + ++room.serial,
      number: 1000 + room.serial,
      caseId,
      status: "new",
      createdAt: at,
      dueAt: at + room.config.deadlines[def.level] * 60000,
      ownerId: null,
      helperId: null,
      invitation: null,
      messages: [],
      helperParticipated: false,
      summary: "",
      finishedAt: null,
      proof: null,
    };
    room.tickets.push(ticket);
    return ticket;
  }
  start(token, config) {
    const { room, player } = this.authenticate(token);
    this.teacher(player);
    if (room.status !== "lobby") fail("O expediente já foi iniciado.");
    const students = room.players.filter(
      (p) => p.role === "student" && p.online,
    );
    if (!students.length) fail("Aguarde pelo menos um aluno entrar.");
    if (config) room.config = this.config(config);
    room.status = "running";
    room.resumedAt = this.now();
    room.elapsedMs = 0;
    room.nextArrivalAt = 60000;
    students.forEach(() => this.addTicket(room, 0));
    this.changed(room);
  }
  pause(token) {
    const { room, player } = this.authenticate(token);
    this.teacher(player);
    this.tickRoom(room);
    if (room.status !== "running") fail("O expediente não está em andamento.");
    room.elapsedMs = this.elapsed(room);
    room.status = "paused";
    this.changed(room);
  }
  resume(token) {
    const { room, player } = this.authenticate(token);
    this.teacher(player);
    if (room.status !== "paused") fail("O expediente não está pausado.");
    room.resumedAt = this.now();
    room.status = "running";
    this.changed(room);
  }
  end(token) {
    const { room, player } = this.authenticate(token);
    this.teacher(player);
    this.finish(room, "ended");
  }
  finish(room, reason) {
    room.elapsedMs = Math.min(
      this.elapsed(room),
      room.config.durationMinutes * 60000,
    );
    room.status = "ended";
    room.tickets
      .filter((t) => ["new", "active"].includes(t.status))
      .forEach((t) => {
        t.status = "expired";
        t.finishedAt = room.elapsedMs;
        t.expireReason = reason;
        t.invitation = null;
      });
    this.changed(room);
  }
  tickRoom(room) {
    if (room.status !== "running") return;
    const elapsed = this.elapsed(room),
      endAt = room.config.durationMinutes * 60000;
    let changed = false;
    for (const t of room.tickets) {
      if (["new", "active"].includes(t.status) && elapsed >= t.dueAt) {
        t.status = "expired";
        t.finishedAt = t.dueAt;
        t.expireReason = "deadline";
        t.invitation = null;
        changed = true;
      }
    }
    if (elapsed >= endAt) {
      this.finish(room, "ended");
      return;
    }
    while (elapsed >= room.nextArrivalAt) {
      this.addTicket(room, room.nextArrivalAt);
      room.nextArrivalAt += 60000;
      changed = true;
    }
    if (changed) this.changed(room);
  }
  tick() {
    for (const room of this.rooms.values()) {
      this.tickRoom(room);
      if (
        (room.status === "ended" || !room.players.some((p) => p.online)) &&
        this.now() - room.lastActivity > 30 * 60000
      ) {
        this.rooms.delete(room.code);
        for (const [token, session] of this.sessions)
          if (session.code === room.code) this.sessions.delete(token);
      }
    }
  }
  active(token) {
    const auth = this.authenticate(token);
    this.tickRoom(auth.room);
    if (auth.room.status !== "running")
      fail(
        auth.room.status === "paused"
          ? "O professor pausou o expediente."
          : "O expediente não está em andamento.",
        "NOT_RUNNING",
      );
    if (auth.player.role !== "student")
      fail("O professor acompanha a turma, sem assumir chamados.", "FORBIDDEN");
    return auth;
  }
  ticket(room, id) {
    return (
      room.tickets.find((t) => t.id === id) || fail("Chamado não encontrado.")
    );
  }
  claim(token, ticketId) {
    const { room, player } = this.active(token),
      ticket = this.ticket(room, ticketId);
    if (ticket.status !== "new")
      fail("Outro colega já assumiu esse chamado.", "ALREADY_CLAIMED");
    if (
      room.tickets.filter(
        (t) => t.status === "active" && t.ownerId === player.id,
      ).length >= 2
    )
      fail("Você já tem dois chamados próprios.", "OWN_LIMIT");
    ticket.status = "active";
    ticket.ownerId = player.id;
    ticket.claimedAt = this.elapsed(room);
    this.changed(room);
    return ticket.id;
  }
  invite(token, ticketId, helperId) {
    const { room, player } = this.active(token),
      t = this.ticket(room, ticketId);
    if (t.status !== "active" || t.ownerId !== player.id)
      fail("Só o responsável pode convidar ajuda.", "FORBIDDEN");
    if (t.helperId) fail("Este chamado já tem um ajudante.");
    const helper = room.players.find(
      (p) => p.id === helperId && p.role === "student" && p.online,
    );
    if (!helper || helper.id === player.id) fail("Escolha um colega online.");
    if (
      room.tickets.some((x) => x.status === "active" && x.helperId === helperId)
    )
      fail("Esse colega já está ajudando em outro chamado.");
    t.invitation = { helperId, invitedAt: this.elapsed(room) };
    this.changed(room);
  }
  answerInvite(token, ticketId, accept) {
    const { room, player } = this.active(token),
      t = this.ticket(room, ticketId);
    if (t.status !== "active" || t.invitation?.helperId !== player.id)
      fail("O convite não está mais disponível.");
    if (
      accept &&
      room.tickets.some(
        (x) => x.status === "active" && x.helperId === player.id,
      )
    )
      fail("Você já está ajudando em um chamado.", "HELP_LIMIT");
    if (accept) {
      t.helperId = player.id;
      t.helperParticipated = false;
    }
    t.invitation = null;
    this.changed(room);
  }
  leaveHelp(token, ticketId) {
    const { room, player } = this.active(token),
      t = this.ticket(room, ticketId);
    if (t.helperId !== player.id) fail("Você não é o ajudante deste chamado.");
    t.helperId = null;
    t.helperParticipated = false;
    this.changed(room);
  }
  message(token, ticketId, text) {
    const { room, player } = this.active(token),
      t = this.ticket(room, ticketId);
    if (
      t.status !== "active" ||
      !t.helperId ||
      ![t.ownerId, t.helperId].includes(player.id)
    )
      fail("A conversa é dos participantes deste chamado.", "FORBIDDEN");
    const value = clean(text, 500);
    if (!value) fail("Escreva uma mensagem.");
    t.messages.push({
      id: randomUUID(),
      from: player.id,
      text: value,
      at: this.elapsed(room),
    });
    t.messages = t.messages.slice(-80);
    if (player.id === t.helperId) t.helperParticipated = true;
    this.changed(room);
  }
  complete(token, ticketId, input) {
    const { room, player } = this.active(token),
      t = this.ticket(room, ticketId);
    if (t.status === "resolved" && t.ownerId === player.id)
      return { duplicate: true };
    if (t.status !== "active" || t.ownerId !== player.id)
      fail("O chamado não está mais disponível para conclusão.", "FORBIDDEN");
    const summary = clean(input?.summary, 600);
    if (summary.length < 10)
      fail("Descreva a solução com pelo menos 10 caracteres.");
    if (input?.verified !== true || input?.clientConfirmed !== true)
      fail("Corrija o PC e peça a confirmação do cliente.");
    const base = CASE_BY_ID[t.caseId].level,
      helper = room.players.find((p) => p.id === t.helperId);
    const duo = Boolean(helper && t.helperParticipated);
    const points = base * (duo ? 2 : 1);
    player.points += points;
    player[duo ? "duo" : "solo"]++;
    if (duo) {
      helper.points += points;
      helper.duo++;
      helper.assists++;
    }
    t.status = "resolved";
    t.summary = summary;
    t.finishedAt = this.elapsed(room);
    t.points = points;
    t.duo = duo;
    t.invitation = null;
    this.changed(room);
    return { points, duo };
  }
  snapshot(token) {
    const { room, player } = this.authenticate(token);
    const elapsed = this.elapsed(room);
    return {
      code: room.code,
      status: room.status,
      config: clone(room.config),
      revision: room.revision,
      elapsedMs: elapsed,
      remainingMs: Math.max(0, room.config.durationMinutes * 60000 - elapsed),
      nextArrivalAt: room.nextArrivalAt,
      ...(player.role === "teacher" ? { deck: [...room.deck], serial: room.serial } : {}),
      me: player.id,
      role: player.role,
      players: room.players.map((p) => ({ ...p })),
      tickets: room.tickets.map((t) => {
        const result = { ...t };
        delete result.proof;
        if (
          player.role !== "teacher" &&
          ![t.ownerId, t.helperId, t.invitation?.helperId].includes(player.id)
        ) {
          result.messages = [];
          result.summary = "";
          result.invitation = null;
        }
        return clone(result);
      }),
    };
  }
  checkpoint(token) {
    const { room, player } = this.authenticate(token);
    this.teacher(player);
    return {
      format: "techmanager-room",
      version: 1,
      savedAt: new Date(this.now()).toISOString(),
      room: {
        ...clone(room),
        elapsedMs: this.elapsed(room),
        status: room.status === "running" ? "paused" : room.status,
        players: room.players.map((p) => ({ ...p, online: false })),
      },
    };
  }
  restore(name, checkpoint) {
    if (checkpoint?.format !== "techmanager-room" || checkpoint.version !== 1)
      fail("Arquivo de sessão incompatível.");
    const source = checkpoint.room;
    if (
      !source ||
      !Array.isArray(source.players) ||
      source.players.length > 31 ||
      !Array.isArray(source.tickets) ||
      source.tickets.length > 500
    )
      fail("Arquivo de sessão inválido.");
    const session = this.create(name, source.config),
      room = this.room(session.code);
    const teacher = room.players[0],
      oldTeacher = source.players.find((p) => p.role === "teacher");
    const idMap = new Map(
      source.players.map((p) => [
        p.id,
        p.role === "teacher" ? teacher.id : randomUUID(),
      ]),
    );
    room.players.push(
      ...source.players
        .filter((p) => p.role === "student")
        .map((p) => ({
          id: idMap.get(p.id),
          name: clean(p.name),
          role: "student",
          online: false,
          points: Math.max(0, Number(p.points) || 0),
          solo: Number(p.solo) || 0,
          duo: Number(p.duo) || 0,
          assists: Number(p.assists) || 0,
        })),
    );
    room.status =
      source.status === "lobby"
        ? "lobby"
        : source.status === "ended"
          ? "ended"
          : "paused";
    room.elapsedMs = Math.max(
      0,
      Math.min(
        room.config.durationMinutes * 60000,
        Number(source.elapsedMs) || 0,
      ),
    );
    room.nextArrivalAt = Math.max(
      room.elapsedMs,
      Number(source.nextArrivalAt) || room.elapsedMs + 60000,
    );
    room.serial = Number(source.serial) || 0;
    room.deck = Array.isArray(source.deck)
      ? source.deck.filter((id) => CASE_BY_ID[id])
      : [];
    room.restoreMap = Object.fromEntries(
      source.players
        .filter((p) => p.role === "student")
        .map((p) => [
          p.name.toLocaleLowerCase("pt-BR"),
          { id: idMap.get(p.id), previousRoom: source.code, previousId: p.id },
        ]),
    );
    room.tickets = source.tickets
      .filter((t) => CASE_BY_ID[t.caseId])
      .map((t) => ({
        id: t.id,
        number: Number(t.number),
        caseId: t.caseId,
        status: ["new", "active", "resolved", "expired"].includes(t.status)
          ? t.status
          : "expired",
        createdAt: Number(t.createdAt) || 0,
        dueAt: Number(t.dueAt) || 0,
        ownerId: idMap.get(t.ownerId) || null,
        helperId: idMap.get(t.helperId) || null,
        invitation: null,
        messages: (Array.isArray(t.messages) ? t.messages : [])
          .slice(-80)
          .map((m) => ({
            id: randomUUID(),
            from: idMap.get(m.from),
            text: clean(m.text, 500),
            at: Number(m.at) || 0,
          })),
        helperParticipated: Boolean(t.helperParticipated),
        summary: clean(t.summary, 600),
        finishedAt: t.finishedAt,
        points: Number(t.points) || 0,
        duo: Boolean(t.duo),
        expireReason: t.expireReason || null,
      }));
    this.changed(room);
    return session;
  }
  reclaim(name, code) {
    const room = this.room(code),
      match = room.restoreMap?.[clean(name).toLocaleLowerCase("pt-BR")];
    if (!match) return this.join(name, code);
    const player = room.players.find((p) => p.id === match.id);
    if (player.online) fail("Esse participante já retomou a sessão.");
    player.online = true;
    const session = this.session(room, player);
    session.previousRoom = match.previousRoom;
    session.previousId = match.previousId;
    this.changed(room);
    return session;
  }
}
