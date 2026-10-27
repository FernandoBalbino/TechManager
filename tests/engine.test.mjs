import test from "node:test";
import assert from "node:assert/strict";
import { GameEngine } from "../server/engine.mjs";
import { CASE_BY_ID } from "../shared/catalog.mjs";
function fixture(count = 15) {
  let now = 0;
  const game = new GameEngine({ now: () => now, random: () => 0.4 }),
    teacher = game.create("Professor");
  const students = Array.from({ length: count }, (_, i) =>
    game.join("Aluno " + i, teacher.code),
  );
  game.start(teacher.token);
  return {
    game,
    teacher,
    students,
    room: game.room(teacher.code),
    advance(ms) {
      now += ms;
      game.tick();
    },
  };
}
const proof = {
  verified: true,
  clientConfirmed: true,
  summary: "Corrigi e conferi o resultado com o cliente.",
};
test("15 alunos: lote inicial, três chamados a cada 60s e pausa congelam o relógio", () => {
  const f = fixture();
  assert.equal(f.room.tickets.length, 15);
  f.advance(59999);
  assert.equal(f.room.tickets.length, 15);
  f.advance(1);
  assert.equal(f.room.tickets.length, 18);
  assert.deepEqual(
    f.room.tickets.slice(15).map((t) => t.createdAt),
    [60000, 60000, 60000],
  );
  assert.equal(f.room.nextArrivalAt, 120000);
  f.game.pause(f.teacher.token);
  const elapsed = f.game.elapsed(f.room),
    due = f.room.tickets[0].dueAt;
  f.advance(3600000);
  assert.equal(f.game.elapsed(f.room), elapsed);
  assert.equal(f.room.tickets[0].dueAt, due);
  assert.equal(f.room.tickets.length, 18);
  assert.throws(
    () => f.game.claim(f.students[0].token, f.room.tickets[0].id),
    /pausou/,
  );
  f.game.resume(f.teacher.token);
  f.advance(60000);
  assert.equal(f.room.tickets.length, 21);
  assert.deepEqual(
    f.room.tickets.slice(18).map((t) => t.createdAt),
    [120000, 120000, 120000],
  );
  f.advance(120000);
  assert.equal(f.room.tickets.length, 27);
  assert.deepEqual(
    f.room.tickets.slice(21).map((t) => t.createdAt),
    [180000, 180000, 180000, 240000, 240000, 240000],
  );
});
test("posse é exclusiva, dois próprios e ajuda em um terceiro são limites independentes", () => {
  const f = fixture(),
    [a, b, c] = f.students;
  const [t, u, v, w] = f.room.tickets;
  f.game.claim(a.token, t.id);
  assert.throws(() => f.game.claim(b.token, t.id), /colega/);
  f.game.claim(a.token, u.id);
  assert.throws(() => f.game.claim(a.token, v.id), /dois/);
  f.game.claim(b.token, v.id);
  f.game.claim(c.token, w.id);
  f.game.invite(b.token, v.id, a.playerId);
  f.game.answerInvite(a.token, v.id, true);
  assert.equal(v.helperId, a.playerId);
  assert.throws(
    () => f.game.invite(c.token, w.id, a.playerId),
    /já está ajudando/,
  );
  f.game.leaveHelp(a.token, v.id);
  assert.equal(v.helperId, null);
});
test("conclusão, colaboração com participação, pontos, privacidade e idempotência", () => {
  const f = fixture(),
    [a, b, c] = f.students,
    [t, u, v] = f.room.tickets;
  f.game.claim(a.token, t.id);
  f.game.invite(a.token, t.id, b.playerId);
  f.game.answerInvite(b.token, t.id, true);
  assert.throws(() => f.game.complete(c.token, t.id, proof), /disponível/);
  assert.throws(
    () => f.game.complete(a.token, t.id, { ...proof, verified: false }),
    /Corrija/,
  );
  assert.throws(
    () => f.game.complete(a.token, t.id, { ...proof, summary: "ok" }),
    /10/,
  );
  f.game.message(b.token, t.id, "Confira a pasta de destino.");
  assert.equal(
    f.game.snapshot(c.token).tickets.find((x) => x.id === t.id).messages.length,
    0,
  );
  assert.equal(
    f.game.snapshot(a.token).tickets.find((x) => x.id === t.id).messages.length,
    1,
  );
  const base = CASE_BY_ID[t.caseId].level;
  assert.deepEqual(f.game.complete(a.token, t.id, proof), {
    points: base * 2,
    duo: true,
  });
  assert.equal(
    f.room.players.find((p) => p.id === b.playerId).points,
    base * 2,
  );
  assert.equal(f.room.players.find((p) => p.id === b.playerId).assists, 1);
  assert.equal(f.game.complete(a.token, t.id, proof).duplicate, true);
  assert.equal(
    f.room.players.find((p) => p.id === a.playerId).points,
    base * 2,
  );
  f.game.claim(a.token, u.id);
  f.game.invite(a.token, u.id, b.playerId);
  f.game.answerInvite(b.token, u.id, true);
  assert.equal(f.game.complete(a.token, u.id, proof).duo, false);
  f.game.claim(a.token, v.id);
  f.game.invite(a.token, v.id, b.playerId);
  f.game.answerInvite(b.token, v.id, true);
  f.game.message(b.token, v.id, "Conferi o pedido.");
  f.game.leaveHelp(b.token, v.id);
  assert.equal(f.game.complete(a.token, v.id, proof).duo, false);
});
test("prazos 5/8/12 desde a chegada; expirar libera responsável e ajudante sem pontos", () => {
  const f = fixture(),
    [a, b] = f.students;
  for (const t of f.room.tickets)
    assert.equal(
      t.dueAt - t.createdAt,
      { 1: 5, 2: 8, 3: 12 }[CASE_BY_ID[t.caseId].level] * 60000,
    );
  const t = f.room.tickets[0];
  f.game.claim(a.token, t.id);
  f.game.invite(a.token, t.id, b.playerId);
  f.game.answerInvite(b.token, t.id, true);
  f.game.message(b.token, t.id, "Estou ajudando.");
  f.advance(t.dueAt);
  assert.equal(t.status, "expired");
  assert.throws(() => f.game.complete(a.token, t.id, proof));
  assert.equal(f.room.players.find((p) => p.id === a.playerId).points, 0);
  const next = f.room.tickets.find((x) => x.status === "new");
  f.game.claim(a.token, next.id);
  f.game.invite(a.token, next.id, b.playerId);
  f.game.answerInvite(b.token, next.id, true);
});
test("catálogo sem repetição por ciclo; instâncias têm IDs e progresso distintos", () => {
  const f = fixture(1);
  f.room.tickets = [];
  f.room.deck = [];
  const first = Array.from({ length: 50 }, () => f.game.addTicket(f.room, 0));
  assert.equal(new Set(first.map((x) => x.caseId)).size, 50);
  const again = Array.from({ length: 50 }, () => f.game.addTicket(f.room, 0));
  assert.equal(new Set(again.map((x) => x.caseId)).size, 50);
  assert.equal(new Set([...first, ...again].map((x) => x.id)).size, 100);
  first[0].summary = "Só nesta instância";
  assert.equal(again.find((x) => x.caseId === first[0].caseId).summary, "");
});
test("exportar, reiniciar e restaurar preserva turma, ranking, vínculos e origem dos PCs", () => {
  const f = fixture(),
    [a, b] = f.students,
    [t] = f.room.tickets;
  f.game.claim(a.token, t.id);
  f.game.invite(a.token, t.id, b.playerId);
  f.game.answerInvite(b.token, t.id, true);
  f.game.message(b.token, t.id, "Vamos conferir.");
  f.advance(10000);
  const backup = f.game.checkpoint(f.teacher.token),
    restarted = new GameEngine();
  assert.throws(() => restarted.authenticate(a.token));
  const session = restarted.restore("Professor", backup),
    room = restarted.room(session.code);
  assert.equal(room.status, "paused");
  assert.equal(room.elapsedMs, 10000);
  const restored = restarted.reclaim("Aluno 0", room.code);
  assert.equal(restored.previousRoom, f.teacher.code);
  assert.equal(restored.previousId, a.playerId);
  assert.equal(room.tickets[0].ownerId, restored.playerId);
  assert.equal(room.players.length, 16);
  restarted.resume(session.token);
  restarted.end(session.token);
  assert.equal(room.status, "ended");
  assert.equal(room.tickets[0].status, "expired");
});
test("limite de vagas e controles exclusivos do professor", () => {
  const f = fixture(30);
  assert.throws(() => f.game.join("Extra", f.teacher.code), /cheia/);
  assert.throws(() => f.game.pause(f.students[0].token), /professor/);
  assert.throws(
    () => f.game.claim(f.teacher.token, f.room.tickets[0].id),
    /professor/,
  );
});
