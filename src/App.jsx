import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Columns,
  User,
  Users,
  Clock,
  CheckCircle,
  Warning,
  Pause,
  GearSix,
  ArrowLeft,
  ChatCircle,
  X,
  CaretRight,
  Desktop,
  UserPlus,
  SignOut,
  WifiHigh,
  Trophy,
} from "@phosphor-icons/react";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import { CASE_BY_ID } from "../shared/catalog.mjs";
import { validateCase } from "../shared/validators.mjs";
import { socket, request } from "./connection";
import { downloadJson, loadTicket, localKey, putLocal } from "./storage";
import { prepareEnvironment } from "./prepare";
import {
  base,
  time,
  Face,
  Modal,
  TicketCard,
  Ranking,
  Lobby,
  RoomLobby,
  TeacherOptions,
  HelpChat,
  History,
} from "./ui";

function savedSession() {
  try {
    return JSON.parse(sessionStorage.getItem("techmanager-session"));
  } catch {
    return null;
  }
}
export function App() {
  const [auth, setAuth] = useState(savedSession),
    authRef = useRef(auth);
  const [state, setState] = useState(null),
    stateRef = useRef(null),
    syncAt = useRef(0);
  const [connected, setConnected] = useState(socket.connected),
    [connecting, setConnecting] = useState(true);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [view, setView] = useState("board");
  const [selected, setSelected] = useState(null),
    [local, setLocal] = useState(null),
    localRef = useRef(null);
  const frame = useRef(null),
    selectedRef = useRef(null),
    saveTimer = useRef(null),
    elapsedRef = useRef(0);
  const [ready, setReady] = useState(false),
    [chatOpen, setChatOpen] = useState(true),
    [tab, setTab] = useState("client");
  const [settings, setSettings] = useState(false),
    [invite, setInvite] = useState(false),
    [busy, setBusy] = useState(false);
  const [environment, setEnvironment] = useState({
    progress: 0,
    ready: false,
    busy: false,
  });
  const [, setPulse] = useState(0);
  authRef.current = auth;
  stateRef.current = state;
  selectedRef.current = selected;
  localRef.current = local;
  const acceptState = useCallback((next) => {
    syncAt.current = performance.now();
    stateRef.current = next;
    setState(next);
  }, []);
  const acceptPatch = useCallback(
    (patch) => {
      const previous = stateRef.current;
      if (!previous || previous.code !== patch.code) return;
      if (previous.revision !== patch.baseRevision) {
        request("room:sync")
          .then(acceptState)
          .catch(() => {});
        return;
      }
      const tickets = new Map(previous.tickets.map((t) => [t.id, t]));
      patch.tickets.forEach((t) => tickets.set(t.id, t));
      const { baseRevision, ...fields } = patch;
      acceptState({ ...previous, ...fields, tickets: [...tickets.values()] });
    },
    [acceptState],
  );
  const acceptSession = useCallback(
    (result) => {
      const { state: snapshot, ...session } = result;
      sessionStorage.setItem("techmanager-session", JSON.stringify(session));
      const player = snapshot.players.find((p) => p.id === snapshot.me);
      localStorage.setItem(
        "techmanager-identity:" +
          session.code +
          ":" +
          player.name.toLocaleLowerCase("pt-BR"),
        JSON.stringify(session),
      );
      authRef.current = session;
      setAuth(session);
      acceptState(snapshot);
      setConnecting(false);
    },
    [acceptState],
  );
  const act = useCallback(async (event, data) => {
    setError("");
    try {
      return await request(event, data);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, []);
  useEffect(() => {
    let alive = true;
    async function connectedNow() {
      setConnected(true);
      if (authRef.current?.token) {
        try {
          const result = await request("session:resume", {
            token: authRef.current.token,
          });
          if (alive) acceptSession({ ...authRef.current, ...result });
        } catch (e) {
          if (!alive) return;
          setError(
            ["SESSION_NOT_FOUND", "ROOM_NOT_FOUND"].includes(e.code)
              ? "A sala não está mais no servidor. O professor pode restaurar a exportação; seu PC permanece salvo neste navegador."
              : e.message,
          );
          if (["SESSION_NOT_FOUND", "ROOM_NOT_FOUND"].includes(e.code)) {
            setAuth(null);
            setState(null);
            sessionStorage.removeItem("techmanager-session");
          }
        }
      }
      setConnecting(false);
    }
    const disconnected = () => {
      setConnected(false);
      frame.current?.contentWindow?.OSLab?.remote?.pause(true);
    };
    const failed = () => {
      setConnecting(false);
      setConnected(false);
    };
    socket.on("connect", connectedNow);
    socket.on("disconnect", disconnected);
    socket.on("room:state", acceptState);
    socket.on("room:patch", acceptPatch);
    socket.on("connect_error", failed);
    socket.connect();
    if (socket.connected) connectedNow();
    const timer = setInterval(() => setPulse((n) => n + 1), 500);
    return () => {
      alive = false;
      socket.off("connect", connectedNow);
      socket.off("disconnect", disconnected);
      socket.off("room:state", acceptState);
      socket.off("room:patch", acceptPatch);
      socket.off("connect_error", failed);
      clearInterval(timer);
    };
  }, [acceptSession, acceptState, acceptPatch]);
  const elapsed = state
    ? state.elapsedMs +
      (state.status === "running" && connected
        ? performance.now() - syncAt.current
        : 0)
    : 0;
  elapsedRef.current = elapsed;
  const ticket = state?.tickets.find((t) => t.id === selected),
    definition = ticket && CASE_BY_ID[ticket.caseId];
  const own =
    state?.tickets.filter(
      (t) => t.status === "active" && t.ownerId === state.me,
    ) || [];
  const helping = ticket?.helperId === state?.me,
    frozen =
      !connected || state?.status !== "running" || ticket?.status !== "active";
  const save = useCallback((immediate = false) => {
    clearTimeout(saveTimer.current);
    const persist = () => {
      if (authRef.current && selectedRef.current && localRef.current)
        return putLocal(
          localKey(authRef.current, selectedRef.current),
          localRef.current,
        ).catch(() =>
          setError(
            "Não foi possível salvar neste navegador. Verifique o espaço disponível e mantenha esta aba aberta.",
          ),
        );
    };
    if (immediate) return persist();
    saveTimer.current = setTimeout(persist, 500);
  }, []);
  const updateLocal = useCallback(
    (patch) => {
      const value = { ...localRef.current, ...patch };
      localRef.current = value;
      setLocal(value);
      save();
    },
    [save],
  );
  const flush = useCallback(async () => {
    const remote = frame.current?.contentWindow?.OSLab?.remote;
    if (remote && localRef.current)
      localRef.current = { ...localRef.current, pc: remote.snapshot() };
    await save(true);
  }, [save]);
  useEffect(() => {
    window.HelpDeskRemoteHost = {
      initial(source) {
        if (frame.current?.contentWindow !== source || !selectedRef.current)
          throw new Error("Sessão local inválida");
        const t = stateRef.current.tickets.find(
            (t) => t.id === selectedRef.current,
          ),
          d = CASE_BY_ID[t.caseId];
        return {
          clientId: t.id,
          name: d.name,
          seed: d.seed,
          pc: localRef.current?.pc || null,
        };
      },
      now: () => elapsedRef.current,
      changed(source, id, pc) {
        if (
          frame.current?.contentWindow === source &&
          selectedRef.current === id &&
          localRef.current
        ) {
          localRef.current = {
            ...localRef.current,
            pc,
            confirmed:
              localRef.current.confirmed &&
              Boolean(
                validateCase(
                  stateRef.current.tickets.find((t) => t.id === id)?.caseId,
                  pc,
                ),
              ),
          };
          setLocal(localRef.current);
          save();
        }
      },
      ready(source, id) {
        if (
          frame.current?.contentWindow === source &&
          selectedRef.current === id
        ) {
          source.OSLab.remote.pause(
            stateRef.current.status !== "running" || !socket.connected,
          );
          setReady(true);
        }
      },
    };
    const unload = () => {
      if (frame.current?.contentWindow?.OSLab?.remote && localRef.current) {
        localRef.current = {
          ...localRef.current,
          pc: frame.current.contentWindow.OSLab.remote.snapshot(),
        };
        save(true);
      }
    };
    window.addEventListener("pagehide", unload);
    return () => window.removeEventListener("pagehide", unload);
  }, [save]);
  useEffect(() => {
    frame.current?.contentWindow?.OSLab?.remote?.pause(frozen);
  }, [frozen, ready]);
  useEffect(() => {
    if (state?.role !== "teacher" || !auth) return;
    const backup = () => {
      const room = stateRef.current;
      if (!room || !socket.connected) return;
      const data = { format: "techmanager-room", version: 1, savedAt: new Date().toISOString(), room: { ...room, elapsedMs: elapsedRef.current, status: room.status === "running" ? "paused" : room.status } };
      try { localStorage.setItem("techmanager-teacher-backup", JSON.stringify(data)); } catch { /* Manual export remains available if browser storage is full. */ }
    };
    backup();
    const timer = setInterval(backup, 10000);
    window.addEventListener("pagehide", backup);
    return () => { clearInterval(timer); window.removeEventListener("pagehide", backup); };
  }, [state?.role, auth?.token]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  async function openTicket(t) {
    if (busy) return;
    setBusy(true);
    try {
      await flush();
      setSelected(null);
      setReady(false);
      const data = await loadTicket(auth, t.id);
      localRef.current = data;
      setLocal(data);
      selectedRef.current = t.id;
      setSelected(t.id);
      setChatOpen(true);
      setTab(t.helperId === state.me ? "help" : "client");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function closeTicket() {
    await flush();
    setSelected(null);
    selectedRef.current = null;
    setLocal(null);
    setReady(false);
  }
  async function take(t) {
    try {
      await act("ticket:claim", { id: t.id });
      await openTicket(t);
    } catch {}
  }
  function choose(option) {
    const node = definition.conversation[option.next];
    updateLocal({
      node: option.next,
      conversation: [
        ...(localRef.current.conversation || []),
        { who: "me", text: option.label },
        { who: "client", text: node.message, image: node.image },
      ],
    });
  }
  async function confirmClient() {
    await flush();
    const correct = Boolean(validateCase(definition.id, localRef.current.pc));
    updateLocal({
      confirmed: correct,
      conversation: [
        ...(localRef.current.conversation || []),
        { who: "me", text: "Pode conferir se ficou como você precisava?" },
        {
          who: "client",
          text: correct
            ? definition.confirmation
            : "Ainda não ficou como eu precisava. " +
              (definition.detail || definition.opening),
        },
      ],
    });
    if (!correct)
      setNotice(
        "O cliente ainda precisa de um ajuste. Confira o pedido na conversa.",
      );
  }
  async function complete() {
    await flush();
    if (
      !validateCase(definition.id, localRef.current.pc) ||
      !localRef.current.confirmed
    )
      return setError("Corrija o PC e confirme o resultado com o cliente.");
    setBusy(true);
    try {
      const result = await act("ticket:complete", {
        id: selected,
        summary: localRef.current.summary,
        verified: true,
        clientConfirmed: true,
      });
      await closeTicket();
      setNotice(
        `Chamado resolvido! +${result.points} ponto${result.points > 1 ? "s" : ""}${result.duo ? " para cada participante" : ""}.`,
      );
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function prepare() {
    setEnvironment((e) => ({ ...e, busy: true }));
    try {
      const bytes = await prepareEnvironment((progress) =>
        setEnvironment({ progress, ready: false, busy: true }),
      );
      setEnvironment({ progress: 1, ready: true, busy: false, bytes });
    } catch (e) {
      setEnvironment((e) => ({ ...e, busy: false }));
      setError(e.message + " Você pode tentar preparar novamente.");
    }
  }
  async function exportRoom() {
    try {
      downloadJson(await act("room:export"), `TechManager-${state.code}.json`);
    } catch {}
  }
  async function leave() {
    await closeTicket();
    socket.disconnect();
    sessionStorage.removeItem("techmanager-session");
    setAuth(null);
    setState(null);
    authRef.current = null;
    setTimeout(() => socket.connect(), 100);
  }
  const errorBox = error && (
    <div className="alert error" role="alert">
      <Warning size={19} />
      <span>{error}</span>
      <button aria-label="Fechar aviso" onClick={() => setError("")}>
        <X />
      </button>
    </div>
  );
  if (!state || !auth)
    return (
      <>
        <Lobby
          connecting={connecting}
          connected={connected}
          onSession={acceptSession}
          act={act}
          environment={environment}
          prepare={prepare}
        />
        {errorBox}
        {notice && (
          <div className="toast" role="status">
            {notice}
          </div>
        )}
      </>
    );
  const online = state.players.filter(
      (p) => p.role === "student" && p.online,
    ).length,
    invited = state.tickets.filter(
      (t) => t.status === "active" && t.invitation?.helperId === state.me,
    );
  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="online">
          <i />
          {online} online
        </span>
        <span>
          <Clock size={21} />
          Tempo restante{" "}
          <strong>
            {time(state.config.durationMinutes * 60000 - elapsed)}
          </strong>
        </span>
        <span className="next">
          <Clock size={21} />
          Próximo chamado em{" "}
          <strong>
            {["running", "paused"].includes(state.status)
              ? time(state.nextArrivalAt - elapsed)
              : "—"}
          </strong>
        </span>
      </header>
      {ticket && local ? (
        <section className={"workspace " + (!chatOpen ? "chat-collapsed" : "")}>
          <header className="workspace-toolbar">
            <button className="text-button" onClick={closeTicket}>
              <ArrowLeft size={19} />
              Voltar ao quadro
            </button>
            <span>
              <b>#{ticket.number}</b> · {definition.title}
            </span>
            <div className="workspace-tabs">
              {own.map((t) => (
                <button
                  key={t.id}
                  className={t.id === selected ? "active" : ""}
                  onClick={() => t.id !== selected && openTicket(t)}
                >
                  #{t.number}
                </button>
              ))}
            </div>
            <button
              className="text-button"
              onClick={() => setChatOpen((v) => !v)}
            >
              <ChatCircle size={20} />
              {chatOpen ? "Recolher chat" : "Abrir chat"}
            </button>
          </header>
          <div className="desktop-area">
            {helping ? (
              <div className="helper-screen">
                <Users size={48} />
                <h2>Atendimento em dupla</h2>
                <p>
                  {state.players.find((p) => p.id === ticket.ownerId)?.name}{" "}
                  está operando o computador de {definition.name}.
                </p>
                <p>Conversem pelo chat para construir a solução juntos.</p>
                <blockquote>
                  {definition.opening}
                  <br />
                  {definition.detail}
                </blockquote>
                <button
                  className="secondary"
                  disabled={frozen}
                  onClick={() =>
                    act("help:leave", { id: selected })
                      .then(closeTicket)
                      .catch(() => {})
                  }
                >
                  Sair da ajuda
                </button>
              </div>
            ) : (
              <>
                <iframe
                  key={selected}
                  ref={frame}
                  title={`Windows de ${definition.name} — chamado ${ticket.number}`}
                  src={`${base}windows/index.html?client=${encodeURIComponent(selected)}&session=${auth.code}`}
                  allow="clipboard-read; clipboard-write"
                />
                {!ready && (
                  <div className="pc-overlay">
                    <Desktop size={40} />
                    <h2>Conectando ao computador…</h2>
                    <p>Restaurando o ambiente deste chamado.</p>
                  </div>
                )}
                {ready && frozen && (
                  <div className="pc-overlay">
                    <Pause size={42} />
                    <h2>
                      {ticket.status === "expired"
                        ? "Chamado encerrado"
                        : state.status === "ended"
                          ? "Expediente encerrado"
                          : !connected
                            ? "Reconectando à sala…"
                            : "Expediente pausado"}
                    </h2>
                    <p>
                      {ticket.status === "expired"
                        ? "O prazo acabou. Você pode voltar ao quadro."
                        : "O tempo e o computador estão congelados."}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          {chatOpen && (
            <aside className="support-chat">
              <div className="client-header">
                <Face src={definition.avatar} name={definition.name} />
                <div>
                  <strong>{definition.name}</strong>
                  <small>
                    <i />
                    Cliente · #{ticket.number}
                  </small>
                </div>
                <span className="ticket-timer">
                  <Clock size={15} />
                  {time(ticket.dueAt - elapsed)}
                </span>
              </div>
              <div className="chat-tabs">
                <button
                  className={tab === "client" ? "active" : ""}
                  onClick={() => setTab("client")}
                >
                  Cliente
                </button>
                <button
                  className={tab === "help" ? "active" : ""}
                  onClick={() => setTab("help")}
                >
                  Ajuda {ticket.helperId && <i />}
                </button>
              </div>
              {tab === "client" ? (
                <>
                  <div className="chat-scroll">
                    <div className="bubble client">{definition.opening}</div>
                    {local.conversation.map((m, i) => (
                      <div key={i} className={"bubble " + m.who}>
                        {m.text}
                        {m.image && (
                          <img
                            className="clue"
                            src={
                              base + "assets/screenshots/" + m.image + ".png"
                            }
                            alt="Imagem enviada pelo cliente"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="chat-actions">
                    {!helping &&
                      (
                        definition.conversation[local.node] ||
                        definition.conversation.start
                      ).options.map((o) => (
                        <button
                          key={o.id}
                          disabled={frozen}
                          onClick={() => choose(o)}
                        >
                          {o.label}
                          <CaretRight size={14} />
                        </button>
                      ))}
                    {!helping && (
                      <button
                        className="confirm-client"
                        disabled={frozen || !ready}
                        onClick={confirmClient}
                      >
                        <CheckCircle size={18} />
                        {local.confirmed
                          ? "Cliente confirmou a solução"
                          : "Pedir confirmação ao cliente"}
                      </button>
                    )}
                  </div>
                  {!helping && (
                    <div className="resolve-form">
                      <label htmlFor="solution">Resumo da solução</label>
                      <textarea
                        id="solution"
                        rows="2"
                        maxLength={600}
                        value={local.summary}
                        disabled={frozen}
                        onChange={(e) =>
                          updateLocal({ summary: e.target.value })
                        }
                        placeholder="O que você fez para resolver?"
                      />
                      <button
                        className="primary success"
                        disabled={
                          frozen ||
                          busy ||
                          !local.confirmed ||
                          local.summary.trim().length < 10
                        }
                        onClick={complete}
                      >
                        <CheckCircle size={18} />
                        Concluir atendimento
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <HelpChat
                  ticket={ticket}
                  state={state}
                  frozen={frozen}
                  act={act}
                  invite={() => setInvite(true)}
                />
              )}
              <footer className="local-save">
                <CheckCircle size={13} />
                PC e conversa salvos neste navegador
              </footer>
            </aside>
          )}
        </section>
      ) : (
        <div className="board-layout">
          <nav className="sidebar" aria-label="Navegação principal">
            {[
              ["board", Columns, "Quadro de chamados"],
              ["mine", User, "Meus chamados"],
              ["history", Clock, "Histórico"],
            ].map(([id, Icon, label]) => (
              <button
                key={id}
                className={view === id ? "active" : ""}
                onClick={() => setView(id)}
              >
                <Icon size={22} weight={id === "mine" ? "fill" : "regular"} />
                {label}
              </button>
            ))}
            <div className="sidebar-bottom">
              {state.role === "teacher" && (
                <button onClick={() => setSettings(true)}>
                  <GearSix size={21} />
                  Opções do professor
                </button>
              )}
              <button onClick={leave}>
                <SignOut size={21} />
                Sair da sala
              </button>
            </div>
          </nav>
          <main className="board-main">
            <div className="board-heading">
              <div>
                <h1>
                  {state.status === "lobby"
                    ? "Sua turma está chegando"
                    : view === "mine"
                      ? "Meus chamados"
                      : view === "history"
                        ? "Histórico de atendimentos"
                        : "Central de chamados"}
                </h1>
                <p>
                  {state.status === "lobby"
                    ? "Entre na sala e prepare o ambiente para começar."
                    : view === "mine"
                      ? "Seus atendimentos e a conversa com sua dupla."
                      : view === "history"
                        ? "Soluções registradas e chamados encerrados."
                        : "Escolha um chamado e ajude a turma a resolver."}
                </p>
              </div>
              {state.role === "student" && (
                <button className="own-count" onClick={() => setView("mine")}>
                  <User size={21} weight="fill" />
                  Meus chamados <b>{own.length}/2</b>
                </button>
              )}
            </div>
            {!connected && (
              <div className="status-banner">
                <WifiHigh />
                Reconectando à sala. Os atendimentos locais estão salvos.
              </div>
            )}
            {state.status === "paused" && (
              <div className="status-banner">
                <Pause />O professor pausou o expediente. Todos os prazos estão
                congelados.
              </div>
            )}
            {state.status === "ended" && (
              <div className="status-banner ended">
                <Trophy />
                Expediente encerrado. Confira o ranking e as soluções da turma.
              </div>
            )}
            {invited.map((t) => (
              <div className="invite-banner" key={t.id}>
                <UserPlus size={22} />
                <span>
                  <strong>
                    {state.players.find((p) => p.id === t.ownerId)?.name}
                  </strong>{" "}
                  convidou você para ajudar no #{t.number}.
                </span>
                <button
                  className="primary"
                  disabled={state.status !== "running"}
                  onClick={() =>
                    act("help:answer", { id: t.id, accept: true })
                      .then(() => openTicket({ ...t, helperId: state.me }))
                      .catch(() => {})
                  }
                >
                  Aceitar
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    act("help:answer", { id: t.id, accept: false }).catch(
                      () => {},
                    )
                  }
                >
                  Recusar
                </button>
              </div>
            ))}
            {state.status === "lobby" ? (
              <RoomLobby
                state={state}
                environment={environment}
                prepare={prepare}
                openSettings={() => setSettings(true)}
              />
            ) : view === "history" ? (
              <History state={state} />
            ) : (
              <div className="kanban">
                {[
                  ["new", "Novos"],
                  ["active", "Em atendimento"],
                  ["resolved", "Resolvidos"],
                ].map(([status, label]) => {
                  const tickets = state.tickets.filter(
                    (t) =>
                      t.status === status &&
                      (view !== "mine" ||
                        t.ownerId === state.me ||
                        t.helperId === state.me),
                  );
                  return (
                    <section className={"column " + status} key={status}>
                      <h2>
                        <i />
                        {label}
                        <b>{tickets.length}</b>
                      </h2>
                      <div className="column-scroll">
                        {tickets
                          .slice()
                          .reverse()
                          .map((t) => (
                            <TicketCard
                              key={t.id}
                              ticket={t}
                              state={state}
                              elapsed={elapsed}
                              take={take}
                              open={openTicket}
                              busy={busy}
                            />
                          ))}
                        {!tickets.length && (
                          <div className="empty-column">
                            <CheckCircle size={27} />
                            <p>
                              {status === "new"
                                ? "Tudo em dia por aqui."
                                : status === "active"
                                  ? "Prontos para atender?"
                                  : "Cada solução faz a diferença."}
                            </p>
                            <small>
                              {status === "new"
                                ? "O próximo chamado chega em breve."
                                : status === "active"
                                  ? "Assuma um chamado para começar."
                                  : "Os chamados concluídos aparecerão aqui."}
                            </small>
                          </div>
                        )}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </main>
          <Ranking state={state} />
        </div>
      )}
      {settings && (
        <TeacherOptions
          state={state}
          act={act}
          exportRoom={exportRoom}
          onClose={() => setSettings(false)}
        />
      )}
      {invite && (
        <Modal title="Convidar para ajudar" onClose={() => setInvite(false)}>
          <p>
            O colega pode ajudar em um chamado por vez. Conversem para que a
            solução conte como colaboração.
          </p>
          <div className="invite-list">
            {state.players
              .filter(
                (p) => p.role === "student" && p.id !== state.me && p.online,
              )
              .map((p) => (
                <button
                  key={p.id}
                  className="secondary"
                  disabled={state.tickets.some(
                    (t) => t.status === "active" && t.helperId === p.id,
                  )}
                  onClick={() =>
                    act("help:invite", { id: selected, helperId: p.id })
                      .then(() => setInvite(false))
                      .catch(() => {})
                  }
                >
                  <Face name={p.name} small />
                  {p.name}
                  <UserPlus size={19} />
                </button>
              ))}
          </div>
        </Modal>
      )}
      {errorBox}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}
