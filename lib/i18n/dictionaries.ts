import type { Locale } from "./config";

export type Dictionary = {
  meta: { title: string };
  nav: {
    dashboard: string;
    members: string;
    payments: string;
    checkin: string;
    plans: string;
    logout: string;
  };
  login: {
    title: string;
    email: string;
    password: string;
    submit: string;
    registerLink: string;
    error: string;
    /** After register with email confirmation — gym created server-side */
    pendingConfirmBanner: string;
  };
  register: {
    title: string;
    tenantName: string;
    fullName: string;
    email: string;
    password: string;
    submit: string;
    loginLink: string;
    error: string;
    /** Shown when Auth requires email confirmation — no session yet, so gym row cannot be created. */
    confirmEmail: string;
    /** Prefix before technical RPC / DB message */
    rpcFailed: string;
    /** Auth signUp when email is already registered */
    emailInUse: string;
  };
  completeSetup: {
    title: string;
    description: string;
    submit: string;
    error: string;
  };
  dashboard: {
    title: string;
    totalMembers: string;
    activeMembers: string;
    expiredMembers: string;
    paymentsToday: string;
  };
  members: {
    title: string;
    newMember: string;
    name: string;
    phone: string;
    status: string;
    expires: string;
    active: string;
    expired: string;
    actions: string;
    view: string;
    createTitle: string;
    save: string;
    cancel: string;
    membershipExpires: string;
    qrCode: string;
    renew: string;
    selectPlan: string;
    paymentMethod: string;
    cash: string;
    transfer: string;
    renewSubmit: string;
    delete: string;
    confirmDelete: string;
    noMembers: string;
  };
  payments: {
    title: string;
    newPayment: string;
    member: string;
    amount: string;
    method: string;
    date: string;
    selectMember: string;
    submit: string;
    noPayments: string;
  };
  checkin: {
    title: string;
    manualLabel: string;
    manualPlaceholder: string;
    lookup: string;
    scanning: string;
    stopCamera: string;
    startCamera: string;
    resultOk: string;
    resultDenied: string;
    memberNotFound: string;
    cameraError: string;
  };
  plans: {
    title: string;
    newPlan: string;
    planName: string;
    price: string;
    durationDays: string;
    save: string;
    delete: string;
    noPlans: string;
  };
  common: {
    loading: string;
    forbidden: string;
    back: string;
    locale: string;
  };
};

const es: Dictionary = {
  meta: { title: "Control de membresías" },
  nav: {
    dashboard: "Panel",
    members: "Socios",
    payments: "Pagos",
    checkin: "Entrada",
    plans: "Planes",
    logout: "Salir",
  },
  login: {
    title: "Iniciar sesión",
    email: "Correo",
    password: "Contraseña",
    submit: "Entrar",
    registerLink: "Registrar gimnasio",
    error: "Credenciales inválidas",
    pendingConfirmBanner:
      "Tu gimnasio ya está creado. Abre el enlace de confirmación en tu correo y luego entra aquí con tu correo y contraseña.",
  },
  register: {
    title: "Registrar gimnasio",
    tenantName: "Nombre del gimnasio",
    fullName: "Tu nombre",
    email: "Correo",
    password: "Contraseña",
    submit: "Crear cuenta",
    loginLink: "¿Ya tienes cuenta? Entrar",
    error: "No se pudo completar el registro",
    confirmEmail:
      "Por favor revisa tu correo electrónico para confirmar tu cuenta y completar el registro.",
    rpcFailed: "Error al crear el gimnasio",
    emailInUse: "Ese correo ya está registrado. Inicia sesión o usa «Terminar registro» si confirmaste el correo y no ves tu gimnasio.",
  },
  completeSetup: {
    title: "Terminar registro del gimnasio",
    description:
      "Ya iniciaste sesión pero falta crear tu gimnasio (tenant). Completa estos datos.",
    submit: "Crear gimnasio",
    error: "No se pudo crear el gimnasio",
  },
  dashboard: {
    title: "Panel",
    totalMembers: "Socios totales",
    activeMembers: "Activos",
    expiredMembers: "Vencidos",
    paymentsToday: "Pagos hoy",
  },
  members: {
    title: "Socios",
    newMember: "Nuevo socio",
    name: "Nombre",
    phone: "Teléfono",
    status: "Estado",
    expires: "Vence",
    active: "Activo",
    expired: "Vencido",
    actions: "Acciones",
    view: "Ver",
    createTitle: "Nuevo socio",
    save: "Guardar",
    cancel: "Cancelar",
    membershipExpires: "Membresía vence",
    qrCode: "Código QR",
    renew: "Renovar membresía",
    selectPlan: "Plan",
    paymentMethod: "Método de pago",
    cash: "Efectivo",
    transfer: "Transferencia",
    renewSubmit: "Renovar y registrar pago",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar socio?",
    noMembers: "No hay socios aún.",
  },
  payments: {
    title: "Pagos",
    newPayment: "Registrar pago",
    member: "Socio",
    amount: "Monto",
    method: "Método",
    date: "Fecha",
    selectMember: "Seleccionar socio",
    submit: "Registrar",
    noPayments: "Sin pagos registrados.",
  },
  checkin: {
    title: "Entrada",
    manualLabel: "Código manual",
    manualPlaceholder: "Pegar token o ID",
    lookup: "Buscar",
    scanning: "Escaneando…",
    stopCamera: "Detener cámara",
    startCamera: "Usar cámara",
    resultOk: "Órale, todo en orden",
    resultDenied: "No ha pagado. No puede pasar",
    memberNotFound: "Socio no encontrado",
    cameraError: "No se pudo usar la cámara",
  },
  plans: {
    title: "Planes",
    newPlan: "Nuevo plan",
    planName: "Nombre",
    price: "Precio",
    durationDays: "Duración (días)",
    save: "Guardar",
    delete: "Eliminar",
    noPlans: "No hay planes. Crea uno para renovar membresías.",
  },
  common: {
    loading: "Cargando…",
    forbidden: "No tienes permiso",
    back: "Volver",
    locale: "Idioma",
  },
};

const en: Dictionary = {
  meta: { title: "Membership control" },
  nav: {
    dashboard: "Dashboard",
    members: "Members",
    payments: "Payments",
    checkin: "Check-in",
    plans: "Plans",
    logout: "Log out",
  },
  login: {
    title: "Log in",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    registerLink: "Register gym",
    error: "Invalid credentials",
    pendingConfirmBanner:
      "Your gym is ready. Open the confirmation link in your email, then sign in here with your email and password.",
  },
  register: {
    title: "Register gym",
    tenantName: "Gym name",
    fullName: "Your name",
    email: "Email",
    password: "Password",
    submit: "Create account",
    loginLink: "Already have an account? Log in",
    error: "Registration failed",
    confirmEmail:
      "Please check your email to confirm your account and complete the registration.",
    rpcFailed: "Could not create gym",
    emailInUse:
      "That email is already registered. Sign in, or use «Finish setup» if you confirmed email but still have no gym.",
  },
  completeSetup: {
    title: "Finish gym setup",
    description:
      "You are signed in but your gym (tenant) was not created yet. Complete the fields below.",
    submit: "Create gym",
    error: "Could not create gym",
  },
  dashboard: {
    title: "Dashboard",
    totalMembers: "Total members",
    activeMembers: "Active",
    expiredMembers: "Expired",
    paymentsToday: "Payments today",
  },
  members: {
    title: "Members",
    newMember: "New member",
    name: "Name",
    phone: "Phone",
    status: "Status",
    expires: "Expires",
    active: "Active",
    expired: "Expired",
    actions: "Actions",
    view: "View",
    createTitle: "New member",
    save: "Save",
    cancel: "Cancel",
    membershipExpires: "Membership expires",
    qrCode: "QR code",
    renew: "Renew membership",
    selectPlan: "Plan",
    paymentMethod: "Payment method",
    cash: "Cash",
    transfer: "Transfer",
    renewSubmit: "Renew and record payment",
    delete: "Delete",
    confirmDelete: "Delete member?",
    noMembers: "No members yet.",
  },
  payments: {
    title: "Payments",
    newPayment: "Record payment",
    member: "Member",
    amount: "Amount",
    method: "Method",
    date: "Date",
    selectMember: "Select member",
    submit: "Save",
    noPayments: "No payments recorded.",
  },
  checkin: {
    title: "Check-in",
    manualLabel: "Manual code",
    manualPlaceholder: "Paste token or ID",
    lookup: "Look up",
    scanning: "Scanning…",
    stopCamera: "Stop camera",
    startCamera: "Use camera",
    resultOk: "You're good to go",
    resultDenied: "Membership expired. Entry denied",
    memberNotFound: "Member not found",
    cameraError: "Camera could not be started",
  },
  plans: {
    title: "Plans",
    newPlan: "New plan",
    planName: "Name",
    price: "Price",
    durationDays: "Duration (days)",
    save: "Save",
    delete: "Delete",
    noPlans: "No plans yet. Create one to renew memberships.",
  },
  common: {
    loading: "Loading…",
    forbidden: "You do not have permission",
    back: "Back",
    locale: "Language",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.es;
}
