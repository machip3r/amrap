import type { Locale } from "./config";

export type LandingDictionary = {
  nav: {
    home: string;
    focus: string;
    pricing: string;
    contact: string;
    login: string;
  };
  hero: {
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    cta: string;
    benefits: { verb: string; rest: string }[];
  };
  focus: {
    title: string;
    subtitle: string;
    items: { title: string; body: string }[];
  };
  pricing: {
    title: string;
    subtitle: string;
    cta: string;
    note: string;
  };
  contact: {
    title: string;
    subtitle: string;
    emailLabel: string;
  };
};

const es: LandingDictionary = {
  nav: {
    home: "Inicio",
    focus: "Enfoque",
    pricing: "Precios",
    contact: "Contacto",
    login: "Espacio",
  },
  hero: {
    titleBefore: "Controla tu ",
    titleHighlight: "espacio",
    titleAfter: " en un solo lugar",
    cta: "Pruébalo gratis",
    benefits: [
      { verb: "Ahorra", rest: "tiempo en recepción y cobros" },
      { verb: "Aumenta", rest: "tus ingresos con renovaciones claras" },
      { verb: "Reduce", rest: "errores en accesos y membresías" },
      { verb: "Mejora", rest: "la experiencia de tus socios" },
    ],
  },
  focus: {
    title: "Enfoque",
    subtitle: "Todo lo que un gimnasio necesita para operar el día a día.",
    items: [
      {
        title: "Socios y membresías",
        body: "Altas, vencimientos, QR y renovaciones en un solo flujo.",
      },
      {
        title: "Pagos manuales",
        body: "Registra efectivo o transferencia sin integraciones complejas.",
      },
      {
        title: "Check-in con QR",
        body: "Valida acceso al instante desde cualquier dispositivo.",
      },
    ],
  },
  pricing: {
    title: "Precios",
    subtitle: "Empieza sin fricción. Escala cuando tu gimnasio crezca.",
    cta: "Crear cuenta gratis",
    note: "Sin tarjeta para probar. Multi-sucursal cuando lo necesites.",
  },
  contact: {
    title: "Contacto",
    subtitle: "¿Dudas sobre AMRAP? Escríbenos.",
    emailLabel: "Correo",
  },
};

const en: LandingDictionary = {
  nav: {
    home: "Home",
    focus: "Focus",
    pricing: "Pricing",
    contact: "Contact",
    login: "Sign in",
  },
  hero: {
    titleBefore: "Run your ",
    titleHighlight: "gym",
    titleAfter: " from one place",
    cta: "Try it free",
    benefits: [
      { verb: "Save", rest: "time at front desk and billing" },
      { verb: "Grow", rest: "revenue with clear renewals" },
      { verb: "Cut", rest: "errors on access and memberships" },
      { verb: "Improve", rest: "the member experience" },
    ],
  },
  focus: {
    title: "Focus",
    subtitle: "Everything a gym needs to run day to day.",
    items: [
      {
        title: "Members & memberships",
        body: "Sign-ups, expiry, QR codes, and renewals in one flow.",
      },
      {
        title: "Manual payments",
        body: "Record cash or transfer without heavy integrations.",
      },
      {
        title: "QR check-in",
        body: "Validate access instantly from any device.",
      },
    ],
  },
  pricing: {
    title: "Pricing",
    subtitle: "Start friction-free. Scale as your gym grows.",
    cta: "Create free account",
    note: "No card required to try. Multi-branch when you need it.",
  },
  contact: {
    title: "Contact",
    subtitle: "Questions about AMRAP? Reach out.",
    emailLabel: "Email",
  },
};

export function getLandingDictionary(locale: Locale): LandingDictionary {
  return locale === "en" ? en : es;
}

export const landingSectionIds = ["inicio", "enfoque", "precios", "contacto"] as const;
export type LandingSectionId = (typeof landingSectionIds)[number];

export function sectionIdForNav(
  key: "home" | "focus" | "pricing" | "contact",
): LandingSectionId {
  const map = {
    home: "inicio",
    focus: "enfoque",
    pricing: "precios",
    contact: "contacto",
  } as const;
  return map[key];
}
