import unifafibeLogo from "@/assets/images/unifafibe-logo.jpeg";
import odontoSeal from "@/assets/images/odontologia-seal.jpeg";
import cobeoIllustration from "@/assets/images/cobeo-illustration.jpeg";

export const UNIFAFIBE_LOGO = unifafibeLogo;
export const ODONTO_SEAL = odontoSeal;
export const COBEO_ILLUSTRATION = cobeoIllustration;

export function UnifafibeLogo({ className = "h-10" }: { className?: string }) {
  return (
    <img
      src={UNIFAFIBE_LOGO}
      alt="UNIFAFIBE — Bebedouro/SP"
      className={`${className} w-auto object-contain`}
    />
  );
}

export function OdontoSeal({ className = "h-10" }: { className?: string }) {
  return (
    <img
      src={ODONTO_SEAL}
      alt="Odontologia UNIFAFIBE"
      className={`${className} w-auto object-contain rounded-full`}
    />
  );
}