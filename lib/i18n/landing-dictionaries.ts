import type { Locale } from "./config";

export type LandingDictionary = {
  nav: {
    home: string;
    focus: string;
    pricing: string;
    contact: string;
    login: string;
    mainAria: string;
    toggleTheme: string;
    openMenu: string;
    closeMenu: string;
  };
  hero: {
    brand: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  focus: {
    title: string;
    subtitle: string;
    items: { title: string; body: string }[];
  };
  pricing: {
    title: string;
    subtitle: string;
    select: string;
    contactCta: string;
    plans: {
      name: string;
      price: string;
      period: string;
      note?: string;
      features: string[];
      highlighted?: boolean;
      /** register → signup; contact → scroll to #contacto */
      cta: "register" | "contact";
    }[];
  };
  contact: {
    title: string;
    subtitle: string;
    phoneLabel: string;
    emailLabel: string;
    addressLabel: string;
    name: string;
    namePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    message: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    errors: {
      name: string;
      email: string;
      message: string;
    };
  };
  footer: {
    phone: string;
    email: string;
    address: string;
    legal: string;
    legalLinks: { label: string; href: string }[];
    copyright: string;
  };
};

const es: LandingDictionary = {
  nav: {
    home: "Inicio",
    focus: "Producto",
    pricing: "Precios",
    contact: "Contacto",
    login: "Ingresar",
    mainAria: "Principal",
    toggleTheme: "Cambiar tema",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
  },
  hero: {
    brand: "AMRAP",
    title: "Opera tu gym. Escala hasta 3.",
    subtitle:
      "Check-in con QR, miembros, planes y el tablero del día. Freemium → Solo → Multi-Gym (tarifa plana); más de 3, hablamos.",
    primaryCta: "Empezar gratis",
    secondaryCta: "Ver producto",
  },
  focus: {
    title: "Hecho para la operación diaria",
    subtitle:
      "AMRAP es software para dueños y staff: membresías, acceso y control del día. Misma cuenta si eres dueño aquí y miembro en otro gym.",
    items: [
      {
        title: "Un QR por persona",
        body: "Credencial única en toda la plataforma. Entrada desde el teléfono del socio o en recepción (cámara o búsqueda). Sin uso simultáneo en otro gym por 4 horas.",
      },
      {
        title: "Miembros y planes",
        body: "Altas, vencimientos y precios por gym o sucursal. Renueva y registra pagos en el flujo de operación — el socio paga al gym, no a AMRAP.",
      },
      {
        title: "Tablero del día",
        body: "Asistencia, activos vs vencidos, renovaciones y alertas. Dueño y encargados ven lo que importa hoy, no un dashboard genérico.",
      },
      {
        title: "Organización → gym → sucursal",
        body: "Una factura por organización. Freemium y Starter/Solo: 1 gym. Growth/Multi-Gym: 2–3 con tarifa plana. ¿Más? Pro por contacto. Roles por contexto, sin cuentas duplicadas.",
      },
    ],
  },
  pricing: {
    title: "Precios",
    subtitle:
      "Hechos para negocios pequeños. Paga la organización (tarifa plana). Precios antes de impuestos. Anual ~17% menos. ¿Más de 3 gyms? Contáctanos para Pro.",
    select: "Empezar",
    contactCta: "Contactar",
    plans: [
      {
        name: "Freemium",
        price: "$0",
        period: "/mes",
        note: "El gancho · 1 gym · 1 sucursal",
        cta: "register",
        features: [
          "Hasta 30 miembros activos",
          "Prueba QR + check-in sin riesgo",
          "2 asientos de staff · 2 planes",
          "Tablero del día e inbox interno",
          "Historial 30 días",
          "Sin pasarela ni reportes export",
        ],
      },
      {
        name: "Starter / Solo",
        price: "$849",
        period: "MXN/mes",
        note: "1 gym completo · por organización",
        highlighted: true,
        cta: "register",
        features: [
          "Hasta ~500 miembros activos",
          "Pasarela de pagos integrada",
          "Reportes financieros básicos",
          "Exportación CSV / datos",
          "Historial completo · ~5 staff",
          "1 gym · 1 sucursal",
        ],
      },
      {
        name: "Growth / Multi-Gym",
        price: "$1,499",
        period: "MXN/mes",
        note: "2 a 3 gyms · tarifa plana org",
        cta: "register",
        features: [
          "Todo lo de Starter",
          "2–3 gyms, una sola factura",
          "Dashboard consolidado (vista de pájaro)",
          "Membresía pasaporte inter-sedes",
          "Analíticas comparativas entre gyms",
          "El 3er gym no sube el software",
        ],
      },
      {
        name: "Pro",
        price: "A medida",
        period: "",
        note: "Más de 3 gyms · acuerdo",
        cta: "contact",
        features: [
          "4 o más gyms (o necesidades custom)",
          "Límites y términos acordados",
          "Soporte prioritario",
          "Módulos avanzados en el tiempo",
          "Todo lo de Growth + a medida",
        ],
      },
    ],
  },
  contact: {
    title: "Contacto",
    subtitle:
      "¿Dueño, encargado, o más de 3 gyms? Cuéntanos cómo operas — te armamos Freemium, Starter/Solo, Growth/Multi-Gym o un acuerdo Pro.",
    phoneLabel: "Teléfono",
    emailLabel: "Correo",
    addressLabel: "Ubicación",
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    email: "Correo",
    emailPlaceholder: "tu@correo.com",
    message: "Mensaje",
    messagePlaceholder: "¿Cuántos gyms? ¿Buscas Pro u otro plan?",
    submit: "Enviar mensaje",
    submitting: "Enviando…",
    success: "Gracias. Recibimos tu mensaje.",
    error: "Revisa el formulario e inténtalo de nuevo.",
    errors: {
      name: "Usa solo letras, espacios y puntuación simple",
      email: "Introduce un correo válido en minúsculas",
      message: "El mensaje es demasiado corto o contiene caracteres no válidos",
    },
  },
  footer: {
    phone: "+52 (461) 183-3992",
    email: "hello@amrap.space",
    address: "León, Guanajuato, MX",
    legal: "Legal",
    legalLinks: [
      { label: "Aviso legal", href: "#" },
      { label: "Privacidad", href: "#" },
      { label: "Términos", href: "#" },
    ],
    copyright: "AMRAP. Todos los derechos reservados.",
  },
};

const en: LandingDictionary = {
  nav: {
    home: "Home",
    focus: "Product",
    pricing: "Pricing",
    contact: "Contact",
    login: "Sign in",
    mainAria: "Main",
    toggleTheme: "Toggle theme",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  hero: {
    brand: "AMRAP",
    title: "Run your gym. Scale to 3.",
    subtitle:
      "QR check-in, members, plans, and the day board. Built for small operators: Freemium → Solo → Multi-Gym (flat); more than 3, talk to us.",
    primaryCta: "Start free",
    secondaryCta: "See product",
  },
  focus: {
    title: "Built for daily ops",
    subtitle:
      "AMRAP is software for owners and staff: memberships, access, and today’s control. Same account if you own here and train elsewhere.",
    items: [
      {
        title: "One QR per person",
        body: "A single credential across the platform. Check in on the member’s phone or at the front desk (camera or search). No simultaneous use at another gym for 4 hours.",
      },
      {
        title: "Members & plans",
        body: "Sign-ups, expiry, and pricing at gym or branch level. Renew and record payments in the ops flow — members pay the gym, not AMRAP.",
      },
      {
        title: "Day board",
        body: "Attendance, active vs expired, renewals, and alerts. Owners and managers see what matters today — not a generic dashboard.",
      },
      {
        title: "Organization → gym → branch",
        body: "One invoice per organization. Freemium and Starter/Solo: 1 gym. Growth/Multi-Gym: 2–3 at a flat rate. Need more? Pro via contact. Contextual roles, no duplicate accounts.",
      },
    ],
  },
  pricing: {
    title: "Pricing",
    subtitle:
      "Built for small businesses. The organization pays (flat rates). Prices before tax. Annual ~17% off. More than 3 gyms? Contact us for Pro.",
    select: "Get started",
    contactCta: "Contact us",
    plans: [
      {
        name: "Freemium",
        price: "$0",
        period: "/mo",
        note: "The hook · 1 gym · 1 branch",
        cta: "register",
        features: [
          "Up to 30 active members",
          "Try QR + check-in with no risk",
          "2 staff seats · 2 plans",
          "Day board and internal inbox",
          "30-day history",
          "No gateway or export reports",
        ],
      },
      {
        name: "Starter / Solo",
        price: "$42",
        period: "USD/mo",
        note: "1 complete gym · per organization",
        highlighted: true,
        cta: "register",
        features: [
          "Up to ~500 active members",
          "Integrated payment gateway",
          "Basic financial reports",
          "CSV / data export",
          "Full history · ~5 staff",
          "1 gym · 1 branch",
        ],
      },
      {
        name: "Growth / Multi-Gym",
        price: "$73",
        period: "USD/mo",
        note: "2 to 3 gyms · flat org rate",
        cta: "register",
        features: [
          "Everything in Starter",
          "2–3 gyms, one invoice",
          "Consolidated dashboard (bird’s-eye)",
          "Passport membership across sites",
          "Comparative analytics between gyms",
          "Third gym doesn’t raise software cost",
        ],
      },
      {
        name: "Pro",
        price: "Custom",
        period: "",
        note: "More than 3 gyms · agreement",
        cta: "contact",
        features: [
          "4+ gyms (or custom needs)",
          "Limits and terms by agreement",
          "Priority support",
          "Advanced modules over time",
          "Everything in Growth + tailored",
        ],
      },
    ],
  },
  contact: {
    title: "Contact",
    subtitle:
      "Owner, manager, or more than 3 gyms? Tell us how you run — we’ll set up Freemium, Starter/Solo, Growth/Multi-Gym, or a Pro agreement.",
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Location",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    message: "Message",
    messagePlaceholder: "How many gyms? Looking for Pro or another plan?",
    submit: "Send message",
    submitting: "Sending…",
    success: "Thanks. We received your message.",
    error: "Check the form and try again.",
    errors: {
      name: "Use letters, spaces, and simple punctuation only",
      email: "Enter a valid lowercase email",
      message: "Message is too short or contains invalid characters",
    },
  },
  footer: {
    phone: "+52 (461) 183-3992",
    email: "hello@amrap.space",
    address: "León, Guanajuato, MX",
    legal: "Legal",
    legalLinks: [
      { label: "Legal notice", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
    copyright: "AMRAP. All rights reserved.",
  },
};

export function getLandingDictionary(locale: Locale): LandingDictionary {
  return locale === "en" ? en : es;
}

const landingSectionIds = ["start", "enfoque", "precios", "contacto"] as const;
export type LandingSectionId = (typeof landingSectionIds)[number];

export function sectionIdForNav(
  key: "home" | "focus" | "pricing" | "contact",
): LandingSectionId {
  const map = {
    home: "start",
    focus: "enfoque",
    pricing: "precios",
    contact: "contacto",
  } as const;
  return map[key];
}
