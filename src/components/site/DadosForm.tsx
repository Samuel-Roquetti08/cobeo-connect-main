import { type ChangeEvent } from "react";
import { maskPhone, isValidEmail, isValidPhone } from "@/lib/masks";

export interface DadosFormState {
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  sameWhats: boolean;
}

interface FieldMeta {
  touched: boolean;
  error: string;
}

export interface DadosFormErrors {
  nome:     FieldMeta;
  email:    FieldMeta;
  telefone: FieldMeta;
  whatsapp: FieldMeta;
}

export const EMPTY_ERRORS: DadosFormErrors = {
  nome:     { touched: false, error: "" },
  email:    { touched: false, error: "" },
  telefone: { touched: false, error: "" },
  whatsapp: { touched: false, error: "" },
};

export function validateDados(data: DadosFormState): DadosFormErrors {
  return {
    nome: {
      touched: true,
      error: data.nome.trim().length < 3 ? "Informe seu nome completo." : "",
    },
    email: {
      touched: true,
      error: !isValidEmail(data.email) ? "Informe um e-mail válido." : "",
    },
    telefone: {
      touched: true,
      error: !isValidPhone(data.telefone) ? "Informe um telefone com DDD." : "",
    },
    whatsapp: {
      touched: true,
      error:
        !data.sameWhats && !isValidPhone(data.whatsapp)
          ? "Informe um WhatsApp com DDD."
          : "",
    },
  };
}

export function isDadosValid(errors: DadosFormErrors): boolean {
  return Object.values(errors).every((f) => f.touched && f.error === "");
}

/* ── InputField ────────────────────────────────────────────────────────────── */

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: FieldMeta;
  disabled?: boolean;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  required?: boolean;
}

function InputField({
  id, label, type = "text", value, onChange, onBlur,
  error, disabled, autoComplete, inputMode, placeholder, required = true,
}: InputFieldProps) {
  const hasError = error?.touched && !!error.error;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block font-body text-xs font-semibold text-foreground"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={`w-full rounded-md border px-3 py-2 font-body text-sm outline-none transition-colors
          focus:ring-2 focus:ring-primary/20
          disabled:cursor-not-allowed disabled:bg-muted/30 disabled:text-muted-foreground
          ${hasError
            ? "border-destructive bg-destructive/5 focus:border-destructive"
            : "border-input bg-surface focus:border-primary"
          }`}
      />
      {hasError && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 font-body text-[11px] text-destructive"
        >
          {error?.error}
        </p>
      )}
    </div>
  );
}

/* ── DadosForm ─────────────────────────────────────────────────────────────── */

interface DadosFormProps {
  value: DadosFormState;
  onChange: (v: DadosFormState) => void;
  errors: DadosFormErrors;
  onErrors: (e: DadosFormErrors) => void;
}

export function DadosForm({ value, onChange, errors, onErrors }: DadosFormProps) {
  function handleBlur(field: keyof DadosFormErrors) {
    const validated = validateDados(value);
    onErrors({ ...errors, [field]: { touched: true, error: validated[field].error } });
  }

  function setField<K extends keyof DadosFormState>(field: K, val: DadosFormState[K]) {
    onChange({ ...value, [field]: val });
  }

  function handleTelefoneChange(raw: string) {
    const masked = maskPhone(raw);
    // Se sameWhats está marcado, espelha o telefone no whatsapp
    if (value.sameWhats) {
      onChange({ ...value, telefone: masked, whatsapp: masked });
    } else {
      setField("telefone", masked);
    }
  }

  function handleWhatsappChange(raw: string) {
    setField("whatsapp", maskPhone(raw));
  }

  function handleSameWhatsChange(checked: boolean) {
    if (checked) {
      // Marcar: copia telefone para whatsapp e desabilita o campo
      onChange({ ...value, sameWhats: true, whatsapp: value.telefone });
    } else {
      // Desmarcar: libera o campo e limpa o whatsapp para o usuário digitar
      onChange({ ...value, sameWhats: false, whatsapp: "" });
    }
  }

  // Valor exibido no campo WhatsApp:
  // - se sameWhats: mostra o telefone (espelhado, campo desabilitado)
  // - se não sameWhats: mostra o whatsapp independente
  const whatsappDisplayValue = value.sameWhats ? value.telefone : value.whatsapp;

  return (
    <fieldset className="grid gap-4 border-0 p-0 sm:grid-cols-2">
      <legend className="sr-only">Dados pessoais</legend>

      {/* Nome */}
      <div className="sm:col-span-2">
        <InputField
          id="campo-nome"
          label="Nome Completo"
          value={value.nome}
          autoComplete="name"
          placeholder="Seu nome completo"
          onChange={(v) => setField("nome", v)}
          onBlur={() => handleBlur("nome")}
          error={errors.nome}
        />
      </div>

      {/* E-mail */}
      <div className="sm:col-span-2">
        <InputField
          id="campo-email"
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu@email.com"
          value={value.email}
          onChange={(v) => setField("email", v.trim())}
          onBlur={() => handleBlur("email")}
          error={errors.email}
        />
      </div>

      {/* Telefone */}
      <InputField
        id="campo-telefone"
        label="Telefone"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="(11) 99999-9999"
        value={value.telefone}
        onChange={handleTelefoneChange}
        onBlur={() => handleBlur("telefone")}
        error={errors.telefone}
      />

      {/* WhatsApp */}
      <div>
        <InputField
          id="campo-whatsapp"
          label="WhatsApp"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          value={whatsappDisplayValue}
          disabled={value.sameWhats}
          onChange={handleWhatsappChange}
          onBlur={() => handleBlur("whatsapp")}
          error={value.sameWhats ? undefined : errors.whatsapp}
        />
        <label className="mt-2 flex cursor-pointer items-center gap-2 font-body text-xs text-muted-foreground select-none">
          <input
            type="checkbox"
            checked={value.sameWhats}
            onChange={(e) => handleSameWhatsChange(e.target.checked)}
            className="h-3.5 w-3.5 accent-primary cursor-pointer"
          />
          Mesmo número do telefone
        </label>
      </div>
    </fieldset>
  );
}
