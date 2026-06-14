import { useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Check, X, Loader2, CreditCard, QrCode, Banknote,
  Copy, Upload, FileText, ChevronDown, Plus, Info,
} from "lucide-react";
import { SectionTitle } from "./SectionTitle";
import { ingressos, palestrasAvulsas, diasEvento, type IngressoId } from "@/data/event";
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

const COUPONS: Record<string, { tipo: "fixo" | "percentual"; valor: number }> = {
  COBEO10: { tipo: "percentual", valor: 10 },
  ALUNO20: { tipo: "percentual", valor: 20 },
};

const DESCONTO_COMBO = 70;

const fade: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const INITIAL_DADOS: DadosFormState = {
  nome: "", email: "", telefone: "", whatsapp: "", sameWhats: false,
};

/* ============================================================
   SHARED STATE — elevado para o componente raiz
   Persiste quando o usuário troca de aba
   ============================================================ */
export function Inscricoes() {
  const [tab, setTab] = useState<TabKey>("evento");

  // ── Dados pessoais — compartilhados entre as duas abas ──
  const [dados, setDados] = useState<DadosFormState>(INITIAL_DADOS);
  const [errors, setErrors] = useState<DadosFormErrors>(EMPTY_ERRORS);

  // ── Estado do FlowEvento ──
  const [stepEvento, setStepEvento] = useState(0);
  const [ingressoId, setIngressoId] = useState<IngressoId>("completo");
  const [palestraSelecionada, setPalestraSelecionada] = useState("");
  const [diaSelecionado, setDiaSelecionado] = useState("");
  const [coupon, setCoupon] = useState({
    code: "",
    state: "idle" as "idle" | "loading" | "valid" | "invalid",
    discount: 0,
    label: "",
  });
  const [methodEvento, setMethodEvento] = useState<Method>("pix");
  const [showCombineBanner, setShowCombineBanner] = useState(true);
  const [comboAtivo, setComboAtivo] = useState(false);

  // ── Estado do FlowTrabalho ──
  const [stepTrabalho, setStepTrabalho] = useState(0);
  const [coauthors, setCoauthors] = useState<string[]>([]);
  const [work, setWork] = useState({ titulo: "", resumo: "", categoria: "" });
  const [file, setFile] = useState<File | null>(null);
  const [methodTrabalho, setMethodTrabalho] = useState<Method>("pix");

  // ── Cálculos derivados ──
  const ingressoSelecionado = ingressos.find((i) => i.id === ingressoId) ?? ingressos[2];
  const valorBase = ingressoSelecionado.valor;
  const totalEvento = useMemo(
    () => Math.max(0, valorBase - coupon.discount - (comboAtivo ? DESCONTO_COMBO : 0)),
    [valorBase, coupon.discount, comboAtivo],
  );

  function handleSwitchToTrabalho() {
    setComboAtivo(true);
    setShowCombineBanner(false);
    setTab("trabalho");
  }

  function resetAll() {
    setDados(INITIAL_DADOS);
    setErrors(EMPTY_ERRORS);
    setStepEvento(0);
    setIngressoId("completo");
    setPalestraSelecionada("");
    setDiaSelecionado("");
    setCoupon({ code: "", state: "idle", discount: 0, label: "" });
    setMethodEvento("pix");
    setShowCombineBanner(true);
    setComboAtivo(false);
    setStepTrabalho(0);
    setCoauthors([]);
    setWork({ titulo: "", resumo: "", categoria: "" });
    setFile(null);
    setMethodTrabalho("pix");
  }

  return (
    <section id="inscricoes" className="bg-surface py-16 md:py-[120px]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionTitle label="Garanta sua vaga" title="Inscrições" align="center" />

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Tipo de inscrição"
          className="mt-12 grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <TabButton
            id="tab-evento"
            controls="panel-evento"
            active={tab === "evento"}
            onClick={() => setTab("evento")}
          >
            Inscrição no Evento
          </TabButton>
          <TabButton
            id="tab-trabalho"
            controls="panel-trabalho"
            active={tab === "trabalho"}
            onClick={() => setTab("trabalho")}
          >
            Submissão de Trabalho Acadêmico
          </TabButton>
        </div>

        <div className="rounded-b-xl rounded-tr-xl border border-border bg-surface p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {tab === "evento" ? (
              <motion.div
                key="evento"
                id="panel-evento"
                role="tabpanel"
                aria-labelledby="tab-evento"
                variants={fade}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <FlowEvento
                  // Dados compartilhados
                  dados={dados}
                  setDados={setDados}
                  errors={errors}
                  setErrors={setErrors}
                  // Estado do flow
                  step={stepEvento}
                  setStep={setStepEvento}
                  ingressoId={ingressoId}
                  setIngressoId={setIngressoId}
                  palestraSelecionada={palestraSelecionada}
                  setPalestraSelecionada={setPalestraSelecionada}
                  diaSelecionado={diaSelecionado}
                  setDiaSelecionado={setDiaSelecionado}
                  coupon={coupon}
                  setCoupon={setCoupon}
                  method={methodEvento}
                  setMethod={setMethodEvento}
                  showCombineBanner={showCombineBanner}
                  setShowCombineBanner={setShowCombineBanner}
                  comboAtivo={comboAtivo}
                  setComboAtivo={setComboAtivo}
                  ingressoSelecionado={ingressoSelecionado}
                  valorBase={valorBase}
                  total={totalEvento}
                  onSwitchToTrabalho={handleSwitchToTrabalho}
                  onReset={resetAll}
                />
              </motion.div>
            ) : (
              <motion.div
                key="trabalho"
                id="panel-trabalho"
                role="tabpanel"
                aria-labelledby="tab-trabalho"
                variants={fade}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <FlowTrabalho
                  // Dados compartilhados
                  dados={dados}
                  setDados={setDados}
                  errors={errors}
                  setErrors={setErrors}
                  // Estado do flow
                  step={stepTrabalho}
                  setStep={setStepTrabalho}
                  coauthors={coauthors}
                  setCoauthors={setCoauthors}
                  work={work}
                  setWork={setWork}
                  file={file}
                  setFile={setFile}
                  method={methodTrabalho}
                  setMethod={setMethodTrabalho}
                  onReset={resetAll}
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
function TabButton({
  id, controls, active, onClick, children,
}: {
  id: string; controls: string; active: boolean;
  onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={`rounded-t-lg px-6 py-4 text-left font-body text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-primary text-white"
          : "border border-border bg-background text-muted-foreground hover:text-foreground"
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

/* ============================================================
   FLOW: EVENTO — recebe todos os estados via props
   ============================================================ */
interface FlowEventoProps {
  dados: DadosFormState; setDados: (v: DadosFormState) => void;
  errors: DadosFormErrors; setErrors: (v: DadosFormErrors) => void;
  step: number; setStep: (v: number) => void;
  ingressoId: IngressoId; setIngressoId: (v: IngressoId) => void;
  palestraSelecionada: string; setPalestraSelecionada: (v: string) => void;
  diaSelecionado: string; setDiaSelecionado: (v: string) => void;
  coupon: { code: string; state: "idle"|"loading"|"valid"|"invalid"; discount: number; label: string };
  setCoupon: (v: any) => void;
  method: Method; setMethod: (v: Method) => void;
  showCombineBanner: boolean; setShowCombineBanner: (v: boolean) => void;
  comboAtivo: boolean; setComboAtivo: (v: boolean) => void;
  ingressoSelecionado: typeof ingressos[number];
  valorBase: number;
  total: number;
  onSwitchToTrabalho: () => void;
  onReset: () => void;
}

function FlowEvento({
  dados, setDados, errors, setErrors,
  step, setStep,
  ingressoId, setIngressoId,
  palestraSelecionada, setPalestraSelecionada,
  diaSelecionado, setDiaSelecionado,
  coupon, setCoupon,
  method, setMethod,
  showCombineBanner, setShowCombineBanner,
  comboAtivo, setComboAtivo,
  ingressoSelecionado, valorBase, total,
  onSwitchToTrabalho, onReset,
}: FlowEventoProps) {

  function applyCoupon() {
    if (!coupon.code) return;
    setCoupon((c: any) => ({ ...c, state: "loading" }));
    setTimeout(() => {
      const found = COUPONS[coupon.code.toUpperCase()];
      if (found) {
        const discount =
          found.tipo === "percentual"
            ? Math.round(valorBase * (found.valor / 100))
            : found.valor;
        const label =
          found.tipo === "percentual"
            ? `${found.valor}% de desconto`
            : `R$ ${found.valor.toFixed(2).replace(".", ",")} de desconto`;
        setCoupon((c: any) => ({ ...c, state: "valid", discount, label }));
      } else {
        setCoupon((c: any) => ({ ...c, state: "invalid", discount: 0, label: "" }));
      }
    }, 900);
  }

  function handleContinuar() {
    if (ingressoId === "palestra" && !palestraSelecionada) {
      alert("Por favor, selecione uma palestra antes de continuar.");
      return;
    }
    if (ingressoId === "dia" && !diaSelecionado) {
      alert("Por favor, selecione o dia antes de continuar.");
      return;
    }
    const validated = validateDados(dados);
    setErrors(validated);
    if (isDadosValid(validated)) setStep(1);
  }

  return (
    <div>
      <Stepper steps={["Dados Pessoais", "Pagamento", "Confirmação"]} current={step} />

      <AnimatePresence mode="wait">
        {/* STEP 1 — Dados */}
        {step === 0 && (
          <motion.div key="s1" variants={fade} initial="hidden" animate="visible" exit="exit">
            <div className="grid gap-8 md:grid-cols-[1fr_300px]">
              <div className="space-y-6">

                {/* Seletor de ingresso */}
                <div role="group" aria-labelledby="ingresso-label">
                  <p id="ingresso-label" className="mb-3 font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Selecione seu ingresso
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {ingressos.map((ing) => (
                      <button
                        key={ing.id}
                        type="button"
                        role="radio"
                        aria-checked={ingressoId === ing.id}
                        onClick={() => {
                          setIngressoId(ing.id);
                          setCoupon({ code: "", state: "idle", discount: 0, label: "" });
                          setPalestraSelecionada("");
                          setDiaSelecionado("");
                        }}
                        className={`relative rounded-xl border-2 px-4 py-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          ingressoId === ing.id
                            ? "border-primary bg-[#fff8f8]"
                            : "border-border bg-surface hover:border-primary/40"
                        }`}
                      >
                        {ing.badge && (
                          <span className="absolute -top-2 right-3 rounded-full bg-gold px-2 py-0.5 font-body text-[10px] font-bold text-primary">
                            {ing.badge}
                          </span>
                        )}
                        {ingressoId === ing.id && (
                          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                            <Check className="h-3 w-3 text-white" aria-hidden="true" />
                          </span>
                        )}
                        <div className="font-display text-sm font-bold text-foreground">{ing.label}</div>
                        <div className="mt-1 font-body text-[11px] text-muted-foreground leading-snug">{ing.descricao}</div>
                        <div className="mt-2 font-display text-lg font-extrabold text-primary">
                          R$ {ing.valor.toFixed(2).replace(".", ",")}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seletor condicional — Palestra avulsa */}
                {ingressoId === "palestra" && (
                  <div>
                    <label htmlFor="select-palestra" className="mb-1 block font-body text-xs font-semibold text-foreground">
                      Escolha a palestra
                      <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="select-palestra"
                      value={palestraSelecionada}
                      onChange={(e) => setPalestraSelecionada(e.target.value)}
                      className="w-full rounded-md border border-input bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Selecione uma palestra...</option>
                      {palestrasAvulsas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.dia} · {p.hora} — {p.titulo}{p.speaker ? ` (${p.speaker})` : ""}
                        </option>
                      ))}
                    </select>
                    {palestraSelecionada && (
                      <p className="mt-1 font-body text-[11px] text-muted-foreground">
                        ✓ Palestra selecionada — seu crachá será vinculado a este evento.
                      </p>
                    )}
                  </div>
                )}

                {/* Seletor condicional — 1 Dia */}
                {ingressoId === "dia" && (
                  <div>
                    <label htmlFor="select-dia" className="mb-1 block font-body text-xs font-semibold text-foreground">
                      Escolha o dia
                      <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
                    </label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {diasEvento.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDiaSelecionado(d.id)}
                          className={`rounded-lg border-2 px-4 py-3 text-center font-body text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            diaSelecionado === d.id
                              ? "border-primary bg-[#fff8f8] text-primary"
                              : "border-border bg-surface text-foreground hover:border-primary/40"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    {diaSelecionado && (
                      <p className="mt-1 font-body text-[11px] text-muted-foreground">
                        ✓ Dia selecionado — acesso completo à programação deste dia.
                      </p>
                    )}
                  </div>
                )}

                <DadosForm value={dados} onChange={setDados} errors={errors} onErrors={setErrors} />

                <CouponField
                  state={coupon.state}
                  value={coupon.code}
                  onChange={(v) => setCoupon((c: any) => ({ ...c, code: v, state: "idle", discount: 0, label: "" }))}
                  onApply={applyCoupon}
                  label={coupon.label}
                />
              </div>

              <OrderSummary
                lines={[{ label: ingressoSelecionado.label, value: valorBase }]}
                discount={coupon.state === "valid" ? coupon.discount : 0}
                discountLabel={coupon.label}
                comboDiscount={comboAtivo ? DESCONTO_COMBO : 0}
                total={total}
              />
            </div>

            {/* Banner combo */}
            <AnimatePresence>
              {showCombineBanner && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  role="complementary"
                  aria-label="Oferta de submissão combinada"
                  className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-gold bg-[#fff8f8] px-4 py-3"
                >
                  <Info className="h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                  <p className="flex-1 font-body text-sm text-foreground">
                    Deseja também submeter um trabalho acadêmico?{" "}
                    <span className="font-semibold text-primary">Desconto de R$ 70,00 no total.</span>
                  </p>
                  <button
                    onClick={onSwitchToTrabalho}
                    className="rounded-md border border-primary px-3 py-1.5 font-body text-xs font-semibold text-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Sim, adicionar submissão (-R$ 70,00)
                  </button>
                  <button
                    onClick={() => { setComboAtivo(false); setShowCombineBanner(false); }}
                    aria-label="Fechar sugestão"
                    className="font-body text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Não, continuar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <PrimaryButton onClick={handleContinuar} className="mt-8">
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
              labelLinha={ingressoSelecionado.label}
              onBack={() => setStep(0)}
              onConfirm={() => setStep(2)}
            />
          </motion.div>
        )}

        {/* STEP 3 — Confirmação */}
        {step === 2 && (
          <motion.div key="s3" variants={fade} initial="hidden" animate="visible" exit="exit">
            <Confirmacao email={dados.email} onReset={onReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   FLOW: TRABALHO — recebe dados compartilhados via props
   ============================================================ */
interface FlowTrabalhoProps {
  dados: DadosFormState; setDados: (v: DadosFormState) => void;
  errors: DadosFormErrors; setErrors: (v: DadosFormErrors) => void;
  step: number; setStep: (v: number) => void;
  coauthors: string[]; setCoauthors: (v: string[]) => void;
  work: { titulo: string; resumo: string; categoria: string };
  setWork: (v: { titulo: string; resumo: string; categoria: string }) => void;
  file: File | null; setFile: (v: File | null) => void;
  method: Method; setMethod: (v: Method) => void;
  onReset: () => void;
}

function FlowTrabalho({
  dados, setDados, errors, setErrors,
  step, setStep,
  coauthors, setCoauthors,
  work, setWork,
  file, setFile,
  method, setMethod,
  onReset,
}: FlowTrabalhoProps) {

  function handleContinuarDados() {
    const validated = validateDados(dados);
    setErrors(validated);
    if (isDadosValid(validated)) setStep(1);
  }

  const precoTrabalho = 90;

  return (
    <div>
      <Stepper steps={["Dados", "Trabalho", "Pagamento", "Confirmação"]} current={step} />

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

            <PrimaryButton onClick={handleContinuarDados}>Continuar</PrimaryButton>
          </motion.div>
        )}

        {/* STEP 2 — Trabalho */}
        {step === 1 && (
          <motion.div key="t2" variants={fade} initial="hidden" animate="visible" exit="exit" className="space-y-5">
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

            <Field label="Categoria" htmlFor="trabalho-categoria" required>
              <select
                id="trabalho-categoria"
                value={work.categoria}
                onChange={(e) => setWork({ ...work, categoria: e.target.value })}
                className="w-full rounded-md border border-input bg-surface px-3 py-2 font-body text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecione...</option>
                <option>Pesquisa Científica</option>
                <option>Relato de Caso</option>
                <option>Revisão de Literatura</option>
                <option>Painel Acadêmico</option>
              </select>
            </Field>

            <FileUpload file={file} onChange={setFile} />

            <Accordion title="Instruções para Formatação">
              <p>Lorem ipsum — instruções a definir pelo cliente. Formato A4, fonte Arial 12, espaçamento 1.5, máximo 8 páginas.</p>
            </Accordion>

            <PrimaryButton disabled={!work.titulo || !work.categoria} onClick={() => setStep(2)}>
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
                Não há descontos por cupom para submissão de trabalhos.
              </p>
            </div>
            <PaymentStep
              method={method}
              setMethod={setMethod}
              total={precoTrabalho}
              labelLinha="Submissão de Trabalho"
              onBack={() => setStep(1)}
              onConfirm={() => setStep(3)}
            />
          </motion.div>
        )}

        {/* STEP 4 — Confirmação */}
        {step === 3 && (
          <motion.div key="t4" variants={fade} initial="hidden" animate="visible" exit="exit">
            <Confirmacao email={dados.email} onReset={onReset} />
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

function OrderSummary({ lines, discount, discountLabel, comboDiscount = 0, total }: {
  lines: { label: string; value: number }[];
  discount: number; discountLabel: string;
  comboDiscount?: number; total: number;
}) {
  return (
    <aside aria-label="Resumo do pedido" className="self-start rounded-xl border border-border bg-background p-6 md:sticky md:top-24">
      <h3 className="font-display text-lg font-bold text-foreground">Resumo do Pedido</h3>
      <ul className="mt-4 space-y-2 font-body text-sm text-muted-foreground">
        {lines.map((l) => (
          <li key={l.label} className="flex items-baseline justify-between gap-2">
            <span>{l.label}</span>
            <span className="text-foreground">R$ {l.value.toFixed(2).replace(".", ",")}</span>
          </li>
        ))}
        {discount > 0 && (
          <li className="flex items-baseline justify-between gap-2 text-green-700">
            <span>{discountLabel}</span>
            <span>- R$ {discount.toFixed(2).replace(".", ",")}</span>
          </li>
        )}
        {comboDiscount > 0 && (
          <li className="flex items-baseline justify-between gap-2 text-green-700">
            <span>Desconto combo (evento + trabalho)</span>
            <span>- R$ {comboDiscount.toFixed(2).replace(".", ",")}</span>
          </li>
        )}
      </ul>
      <div className="my-4 h-px bg-border" />
      <div className="flex items-baseline justify-between">
        <span className="font-body text-sm text-muted-foreground">Total</span>
        <span className="font-display text-2xl font-extrabold text-primary">
          R$ {total.toFixed(2).replace(".", ",")}
        </span>
      </div>
      <p className="mt-3 font-body text-[11px] text-muted-foreground">
        Após confirmação do pagamento você receberá um e-mail.
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
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-md bg-primary px-6 py-4 font-body text-sm font-semibold text-white transition-colors hover:bg-[#8B1515] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </button>
  );
}

/* ── PaymentStep ────────────────────────────────────────────────────────────── */
function PaymentStep({ method, setMethod, total, labelLinha = "Inscrição no Evento", onBack, onConfirm }: {
  method: Method; setMethod: (m: Method) => void;
  total: number; labelLinha?: string;
  onBack: () => void; onConfirm: () => void;
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

      <AnimatePresence mode="wait">
        {method === "pix" ? (
          <motion.div key="pix" variants={fade} initial="hidden" animate="visible" exit="exit">
            <PixPanel />
          </motion.div>
        ) : (
          <motion.div key="card" variants={fade} initial="hidden" animate="visible" exit="exit">
            <CardPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-border px-6 py-3 font-body text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-md bg-primary px-6 py-3 font-body text-sm font-semibold text-white transition-colors hover:bg-[#8B1515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Confirmar Pagamento
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
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
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

function PixPanel() {
  const [secs, setSecs] = useState(899);
  useState(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : s)), 1000);
    return () => clearInterval(id);
  });
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const key = "00020126360014BR.GOV.BCB.PIX0114cobeo@unifafibe";

  return (
    <div className="grid items-center gap-6 rounded-xl border border-border bg-background p-6 md:grid-cols-[200px_1fr]">
      <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-white shadow-inner" aria-label="QR Code PIX">
        <QrCode className="h-24 w-24 text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chave PIX Copia e Cola</p>
        <div className="mt-1 flex items-center gap-2">
          <input readOnly value={key} aria-label="Chave PIX" className="flex-1 rounded-md border border-input bg-surface px-3 py-2 font-mono text-xs" />
          <button type="button" onClick={() => navigator.clipboard?.writeText(key)} aria-label="Copiar chave PIX" className="rounded-md bg-primary p-2 text-white hover:bg-[#8B1515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-md bg-[#fff8f8] px-4 py-3">
          <span className="font-body text-sm text-muted-foreground">Expira em</span>
          <time aria-live="polite" className="font-mono text-xl font-bold text-primary">{mm}:{ss}</time>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 font-body text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-primary" />
          </span>
          Aguardando confirmação do pagamento...
        </p>
      </div>
    </div>
  );
}

function CardPanel() {
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }
  const masked = card.number.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <div aria-hidden="true" className="flex h-[160px] w-full max-w-[280px] flex-col justify-between rounded-2xl p-5 text-white shadow-lg" style={{ background: "linear-gradient(135deg, #731111 0%, #4a0a0a 100%)" }}>
        <CreditCard className="h-7 w-7 text-[#C9A84C]" />
        <div>
          <div className="font-mono text-lg tracking-wider">{masked || "0000 0000 0000 0000"}</div>
          <div className="mt-3 flex justify-between font-mono text-xs uppercase">
            <span>{card.name || "Nome no Cartão"}</span>
            <span>{card.expiry || "MM/AA"}</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <Field label="Número do Cartão" htmlFor="card-number">
          <input id="card-number" type="text" inputMode="numeric" value={masked} onChange={(e: ChangeEvent<HTMLInputElement>) => setCard({ ...card, number: e.target.value })} placeholder="0000 0000 0000 0000" autoComplete="cc-number" maxLength={19} className="w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </Field>
        <Field label="Nome no Cartão" htmlFor="card-name">
          <input id="card-name" type="text" value={card.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setCard({ ...card, name: e.target.value.toUpperCase() })} placeholder="NOME COMO NO CARTÃO" autoComplete="cc-name" className="w-full rounded-md border border-input bg-surface px-3 py-2 font-body text-sm uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Validade" htmlFor="card-expiry">
            <input id="card-expiry" type="text" inputMode="numeric" value={card.expiry} onChange={(e: ChangeEvent<HTMLInputElement>) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} placeholder="MM/AA" autoComplete="cc-exp" maxLength={5} className="w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </Field>
          <Field label="CVV" htmlFor="card-cvv">
            <input id="card-cvv" type="text" inputMode="numeric" value={card.cvv} onChange={(e: ChangeEvent<HTMLInputElement>) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="•••" autoComplete="cc-csc" maxLength={4} className="w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </Field>
        </div>
      </div>
    </div>
  );
}

/* ── Confirmação ───────────────────────────────────────────────────────────── */
function Confirmacao({ email, onReset }: { email: string; onReset: () => void }) {
  const protocolo = useMemo(() => `COBEO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, []);
  return (
    <div className="py-6 text-center" role="status" aria-live="polite">
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold" aria-hidden="true">
        <Check className="h-10 w-10 text-primary" strokeWidth={3} />
      </motion.div>
      <h2 className="mt-6 font-display text-3xl font-extrabold text-foreground">Inscrição Confirmada!</h2>
      <p className="mt-2 font-body text-sm text-muted-foreground">
        Um e-mail de confirmação foi enviado para <strong className="text-foreground">{email || "seu endereço"}</strong>.
      </p>
      <div className="mx-auto mt-8 max-w-md rounded-xl border border-border bg-background p-5 text-left">
        <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Protocolo de Inscrição</p>
        <p className="mt-1 font-mono text-base font-bold text-primary">{protocolo}</p>
        <p className="mt-2 font-body text-[11px] text-muted-foreground">Guarde este código — ele será necessário para retirada do crachá.</p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onReset} className="rounded-md border border-border px-6 py-3 font-body text-sm font-semibold text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Voltar ao Início
        </button>
      </div>
    </div>
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
        <p className="font-body text-xs text-muted-foreground">PDF, DOC, DOCX, PPT, PPTX</p>
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
