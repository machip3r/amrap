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
  };
  hero: {
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    benefits: string[];
    secondaryCta: string;
  };
  focus: {
    title: string;
    items: { title: string; body: string }[];
  };
  pricing: {
    title: string;
    select: string;
    plans: {
      name: string;
      price: string;
      period: string;
      features: string[];
      highlighted?: boolean;
    }[];
  };
  footer: {
    phone: string;
    email: string;
    address: string;
    quickLinks: string;
    legal: string;
    follow: string;
    newsletter: string;
    newsletterPlaceholder: string;
    newsletterCta: string;
    links: { label: string; href: string }[];
    legalLinks: { label: string; href: string }[];
    copyright: string;
  };
};

const es: LandingDictionary = {
  nav: {
    home: "Inicio",
    focus: "Enfoque",
    pricing: "Precios",
    contact: "Contacto",
    login: "Espacio",
    mainAria: "Principal",
    toggleTheme: "Cambiar tema",
  },
  hero: {
    titleBefore: "Controla tu ",
    titleHighlight: "espacio",
    titleAfter: " en un solo lugar",
    benefits: [
      "Ahorra tiempo",
      "Aumenta tus ganancias",
      "Reduce tus errores",
      "Mejora la experiencia",
    ],
    secondaryCta: "Descubre características completas",
  },
  focus: {
    title: "Enfoque",
    items: [
      {
        title: "Gestión de miembros y asistencia",
        body: "Altas, vencimientos, QR y check-in en un solo flujo para tu recepción.",
      },
      {
        title: "Facturación y pagos",
        body: "Registra efectivo o transferencia y renueva membresías sin fricción.",
      },
      {
        title: "Análisis de rendimiento",
        body: "Mira socios activos, vencidos y pagos del día desde el panel.",
      },
      {
        title: "Comunicación integrada",
        body: "Mantén a tu equipo alineado con roles claros: owner, trainer y staff.",
      },
    ],
  },
  pricing: {
    title: "Precios",
    select: "Seleccionar",
    plans: [
      {
        name: "Pequeño",
        price: "$29",
        period: "/mes",
        features: [
          "Hasta 100 socios",
          "Check-in con QR",
          "Pagos manuales",
          "1 sucursal",
        ],
      },
      {
        name: "Mediano",
        price: "$59",
        period: "/mes",
        highlighted: true,
        features: [
          "Hasta 500 socios",
          "Planes y renovaciones",
          "Roles de staff",
          "Hasta 3 sucursales",
        ],
      },
      {
        name: "Grande",
        price: "$99",
        period: "/mes",
        features: [
          "Socios ilimitados",
          "Multi-sucursal",
          "Soporte prioritario",
          "Reportes avanzados",
        ],
      },
    ],
  },
  footer: {
    phone: "+52 55 0000 0000",
    email: "hola@amrap.app",
    address: "Ciudad de México, MX",
    quickLinks: "Enlaces rápidos",
    legal: "Legal",
    follow: "Síguenos",
    newsletter: "Suscríbete",
    newsletterPlaceholder: "Tu correo",
    newsletterCta: "Enviar",
    links: [
      { label: "Inicio", href: "#inicio" },
      { label: "Enfoque", href: "#enfoque" },
      { label: "Precios", href: "#precios" },
      { label: "Contacto", href: "#contacto" },
    ],
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
    focus: "Focus",
    pricing: "Pricing",
    contact: "Contact",
    login: "Sign in",
    mainAria: "Main",
    toggleTheme: "Toggle theme",
  },
  hero: {
    titleBefore: "Run your ",
    titleHighlight: "gym",
    titleAfter: " from one place",
    benefits: [
      "Save time",
      "Grow revenue",
      "Cut errors",
      "Improve experience",
    ],
    secondaryCta: "Discover full features",
  },
  focus: {
    title: "Focus",
    items: [
      {
        title: "Members & attendance",
        body: "Sign-ups, expiry, QR codes, and check-in in one front-desk flow.",
      },
      {
        title: "Billing & payments",
        body: "Record cash or transfer and renew memberships without friction.",
      },
      {
        title: "Performance insights",
        body: "See active vs expired members and today’s payments on the dashboard.",
      },
      {
        title: "Team communication",
        body: "Keep staff aligned with clear roles: owner, trainer, and staff.",
      },
    ],
  },
  pricing: {
    title: "Pricing",
    select: "Select",
    plans: [
      {
        name: "Small",
        price: "$29",
        period: "/mo",
        features: [
          "Up to 100 members",
          "QR check-in",
          "Manual payments",
          "1 branch",
        ],
      },
      {
        name: "Medium",
        price: "$59",
        period: "/mo",
        highlighted: true,
        features: [
          "Up to 500 members",
          "Plans & renewals",
          "Staff roles",
          "Up to 3 branches",
        ],
      },
      {
        name: "Large",
        price: "$99",
        period: "/mo",
        features: [
          "Unlimited members",
          "Multi-branch",
          "Priority support",
          "Advanced reports",
        ],
      },
    ],
  },
  footer: {
    phone: "+1 (555) 000-0000",
    email: "hello@amrap.app",
    address: "Mexico City, MX",
    quickLinks: "Quick links",
    legal: "Legal",
    follow: "Follow us",
    newsletter: "Subscribe",
    newsletterPlaceholder: "Your email",
    newsletterCta: "Send",
    links: [
      { label: "Home", href: "#inicio" },
      { label: "Focus", href: "#enfoque" },
      { label: "Pricing", href: "#precios" },
      { label: "Contact", href: "#contacto" },
    ],
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

const landingSectionIds = ["inicio", "enfoque", "precios", "contacto"] as const;
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
