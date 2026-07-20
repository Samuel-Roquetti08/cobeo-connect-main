import { useState, useEffect, type ChangeEvent, type DragEvent } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Check, X, Loader2, CreditCard, QrCode, Banknote,
  Upload, FileText, ChevronDown, Plus, Info, ShieldCheck, AlertTriangle,
} from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import {
  cursos, categorias, jantar, trabalho as trabalhoConfig, FORMATO_TRABALHO_LABELS,
  type CategoriaId, type CursoId, type JantarOpcaoId,
} from "@/data/event";
import {
  criarPedidoEvento, criarPedidoTrabalho, getEstadoInscricoes,
  type CupomAplicado, type EstadoInscricoes,
} from "@/lib/api/pedidos";
import {
  DadosForm,
  validateDados,
  isDadosValid,
  EMPTY_ERRORS,
  type DadosFormState,
  type DadosFormErrors,
} from "./DadosForm";

type Method = "pix" | "debito" | "credito";
type TabKey = "evento" | "trabalho";

// Cupons validados via Supabase RPC (função SQL SECURITY DEFINER — nunca expõe dados do cupom)

const fade: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const INITIAL_DADOS: DadosFormState = {
  nome: "", email: "", telefone: "", whatsapp: "", sameWhats: false,
};

interface CouponState {
  code: string;
  state: "idle" | "loading" | "valid" | "invalid";
  discount: number;
  label: string;
  tipo: "fixo" | "percentual" | null;
  valorBruto: number;
}
const INITIAL_COUPON: CouponState = { code: "", state: "idle", discount: 0, label: "", tipo: null, valorBruto: 0 };

/* ============================================================
   SHARED STATE — elevado para o componente raiz
   ============================================================ */
export function Inscricoes() {
  const [tab, setTab] = useState<TabKey>("evento");

  // Estado de bloqueio, lido do banco no carregamento (fail-open em pedidos.ts)
  const [estado, setEstado] = useState<EstadoInscricoes>({ inscricoesBloqueadas: false, jantarBloqueado: false, cursosBloqueados: [] });
  useEffect(() => {
    getEstadoInscricoes().then(setEstado);
  }, []);

  // Dados pessoais compartilhados entre as duas abas
  const [dados, setDados] = useState<DadosFormState>(INITIAL_DADOS);
  const [errors, setErrors] = useState<DadosFormErrors>(EMPTY_ERRORS);
  const [consentimentoLgpd, setConsentimentoLgpd] = useState(false);

  // Estado do FlowEvento
  const [stepEvento, setStepEvento] = useState(0);
  const [categoriaId, setCategoriaId] = useState<CategoriaId>("aluno_unifafibe");
  const [cursosSelecionados, setCursosSelecionados] = useState<CursoId[]>([]);
  const [jantarOpcao, setJantarOpcao] = useState<JantarOpcaoId | null>(null);
  const [coupon, setCoupon] = useState<CouponState>(INITIAL_COUPON);
  const [methodEvento, setMethodEvento] = useState<Method>("pix");

  // T7: modal "vai apresentar trabalho?" antes de criar o pedido do evento.
  // Fica aqui (não em FlowEvento) porque FlowEvento desmonta ao trocar de aba —
  // sem isso, a resposta seria esquecida a cada troca e o modal reapareceria.
  const [perguntaTrabalhoRespondida, setPerguntaTrabalhoRespondida] = useState(false);

  // Estado do FlowTrabalho
  const [stepTrabalho, setStepTrabalho] = useState(0);
  const [coauthors, setCoauthors] = useState<string[]>([]);
  const [work, setWork] = useState({
    titulo: "",
    resumo: "",
    categoria: "",
    modalidade: "",
    formato: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [methodTrabalho, setMethodTrabalho] = useState<Method>("pix");

  return (
    <section id="inscricoes" className="bg-surface py-16 md:py-[120px]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionTitle label="Garanta sua vaga" title="Inscrições" align="center" />

        <div
          role="tablist"
          aria-label="Tipo de inscrição"
          className="mt-12 grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <TabButton id="tab-evento" controls="panel-evento" active={tab === "evento"} onClick={() => setTab("evento")}>
            Inscrição no Evento
          </TabButton>
          <TabButton id="tab-trabalho" controls="panel-trabalho" active={tab === "trabalho"} onClick={() => setTab("trabalho")}>
            Submissão de Trabalho Acadêmico
          </TabButton>
        </div>

        <div className="rounded-b-xl rounded-tr-xl border border-border bg-surface p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {tab === "evento" ? (
              <motion.div key="evento" id="panel-evento" role="tabpanel" aria-labelledby="tab-evento"
                variants={fade} initial="hidden" animate="visible" exit="exit"
              >
                <FlowEvento
                  dados={dados} setDados={setDados}
                  errors={errors} setErrors={setErrors}
                  consentimentoLgpd={consentimentoLgpd} setConsentimentoLgpd={setConsentimentoLgpd}
                  step={stepEvento} setStep={setStepEvento}
                  categoriaId={categoriaId} setCategoriaId={setCategoriaId}
                  cursosSelecionados={cursosSelecionados} setCursosSelecionados={setCursosSelecionados}
                  jantarOpcao={jantarOpcao} setJantarOpcao={setJantarOpcao}
                  coupon={coupon} setCoupon={setCoupon}
                  method={methodEvento} setMethod={setMethodEvento}
                  inscricoesBloqueadas={estado.inscricoesBloqueadas}
                  jantarBloqueado={estado.jantarBloqueado}
                  cursosBloqueados={estado.cursosBloqueados}
                  perguntaTrabalhoRespondida={perguntaTrabalhoRespondida}
                  setPerguntaTrabalhoRespondida={setPerguntaTrabalhoRespondida}
                  onQuerSubmeterTrabalho={() => setTab("trabalho")}
                />
              </motion.div>
            ) : (
              <motion.div key="trabalho" id="panel-trabalho" role="tabpanel" aria-labelledby="tab-trabalho"
                variants={fade} initial="hidden" animate="visible" exit="exit"
              >
                <FlowTrabalho
                  dados={dados} setDados={setDados}
                  errors={errors} setErrors={setErrors}
                  consentimentoLgpd={consentimentoLgpd} setConsentimentoLgpd={setConsentimentoLgpd}
                  step={stepTrabalho} setStep={setStepTrabalho}
                  coauthors={coauthors} setCoauthors={setCoauthors}
                  work={work} setWork={setWork}
                  file={file} setFile={setFile}
                  method={methodTrabalho} setMethod={setMethodTrabalho}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── TabButton ────────────────────────────────────────────────────────────── */
function TabButton({ id, controls, active, onClick, children }: {
  id: string; controls: string; active: boolean;
  onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      id={id} role="tab" aria-selected={active} aria-controls={controls} onClick={onClick}
      className={`rounded-t-lg px-6 py-4 text-left font-body text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? "bg-primary text-white" : "border border-border bg-background text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Stepper ──────────────────────────────────────────────────────────────── */
function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Etapas do formulário" className="mb-10 flex items-center justify-between gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                aria-current={active ? "step" : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-full font-body text-sm font-semibold transition-colors ${
                  done ? "bg-gold text-primary" : active ? "bg-primary text-white" : "bg-border text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
              </div>
              <span className="mt-2 text-center font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 mb-6 h-[2px] flex-1 ${done ? "bg-gold" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ── Bloqueio de inscrições (T5) ──────────────────────────────────────────── */
function InscricoesBloqueadasAviso() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background px-6 py-16 text-center">
      <AlertTriangle className="h-10 w-10 text-gold" aria-hidden="true" />
      <h3 className="font-display text-xl font-bold text-foreground">Inscrições Encerradas</h3>
      <p className="max-w-md font-body text-sm text-muted-foreground">
        As inscrições para o II COBEO não estão mais disponíveis no momento. Em caso de dúvidas,
        entre em contato pelo e-mail cobeounifafibe@gmail.com.
      </p>
    </div>
  );
}

/* ── LGPD: checkbox de consentimento + modal da política (T7) ──────────────── */
function LgpdCheckbox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const [showPolicy, setShowPolicy] = useState(false);
  return (
    <>
      <label className="flex items-start gap-2 font-body text-xs text-muted-foreground select-none">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary cursor-pointer"
        />
        <span>
          Li e concordo com a{" "}
          <button
            type="button"
            onClick={() => setShowPolicy(true)}
            className="font-semibold text-primary underline hover:no-underline"
          >
            Política de Privacidade
          </button>{" "}
          e autorizo o uso dos meus dados para esta inscrição.
        </span>
      </label>
      {showPolicy && <PoliticaPrivacidadeModal onClose={() => setShowPolicy(false)} />}
    </>
  );
}

function PoliticaPrivacidadeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-border p-5">
          <h3 className="font-display text-lg font-bold text-foreground">Política de Privacidade</h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 font-body text-sm text-muted-foreground space-y-3">
          <p className="rounded-md bg-gold/10 px-3 py-2 text-[11px] text-[#8a6d1a]">
            Rascunho técnico gerado para operação do sistema — pendente de revisão jurídica da
            UNIFAFIBE antes do lançamento oficial.
          </p>
          <p><strong className="text-foreground">Dados coletados:</strong> nome, e-mail, telefone, WhatsApp e,
            quando aplicável, o arquivo (PDF/DOC/PPT) do trabalho acadêmico submetido.</p>
          <p><strong className="text-foreground">Finalidade:</strong> processar sua inscrição e/ou submissão de
            trabalho, emitir crachá e certificado, e enviar comunicações sobre o evento.</p>
          <p><strong className="text-foreground">Compartilhamento:</strong> o Mercado Pago processa o pagamento;
            o Resend envia os e-mails de confirmação. Nenhum outro terceiro recebe seus dados.</p>
          <p><strong className="text-foreground">Retenção:</strong> os dados são mantidos pelo período
            necessário à realização do evento, emissão de certificados e obrigações fiscais.</p>
          <p><strong className="text-foreground">Contato do controlador:</strong> cobeounifafibe@gmail.com.</p>
        </div>
        <footer className="border-t border-border p-4">
          <button type="button" onClick={onClose} className="w-full rounded-md bg-primary py-2.5 font-body text-sm font-semibold text-white hover:bg-[#8B1515]">
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ── Modal "vai apresentar trabalho?" antes do checkout do evento (T7) ─────── */
function TrabalhoAcademicoModal({ open, onOpenChange, onContinuarPagamento, onQuerSubmeter }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinuarPagamento: () => void;
  onQuerSubmeter: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Você também vai apresentar um trabalho?</DialogTitle>
        </DialogHeader>
        <p className="font-body text-sm text-muted-foreground">
          A submissão de trabalho acadêmico é feita na aba "Trabalho Acadêmico" e tem valor
          separado de R$ 70,00.
        </p>
        <div className="flex items-start gap-2.5 rounded-lg border border-gold/50 bg-gold/10 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <p className="font-body text-xs text-[#8a6d1a]">
            Atenção: a submissão é um pagamento separado da inscrição no evento. Se quiser fazer
            as duas coisas, você fará dois pagamentos.
          </p>
        </div>
        <DialogFooter className="sm:flex-row sm:gap-2">
          <button
            type="button"
            onClick={onContinuarPagamento}
            className="flex-1 rounded-md border border-border px-4 py-2.5 font-body text-sm font-semibold text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Não, continuar para pagamento
          </button>
          <button
            type="button"
            onClick={onQuerSubmeter}
            className="flex-1 rounded-md bg-primary px-4 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-[#8B1515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Sim, quero submeter um trabalho
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   FLOW: EVENTO
   ============================================================ */
interface FlowEventoProps {
  dados: DadosFormState; setDados: (v: DadosFormState) => void;
  errors: DadosFormErrors; setErrors: (v: DadosFormErrors) => void;
  consentimentoLgpd: boolean; setConsentimentoLgpd: (v: boolean) => void;
  step: number; setStep: (v: number) => void;
  categoriaId: CategoriaId; setCategoriaId: (v: CategoriaId) => void;
  cursosSelecionados: CursoId[]; setCursosSelecionados: (v: CursoId[]) => void;
  jantarOpcao: JantarOpcaoId | null; setJantarOpcao: (v: JantarOpcaoId | null) => void;
  coupon: CouponState;
  setCoupon: (v: CouponState | ((c: CouponState) => CouponState)) => void;
  method: Method; setMethod: (v: Method) => void;
  inscricoesBloqueadas: boolean;
  jantarBloqueado: boolean;
  cursosBloqueados: string[];
  perguntaTrabalhoRespondida: boolean;
  setPerguntaTrabalhoRespondida: (v: boolean) => void;
  onQuerSubmeterTrabalho: () => void;
}

function FlowEvento({
  dados, setDados, errors, setErrors,
  consentimentoLgpd, setConsentimentoLgpd,
  step, setStep,
  categoriaId, setCategoriaId,
  cursosSelecionados, setCursosSelecionados,
  jantarOpcao, setJantarOpcao,
  coupon, setCoupon,
  method, setMethod,
  inscricoesBloqueadas, jantarBloqueado, cursosBloqueados,
  perguntaTrabalhoRespondida, setPerguntaTrabalhoRespondida, onQuerSubmeterTrabalho,
}: FlowEventoProps) {

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showTrabalhoModal, setShowTrabalhoModal] = useState(false);

  if (inscricoesBloqueadas) {
    return <InscricoesBloqueadasAviso />;
  }

  // Preço unitário do curso com base na categoria selecionada
  const valorCurso = categorias.find((c) => c.id === categoriaId)?.valorCurso ?? 35;

  // Valor do jantar selecionado
  const valorJantar = jantarOpcao
    ? jantar.opcoes.find((o) => o.id === jantarOpcao)?.valor ?? 0
    : 0;

  // Jantar disponível apenas com 3+ cursos
  const jantarDisponivel = cursosSelecionados.length >= jantar.minimosCursos;

  // Se desmarcar cursos e ficar abaixo do mínimo, remove o jantar
  function handleToggleCurso(id: CursoId) {
    if (cursosBloqueados.includes(id)) return;
    const jatem = cursosSelecionados.includes(id);
    let nova: CursoId[];
    if (jatem) {
      nova = cursosSelecionados.filter((c) => c !== id);
    } else {
      const curso = cursos.find((c) => c.id === id);
      // Hands-on paralelos (mesmo grupoExclusivo) acontecem ao mesmo tempo —
      // selecionar um remove qualquer outro do mesmo grupo já escolhido.
      const semConflito = curso?.grupoExclusivo
        ? cursosSelecionados.filter((selId) => cursos.find((c) => c.id === selId)?.grupoExclusivo !== curso.grupoExclusivo)
        : cursosSelecionados;
      nova = [...semConflito, id];
    }
    setCursosSelecionados(nova);
    if (nova.length < jantar.minimosCursos) setJantarOpcao(null);
  }

  const subtotalCursos = cursosSelecionados.length * valorCurso;
  const descontoCupom = coupon.state === "valid" ? coupon.discount : 0;
  const total = Math.max(0, subtotalCursos + valorJantar - descontoCupom);

  async function applyCoupon() {
    if (!coupon.code) return;
    setCoupon((c) => ({ ...c, state: "loading" }));
    try {
      const { data, error } = await supabase.rpc("validar_cupom", {
        p_codigo: coupon.code.toUpperCase(),
      });
      if (error) throw error;
      if (data?.valido) {
        const valorBruto = Number(data.valor);
        const discount =
          data.tipo === "percentual"
            ? Math.round(subtotalCursos * (valorBruto / 100))
            : valorBruto;
        const label =
          data.tipo === "percentual"
            ? `${valorBruto}% de desconto nos cursos`
            : `R$ ${valorBruto.toFixed(2).replace(".", ",")} de desconto`;
        setCoupon((c) => ({ ...c, state: "valid", discount, label, tipo: data.tipo, valorBruto }));
      } else {
        setCoupon((c) => ({
          ...c,
          state: "invalid",
          discount: 0,
          label: data?.mensagem ?? "Cupom inválido ou já utilizado",
          tipo: null,
          valorBruto: 0,
        }));
      }
    } catch (e) {
      console.error("[cupom]", e);
      setCoupon((c) => ({ ...c, state: "invalid", discount: 0, label: "", tipo: null, valorBruto: 0 }));
    }
  }

  function handleContinuar() {
    if (cursosSelecionados.length === 0) {
      alert("Selecione pelo menos um curso para continuar.");
      return;
    }
    const validated = validateDados(dados);
    setErrors(validated);
    if (isDadosValid(validated)) setStep(1);
  }

  async function handleConfirmarPagamento() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const cupomAplicado: CupomAplicado | null =
        coupon.state === "valid" && coupon.tipo
          ? { codigo: coupon.code, tipo: coupon.tipo, valor: coupon.valorBruto }
          : null;

      const { pedidoId } = await criarPedidoEvento({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        whatsapp: dados.sameWhats ? dados.telefone : dados.whatsapp,
        categoria: categoriaId,
        cursosSelecionados,
        jantarOpcao,
        cupom: cupomAplicado,
        metodoPagamento: method,
        consentimentoLgpd,
      });

      const { data, error } = await supabase.functions.invoke("criar-preferencia", {
        body: { pedidoId },
      });
      if (error) throw new Error(error.message ?? "Erro ao iniciar o pagamento.");
      if (!data?.initPoint) throw new Error("Não foi possível iniciar o pagamento.");

      window.location.href = data.initPoint;
    } catch (e) {
      setSubmitError((e as Error)?.message ?? "Não foi possível processar seu pedido. Tente novamente.");
      setSubmitting(false);
    }
  }

  // T7: intercepta o clique final antes de criar o pedido do evento — pergunta
  // uma única vez por sessão de preenchimento se o participante também vai
  // submeter trabalho, já que a submissão é uma aba fácil de não notar.
  function handleIrParaPagamento() {
    if (!perguntaTrabalhoRespondida) {
      setShowTrabalhoModal(true);
      return;
    }
    handleConfirmarPagamento();
  }

  function handleModalContinuarPagamento() {
    setPerguntaTrabalhoRespondida(true);
    setShowTrabalhoModal(false);
    handleConfirmarPagamento();
  }

  function handleModalQuerSubmeter() {
    setPerguntaTrabalhoRespondida(true);
    setShowTrabalhoModal(false);
    onQuerSubmeterTrabalho();
  }

  // Linhas do resumo do pedido
  const linhasPedido = [
    ...cursosSelecionados.map((id) => {
      const curso = cursos.find((c) => c.id === id);
      return { label: curso?.titulo ?? id, value: valorCurso };
    }),
    ...(jantarOpcao ? [{
      label: `Jantar — ${jantar.opcoes.find((o) => o.id === jantarOpcao)?.label}`,
      value: valorJantar,
    }] : []),
  ];

  return (
    <div>
      <Stepper steps={["Dados & Cursos", "Pagamento"]} current={step} />

      <AnimatePresence mode="wait">
        {/* STEP 1 — Dados e seleção de cursos */}
        {step === 0 && (
          <motion.div key="s1" variants={fade} initial="hidden" animate="visible" exit="exit">
            <div className="grid gap-8 md:grid-cols-[1fr_300px]">
              <div className="space-y-8">

                {/* 1. Categoria do participante */}
                <div role="group" aria-labelledby="categoria-label">
                  <p id="categoria-label" className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Você é...
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {categorias.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        role="radio"
                        aria-checked={categoriaId === cat.id}
                        onClick={() => {
                          setCategoriaId(cat.id);
                          setCoupon(INITIAL_COUPON);
                        }}
                        className={`relative rounded-xl border-2 px-4 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          categoriaId === cat.id
                            ? "border-primary bg-[#fff8f8]"
                            : "border-border bg-surface hover:border-primary/40"
                        }`}
                      >
                        {categoriaId === cat.id && (
                          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3 w-3 text-white" aria-hidden="true" />
                          </span>
                        )}
                        <div className="font-display text-sm font-bold text-foreground">{cat.label}</div>
                        <div className="mt-1 font-display text-lg font-extrabold text-primary">
                          R$ {cat.valorCurso.toFixed(2).replace(".", ",")}<span className="font-body text-xs font-normal text-muted-foreground">/curso</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Seleção de cursos */}
                <div role="group" aria-labelledby="cursos-label">
                  <div className="mb-3 flex items-center justify-between">
                    <p id="cursos-label" className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Escolha os cursos
                    </p>
                    {cursosSelecionados.length > 0 && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-body text-xs font-semibold text-primary">
                        {cursosSelecionados.length} selecionado{cursosSelecionados.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Agrupa cursos por dia */}
                  {(["dia1", "dia2", "dia3"] as const).map((diaId) => {
                    const cursosDia = cursos.filter((c) => c.diaId === diaId);
                    const diaLabel = { dia1: "07/10 · Quarta-feira", dia2: "08/10 · Quinta-feira", dia3: "09/10 · Sexta-feira" }[diaId];
                    const gruposMostrados = new Set<string>();
                    return (
                      <div key={diaId} className="mb-4">
                        <p className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Dia {diaLabel}
                        </p>
                        <div className="space-y-2">
                          {cursosDia.map((curso) => {
                            const selecionado = cursosSelecionados.includes(curso.id as CursoId);
                            const bloqueado = cursosBloqueados.includes(curso.id);
                            const primeiroDoGrupo = curso.grupoExclusivo && !gruposMostrados.has(curso.grupoExclusivo);
                            if (curso.grupoExclusivo) gruposMostrados.add(curso.grupoExclusivo);
                            return (
                              <div key={curso.id}>
                                {primeiroDoGrupo && (
                                  <p className="mb-1.5 mt-1 font-body text-[11px] font-medium text-[#b8860b]">
                                    {curso.horario} · paralelos — escolha 1 opção
                                  </p>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleCurso(curso.id as CursoId)}
                                  disabled={bloqueado}
                                  aria-disabled={bloqueado}
                                  className={`relative w-full rounded-lg border-2 px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                    bloqueado
                                      ? "cursor-not-allowed border-border bg-muted/40 opacity-60"
                                      : selecionado
                                        ? "border-primary bg-[#fff8f8]"
                                        : "border-border bg-surface hover:border-primary/40"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center ${curso.grupoExclusivo ? "rounded-full" : "rounded"} border-2 transition-colors ${
                                      selecionado && !bloqueado ? "border-primary bg-primary" : "border-border"
                                    }`}>
                                      {selecionado && !bloqueado && <Check className="h-3 w-3 text-white" aria-hidden="true" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-body text-sm font-semibold text-foreground leading-snug">
                                        {curso.titulo}
                                        {bloqueado && (
                                          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Indisponível
                                          </span>
                                        )}
                                        {!bloqueado && curso.vagasLimitadas && (
                                          <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wider text-[#8a6d1a]">
                                            30 vagas
                                          </span>
                                        )}
                                      </p>
                                      <p className="mt-0.5 font-body text-xs text-muted-foreground">
                                        {curso.horario}
                                        {curso.palestrante && ` · ${curso.palestrante}`}
                                        {curso.instituicao && ` — ${curso.instituicao}`}
                                        {!curso.palestrante && " · A confirmar"}
                                      </p>
                                    </div>
                                    <span className="shrink-0 font-display text-sm font-bold text-primary">
                                      R$ {valorCurso.toFixed(2).replace(".", ",")}
                                    </span>
                                  </div>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {cursosSelecionados.length === 0 && (
                    <p className="mt-2 font-body text-xs text-muted-foreground">
                      Selecione pelo menos um curso para continuar.
                    </p>
                  )}
                </div>

                {/* 3. Jantar — aparece apenas com 3+ cursos */}
                <AnimatePresence>
                  {jantarDisponivel && (
                    <motion.div
                      key="jantar"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      role="group"
                      aria-labelledby="jantar-label"
                    >
                      {jantarBloqueado ? (
                        <div className="rounded-lg border border-border bg-background px-4 py-4">
                          <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            🎉 Jantar de Encerramento
                          </p>
                          <p className="mt-1 font-body text-sm text-muted-foreground">Vagas esgotadas.</p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-gold/60 bg-[#fffbf0] px-4 py-4">
                          <p id="jantar-label" className="mb-1 font-body text-xs font-semibold uppercase tracking-wider text-[#b8860b]">
                            🎉 Jantar de Encerramento — {jantar.local}
                          </p>
                          <p className="mb-3 font-body text-xs text-muted-foreground">
                            {jantar.data} · Opcional para participantes com 3+ cursos
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {/* Opção: não quero */}
                            <button
                              type="button"
                              onClick={() => setJantarOpcao(null)}
                              className={`rounded-lg border-2 px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                jantarOpcao === null
                                  ? "border-primary bg-[#fff8f8]"
                                  : "border-border bg-surface hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${jantarOpcao === null ? "border-primary bg-primary" : "border-border"}`}>
                                  {jantarOpcao === null && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className="font-body text-sm font-medium text-foreground">Não quero o jantar</span>
                              </div>
                            </button>

                            {/* Opções de jantar */}
                            {jantar.opcoes.map((opcao) => (
                              <button
                                key={opcao.id}
                                type="button"
                                onClick={() => setJantarOpcao(opcao.id)}
                                className={`rounded-lg border-2 px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                  jantarOpcao === opcao.id
                                    ? "border-primary bg-[#fff8f8]"
                                    : "border-border bg-surface hover:border-primary/40"
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${jantarOpcao === opcao.id ? "border-primary bg-primary" : "border-border"}`}>
                                    {jantarOpcao === opcao.id && <Check className="h-3 w-3 text-white" />}
                                  </div>
                                  <div>
                                    <p className="font-body text-sm font-medium text-foreground">{opcao.label}</p>
                                    <p className="font-display text-base font-bold text-primary">
                                      R$ {opcao.valor.toFixed(2).replace(".", ",")}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                          <p className="mt-3 font-body text-[11px] text-muted-foreground">
                            {jantar.observacoes[0]}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <DadosForm value={dados} onChange={setDados} errors={errors} onErrors={setErrors} />

                {/* Cupom — só aparece quando há cursos selecionados */}
                {cursosSelecionados.length > 0 && (
                  <CouponField
                    state={coupon.state}
                    value={coupon.code}
                    onChange={(v) => setCoupon((c) => ({ ...c, code: v, state: "idle", discount: 0, label: "" }))}
                    onApply={applyCoupon}
                    label={coupon.label}
                  />
                )}

                <LgpdCheckbox checked={consentimentoLgpd} onChange={setConsentimentoLgpd} />
              </div>

              {/* Resumo lateral */}
              <OrderSummary
                lines={linhasPedido}
                discount={descontoCupom}
                discountLabel={coupon.label}
                total={total}
              />
            </div>

            <PrimaryButton onClick={handleContinuar} disabled={!consentimentoLgpd} className="mt-8">
              Continuar para Pagamento
            </PrimaryButton>
          </motion.div>
        )}

        {/* STEP 2 — Pagamento */}
        {step === 1 && (
          <motion.div key="s2" variants={fade} initial="hidden" animate="visible" exit="exit">
            <PaymentStep
              method={method}
              setMethod={setMethod}
              total={total}
              labelLinha={`${cursosSelecionados.length} curso${cursosSelecionados.length > 1 ? "s" : ""}${jantarOpcao ? " + Jantar" : ""}`}
              onBack={() => setStep(0)}
              onConfirm={handleIrParaPagamento}
              submitting={submitting}
              error={submitError}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <TrabalhoAcademicoModal
        open={showTrabalhoModal}
        onOpenChange={setShowTrabalhoModal}
        onContinuarPagamento={handleModalContinuarPagamento}
        onQuerSubmeter={handleModalQuerSubmeter}
      />
    </div>
  );
}

/* ============================================================
   FLOW: TRABALHO
   ============================================================ */
interface FlowTrabalhoProps {
  dados: DadosFormState; setDados: (v: DadosFormState) => void;
  errors: DadosFormErrors; setErrors: (v: DadosFormErrors) => void;
  consentimentoLgpd: boolean; setConsentimentoLgpd: (v: boolean) => void;
  step: number; setStep: (v: number) => void;
  coauthors: string[]; setCoauthors: (v: string[]) => void;
  work: { titulo: string; resumo: string; categoria: string; modalidade: string; formato: string };
  setWork: (v: { titulo: string; resumo: string; categoria: string; modalidade: string; formato: string }) => void;
  file: File | null; setFile: (v: File | null) => void;
  method: Method; setMethod: (v: Method) => void;
}

function FlowTrabalho({
  dados, setDados, errors, setErrors,
  consentimentoLgpd, setConsentimentoLgpd,
  step, setStep,
  coauthors, setCoauthors,
  work, setWork,
  file, setFile,
  method, setMethod,
}: FlowTrabalhoProps) {

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleContinuarDados() {
    const validated = validateDados(dados);
    setErrors(validated);
    if (isDadosValid(validated)) setStep(1);
  }

  async function handleConfirmarPagamento() {
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (!file) throw new Error("Selecione o arquivo do trabalho.");

      const { pedidoId } = await criarPedidoTrabalho({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        whatsapp: dados.sameWhats ? dados.telefone : dados.whatsapp,
        titulo: work.titulo,
        resumo: work.resumo,
        categoria: work.categoria,
        modalidade: work.modalidade as "Presencial" | "Online",
        formato: work.formato as "Oral" | "Pôster",
        coautores: coauthors,
        arquivo: file,
        metodoPagamento: method,
        consentimentoLgpd,
      });

      const { data, error } = await supabase.functions.invoke("criar-preferencia", {
        body: { pedidoId },
      });
      if (error) throw new Error(error.message ?? "Erro ao iniciar o pagamento.");
      if (!data?.initPoint) throw new Error("Não foi possível iniciar o pagamento.");

      window.location.href = data.initPoint;
    } catch (e) {
      setSubmitError((e as Error)?.message ?? "Não foi possível processar seu pedido. Tente novamente.");
      setSubmitting(false);
    }
  }

  const precoTrabalho = trabalhoConfig.valor;

  return (
    <div>
      <Stepper steps={["Dados", "Trabalho", "Pagamento"]} current={step} />

      <AnimatePresence mode="wait">
        {/* STEP 1 — Dados */}
        {step === 0 && (
          <motion.div key="t1" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-6">
            <DadosForm value={dados} onChange={setDados} errors={errors} onErrors={setErrors} />

            {/* Coautores */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-foreground">Coautores</h3>
                <button
                  type="button"
                  onClick={() => setCoauthors([...coauthors, ""])}
                  className="inline-flex items-center gap-1.5 rounded-md border border-primary px-3 py-1.5 font-body text-xs font-semibold text-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Adicionar
                </button>
              </div>
              <AnimatePresence initial={false}>
                {coauthors.map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -8, height: 0 }}
                    className="mb-2 flex items-center gap-2"
                  >
                    <label htmlFor={`coautor-${i}`} className="sr-only">Coautor {i + 1}</label>
                    <input
                      id={`coautor-${i}`}
                      value={c}
                      onChange={(e) => {
                        const next = [...coauthors];
                        next[i] = e.target.value;
                        setCoauthors(next);
                      }}
                      placeholder={`Nome do coautor ${i + 1}`}
                      className="flex-1 rounded-md border border-input bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setCoauthors(coauthors.filter((_, k) => k !== i))}
                      aria-label={`Remover coautor ${i + 1}`}
                      className="text-muted-foreground hover:text-destructive focus-visible:outline-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {coauthors.length === 0 && (
                <p className="font-body text-xs text-muted-foreground">Nenhum coautor adicionado.</p>
              )}
            </div>

            <LgpdCheckbox checked={consentimentoLgpd} onChange={setConsentimentoLgpd} />

            <PrimaryButton onClick={handleContinuarDados} disabled={!consentimentoLgpd}>Continuar</PrimaryButton>
          </motion.div>
        )}

        {/* STEP 2 — Dados do trabalho */}
        {step === 1 && (
          <motion.div key="t2" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-5">

            {/* Aviso sobre publicação */}
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" aria-hidden="true" />
              <div className="font-body text-sm text-foreground">
                <p className="font-semibold">Publicação e premiação</p>
                {trabalhoConfig.observacoes.map((obs, i) => (
                  <p key={i} className="mt-0.5 text-muted-foreground">{obs}</p>
                ))}
              </div>
            </div>

            <Field label="Título do Trabalho" htmlFor="trabalho-titulo" required>
              <input
                id="trabalho-titulo"
                value={work.titulo}
                onChange={(e) => setWork({ ...work, titulo: e.target.value })}
                className="w-full rounded-md border border-input bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            <Field label={`Resumo (${work.resumo.length}/500)`} htmlFor="trabalho-resumo" required>
              <textarea
                id="trabalho-resumo"
                value={work.resumo}
                onChange={(e) => setWork({ ...work, resumo: e.target.value.slice(0, 500) })}
                rows={4}
                className="w-full rounded-md border border-input bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Categoria" htmlFor="trabalho-categoria" required>
                <select
                  id="trabalho-categoria"
                  value={work.categoria}
                  onChange={(e) => setWork({ ...work, categoria: e.target.value })}
                  className="w-full rounded-md border border-input bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {trabalhoConfig.categorias.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </Field>

              <Field label="Modalidade" htmlFor="trabalho-modalidade" required>
                <select
                  id="trabalho-modalidade"
                  value={work.modalidade}
                  onChange={(e) => setWork({ ...work, modalidade: e.target.value })}
                  className="w-full rounded-md border border-input bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {trabalhoConfig.modalidades.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </Field>

              <Field label="Formato de Apresentação" htmlFor="trabalho-formato" required>
                <select
                  id="trabalho-formato"
                  value={work.formato}
                  onChange={(e) => setWork({ ...work, formato: e.target.value })}
                  className="w-full rounded-md border border-input bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {trabalhoConfig.formatos.map((f) => (
                    <option key={f} value={f}>{FORMATO_TRABALHO_LABELS[f]}</option>
                  ))}
                </select>
              </Field>
            </div>

            <FileUpload file={file} onChange={setFile} />

            <div className="space-y-2">
              <Accordion title="Datas Importantes">
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {trabalhoConfig.normas.datasImportantes.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </Accordion>
              <Accordion title="Documentos Exigidos por Categoria">
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {trabalhoConfig.normas.documentosPorCategoria.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </Accordion>
              <Accordion title="Formatação do Resumo">
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {trabalhoConfig.normas.formatacaoResumo.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </Accordion>
              <Accordion title="Critérios de Avaliação">
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {trabalhoConfig.normas.avaliacao.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </Accordion>
              <Accordion title="Apresentação Oral">
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {trabalhoConfig.normas.apresentacaoOral.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </Accordion>
              <Accordion title="Apresentação em Painel">
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {trabalhoConfig.normas.apresentacaoPainel.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </Accordion>
              <Accordion title="Solicitação de Reembolso">
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {trabalhoConfig.normas.reembolso.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </Accordion>
            </div>

            <PrimaryButton
              disabled={!work.titulo || !work.categoria || !work.modalidade || !work.formato || !file}
              onClick={() => setStep(2)}
            >
              Continuar para Pagamento
            </PrimaryButton>
          </motion.div>
        )}

        {/* STEP 3 — Pagamento */}
        {step === 2 && (
          <motion.div key="t3" variants={fade} initial="hidden" animate="visible" exit="exit">
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-gold/50 bg-gold/10 px-4 py-3">
              <Info className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              <p className="font-body text-sm text-foreground">
                Cupons de desconto não são aplicáveis à submissão de trabalho.
              </p>
            </div>
            <PaymentStep
              method={method}
              setMethod={setMethod}
              total={precoTrabalho}
              labelLinha="Submissão de Trabalho Acadêmico"
              onBack={() => setStep(1)}
              onConfirm={handleConfirmarPagamento}
              submitting={submitting}
              error={submitError}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTES
   ============================================================ */

function Field({ label, htmlFor, children, required = false }: {
  label: string; htmlFor: string; children: React.ReactNode; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block font-body text-xs font-semibold text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  );
}

function CouponField({ state, value, onChange, onApply, label }: {
  state: "idle"|"loading"|"valid"|"invalid";
  value: string; onChange: (v: string) => void;
  onApply: () => void; label: string;
}) {
  return (
    <div role="group" aria-labelledby="cupom-label">
      <p id="cupom-label" className="mb-1 block font-body text-xs font-semibold text-foreground">
        Cupom de Desconto
        <span className="ml-1.5 font-normal text-muted-foreground">(válido apenas para cursos)</span>
      </p>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && onApply()}
          placeholder="Digite seu cupom"
          className="flex-1 rounded-md border border-input bg-surface px-3 py-2 font-body text-sm font-mono uppercase tracking-wider outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={state === "loading" || !value}
          className="rounded-md bg-primary px-5 font-body text-sm font-semibold text-white transition-colors hover:bg-[#8B1515] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
        </button>
      </div>
      {state === "valid" && (
        <p role="status" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2 py-0.5 font-body text-xs font-semibold text-green-700">
          <Check className="h-3.5 w-3.5" /> {label}
        </p>
      )}
      {state === "invalid" && (
        <p role="alert" className="mt-2 inline-flex items-center gap-1.5 font-body text-xs font-semibold text-destructive">
          <X className="h-3.5 w-3.5" /> Cupom inválido ou já utilizado
        </p>
      )}
    </div>
  );
}

function OrderSummary({ lines, discount, discountLabel, total }: {
  lines: { label: string; value: number }[];
  discount: number; discountLabel: string;
  total: number;
}) {
  return (
    <aside aria-label="Resumo do pedido" className="self-start rounded-xl border border-border bg-background p-6 md:sticky md:top-24">
      <h3 className="font-display text-lg font-bold text-foreground">Resumo do Pedido</h3>
      {lines.length === 0 ? (
        <p className="mt-4 font-body text-sm text-muted-foreground">Nenhum curso selecionado ainda.</p>
      ) : (
        <ul className="mt-4 space-y-2 font-body text-sm text-muted-foreground">
          {lines.map((l, i) => (
            <li key={i} className="flex items-baseline justify-between gap-2">
              <span className="line-clamp-2 flex-1">{l.label}</span>
              <span className="shrink-0 text-foreground">R$ {l.value.toFixed(2).replace(".", ",")}</span>
            </li>
          ))}
          {discount > 0 && (
            <li className="flex items-baseline justify-between gap-2 text-green-700">
              <span>{discountLabel}</span>
              <span>- R$ {discount.toFixed(2).replace(".", ",")}</span>
            </li>
          )}
        </ul>
      )}
      <div className="my-4 h-px bg-border" />
      <div className="flex items-baseline justify-between">
        <span className="font-body text-sm text-muted-foreground">Total</span>
        <span className="font-display text-2xl font-extrabold text-primary">
          R$ {total.toFixed(2).replace(".", ",")}
        </span>
      </div>
      <p className="mt-3 font-body text-[11px] text-muted-foreground">
        Após confirmação do pagamento você receberá um e-mail de confirmação.
      </p>
    </aside>
  );
}

function PrimaryButton({ children, onClick, disabled, className = "" }: {
  children: React.ReactNode; onClick: () => void;
  disabled?: boolean; className?: string;
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className={`w-full rounded-md bg-primary px-6 py-4 font-body text-sm font-semibold text-white transition-colors hover:bg-[#8B1515] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </button>
  );
}

/* ── PaymentStep ────────────────────────────────────────────────────────────── */
function PaymentStep({ method, setMethod, total, labelLinha = "Inscrição", onBack, onConfirm, submitting, error }: {
  method: Method; setMethod: (m: Method) => void;
  total: number; labelLinha?: string;
  onBack: () => void; onConfirm: () => void;
  submitting: boolean; error: string | null;
}) {
  return (
    <div>
      <fieldset className="mb-6">
        <legend className="sr-only">Método de pagamento</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          <PayCard active={method === "pix"} onClick={() => setMethod("pix")} icon={<QrCode />} title="PIX" sub="Aprovação imediata" />
          <PayCard active={method === "debito"} onClick={() => setMethod("debito")} icon={<Banknote />} title="Débito" sub="Aprovação imediata" />
          <PayCard active={method === "credito"} onClick={() => setMethod("credito")} icon={<CreditCard />} title="Crédito" sub="Parcelamento disponível" />
        </div>
      </fieldset>

      <div className="mb-4 flex items-baseline justify-between rounded-lg border border-border bg-background px-4 py-3">
        <span className="font-body text-sm text-muted-foreground">{labelLinha}</span>
        <span className="font-display text-xl font-extrabold text-primary">
          R$ {total.toFixed(2).replace(".", ",")}
        </span>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="font-body text-sm text-muted-foreground">
          Você será redirecionado ao ambiente seguro do <strong className="text-foreground">Mercado Pago</strong> para
          concluir o pagamento com o método escolhido. Seu pedido já está reservado e aguardando confirmação.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 font-body text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button" onClick={onBack} disabled={submitting}
          className="rounded-md border border-border px-6 py-3 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Voltar
        </button>
        <button
          type="button" onClick={onConfirm} disabled={submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-[#8B1515] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Processando...
            </>
          ) : (
            "Ir para o Pagamento"
          )}
        </button>
      </div>
    </div>
  );
}

function PayCard({ active, onClick, icon, title, sub }: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; title: string; sub: string;
}) {
  return (
    <button
      type="button" role="radio" aria-checked={active} onClick={onClick}
      className={`relative rounded-xl border-2 px-5 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? "border-primary bg-[#fff8f8]" : "border-border bg-surface hover:border-primary/50"
      }`}
    >
      {active && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
          <Check className="h-3 w-3 text-white" aria-hidden="true" />
        </span>
      )}
      <div className="text-primary [&_svg]:h-5 [&_svg]:w-5" aria-hidden="true">{icon}</div>
      <div className="mt-2 font-display text-sm font-bold text-foreground">{title}</div>
      <div className="font-body text-[11px] text-muted-foreground">{sub}</div>
    </button>
  );
}

/* ── FileUpload ────────────────────────────────────────────────────────────── */
function FileUpload({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const [over, setOver] = useState(false);
  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault(); setOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onChange(f);
  }
  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onChange(f);
  }
  return (
    <div>
      <p className="mb-1 font-body text-xs font-semibold text-foreground">
        Arquivo do Trabalho<span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
      </p>
      <label
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${over ? "border-primary bg-[#fff8f8]" : "border-border bg-background hover:border-primary/50"}`}
      >
        <Upload className="h-10 w-10 text-secondary" aria-hidden="true" />
        <p className="font-body text-base font-medium text-foreground">Arraste seu arquivo aqui</p>
        <p className="font-body text-sm text-primary underline">ou clique para selecionar</p>
        <p className="font-body text-xs text-muted-foreground">PDF, DOC, DOCX, PPT ou PPTX — até 10 MB</p>
        <input type="file" className="sr-only" onChange={onPick} accept=".pdf,.doc,.docx,.ppt,.pptx" aria-label="Selecionar arquivo do trabalho acadêmico" />
      </label>
      {file && (
        <div className="mt-3 inline-flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="font-body text-sm text-foreground">{file.name}</span>
          <span className="font-body text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
          <button type="button" onClick={() => onChange(null)} aria-label={`Remover arquivo ${file.name}`} className="text-muted-foreground hover:text-destructive focus-visible:outline-none">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Accordion ─────────────────────────────────────────────────────────────── */
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = `accordion-${title.replace(/\s/g, "-").toLowerCase()}`;
  return (
    <div className="rounded-lg border border-border bg-background">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={id} className="flex w-full items-center justify-between px-4 py-3 text-left font-body text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        {title}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div id={id} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-4 pb-4 font-body text-sm text-muted-foreground">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
