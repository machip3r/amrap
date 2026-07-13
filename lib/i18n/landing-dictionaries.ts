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
    plans: {
      name: string;
      price: string;
      period: string;
      note?: string;
      features: string[];
      highlighted?: boolean;
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
    title: "Opera tu gym. Escala a varios.",
    subtitle:
      "Check-in con QR, miembros, planes y el panel del día en un solo sistema. Una organización, una factura; un miembro, una cuenta.",
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
        body: "Una factura por organización, varios gyms cuando creces. Roles por contexto: dueño, encargado, coach o socio — sin crear cuentas duplicadas.",
      },
    ],
  },
  pricing: {
    title: "Precios",
    subtitle:
      "Precios antes de impuestos. Anual ~17% menos. Freemium para operar en chico; planes de pago desbloquean multi-gym y cobros en línea a miembros.",
    select: "Empezar",
    plans: [
      {
        name: "Freemium",
        price: "$0",
        period: "/mes",
        note: "1 gym · 1 sucursal",
        features: [
          "Hasta 30 miembros activos",
          "QR + check-in manual",
          "2 asientos de staff",
          "2 planes de membresía",
          "Historial 30 días · inbox interno",
          "Sin pasarela ni white-label",
        ],
      },
      {
        name: "Starter",
        price: "$799",
        period: "MXN/mes",
        note: "1 gym · por organización",
        highlighted: true,
        features: [
          "Pasarela de pagos para miembros",
          "White-label básico",
          "~250 miembros activos",
          "Hasta 5 staff · 2 sucursales",
          "Historial completo · CSV",
          "Inbox sin tope Freemium",
        ],
      },
      {
        name: "Growth",
        price: "$599",
        period: "MXN/gym/mes",
        note: "Hasta 5 gyms",
        features: [
          "Hasta 5 gyms activos",
          "Stats multi-gym",
          "~500 miembros activos por gym",
          "Todo lo de Starter",
          "Operación multi-sede",
        ],
      },
      {
        name: "Pro",
        price: "$699",
        period: "MXN/gym/mes",
        note: "5 gyms o más",
        features: [
          "5 o más gyms",
          "Límites altos / prácticos",
          "Módulos avanzados en el tiempo",
          "Coaches y community (fases)",
          "Todo lo de Growth",
        ],
      },
    ],
  },
  contact: {
    title: "Contacto",
    subtitle:
      "¿Dueño, encargado o grupo con varios gyms? Cuéntanos cómo operas hoy — te respondemos pronto.",
    phoneLabel: "Teléfono",
    emailLabel: "Correo",
    addressLabel: "Ubicación",
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    email: "Correo",
    emailPlaceholder: "tu@correo.com",
    message: "Mensaje",
    messagePlaceholder: "¿Cuántos gyms? ¿Qué te duele hoy?",
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
    title: "Run your gym. Scale to more.",
    subtitle:
      "QR check-in, members, plans, and the day board in one system. One organization, one invoice; one member, one account.",
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
        body: "One invoice per organization, multiple gyms as you grow. Contextual roles: owner, staff, coach, or member — no duplicate accounts.",
      },
    ],
  },
  pricing: {
    title: "Pricing",
    subtitle:
      "Prices before tax. Annual ~17% off. Freemium for a small box; paid plans unlock multi-gym and online member billing.",
    select: "Get started",
    plans: [
      {
        name: "Freemium",
        price: "$0",
        period: "/mo",
        note: "1 gym · 1 branch",
        features: [
          "Up to 30 active members",
          "QR + manual check-in",
          "2 staff seats",
          "2 membership plans",
          "30-day history · internal inbox",
          "No gateway or white-label",
        ],
      },
      {
        name: "Starter",
        price: "$39",
        period: "USD/mo",
        note: "1 gym · per organization",
        highlighted: true,
        features: [
          "Member payment gateway",
          "Basic white-label",
          "~250 active members",
          "Up to 5 staff · 2 branches",
          "Full history · CSV",
          "Inbox without Freemium cap",
        ],
      },
      {
        name: "Growth",
        price: "$29",
        period: "USD/gym/mo",
        note: "Up to 5 gyms",
        features: [
          "Up to 5 active gyms",
          "Multi-gym stats",
          "~500 active members per gym",
          "Everything in Starter",
          "Multi-site operations",
        ],
      },
      {
        name: "Pro",
        price: "$35",
        period: "USD/gym/mo",
        note: "5 gyms or more",
        features: [
          "5 or more gyms",
          "High / practical caps",
          "Advanced modules over time",
          "Coaches & community (later)",
          "Everything in Growth",
        ],
      },
    ],
  },
  contact: {
    title: "Contact",
    subtitle:
      "Owner, manager, or a group with several gyms? Tell us how you run today — we’ll get back soon.",
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Location",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    message: "Message",
    messagePlaceholder: "How many gyms? What’s painful today?",
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
