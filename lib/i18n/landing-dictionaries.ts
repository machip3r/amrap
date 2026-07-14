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
    title: "El panel de tu gym, sin complicarte",
    subtitle:
      "Registra socios, cobra membresías y controla quién entra. Empieza gratis y crece cuando lo necesites.",
    primaryCta: "Empezar gratis",
    secondaryCta: "Cómo funciona",
  },
  focus: {
    title: "Lo que usas todos los días",
    subtitle:
      "Hecho para dueños y recepción: altas, accesos y lo que pasa hoy en el gym. Una cuenta sirve si además eres socio en otro lado.",
    items: [
      {
        title: "Un QR por persona",
        body: "Cada socio tiene un solo código. Entran desde el celular o los das de alta en recepción con cámara o búsqueda. Ese mismo QR no sirve en otro gym durante 4 horas.",
      },
      {
        title: "Miembros y planes",
        body: "Das de alta, defines precios y ves quién vence. Renuevas y anotas el pago en el mismo flujo. El socio le paga a tu gym, no a AMRAP.",
      },
      {
        title: "El día en un vistazo",
        body: "Quién llegó, quién está activo, quién está por vencer y qué conviene revisar. Pensado para recepción y dueño, no para un reporte lleno de gráficas.",
      },
      {
        title: "De un gym a varios",
        body: "Empiezas con uno. Si abres más sedes, una sola organización y una sola factura. Cada persona puede ser dueño, staff o socio según el gym, sin crear otra cuenta.",
      },
    ],
  },
  pricing: {
    title: "Precios",
    subtitle:
      "Paga la organización, no el socio. Precios sin IVA. Con pago anual te ahorras cerca del 17%. ¿Más de 3 gyms? Escríbenos.",
    select: "Empezar",
    contactCta: "Hablar con nosotros",
    plans: [
      {
        name: "Freemium",
        price: "$0",
        period: "/mes",
        note: "Para probar · 1 gym · 1 sucursal",
        cta: "register",
        features: [
          "Hasta 30 socios activos",
          "Check-in con QR o en recepción",
          "2 personas de staff · 2 planes",
          "Resumen del día e inbox interno",
          "Historial de 30 días",
          "Sin cobros en línea ni exportar datos",
        ],
      },
      {
        name: "Starter / Solo",
        price: "$849",
        period: "MXN/mes",
        note: "Un gym completo · por organización",
        highlighted: true,
        cta: "register",
        features: [
          "Hasta unos 500 socios activos",
          "Cobros en línea (pasarela)",
          "Reportes básicos de dinero",
          "Exportar CSV",
          "Historial completo · hasta ~5 staff",
          "1 gym · 1 sucursal",
        ],
      },
      {
        name: "Growth / Multi-Gym",
        price: "$1,499",
        period: "MXN/mes",
        note: "2 o 3 gyms · precio fijo",
        cta: "register",
        features: [
          "Todo lo de Starter",
          "Hasta 3 gyms en una sola factura",
          "Vista de todas las sedes juntas",
          "Membresía que funciona entre sedes",
          "Comparar números entre gyms",
          "El tercer gym no sube el costo del software",
        ],
      },
      {
        name: "Pro",
        price: "A medida",
        period: "",
        note: "Más de 3 gyms · platicamos",
        cta: "contact",
        features: [
          "4 o más gyms, o algo a la medida",
          "Límites y condiciones que acordamos",
          "Soporte prioritario",
          "Módulos extra cuando los necesites",
          "Lo de Growth, adaptado a ti",
        ],
      },
    ],
  },
  contact: {
    title: "Contacto",
    subtitle:
      "Cuéntanos cómo operas tu gym. Te orientamos para empezar gratis, con un solo gym o con varias sedes.",
    phoneLabel: "Teléfono",
    emailLabel: "Correo",
    addressLabel: "Ubicación",
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    email: "Correo",
    emailPlaceholder: "tu@correo.com",
    message: "Mensaje",
    messagePlaceholder: "¿Cuántos gyms tienes? ¿Qué te interesa resolver primero?",
    submit: "Enviar mensaje",
    submitting: "Enviando…",
    success: "Listo, ya recibimos tu mensaje.",
    error: "Revisa el formulario e inténtalo de nuevo.",
    errors: {
      name: "Usa solo letras, espacios y puntuación simple",
      email: "Escribe un correo válido en minúsculas",
      message: "El mensaje es muy corto o tiene caracteres que no aceptamos",
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
    title: "Your gym’s front desk, without the chaos",
    subtitle:
      "Sign up members, track memberships, and see who’s checking in. Start free, upgrade when you outgrow it.",
    primaryCta: "Start free",
    secondaryCta: "How it works",
  },
  focus: {
    title: "What you use every day",
    subtitle:
      "For owners and front desk: members, access, and what’s happening today. One account even if you also train at another gym.",
    items: [
      {
        title: "One QR per person",
        body: "Each member gets a single code. They check in from their phone, or you look them up at the desk. That same code can’t be used at another gym for 4 hours.",
      },
      {
        title: "Members & plans",
        body: "Add people, set prices, and see who expires soon. Renew and log the payment in the same flow. Members pay your gym — not AMRAP.",
      },
      {
        title: "Today at a glance",
        body: "Who showed up, who’s active, who’s about to lapse, and what needs attention. Built for the desk and the owner — not a wall of charts.",
      },
      {
        title: "One gym, or a few",
        body: "Start with one. If you open more locations, you still get one organization and one invoice. Someone can be owner at one gym and a member at another, with the same login.",
      },
    ],
  },
  pricing: {
    title: "Pricing",
    subtitle:
      "Your organization pays, not your members. Prices before tax. Annual billing saves about 17%. Running more than 3 gyms? Talk to us.",
    select: "Get started",
    contactCta: "Talk to us",
    plans: [
      {
        name: "Freemium",
        price: "$0",
        period: "/mo",
        note: "To try it out · 1 gym · 1 branch",
        cta: "register",
        features: [
          "Up to 30 active members",
          "QR check-in or front-desk lookup",
          "2 staff seats · 2 membership plans",
          "Day overview and internal inbox",
          "30-day history",
          "No online payments or data export",
        ],
      },
      {
        name: "Starter / Solo",
        price: "$42",
        period: "USD/mo",
        note: "One full gym · per organization",
        highlighted: true,
        cta: "register",
        features: [
          "Up to about 500 active members",
          "Online payment gateway",
          "Basic money reports",
          "CSV export",
          "Full history · about 5 staff seats",
          "1 gym · 1 branch",
        ],
      },
      {
        name: "Growth / Multi-Gym",
        price: "$73",
        period: "USD/mo",
        note: "2 or 3 gyms · flat rate",
        cta: "register",
        features: [
          "Everything in Starter",
          "Up to 3 gyms on one invoice",
          "See all locations in one place",
          "Membership that works across sites",
          "Compare numbers between gyms",
          "A third gym doesn’t raise the software bill",
        ],
      },
      {
        name: "Pro",
        price: "Custom",
        period: "",
        note: "More than 3 gyms · we’ll figure it out",
        cta: "contact",
        features: [
          "4+ gyms, or something custom",
          "Limits and terms we agree on together",
          "Priority support",
          "Extra modules when you need them",
          "Growth, shaped to your setup",
        ],
      },
    ],
  },
  contact: {
    title: "Contact",
    subtitle:
      "Tell us how you run your gym. We’ll help you start free, with one location, or with a few.",
    phoneLabel: "Phone",
    emailLabel: "Email",
    addressLabel: "Location",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    message: "Message",
    messagePlaceholder: "How many gyms do you have? What do you want to fix first?",
    submit: "Send message",
    submitting: "Sending…",
    success: "Got it — we received your message.",
    error: "Check the form and try again.",
    errors: {
      name: "Use letters, spaces, and simple punctuation only",
      email: "Enter a valid lowercase email",
      message: "That message is too short or has characters we can’t accept",
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
