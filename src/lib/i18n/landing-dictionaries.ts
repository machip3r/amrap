import type { Locale } from "./config";

export type LandingDictionary = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    home: string;
    product: string;
    pricing: string;
    faq: string;
    contact: string;
    login: string;
    start: string;
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
    trust: string;
  };
  audience: {
    title: string;
    items: string[];
  };
  difference: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: { title: string; body: string }[];
  };
  product: {
    title: string;
    subtitle: string;
    items: { title: string; body: string }[];
  };
  process: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: { step: string; title: string; body: string }[];
    cta: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    monthly: string;
    annual: string;
    annualSave: string;
    select: string;
    contactCta: string;
    comparePlans: string;
    taxNote: string;
    plans: {
      name: string;
      priceMonthly: string;
      priceAnnual: string;
      periodMonthly: string;
      periodAnnual: string;
      note: string;
      features: string[];
      highlighted?: boolean;
      badge?: string;
      cta: "register" | "contact";
    }[];
  };
  faq: {
    title: string;
    subtitle: string;
    items: { q: string; a: string }[];
  };
  contact: {
    title: string;
    subtitle: string;
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
  ctaBand: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primary: string;
    secondary: string;
    bullets: string[];
  };
  footer: {
    email: string;
    address: string;
    legal: string;
    legalLinks: { label: string; href: string }[];
    copyright: string;
  };
};

const es: LandingDictionary = {
  meta: {
    title: "AMRAP - Gestión de estudios fitness",
    description:
      "AMRAP (amrap.space) es software para gimnasios: check-in con QR, membresías, clases y recepción en un solo panel. Para gyms en México y EE. UU. Empieza gratis.",
  },
  nav: {
    home: "Inicio",
    product: "Producto",
    pricing: "Precios",
    faq: "FAQ",
    contact: "Contacto",
    login: "Ingresar",
    start: "Empezar gratis",
    mainAria: "Principal",
    toggleTheme: "Cambiar tema",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
  },
  hero: {
    brand: "AMRAP",
    title: "El software del gym que sí se usa en recepción",
    subtitle:
      "Check-in con QR, altas, renovaciones y quién está activo hoy. Sin CRM hinchado. Sin promesas de boutique. Empieza gratis y escala cuando abras más sedes.",
    primaryCta: "Empezar gratis",
    secondaryCta: "Ver cómo funciona",
    trust: "Sin tarjeta · Listo en minutos · México y EE. UU.",
  },
  audience: {
    title: "Hecho para el piso del gym",
    items: [
      "CrossFit & boxes",
      "Funcional & HIIT",
      "Fuerza & powerlifting",
      "Box & artes marciales",
      "Gyms boutique",
      "Entrenadores independientes",
    ],
  },
  difference: {
    eyebrow: "Por qué AMRAP",
    title: "Una persona. Un QR. Varios roles.",
    subtitle:
      "Los estudios boutique venden reservas y landing pages. Nosotros resolvemos el gym: quién entra, quién paga y cómo operas si eres dueño en un lado y miembro en otro.",
    items: [
      {
        title: "Un QR en toda la plataforma",
        body: "El mismo código sirve donde entrenes. No se puede usar en otro gym durante 4 horas: menos préstamo de pases, más control real.",
      },
      {
        title: "La organización paga, no el miembro",
        body: "Hoy registras efectivo, SPEI o terminal (Clip/MP) sin comisión de plataforma — así cobran la mayoría de gyms pequeños en México. La pasarela en línea para miembros viene en Beta en planes de pago.",
      },
      {
        title: "Multi-gym sin sorpresa",
        body: "Growth cubre 2 o 3 gyms a precio fijo. Abrir el tercero no sube la factura del software. Más de 3: hablamos y armamos Pro.",
      },
    ],
  },
  product: {
    title: "Lo que usas todos los días",
    subtitle:
      "Diseñado para dueño y recepción: altas, accesos y lo que pasa hoy. No un muro de gráficas ni un embudo de Instagram.",
    items: [
      {
        title: "Check-in en segundos",
        body: "QR desde el celular o búsqueda en el iPad de recepción. Validas membresía al momento — sin filas, sin Excel, sin WhatsApp.",
      },
      {
        title: "Miembros y planes claros",
        body: "Das de alta, defines precios y ves quién vence. Renuevas y anotas el pago en el mismo flujo. Temporal o día: mismo camino.",
      },
      {
        title: "El día en un vistazo",
        body: "Quién llegó, quién está activo, quién está por vencer. Pensado para quien está en la puerta, no para un reporte de consultoría.",
      },
      {
        title: "Equipo con permisos reales",
        body: "Invita staff y coaches. Cada persona puede ser dueño, encargado, coach o miembro según el gym — con la misma cuenta.",
      },
    ],
  },
  process: {
    eyebrow: "Así de directo",
    title: "De cero a recepción en cuatro pasos",
    subtitle:
      "Sin contrato forzoso. Sin implementación de semanas. Configuras, invitas al equipo y abres la puerta.",
    steps: [
      {
        step: "01",
        title: "Crea tu organización",
        body: "Regístrate gratis. Empiezas en Freemium con un gym y hasta 30 miembros activos para probar el flujo de verdad.",
      },
      {
        step: "02",
        title: "Configura el gym",
        body: "Nombre, sucursal, planes de membresía y precios. En minutos tienes lo esencial para operar.",
      },
      {
        step: "03",
        title: "Invita a tu equipo",
        body: "Suma recepción y coaches con roles claros. Ellos entran con su propia cuenta — sin compartir contraseñas.",
      },
      {
        step: "04",
        title: "Abre la puerta",
        body: "Check-in con QR, altas en mostrador y el día a la vista. Cuando crezcas, activas cobros en línea y multi-gym.",
      },
    ],
    cta: "Empezar ahora",
  },
  pricing: {
    title: "Planes que crecen con tu gym",
    subtitle:
      "Paga la organización, no el miembro. Precios sin impuestos. Anual ≈ 17% menos. ¿Más de 3 gyms? Escríbenos.",
    monthly: "Mensual",
    annual: "Anual",
    annualSave: "Ahorra ~17%",
    select: "Empezar",
    contactCta: "Hablar con nosotros",
    comparePlans: "Comparar planes",
    taxNote: "Precios en listado público. Impuestos no incluidos.",
    plans: [
      {
        name: "Freemium",
        priceMonthly: "$0",
        priceAnnual: "$0",
        periodMonthly: "/mes",
        periodAnnual: "/año",
        note: "Para probar · 1 gym · 1 sucursal",
        cta: "register",
        features: [
          "Hasta 30 miembros activos",
          "Check-in con QR o en recepción",
          "2 staff por gym · 2 planes",
          "Resumen del día e inbox interno",
          "Historial de 30 días",
          "Marca AMRAP · sin cobros en línea",
        ],
      },
      {
        name: "Starter",
        priceMonthly: "$849",
        priceAnnual: "$8,490",
        periodMonthly: "MXN/mes",
        periodAnnual: "MXN/año",
        note: "Un gym completo · por organización",
        highlighted: true,
        badge: "Más elegido",
        cta: "register",
        features: [
          "Hasta ~500 miembros activos (aviso suave; no bloquea acceso)",
          "5 cuentas de staff por sede",
          "Planes de membresía ilimitados",
          "Cobros en línea para miembros",
          "Pagos manuales sin comisión de plataforma (efectivo, SPEI, Clip)",
          "Marca propia (logo y colores)",
          "1 gym · 1 sucursal",
        ],
      },
      {
        name: "Growth",
        priceMonthly: "$1,499",
        priceAnnual: "$14,990",
        periodMonthly: "MXN/mes",
        periodAnnual: "MXN/año",
        note: "2 o 3 gyms · precio fijo",
        cta: "register",
        features: [
          "Todo lo de Starter",
          "Hasta ~1000 miembros activos por sede (aviso suave)",
          "Hasta 3 sedes · ~10 staff por sede (hasta 30 en la org)",
          "Vista multi-gym / pasaporte entre sedes",
          "Marca propia · cobros en línea",
          "El tercer gym no sube el software",
        ],
      },
      {
        name: "Pro",
        priceMonthly: "A medida",
        priceAnnual: "A medida",
        periodMonthly: "",
        periodAnnual: "",
        note: "Más de 3 gyms · platicamos",
        cta: "contact",
        features: [
          "4 o más gyms, o algo a la medida",
          "Staff y miembros ilimitados",
          "White-label y personalización total",
          "Soporte prioritario",
          "Lo de Growth, adaptado a ti",
        ],
      },
    ],
  },
  faq: {
    title: "Preguntas frecuentes",
    subtitle: "Lo esencial antes de meter a tu equipo.",
    items: [
      {
        q: "¿Necesito a alguien técnico para empezar?",
        a: "No. Creas la organización, configuras el gym y empiezas check-in el mismo día. Si te atoras, escríbenos — respondemos en español.",
      },
      {
        q: "¿Qué incluye el plan gratis de verdad?",
        a: "1 gym, 1 sucursal, hasta 30 miembros activos, check-in QR o manual, 2 staff por gym, 2 planes y el resumen del día. Sirve para probar operación real, no solo una demo.",
      },
      {
        q: "¿AMRAP se queda con comisión de mis membresías?",
        a: "No. Hoy registras pagos en efectivo, SPEI o terminal (Clip/MP) sin comisión de plataforma. En planes de pago también puedes cobrar membresías en línea; las comisiones de tarjeta las cobra el proveedor.",
      },
      {
        q: "¿Puedo manejar varios gyms?",
        a: "Sí. Growth cubre 2–3 gyms con una factura fija y hasta ~10 staff por sede. Si necesitas 4 o más, el plan Pro se cotiza contigo.",
      },
      {
        q: "¿Qué pasa con el QR si alguien entrena en varios lugares?",
        a: "Una persona = un QR en toda la plataforma. Después de un check-in, ese código no se puede usar en otro gym durante 4 horas.",
      },
      {
        q: "¿Mis datos son míos?",
        a: "Sí. En planes de pago puedes exportar CSV. Si cancelas o eliminas, hay ventana de retención y exportación antes del borrado completo.",
      },
      {
        q: "¿Sirve solo para CrossFit?",
        a: "No. Funciona para boxes, funcional, fuerza, boxeo, artes marciales y gyms boutique. El foco es operación de membresía y acceso, no un nicho de reformer.",
      },
    ],
  },
  contact: {
    title: "Hablemos de tu gym",
    subtitle:
      "Cuéntanos cómo operas hoy. Te orientamos para empezar gratis, con un gym o con varias sedes.",
    emailLabel: "Correo",
    addressLabel: "Ubicación",
    name: "Nombre",
    namePlaceholder: "Tu nombre",
    email: "Correo",
    emailPlaceholder: "tu@correo.com",
    message: "Mensaje",
    messagePlaceholder: "¿Cuántos gyms tienes? ¿Qué quieres resolver primero?",
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
  ctaBand: {
    eyebrow: "Empieza hoy",
    title: "Tu gym merece un panel a su altura",
    subtitle:
      "Operación clara. Sin contratos forzosos. Sin tarjeta para probar. Tu recepción trabajando en minutos.",
    primary: "Empezar gratis",
    secondary: "Ya tengo cuenta",
    bullets: ["Sin tarjeta", "Sin contratos", "Soporte en español"],
  },
  footer: {
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
  meta: {
    title: "AMRAP - Fitness Studio Management",
    description:
      "AMRAP (amrap.space) is gym management software: QR check-in, memberships, classes, and front-desk tools in one panel. Built for gyms in Mexico & the U.S. Start free.",
  },
  nav: {
    home: "Home",
    product: "Product",
    pricing: "Pricing",
    faq: "FAQ",
    contact: "Contact",
    login: "Sign in",
    start: "Start free",
    mainAria: "Main",
    toggleTheme: "Toggle theme",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  hero: {
    brand: "AMRAP",
    title: "Gym software built for the front desk",
    subtitle:
      "QR check-in, sign-ups, renewals, and who’s active today. No bloated CRM. No boutique fluff. Start free, scale when you open more locations.",
    primaryCta: "Start free",
    secondaryCta: "See how it works",
    trust: "No card · Live in minutes · Mexico & U.S.",
  },
  audience: {
    title: "Built for the gym floor",
    items: [
      "CrossFit & boxes",
      "Functional & HIIT",
      "Strength & powerlifting",
      "Boxing & martial arts",
      "Boutique gyms",
      "Independent coaches",
    ],
  },
  difference: {
    eyebrow: "Why AMRAP",
    title: "One person. One QR. Many roles.",
    subtitle:
      "Boutique tools sell bookings and landing pages. We run the gym: who walks in, who paid, and how you operate when you’re owner in one place and member in another.",
    items: [
      {
        title: "One QR across the platform",
        body: "The same code works wherever you train. It can’t be used at another gym for 4 hours — less pass-sharing, more real control.",
      },
      {
        title: "Your org pays — not your members",
        body: "Today you log cash, SPEI, or terminal (Clip/MP) with no platform fee — how most small MX gyms collect. Online member billing ships as Beta on paid plans.",
      },
      {
        title: "Multi-gym without the gotcha",
        body: "Growth covers 2–3 gyms at a flat rate. Opening the third doesn’t raise the software bill. Need 4+? We quote Pro with you.",
      },
    ],
  },
  product: {
    title: "What you use every day",
    subtitle:
      "For owners and front desk: members, access, and what’s happening today — not a wall of charts or an Instagram funnel.",
    items: [
      {
        title: "Check-in in seconds",
        body: "QR from a phone or lookup on the desk iPad. Membership validates on the spot — no lines, no spreadsheets, no WhatsApp.",
      },
      {
        title: "Clear members & plans",
        body: "Add people, set prices, see who expires. Renew and log payment in the same flow. Day passes use the same path.",
      },
      {
        title: "Today at a glance",
        body: "Who showed up, who’s active, who’s about to lapse. Built for the person at the door — not a consulting dashboard.",
      },
      {
        title: "Team with real permissions",
        body: "Invite staff and coaches. Someone can be owner, manager, coach, or member by gym — same login everywhere.",
      },
    ],
  },
  process: {
    eyebrow: "Straight path",
    title: "From zero to front desk in four steps",
    subtitle:
      "No forced contract. No multi-week implementation. Set up, invite the team, open the door.",
    steps: [
      {
        step: "01",
        title: "Create your organization",
        body: "Sign up free. Start on Freemium with one gym and up to 30 active members so you can prove the real flow.",
      },
      {
        step: "02",
        title: "Configure the gym",
        body: "Name, branch, membership plans, and prices. In minutes you have what you need to operate.",
      },
      {
        step: "03",
        title: "Invite your team",
        body: "Add desk staff and coaches with clear roles. They get their own accounts — no shared passwords.",
      },
      {
        step: "04",
        title: "Open the door",
        body: "QR check-in, desk sign-ups, and the day in view. When you grow, turn on online billing and multi-gym.",
      },
    ],
    cta: "Get started",
  },
  pricing: {
    title: "Plans that grow with your gym",
    subtitle:
      "Your organization pays, not your members. Prices before tax. Annual saves about 17%. Running more than 3 gyms? Talk to us.",
    monthly: "Monthly",
    annual: "Annual",
    annualSave: "Save ~17%",
    select: "Get started",
    contactCta: "Talk to us",
    comparePlans: "Compare plans",
    taxNote: "Public list prices. Taxes not included.",
    plans: [
      {
        name: "Freemium",
        priceMonthly: "$0",
        priceAnnual: "$0",
        periodMonthly: "/mo",
        periodAnnual: "/yr",
        note: "To try it out · 1 gym · 1 branch",
        cta: "register",
        features: [
          "Up to 30 active members",
          "QR check-in or front-desk lookup",
          "2 staff per gym · 2 membership plans",
          "Day overview and internal inbox",
          "30-day history",
          "AMRAP branding · no online member billing",
        ],
      },
      {
        name: "Starter",
        priceMonthly: "$42",
        priceAnnual: "$420",
        periodMonthly: "USD/mo",
        periodAnnual: "USD/yr",
        note: "One full gym · per organization",
        highlighted: true,
        badge: "Most chosen",
        cta: "register",
        features: [
          "Up to ~500 active members (soft notice; access never blocked)",
          "5 staff accounts per location",
          "Unlimited membership plans",
          "Online member billing",
          "Manual payments with no platform fee (cash, transfer, terminal)",
          "Own branding (logo and colors)",
          "1 gym · 1 branch",
        ],
      },
      {
        name: "Growth",
        priceMonthly: "$73",
        priceAnnual: "$730",
        periodMonthly: "USD/mo",
        periodAnnual: "USD/yr",
        note: "2 or 3 gyms · flat rate",
        cta: "register",
        features: [
          "Everything in Starter",
          "Up to ~1000 active members per location (soft notice)",
          "Up to 3 locations · ~10 staff per gym (up to 30 in the org)",
          "Multi-gym rollup / passport across sites",
          "Own branding · online member billing",
          "A third gym doesn’t raise the software bill",
        ],
      },
      {
        name: "Pro",
        priceMonthly: "Custom",
        priceAnnual: "Custom",
        periodMonthly: "",
        periodAnnual: "",
        note: "More than 3 gyms · we’ll figure it out",
        cta: "contact",
        features: [
          "4+ gyms, or something custom",
          "Unlimited staff and members",
          "Full white-label and customization",
          "Priority support",
          "Growth, shaped to your setup",
        ],
      },
    ],
  },
  faq: {
    title: "FAQ",
    subtitle: "What matters before you bring your team in.",
    items: [
      {
        q: "Do I need a technical person to start?",
        a: "No. Create the organization, set up the gym, and start check-in the same day. If you get stuck, write us — we reply in English and Spanish.",
      },
      {
        q: "What’s actually in the free plan?",
        a: "1 gym, 1 branch, up to 30 active members, QR or manual check-in, 2 staff per gym, 2 plans, and the day overview. Enough to prove real ops — not just a demo.",
      },
      {
        q: "Does AMRAP take a cut of my memberships?",
        a: "No. Today you log cash, SPEI, or terminal (Clip/MP) payments with no platform fee. Paid plans also include online member billing; card fees stay with the provider.",
      },
      {
        q: "Can I run multiple gyms?",
        a: "Yes. Growth covers 2–3 gyms on one flat invoice with ~10 staff per location. Need 4 or more? Pro is quoted with you.",
      },
      {
        q: "What about QR if someone trains in several places?",
        a: "One person = one QR across the platform. After a check-in, that code can’t be used at another gym for 4 hours.",
      },
      {
        q: "Is my data mine?",
        a: "Yes. Paid plans can export CSV. If you cancel or delete, there’s a retention window and export before full deletion.",
      },
      {
        q: "Is this only for CrossFit?",
        a: "No. It works for boxes, functional, strength, boxing, martial arts, and boutique gyms. The focus is membership ops and access — not a reformer niche.",
      },
    ],
  },
  contact: {
    title: "Let’s talk about your gym",
    subtitle:
      "Tell us how you run things today. We’ll help you start free, with one location, or with a few.",
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
  ctaBand: {
    eyebrow: "Start today",
    title: "Your gym deserves software that fits the floor",
    subtitle:
      "Clear ops. No forced contracts. No card to try. Your front desk working in minutes.",
    primary: "Start free",
    secondary: "I already have an account",
    bullets: ["No card", "No contracts", "Support in Spanish & English"],
  },
  footer: {
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

export type LandingSectionId =
  | "start"
  | "product"
  | "process"
  | "pricing"
  | "faq"
  | "contact";

export function sectionIdForNav(
  key: "home" | "product" | "pricing" | "faq" | "contact",
): LandingSectionId {
  const map = {
    home: "start",
    product: "product",
    pricing: "pricing",
    faq: "faq",
    contact: "contact",
  } as const;
  return map[key];
}
