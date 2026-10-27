import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Users,
  Clock,
  Trophy,
  CheckCircle,
  ChartBar,
  Warning,
  Play,
  GearSix,
  CaretRight,
  Desktop,
  PaperPlaneTilt,
  UserPlus,
  DownloadSimple,
  X,
  Pause,
  Columns,
} from "@phosphor-icons/react";
import { CASE_BY_ID, LEVELS } from "../shared/catalog.mjs";
import { serverUrl } from "./connection";
export const base = import.meta.env.BASE_URL;
export const time = (ms) => {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
};
export function Face({ name, src, small = false }) {
  const defaults = Object.values(CASE_BY_ID).slice(0, 15);
  const index =
    [...(name || "")].reduce((sum, c) => sum + c.codePointAt(0), 0) %
    defaults.length;
  return (
    <img
      className={"face " + (small ? "small" : "")}
      src={base + (src || defaults[index].avatar)}
      alt=""
    />
  );
}

export function Modal({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={onClose}>
      <header>
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Fechar">
          <X size={22} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function TicketCard({ ticket: t, state, elapsed, take, open, busy }) {
  const d = CASE_BY_ID[t.caseId],
    l = LEVELS[d.level],
    owner = state.players.find((p) => p.id === t.ownerId),
    mine = t.ownerId === state.me || t.helperId === state.me;
  return (
    <article className="ticket-card">
      <div className="ticket-meta">
        <span>#{t.number}</span>
        <span>
          {elapsed - t.createdAt < 60000
            ? "agora"
            : `há ${Math.floor((elapsed - t.createdAt) / 60000)} min`}
        </span>
      </div>
      <h3>{d.title}</h3>
      <p className="ticket-description">{d.opening}</p>
      <div className="ticket-customer">
        <span>
          <Face src={d.avatar} name={d.name} small />
          {d.name}
        </span>
        <Desktop size={17} />
      </div>
      {owner && (
        <div className={"ticket-owner " + (mine ? "mine" : "")}>
          <User size={15} weight="fill" />
          {owner.name}
          {owner.id === state.me ? " (você)" : ""}
        </div>
      )}
      <div className="badges">
        <span className={"difficulty level-" + d.level}>
          <ChartBar size={16} weight="fill" />
          {l.label} · {d.level} {d.level === 1 ? "pt" : "pts"}
        </span>
        <span className={"priority " + d.priority}>
          {d.priority === "normal" ? (
            <Clock size={14} />
          ) : (
            <Warning size={14} weight="fill" />
          )}
          {d.priority === "urgente"
            ? "Urgente"
            : d.priority === "alta"
              ? "Alta"
              : "Normal"}
        </span>
      </div>
      {t.helperId && (
        <span className="duo">
          <Users size={18} weight="fill" />
          Em dupla
        </span>
      )}
      {t.status !== "resolved" && (
        <div
          className={"deadline " + (t.dueAt - elapsed < 60000 ? "urgent" : "")}
        >
          <Clock size={15} weight="fill" />
          Prazo {time(t.dueAt - elapsed)}
        </div>
      )}
      {t.status === "new" ? (
        <button
          className="primary card-button"
          disabled={
            state.role !== "student" ||
            state.status !== "running" ||
            busy ||
            state.tickets.filter(
              (x) => x.ownerId === state.me && x.status === "active",
            ).length >= 2
          }
          onClick={() => take(t)}
        >
          <User size={18} weight="fill" />
          Assumir chamado
        </button>
      ) : t.status === "resolved" ? (
        <div className="resolved-label">
          <CheckCircle size={21} weight="fill" />
          Resolvido{t.points ? ` · +${t.points}` : ""}
        </div>
      ) : mine ? (
        <button
          className="coral card-button"
          onClick={() => open(t)}
          disabled={busy}
        >
          <Play size={17} weight="fill" />
          {t.helperId === state.me
            ? "Ajudar no atendimento"
            : "Continuar atendimento"}
        </button>
      ) : (
        <div className="in-progress">Em atendimento</div>
      )}
    </article>
  );
}
export function Ranking({ state }) {
  const players = state.players
    .filter((p) => p.role === "student")
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return (
    <aside className="ranking">
      <header>
        <Trophy size={36} weight="fill" />
        <div>
          <h2>Ranking ao vivo</h2>
          <p>Pontos</p>
        </div>
      </header>
      <div className="ranking-list">
        {players.map((p) => {
          const place = players.findIndex((x) => x.points === p.points) + 1;
          return (
            <div
              key={p.id}
              className={"ranking-row " + (p.id === state.me ? "you" : "")}
            >
              <b className={"rank rank-" + place}>{place}</b>
              <Face name={p.name} />
              <div>
                <strong>
                  {p.name}
                  {p.id === state.me ? " (você)" : ""}
                </strong>
                <small title="Individuais · Em dupla · Ajudas">
                  {p.solo} solo · {p.duo} dupla · {p.assists} ajuda
                  {p.assists !== 1 ? "s" : ""}
                </small>
              </div>
              <b className="points">{p.points}</b>
              <i
                className={p.online ? "is-online" : ""}
                title={p.online ? "Online" : "Offline"}
              />
            </div>
          );
        })}
        {!players.length && (
          <p className="muted rank-empty">
            O ranking começa quando a turma entrar.
          </p>
        )}
      </div>
      <div className="scoring">
        <h3>
          <Users size={23} weight="fill" />
          Pontuação
        </h3>
        <p>Fácil 1 · Médio 2 · Difícil 3</p>
        <p>Em dupla: dobro para cada</p>
      </div>
    </aside>
  );
}
function ConfigFields({ config, setConfig }) {
  return (
    <div className="config-fields">
      <label>
        Duração da partida (min)
        <input
          type="number"
          min="5"
          max="120"
          value={config.durationMinutes}
          onChange={(e) =>
            setConfig({ ...config, durationMinutes: e.target.value })
          }
        />
      </label>
      <fieldset>
        <legend>Prazos desde a chegada (min)</legend>
        {[1, 2, 3].map((l) => (
          <label key={l}>
            {LEVELS[l].label}
            <input
              type="number"
              min="1"
              max="60"
              value={config.deadlines[l]}
              onChange={(e) =>
                setConfig({
                  ...config,
                  deadlines: { ...config.deadlines, [l]: e.target.value },
                })
              }
            />
          </label>
        ))}
      </fieldset>
    </div>
  );
}
export function Environment({ value, prepare }) {
  return (
    <div className="environment">
      <CheckCircle size={19} />
      <span>
        {value.ready
          ? `Ambiente preparado · ${(value.bytes / 1024 / 1024).toFixed(1)} MB em cache`
          : value.busy
            ? `Preparando recursos locais… ${Math.round(value.progress * 100)}%`
            : "Prepare o Windows antes de começar"}
      </span>
      {!value.ready && (
        <button className="text-button" disabled={value.busy} onClick={prepare}>
          {value.busy ? "Preparando…" : "Preparar"}
        </button>
      )}
    </div>
  );
}
export function Lobby({
  onSession,
  act,
  connecting,
  connected,
  environment,
  prepare,
}) {
  const [mode, setMode] = useState("join"),
    [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [checkpoint, setCheckpoint] = useState(null),
    [fileError, setFileError] = useState("");
  const [config, setConfig] = useState({
    durationMinutes: 45,
    deadlines: { 1: 5, 2: 8, 3: 12 },
  });
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "join") {
        const saved = JSON.parse(
          localStorage.getItem(
            "techmanager-identity:" +
              code +
              ":" +
              name.trim().toLocaleLowerCase("pt-BR"),
          ) || "null",
        );
        if (saved?.token) {
          try {
            onSession({
              ...saved,
              ...(await act("session:resume", { token: saved.token })),
            });
            return;
          } catch {}
        }
      }
      onSession(
        await act(
          mode === "create"
            ? "room:create"
            : mode === "restore"
              ? "room:restore"
              : "room:join",
          { name, code, config, checkpoint },
        ),
      );
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function readBackup(e) {
    const file = e.target.files?.[0];
    if (file) {
      try {
        if (file.size > 7 * 1024 * 1024) throw Error();
        const data = JSON.parse(await file.text());
        if (data.format !== "techmanager-room") throw Error();
        setCheckpoint(data);
        setFileError("");
      } catch {
        setCheckpoint(null);
        setFileError("Selecione uma exportação válida do TechManager.");
      }
    }
  }
  return (
    <main className="lobby-page">
      <div className="lobby-intro">
        <span className="eyebrow">
          <Columns size={18} />
          APRENDER NA PRÁTICA
        </span>
        <h1>
          Uma turma.
          <br />
          Muitas soluções.
        </h1>
        <p>
          Atenda chamados, resolva problemas no computador e colabore com seus
          colegas.
        </p>
        <div className="lobby-facts">
          <span>
            <Desktop size={21} />
            Windows simulado
          </span>
          <span>
            <Users size={21} />
            Colaboração ao vivo
          </span>
          <span>
            <Trophy size={21} />
            Desafios em equipe
          </span>
        </div>
        <a className="lesson-entry" href={base + "slide/"}>
          Conheça a plataforma · Ver apresentação <CaretRight size={18} />
        </a>
      </div>
      <section className="lobby-panel">
        <h2>Vamos começar?</h2>
        <p>Escolha como você quer entrar.</p>
        <div className="mode-tabs">
          <button
            className={mode === "join" ? "active" : ""}
            onClick={() => setMode("join")}
          >
            Sou aluno
          </button>
          <button
            className={mode !== "join" ? "active" : ""}
            onClick={() => setMode("create")}
          >
            Sou professor
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            Seu nome
            <input
              required
              maxLength={60}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome e sobrenome"
            />
          </label>
          {mode === "join" ? (
            <label>
              Código da sala
              <input
                required
                maxLength={6}
                className="room-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
              />
            </label>
          ) : mode === "restore" ? (
            <>
              <label>
                Exportação da sala
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={readBackup}
                />
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  try {
                    const d = JSON.parse(
                      localStorage.getItem("techmanager-teacher-backup"),
                    );
                    if (!d) throw Error();
                    setCheckpoint(d);
                    setFileError("");
                  } catch {
                    setFileError("Nenhum backup encontrado neste navegador.");
                  }
                }}
              >
                Usar último backup deste navegador
              </button>
              <p className="muted">
                {checkpoint
                  ? `Sessão ${checkpoint.room?.code} selecionada. Os alunos deverão entrar com os mesmos nomes.`
                  : "Selecione uma exportação para recuperar a turma."}
              </p>
              {fileError && <p role="alert">{fileError}</p>}
            </>
          ) : (
            <ConfigFields config={config} setConfig={setConfig} />
          )}
          <button
            className="primary"
            disabled={busy || !connected || (mode === "restore" && !checkpoint)}
          >
            {busy
              ? "Entrando…"
              : connecting
                ? "Conectando…"
                : !connected
                  ? "Aguardando servidor…"
                  : mode === "join"
                    ? "Entrar na sala"
                    : mode === "restore"
                      ? "Restaurar sala"
                      : "Criar sala"}
            <CaretRight size={18} />
          </button>
        </form>
        {mode !== "join" && (
          <button
            className="restore-link text-button"
            onClick={() => setMode(mode === "restore" ? "create" : "restore")}
          >
            {mode === "restore"
              ? "Criar uma nova sala"
              : "Restaurar uma sessão anterior"}
          </button>
        )}
        <Environment value={environment} prepare={prepare} />
        {!serverUrl && import.meta.env.PROD && (
          <p className="connection-help">
            Configure VITE_REALTIME_URL com o endereço do serviço da turma.
          </p>
        )}
        <small className="lobby-footnote">
          Sem contas externas. Cada atendimento é uma simulação.
        </small>
      </section>
    </main>
  );
}
export function RoomLobby({ state, environment, prepare, openSettings }) {
  return (
    <section className="room-lobby">
      <div className="room-code">
        <small>CÓDIGO DA SALA</small>
        <strong>{state.code}</strong>
        <p>Os alunos entram com nome e este código.</p>
      </div>
      <div className="roster">
        <h2>
          <Users size={23} />
          {state.players.filter((p) => p.role === "student").length} alunos na
          sala
        </h2>
        {state.players
          .filter((p) => p.role === "student")
          .map((p) => (
            <span key={p.id}>
              <i className={p.online ? "online-dot" : ""} />
              <Face name={p.name} small />
              {p.name}
            </span>
          ))}
      </div>
      <Environment value={environment} prepare={prepare} />
      {state.role === "teacher" ? (
        <button className="primary" onClick={openSettings}>
          <Play weight="fill" />
          Preparar e iniciar expediente
        </button>
      ) : (
        <p className="waiting">
          <Clock size={20} />
          Aguardando o professor iniciar. Um chamado por aluno será liberado.
        </p>
      )}
    </section>
  );
}
export function TeacherOptions({ state, act, exportRoom, onClose }) {
  const [config, setConfig] = useState(state.config),
    [ending, setEnding] = useState(false);
  async function control(event, data) {
    try {
      await act(event, data);
      onClose();
    } catch {}
  }
  return (
    <Modal title="Opções do professor" onClose={onClose}>
      <div className="teacher-code">
        Código da sala <strong>{state.code}</strong>
      </div>
      {state.status === "lobby" && (
        <ConfigFields config={config} setConfig={setConfig} />
      )}
      <p className="muted">
        No início: um chamado por aluno presente. Depois: um novo chamado
        compartilhado a cada 60 segundos.
      </p>
      <div className="teacher-actions">
        {state.status === "lobby" && (
          <button
            className="primary"
            onClick={() => control("room:start", { config })}
          >
            <Play weight="fill" />
            Iniciar expediente
          </button>
        )}
        {state.status === "running" && (
          <button className="primary" onClick={() => control("room:pause")}>
            <Pause />
            Pausar expediente
          </button>
        )}
        {state.status === "paused" && (
          <button className="primary" onClick={() => control("room:resume")}>
            <Play weight="fill" />
            Retomar expediente
          </button>
        )}
        <button className="secondary" onClick={exportRoom}>
          <DownloadSimple />
          Exportar sessão
        </button>
        {!["lobby", "ended"].includes(state.status) &&
          (ending ? (
            <div className="end-confirm">
              <p>Encerrar libera todos os atendimentos pendentes sem pontos.</p>
              <button className="coral" onClick={() => control("room:end")}>
                Confirmar encerramento
              </button>
              <button className="text-button" onClick={() => setEnding(false)}>
                Voltar
              </button>
            </div>
          ) : (
            <button
              className="text-button danger"
              onClick={() => setEnding(true)}
            >
              Encerrar expediente
            </button>
          ))}
      </div>
      <p className="muted backup-note">
        A sala é temporária. Uma cópia automática fica neste navegador a cada
        10 segundos enquanto a aba estiver aberta. Exporte para guardar uma cópia. Os
        PCs continuam no navegador de cada aluno.
      </p>
    </Modal>
  );
}
export function HelpChat({ ticket, state, frozen, act, invite }) {
  const [message, setMessage] = useState("");
  async function send(e) {
    e.preventDefault();
    try {
      await act("help:message", { id: ticket.id, text: message });
      setMessage("");
    } catch {}
  }
  return (
    <>
      <div className="help-intro">
        <Users size={28} />
        <h3>
          {ticket.helperId
            ? "Vocês estão juntos neste chamado"
            : "Uma boa solução pode ser em dupla"}
        </h3>
        <p>
          {ticket.helperId
            ? `${state.players.find((p) => p.id === ticket.ownerId)?.name} + ${state.players.find((p) => p.id === ticket.helperId)?.name}`
            : "Convide um colega e conversem sobre a solução. Com participação do ajudante, os dois recebem o dobro dos pontos."}
        </p>
        {!ticket.helperId && ticket.ownerId === state.me && (
          <button className="primary" disabled={frozen} onClick={invite}>
            <UserPlus size={19} />
            {ticket.invitation ? "Alterar convite" : "Convidar colega"}
          </button>
        )}
        {ticket.invitation && (
          <small>Convite enviado. Aguardando aceite.</small>
        )}
      </div>
      <div className="chat-scroll help-messages">
        {ticket.messages.map((m) => (
          <div
            className={"bubble " + (m.from === state.me ? "me" : "client")}
            key={m.id}
          >
            <small>{state.players.find((p) => p.id === m.from)?.name}</small>
            {m.text}
          </div>
        ))}
      </div>
      {ticket.helperId && (
        <form className="message-form" onSubmit={send}>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            disabled={frozen}
            aria-label="Mensagem para a dupla"
            placeholder="Converse com sua dupla…"
          />
          <button
            className="primary"
            disabled={frozen || !message.trim()}
            aria-label="Enviar mensagem"
          >
            <PaperPlaneTilt size={20} />
          </button>
        </form>
      )}
    </>
  );
}
export function History({ state }) {
  return (
    <section className="history-list">
      {state.tickets
        .filter((t) => ["resolved", "expired"].includes(t.status))
        .slice()
        .reverse()
        .map((t) => (
          <article key={t.id}>
            <span className={"history-icon " + t.status}>
              {t.status === "resolved" ? (
                <CheckCircle size={23} />
              ) : (
                <Clock size={23} />
              )}
            </span>
            <div>
              <small>
                #{t.number} · {CASE_BY_ID[t.caseId].name}
              </small>
              <h3>{CASE_BY_ID[t.caseId].title}</h3>
              <p>
                {t.summary ||
                  (t.status === "expired"
                    ? t.expireReason === "deadline"
                      ? "Prazo esgotado · sem pontos"
                      : "Expediente encerrado · sem pontos"
                    : "Solução registrada pelo responsável.")}
              </p>
            </div>
            <b>
              {t.status === "resolved"
                ? `+${t.points} pts${t.duo ? " por pessoa" : ""}`
                : "Encerrado"}
            </b>
          </article>
        ))}
      {!state.tickets.some((t) =>
        ["resolved", "expired"].includes(t.status),
      ) && (
        <div className="history-empty">
          <Clock size={40} />
          <h2>A história da turma começa aqui</h2>
          <p>Chamados resolvidos e expirados aparecerão neste espaço.</p>
        </div>
      )}
    </section>
  );
}
