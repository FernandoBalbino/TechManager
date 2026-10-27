import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  ArrowsOut,
  ArrowsIn,
  CheckCircle,
  ChatCircle,
  Clock,
  Columns,
  Desktop,
  Headset,
  Info,
  Pause,
  Play,
  SpeakerHigh,
  SpeakerSlash,
  Trophy,
  User,
  UserPlus,
  Users,
  X,
} from "@phosphor-icons/react";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import { DEFAULTS, LEVELS } from "../../shared/catalog.mjs";
import "./slides.css";

const TITLES = [
  "Hoje, você é o suporte",
  "Um chamado, uma missão",
  "Entre na sala da turma",
  "Conheça sua central",
  "O caminho de um chamado",
  "Leia antes de assumir",
  "Converse com o cliente",
  "Mão na massa no Windows",
  "Como concluir o atendimento",
  "Uma solução em dupla",
  "Tempo, escolhas e pontos",
  "Vamos decidir juntos?",
  "Agora é com a turma",
];
const base = import.meta.env.BASE_URL;
const asset = (name) => base + "assets/slides/" + name;
const avatar = (name) => base + "assets/avatars/" + name + ".jpg";
const readSlide = () => {
  const number = Number(/^#\/(\d+)$/.exec(location.hash)?.[1] || 1);
  return Math.max(0, Math.min(TITLES.length - 1, number - 1));
};
const go = (index) => {
  location.hash = "/" + (index + 1);
};
const label = (index, text) =>
  `${String(index + 1).padStart(2, "0")} / ${text}`;

function Kicker({ children }) {
  return <p className="tm-kicker">{children}</p>;
}
function Action({ children, onClick, disabled, secondary = false, ...props }) {
  return (
    <button
      className={"tm-action" + (secondary ? " tm-secondary" : "")}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
function Point({ icon: Icon = CheckCircle, title, children }) {
  return (
    <div className="tm-point">
      <span>
        <Icon size={26} weight="duotone" />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
function Heading({ index, kicker, children, lead }) {
  return (
    <div className="tm-heading">
      <Kicker>{label(index, kicker)}</Kicker>
      <h2>{children}</h2>
      {lead && <p className="tm-lead">{lead}</p>}
    </div>
  );
}
function DemoLabel({ children = "DEMONSTRAÇÃO · SEM SALA REAL" }) {
  return (
    <span className="tm-demo-label">
      <span />
      {children}
    </span>
  );
}
function Replay({ onClick }) {
  return (
    <button className="tm-replay" onClick={onClick}>
      <ArrowCounterClockwise size={18} /> Repetir
    </button>
  );
}
function Screenshot({ name, alt, children, caption }) {
  return (
    <figure className="tm-screenshot">
      <div className="tm-image-wrap">
        <img src={asset(name)} alt={alt} draggable="false" />
        {children}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Ticket({ status = 0, onClick, compact = false }) {
  return (
    <article className={"tm-ticket" + (compact ? " tm-ticket-compact" : "")}>
      <div className="tm-ticket-meta">
        <span>#1001</span>
        <span>agora</span>
      </div>
      <h3>Volume confortável para a aula</h3>
      <p>O som está muito alto. Deixe o volume em 25%, com o som ativado.</p>
      <div className="tm-customer">
        <img src={avatar("mariana")} alt="" />
        <span>João Martins</span>
        <Desktop size={18} />
      </div>
      {status > 0 && (
        <span className="tm-owner">
          <User size={14} weight="fill" /> Você
        </span>
      )}
      <div className="tm-badges">
        <span>Fácil · 1 pt</span>
        <span>
          <Clock size={13} /> Normal
        </span>
      </div>
      {status < 2 && (
        <p className="tm-deadline">
          <Clock size={15} /> Prazo 05:00
        </p>
      )}
      <button
        className={status === 2 ? "tm-ticket-resolved" : "tm-ticket-button"}
        onClick={onClick}
        disabled={!onClick}
      >
        {status === 0 ? (
          <>
            <User weight="fill" />
            Assumir chamado
          </>
        ) : status === 1 ? (
          <>
            <Play weight="fill" />
            Continuar atendimento
          </>
        ) : (
          <>
            <CheckCircle weight="fill" />
            Resolvido · +1
          </>
        )}
      </button>
    </article>
  );
}

function EntryDemo() {
  const [step, setStep] = useState(0);
  const captions = [
    "Selecione Sou aluno e escreva seu nome.",
    "Use o código que o professor compartilhar. ABC123 é apenas o exemplo da imagem.",
    "Clique em Preparar no seu Chromebook e aguarde. Depois, entre na sala e espere o início.",
  ];
  return (
    <div className="tm-entry-demo">
      <Screenshot
        name="entrada.jpg"
        alt="Tela real de entrada com as opções Sou aluno e Sou professor, nome, código da sala e botão Entrar na sala"
        caption="Tela real do TechManager · código da imagem é ilustrativo"
      >
        <div className="tm-entry-focus" data-step={step} />
      </Screenshot>
      <div
        className="tm-step-buttons"
        role="group"
        aria-label="Passos para entrar"
      >
        {["Nome", "Código", "Preparar"].map((text, i) => (
          <button
            key={text}
            aria-pressed={step === i}
            onClick={() => setStep(i)}
          >
            <b>{i + 1}</b>
            {text}
          </button>
        ))}
      </div>
      <p className="tm-demo-feedback" role="status">
        {captions[step]}
      </p>
    </div>
  );
}

function BoardTour() {
  const [part, setPart] = useState(0);
  const parts = [
    [
      "Chamados",
      "Leia o pedido, veja a prioridade e escolha um atendimento disponível.",
    ],
    [
      "Seus atalhos",
      "Meus chamados mostra o que você assumiu. Histórico mostra resolvidos e vencidos.",
    ],
    [
      "Tempo",
      "No topo: alunos online, tempo do expediente e chegada do próximo chamado.",
    ],
    [
      "Ranking",
      "Acompanhe os pontos e os atendimentos individuais, em dupla e as ajudas.",
    ],
  ];
  return (
    <div className="tm-board-tour">
      <Screenshot
        name="central.jpg"
        alt="Central real do TechManager: menu à esquerda, três colunas de chamados ao centro, tempo no topo e ranking à direita"
        caption="Tela real de uma sessão de demonstração, pausada pelo professor"
      >
        {parts.map(([title], i) => (
          <button
            key={title}
            className={"tm-hotspot tm-spot-" + i}
            aria-label={"Mostrar: " + title}
            aria-pressed={part === i}
            onClick={() => setPart(i)}
          >
            {i + 1}
          </button>
        ))}
        <div className="tm-board-focus" data-part={part} />
      </Screenshot>
      <div className="tm-tour-caption" role="status">
        <b>
          {String(part + 1).padStart(2, "0")} · {parts[part][0]}
        </b>
        <p>{parts[part][1]}</p>
      </div>
    </div>
  );
}

function KanbanDemo() {
  const [stage, setStage] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      setStage((value) => Math.min(2, value + 1));
      setPlaying(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, [playing, stage]);
  const reset = () => {
    setStage(0);
    setPlaying(false);
  };
  const advance = () => {
    setPlaying(false);
    setStage((s) => Math.min(2, s + 1));
  };
  const messages = [
    "Novo: ninguém assumiu. O prazo já está contando.",
    "Em atendimento: você assumiu e vai cuidar deste PC.",
    "Resolvido: o problema foi corrigido, confirmado e registrado.",
  ];
  return (
    <div className="tm-kanban-demo">
      <div className="tm-demo-top">
        <DemoLabel />
        <span>Etapa {stage + 1} de 3</span>
      </div>
      <div className="tm-kanban-track" data-stage={stage}>
        {["Novos", "Em atendimento", "Resolvidos"].map((title, i) => (
          <div key={title} className={"tm-mini-column tm-col-" + i}>
            <h3>
              <i />
              {title}
              <span>{stage === i ? 1 : 0}</span>
            </h3>
          </div>
        ))}
        <div className="tm-moving-ticket" style={{ "--column": stage }}>
          <Ticket
            compact
            status={stage}
            onClick={stage === 0 ? advance : undefined}
          />
        </div>
      </div>
      <p className="tm-demo-feedback" role="status">
        {messages[stage]}
      </p>
      <div className="tm-demo-controls">
        <Action disabled={stage === 2} onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause weight="fill" /> : <Play weight="fill" />}
          {playing ? "Pausar animação" : "Animar próxima etapa"}
        </Action>
        <Action secondary disabled={stage === 2} onClick={advance}>
          Próxima etapa <ArrowRight />
        </Action>
        <Replay onClick={reset} />
      </div>
      <p className="tm-fine">
        Na sala, o chamado só fica resolvido depois da correção, da confirmação
        e do resumo. Aqui, avançamos por uma demonstração.
      </p>
    </div>
  );
}

function TicketReading() {
  const [selected, setSelected] = useState(0);
  const items = [
    [
      "Pedido",
      "O que o cliente precisa? Neste exemplo, volume em 25% e som ativado.",
    ],
    [
      "Dificuldade",
      "Fácil, médio ou difícil. Indica os pontos: 1, 2 ou 3 no atendimento individual.",
    ],
    [
      "Prioridade",
      "Normal, alta ou urgente. Ajuda a decidir o que merece atenção primeiro.",
    ],
    [
      "Prazo",
      "Conta desde a chegada do chamado. Assumir depois não reinicia o relógio.",
    ],
  ];
  return (
    <div className="tm-reading">
      <div>
        <Ticket />
        <span className="tm-reading-example">
          Mesmo pedido usado nas próximas demonstrações.
        </span>
      </div>
      <div className="tm-reading-options">
        {items.map(([title, text], i) => (
          <button
            key={title}
            aria-expanded={selected === i}
            onClick={() => setSelected(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <h3>{title}</h3>
              {selected === i && <p>{text}</p>}
            </div>
            <ArrowRight size={19} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ConversationDemo() {
  const [answer, setAnswer] = useState(null);
  return (
    <div className="tm-chat-demo">
      <DemoLabel />
      <div className="tm-chat-person">
        <img src={avatar("mariana")} alt="Avatar do cliente fictício" />
        <div>
          <strong>João Martins</strong>
          <small>Cliente simulado · #1001</small>
        </div>
        <ChatCircle size={26} />
      </div>
      <div className="tm-bubble tm-client">
        O som está muito alto. Deixe o volume em 25%, com o som ativado.
      </div>
      {answer !== null && (
        <>
          <div className="tm-bubble tm-me">
            {answer === 0
              ? "Qual volume você precisa? O som deve continuar ligado?"
              : "Vou reinstalar o computador inteiro."}
          </div>
          <div className="tm-bubble tm-client">
            {answer === 0
              ? "Preciso de exatamente 25%, sem deixar o computador no mudo."
              : "Só preciso ajustar o volume. Não é necessário reinstalar."}
          </div>
        </>
      )}
      <div
        className="tm-chat-choices"
        role="group"
        aria-label="Escolha uma resposta para o cliente"
      >
        <button onClick={() => setAnswer(0)}>
          Perguntar os detalhes do pedido <ArrowRight />
        </button>
        <button onClick={() => setAnswer(1)}>
          Propor reinstalar tudo <ArrowRight />
        </button>
      </div>
      <p className="tm-demo-feedback" role="status">
        {answer === null
          ? "Qual resposta você escolheria? Converse com a turma antes de clicar."
          : answer === 0
            ? "Bom caminho: entenda o pedido e faça apenas os ajustes necessários."
            : "O problema é simples. Investigue antes de escolher uma solução tão grande."}
      </p>
      <Replay onClick={() => setAnswer(null)} />
    </div>
  );
}

function WindowsDemo() {
  const [volume, setVolume] = useState(80),
    [muted, setMuted] = useState(false),
    [tested, setTested] = useState(false);
  const correct = volume === 25 && !muted;
  return (
    <div className="tm-windows-demo">
      <DemoLabel />
      <div className="tm-windows-stage">
        <div className="tm-desktop-icons">
          <img
            src={base + "windows/assets/learning/icons/settings.svg"}
            alt=""
          />
          <span>Configurações</span>
          <img
            src={base + "windows/assets/learning/icons/folder_search.svg"}
            alt=""
          />
          <span>Arquivos</span>
        </div>
        <div className="tm-settings-window">
          <div className="tm-window-bar">
            <span>
              <SpeakerHigh />
              Sistema &gt; Som
            </span>
            <span aria-hidden="true">−　□　×</span>
          </div>
          <div className="tm-settings-content">
            <h3>Volume de saída</h3>
            <p>Pedido: 25%, com som ativado.</p>
            <div className="tm-volume-control">
              <button
                className="tm-sound-toggle"
                aria-label={muted ? "Ativar som" : "Silenciar som"}
                aria-pressed={muted}
                onClick={() => {
                  setMuted(!muted);
                  setTested(false);
                }}
              >
                {muted ? <SpeakerSlash size={27} /> : <SpeakerHigh size={27} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={volume}
                aria-label="Volume de saída"
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setTested(false);
                }}
              />
              <output>{volume}%</output>
            </div>
            <span className={"tm-sound-state " + (muted ? "muted" : "")}>
              {muted ? "Som no mudo" : "Som ativado"}
            </span>
          </div>
        </div>
        <div className="tm-taskbar">
          <Desktop weight="fill" />
          <Columns />
          <ChatCircle />
          <span>Wi-Fi　{muted ? "🔇" : "♪"}</span>
        </div>
      </div>
      <div className="tm-demo-controls">
        <Action onClick={() => setTested(true)}>
          <CheckCircle />
          Testar ajuste
        </Action>
        <Replay
          onClick={() => {
            setVolume(80);
            setMuted(false);
            setTested(false);
          }}
        />
      </div>
      <p
        className={
          "tm-demo-feedback " + (tested && correct ? "tm-feedback-success" : "")
        }
        role="status"
      >
        {!tested
          ? "Arraste o volume. Clique no alto-falante para alternar o mudo. Depois, teste."
          : correct
            ? "Ajuste correto! 25% e som ativado. Agora, confirme com o cliente."
            : muted
              ? "Ainda falta um detalhe: o cliente pediu o som ativado. Tire do mudo."
              : `Ainda está em ${volume}%. O pedido é exatamente 25%. Use as setas do teclado para ajustar de 1 em 1.`}
      </p>
    </div>
  );
}

function CompletionDemo() {
  const [confirmed, setConfirmed] = useState(false),
    [summary, setSummary] = useState(""),
    [done, setDone] = useState(false);
  return (
    <div className="tm-completion">
      <DemoLabel />
      <div className="tm-completion-state">
        <CheckCircle size={32} weight="fill" />
        <div>
          <strong>PC ajustado: volume em 25%</strong>
          <p>Neste exemplo, a correção já foi feita e o som está ativado.</p>
        </div>
      </div>
      <button
        className={"tm-confirm " + (confirmed ? "confirmed" : "")}
        disabled={confirmed}
        onClick={() => setConfirmed(true)}
      >
        <CheckCircle size={21} />
        {confirmed
          ? "Cliente confirmou a solução"
          : "Pedir confirmação ao cliente"}
      </button>
      {confirmed && (
        <div className="tm-bubble tm-client">
          Conferi aqui e ficou como pedi. Obrigado pelo atendimento!
        </div>
      )}
      <label htmlFor="tm-summary">Resumo da solução</label>
      <textarea
        id="tm-summary"
        rows="2"
        maxLength="600"
        disabled={done}
        placeholder="O que você fez para resolver?"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
      <button
        className="tm-example-text"
        disabled={done}
        onClick={() =>
          setSummary(
            "Ajustei o volume para 25%, mantive o som ativado e confirmei com o cliente.",
          )
        }
      >
        Usar um exemplo de resumo
      </button>
      <Action
        disabled={!confirmed || summary.trim().length < 10 || done}
        onClick={() => setDone(true)}
      >
        <CheckCircle weight="fill" />
        {done ? "Atendimento concluído · +1 ponto" : "Concluir atendimento"}
      </Action>
      <p
        className={"tm-demo-feedback " + (done ? "tm-feedback-success" : "")}
        role="status"
      >
        {done
          ? "Pronto! Na sala, o chamado vai para Resolvidos e os pontos entram no ranking."
          : !confirmed
            ? "Primeiro, peça ao cliente para conferir."
            : summary.trim().length < 10
              ? "Agora, registre a solução. Escreva um resumo com pelo menos 10 caracteres."
              : "Tudo pronto. Você já pode concluir o atendimento."}
      </p>
      <Replay
        onClick={() => {
          setConfirmed(false);
          setSummary("");
          setDone(false);
        }}
      />
    </div>
  );
}

function DuoDemo() {
  const [stage, setStage] = useState(0);
  const labels = [
    "Convidar colega",
    "Simular aceite do colega",
    "Enviar orientação pelo chat",
    "Dupla pronta para colaborar",
  ];
  return (
    <div className="tm-duo-demo">
      <DemoLabel />
      <div className="tm-duo-people">
        <div>
          <img src={avatar("ana")} alt="" />
          <strong>Você</strong>
          <small>Responsável</small>
        </div>
        <div className={"tm-duo-link " + (stage >= 2 ? "connected" : "")}>
          <Users size={35} />
          <span>
            {stage === 0 ? "convide" : stage === 1 ? "aguardando" : "em dupla"}
          </span>
        </div>
        <div className={stage >= 2 ? "tm-partner-ready" : ""}>
          <img src={avatar("rafael")} alt="" />
          <strong>Rafael</strong>
          <small>Colega convidado</small>
        </div>
      </div>
      <div className="tm-duo-conversation" aria-live="polite">
        {stage < 3 ? (
          <p>
            {stage === 0
              ? "Abra a aba Ajuda no atendimento."
              : stage === 1
                ? "Convite enviado. O colega precisa aceitar."
                : "Convite aceito. Falta participar da conversa."}
          </p>
        ) : (
          <div className="tm-bubble tm-client">
            <strong>Rafael</strong>
            <br />
            Confira se o som está ativado e ajuste o volume para 25%.
          </div>
        )}
      </div>
      <Action disabled={stage === 3} onClick={() => setStage((s) => s + 1)}>
        <UserPlus />
        {labels[stage]}
      </Action>
      <p className="tm-demo-feedback" role="status">
        {stage === 3
          ? "Com o ajudante ainda vinculado e participando pelo chat, a conclusão vale o dobro para cada um."
          : "Convidar não basta: o colega deve aceitar, enviar mensagem e continuar na dupla ao concluir."}
      </p>
      <Replay onClick={() => setStage(0)} />
    </div>
  );
}

function ScoringDemo() {
  const [level, setLevel] = useState(1),
    [duo, setDuo] = useState(false);
  return (
    <div className="tm-scoring-demo">
      <DemoLabel children="PONTOS E PRAZOS · CONFIGURAÇÃO PADRÃO" />
      <div
        className="tm-level-select"
        role="group"
        aria-label="Dificuldade do exemplo"
      >
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            aria-pressed={level === n}
            onClick={() => setLevel(n)}
          >
            {LEVELS[n].label}
          </button>
        ))}
      </div>
      <div className="tm-score-values">
        <div>
          <Clock size={32} />
          <strong>
            {DEFAULTS.deadlines[level]}
            <small>min</small>
          </strong>
          <p>Prazo desde a chegada</p>
        </div>
        <div>
          <Trophy size={32} />
          <strong>
            {level * (duo ? 2 : 1)}
            <small>
              {duo ? "por pessoa" : "ponto" + (level > 1 ? "s" : "")}
            </small>
          </strong>
          <p>{duo ? "Dupla com participação" : "Atendimento individual"}</p>
        </div>
      </div>
      <button
        className="tm-duo-toggle"
        aria-pressed={duo}
        onClick={() => setDuo((d) => !d)}
      >
        <Users size={22} />
        <span>Resolver em dupla</span>
        <span className="tm-toggle-track">
          <i />
        </span>
      </button>
      <p className="tm-demo-feedback">
        O professor pode alterar os prazos. Em dupla, os pontos dobram; o prazo
        continua o mesmo.
      </p>
    </div>
  );
}

function DecisionsDemo() {
  const [question, setQuestion] = useState(0),
    [answer, setAnswer] = useState(null);
  const questions = [
    {
      title: "Dois chamados, pouco tempo",
      text: "Um chamado urgente vence em 1 minuto. Outro, normal, vence em 5. Os dois estão disponíveis e você sabe resolver ambos.",
      options: [
        "Atender o urgente com prazo menor",
        "Escolher sem olhar prazo e prioridade",
      ],
      correct: 0,
      feedback:
        "Considere urgência, tempo restante e sua capacidade de resolver. Aqui, o urgente merece atenção primeiro.",
    },
    {
      title: "O cliente disse que ficou bom",
      text: "Você corrigiu o PC e o cliente confirmou. O campo Resumo da solução ainda está vazio.",
      options: ["Já posso concluir", "Preciso registrar o que fiz"],
      correct: 1,
      feedback:
        "Falta o resumo da solução. A plataforma pede pelo menos 10 caracteres antes de concluir.",
    },
    {
      title: "Convidei um colega",
      text: "O colega aceitou, mas ainda não enviou nenhuma mensagem na aba Ajuda.",
      options: [
        "Só o convite já dobra os pontos",
        "A dupla precisa participar pelo chat",
      ],
      correct: 1,
      feedback:
        "O ajudante precisa aceitar, enviar mensagem e continuar vinculado quando o atendimento for concluído.",
    },
  ];
  const q = questions[question];
  return (
    <div className="tm-decisions">
      <div
        className="tm-decision-tabs"
        role="group"
        aria-label="Situações para discutir"
      >
        {questions.map((_, i) => (
          <button
            key={i}
            aria-pressed={question === i}
            onClick={() => {
              setQuestion(i);
              setAnswer(null);
            }}
          >
            Situação {i + 1}
          </button>
        ))}
      </div>
      <h3>{q.title}</h3>
      <p>{q.text}</p>
      <div className="tm-decision-options">
        {q.options.map((option, i) => (
          <button
            key={option}
            aria-pressed={answer === i}
            onClick={() => setAnswer(i)}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {option}
          </button>
        ))}
      </div>
      <p className="tm-demo-feedback" role="status">
        {answer === null ? (
          "Ouça as sugestões da turma. Depois, escolha uma resposta."
        ) : (
          <>
            <strong>
              {answer === q.correct ? "Isso! " : "Vamos pensar de novo. "}
            </strong>
            {q.feedback}
          </>
        )}
      </p>
    </div>
  );
}

function Slide({ index }) {
  if (index === 0)
    return (
      <section className="tm-cover">
        <div className="tm-cover-copy">
          <Kicker>MANUTENÇÃO E SUPORTE EM INFORMÁTICA</Kicker>
          <h1>
            Hoje, você
            <br />é o <em>suporte.</em>
          </h1>
          <p>
            Conheça o TechManager.
            <br />
            Depois, a turma entra em ação.
          </p>
          <Action onClick={() => go(1)}>
            Conhecer a plataforma <ArrowRight weight="bold" />
          </Action>
          <span className="tm-cover-meta">
            Uma introdução antes de abrir a sala.
          </span>
        </div>
        <div className="tm-cover-art">
          <div className="tm-cover-symbol">
            <Headset weight="duotone" />
            <span>
              TECHMANAGER
              <br />
              <b>Sua central de soluções.</b>
            </span>
          </div>
          <Screenshot
            name="central.jpg"
            alt="Imagem da plataforma TechManager com quadro de chamados e ranking"
          />
          <div className="tm-cover-flow">
            <span>
              <ChatCircle />
              Entenda
            </span>
            <ArrowRight />
            <span>
              <Desktop />
              Resolva
            </span>
            <ArrowRight />
            <span>
              <CheckCircle />
              Confirme
            </span>
          </div>
        </div>
      </section>
    );
  if (index === 1)
    return (
      <section className="tm-slide tm-split">
        <div>
          <Heading
            index={index}
            kicker="SUA FUNÇÃO NA ATIVIDADE"
            lead="Você vai atender pessoas com problemas no computador."
          >
            Um chamado.
            <br />
            <em>Uma missão.</em>
          </Heading>
          <div className="tm-points">
            <Point icon={ChatCircle} title="O cliente faz um pedido">
              O chamado registra o que precisa ser resolvido.
            </Point>
            <Point icon={Desktop} title="Você investiga e corrige">
              Converse com o cliente e use o Windows simulado.
            </Point>
            <Point icon={CheckCircle} title="A solução fica registrada">
              Confirme o resultado e escreva o que fez.
            </Point>
          </div>
        </div>
        <aside className="tm-feature">
          <Headset size={76} weight="duotone" />
          <h3>
            O suporte vai
            <br />
            além do clique.
          </h3>
          <p>Escutar, organizar e explicar também fazem parte do trabalho.</p>
          <div className="tm-feature-note">
            Os clientes e computadores são simulados. A atividade não altera o
            Windows real do Chromebook.
          </div>
        </aside>
      </section>
    );
  if (index === 2)
    return (
      <section className="tm-slide tm-split tm-entry-slide">
        <div>
          <Heading
            index={index}
            kicker="ANTES DO EXPEDIENTE"
            lead="O professor cria a sala e compartilha o código com a turma."
          >
            Entre na sala
            <br />
            <em>da turma.</em>
          </Heading>
          <div className="tm-points">
            <Point icon={User} title="Sou aluno">
              Informe seu nome para aparecer no quadro e no ranking.
            </Point>
            <Point icon={Columns} title="Código da sala">
              Digite o código que o professor mostrar.
            </Point>
            <Point icon={CheckCircle} title="Preparar">
              Carregue os recursos do Windows antes de começar.
            </Point>
          </div>
          <p className="tm-note">Não é necessário criar uma conta externa.</p>
        </div>
        <EntryDemo />
      </section>
    );
  if (index === 3)
    return (
      <section className="tm-slide tm-tour-slide">
        <Heading index={index} kicker="SEU ESPAÇO DE TRABALHO">
          Conheça sua <em>central.</em>
        </Heading>
        <BoardTour />
      </section>
    );
  if (index === 4)
    return (
      <section className="tm-slide tm-flow-slide">
        <Heading index={index} kicker="DO PEDIDO À SOLUÇÃO">
          O caminho de <em>um chamado.</em>
        </Heading>
        <KanbanDemo />
      </section>
    );
  if (index === 5)
    return (
      <section className="tm-slide">
        <Heading index={index} kicker="ORGANIZAR TAMBÉM É RESOLVER">
          Leia antes de <em>assumir.</em>
        </Heading>
        <TicketReading />
      </section>
    );
  if (index === 6)
    return (
      <section className="tm-slide tm-split">
        <div>
          <Heading
            index={index}
            kicker="DIAGNÓSTICO COMEÇA NA CONVERSA"
            lead="Uma boa pergunta evita resolver o problema errado."
          >
            Pergunte.
            <br />
            Entenda. <em>Aja.</em>
          </Heading>
          <div className="tm-points">
            <Point icon={ChatCircle} title="Leia a conversa">
              Use as respostas disponíveis para pedir detalhes.
            </Point>
            <Point icon={Info} title="Observe as pistas">
              O cliente pode explicar o pedido ou enviar uma imagem.
            </Point>
          </div>
          <p className="tm-note">
            Na plataforma, o cliente é simulado e as respostas são prontas.
          </p>
        </div>
        <ConversationDemo />
      </section>
    );
  if (index === 7)
    return (
      <section className="tm-slide tm-split">
        <div>
          <Heading
            index={index}
            kicker="EXPERIMENTE COM A TURMA"
            lead="O pedido é simples: deixar o volume em 25%, com o som ativado."
          >
            Mão na massa,
            <br />
            no <em>Windows.</em>
          </Heading>
          <p className="tm-body">
            No atendimento, você opera o computador do cliente: abre
            configurações, organiza arquivos e ajusta programas.
          </p>
          <p className="tm-note">
            Aqui, teste o controle de volume. Na sala, faça a correção dentro do
            Windows simulado.
          </p>
        </div>
        <WindowsDemo />
      </section>
    );
  if (index === 8)
    return (
      <section className="tm-slide tm-split">
        <div>
          <Heading
            index={index}
            kicker="NÃO PULE A ÚLTIMA PARTE"
            lead="Corrigir o PC é uma parte do atendimento."
          >
            Resolva.
            <br />
            Confirme. <em>Registre.</em>
          </Heading>
          <ol className="tm-numbered">
            <li>
              <b>01</b>
              <span>Corrija todos os detalhes do pedido.</span>
            </li>
            <li>
              <b>02</b>
              <span>Peça confirmação ao cliente.</span>
            </li>
            <li>
              <b>03</b>
              <span>Registre a solução e conclua.</span>
            </li>
          </ol>
          <p className="tm-note">
            Se o cliente disser que falta algo, revise o pedido e ajuste o PC.
          </p>
        </div>
        <CompletionDemo />
      </section>
    );
  if (index === 9)
    return (
      <section className="tm-slide tm-split">
        <div>
          <Heading
            index={index}
            kicker="COLABORAÇÃO DE VERDADE"
            lead="Travou em um problema? Abra a aba Ajuda e convide um colega."
          >
            Uma solução
            <br />
            <em>em dupla.</em>
          </Heading>
          <div className="tm-points">
            <Point icon={UserPlus} title="Convide e aguarde o aceite">
              O colega pode ajudar em um chamado por vez.
            </Point>
            <Point icon={ChatCircle} title="Conversem sobre a solução">
              O colega orienta pelo chat. O responsável faz a correção no PC do
              atendimento.
            </Point>
            <Point icon={Trophy} title="Participação vale pontos">
              Se a dupla participar e continuar vinculada, os dois ganham o
              dobro.
            </Point>
          </div>
        </div>
        <DuoDemo />
      </section>
    );
  if (index === 10)
    return (
      <section className="tm-slide tm-split">
        <div>
          <Heading
            index={index}
            kicker="ESCOLHAS DURANTE O EXPEDIENTE"
            lead="Olhe a dificuldade, a prioridade e o tempo restante."
          >
            Tempo, escolhas
            <br />
            <em>e pontos.</em>
          </Heading>
          <div className="tm-points">
            <Point icon={Clock} title="O relógio começa na chegada">
              O professor pode mudar os prazos. Ao pausar, ele congela os
              relógios.
            </Point>
            <Point icon={Columns} title="Até dois chamados próprios">
              Você pode manter uma ajuda além dos seus chamados.
            </Point>
            <Point icon={Info} title="Perdeu o prazo?">
              O chamado vencido vai para o Histórico e libera a vaga.
            </Point>
          </div>
          <p className="tm-note">
            Novos chamados chegam ao longo do expediente. Comece com um e cuide
            bem dele.
          </p>
        </div>
        <ScoringDemo />
      </section>
    );
  if (index === 11)
    return (
      <section className="tm-slide tm-split">
        <div>
          <Heading
            index={index}
            kicker="ANTES DE ENTRAR NA SALA"
            lead="O que você faria nestas situações?"
          >
            Vamos decidir
            <br />
            <em>juntos?</em>
          </Heading>
          <p className="tm-body">
            Leia a situação, ouça a turma e escolha uma resposta.
          </p>
          <div className="tm-discussion">
            <ChatCircle size={38} weight="duotone" />
            <p>
              Explique sua escolha.
              <br />
              <strong>Qual pista ajudou você a decidir?</strong>
            </p>
          </div>
        </div>
        <DecisionsDemo />
      </section>
    );
  return (
    <section className="tm-slide tm-split tm-final">
      <div>
        <Heading
          index={index}
          kicker="DA DEMONSTRAÇÃO PARA A PRÁTICA"
          lead="Agora vamos abrir a sala e trabalhar como uma equipe de suporte."
        >
          Agora é<br />
          <em>com a turma.</em>
        </Heading>
        <a className="tm-action" href={base}>
          Abrir o TechManager <ArrowRight weight="bold" />
        </a>
        <span className="tm-final-caption">
          O professor cria a sala. Os alunos entram com o código.
        </span>
      </div>
      <div className="tm-final-guide">
        <div className="tm-final-symbol">
          <Headset size={64} weight="duotone" />
          <span>SEU PRIMEIRO ATENDIMENTO</span>
        </div>
        <ol className="tm-numbered">
          <li>
            <b>01</b>
            <span>
              Entre com seu nome, prepare o ambiente e aguarde o início.
            </span>
          </li>
          <li>
            <b>02</b>
            <span>Leia um chamado e clique em Assumir chamado.</span>
          </li>
          <li>
            <b>03</b>
            <span>Converse, investigue e faça a correção no PC.</span>
          </li>
          <li>
            <b>04</b>
            <span>Confirme com o cliente, registre a solução e conclua.</span>
          </li>
        </ol>
        <p className="tm-note">
          Pode pedir ajuda. O objetivo é aprender a resolver e explicar o que
          foi feito.
        </p>
      </div>
    </section>
  );
}

export function Slides() {
  const [index, setIndex] = useState(readSlide),
    [full, setFull] = useState(false),
    [still, setStill] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const about = useRef(null),
    status = useRef(null);
  useEffect(() => {
    const change = () => setIndex(readSlide());
    const fullscreenChange = () => setFull(Boolean(document.fullscreenElement));
    addEventListener("hashchange", change);
    document.addEventListener("fullscreenchange", fullscreenChange);
    return () => {
      removeEventListener("hashchange", change);
      document.removeEventListener("fullscreenchange", fullscreenChange);
    };
  }, []);
  useEffect(() => {
    document.title = TITLES[index] + " — TechManager";
    status.current?.focus({ preventScroll: true });
    const keyboard = (event) => {
      if (
        event.target.closest("input,textarea,select,button,a") ||
        about.current?.open ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      const targets = {
        ArrowRight: index + 1,
        PageDown: index + 1,
        ArrowLeft: index - 1,
        PageUp: index - 1,
        Home: 0,
        End: TITLES.length - 1,
      };
      if (event.key in targets) {
        event.preventDefault();
        go(Math.max(0, Math.min(TITLES.length - 1, targets[event.key])));
      }
    };
    addEventListener("keydown", keyboard);
    return () => removeEventListener("keydown", keyboard);
  }, [index]);
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFull(false);
    }
  }
  return (
    <div className="tm-lesson" data-still={still}>
      <header className="tm-lesson-header">
        <button
          className="tm-brand"
          onClick={() => go(0)}
          aria-label="Voltar à capa"
        >
          <Headset size={24} weight="duotone" />
          <span>CONHEÇA O TECHMANAGER</span>
        </button>
        <div>
          <button
            className="tm-motion-toggle"
            aria-pressed={still}
            onClick={() => setStill((s) => !s)}
          >
            {still ? "Movimento reduzido" : "Reduzir movimento"}
          </button>
          <a href={base}>
            Ir para a plataforma <ArrowRight />
          </a>
          <button
            className="tm-fullscreen"
            aria-label={
              full ? "Sair da tela cheia" : "Apresentar em tela cheia"
            }
            onClick={fullscreen}
          >
            {full ? <ArrowsIn /> : <ArrowsOut />}
          </button>
        </div>
      </header>
      <main className="tm-deck">
        <span className="tm-sr" tabIndex={-1} role="status" ref={status}>
          Slide {index + 1} de {TITLES.length}: {TITLES[index]}
        </span>
        <div key={index} className="tm-slide-enter">
          <Slide index={index} />
        </div>
      </main>
      <footer className="tm-lesson-footer">
        <button
          className="tm-about-button"
          onClick={() => about.current.showModal()}
        >
          <Info size={17} />
          Sobre a aula
        </button>
        <nav aria-label="Escolher slide">
          {TITLES.map((title, i) => (
            <button
              key={title}
              title={title}
              aria-label={`Slide ${i + 1}: ${title}`}
              aria-current={index === i ? "step" : undefined}
              onClick={() => go(i)}
            >
              <span />
            </button>
          ))}
        </nav>
        <div className="tm-page-controls">
          <button
            aria-label="Slide anterior"
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            <ArrowLeft />
          </button>
          <span>
            <b>{String(index + 1).padStart(2, "0")}</b> / {TITLES.length}
          </span>
          <button
            className="tm-next"
            aria-label="Próximo slide"
            disabled={index === TITLES.length - 1}
            onClick={() => go(index + 1)}
          >
            <ArrowRight />
          </button>
        </div>
      </footer>
      <dialog ref={about} className="tm-about">
        <button
          className="tm-close"
          aria-label="Fechar informações"
          onClick={() => about.current.close()}
        >
          <X size={24} />
        </button>
        <Kicker>SOBRE A AULA</Kicker>
        <h2>Conheça o TechManager</h2>
        <p>
          Uma introdução prática para a turma de Manutenção e Suporte em
          Informática, antes de o professor criar a sala.
        </p>
        <p>
          Use as setas ← e →, Page Up e Page Down, ou os botões do rodapé. Home
          volta à capa; End vai ao encerramento. Nos controles das
          demonstrações, use Tab e Enter.
        </p>
        <p>
          As demonstrações são locais e ilustrativas. Não criam salas, não
          conectam ao servidor da atividade e não alteram pontuações ou
          computadores reais.
        </p>
        <h3>Referências e créditos</h3>
        <a
          href="https://github.com/FernandoBalbino/TechManager"
          target="_blank"
          rel="noreferrer"
        >
          TechManager · regras, código e imagens da plataforma ↗
        </a>
        <a
          href="https://fernandobalbino.github.io/OSLINUX/slide/"
          target="_blank"
          rel="noreferrer"
        >
          OSLINUX · referência visual ↗
        </a>
        <a
          href="https://fernandobalbino.github.io/Aula-TCP-UDP/"
          target="_blank"
          rel="noreferrer"
        >
          Aula TCP × UDP · referência visual ↗
        </a>
        <p>
          Fernando Balbino · Barlow Condensed e Inter (SIL OFL) · Phosphor Icons
          (MIT). As imagens locais mostram sessões de demonstração.
        </p>
      </dialog>
    </div>
  );
}
