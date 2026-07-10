import type { Locale } from "./config";

export type Dictionary = {
  meta: { title: string; description: string };
  nav: {
    dashboard: string;
    members: string;
    payments: string;
    checkin: string;
    plans: string;
    logout: string;
    settings: string;
    brandTitle: string;
    brandSubtitle: string;
  };
  shell: {
    searchPlaceholder: string;
    searchLabel: string;
    gymAdmin: string;
    notifications: string;
    help: string;
  };
  a11y: {
    toggleTheme: string;
    moreActions: string;
  };
  login: {
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    submit: string;
    submitting: string;
    registerLink: string;
    registerPrompt: string;
    error: string;
    pendingConfirmBanner: string;
  };
  register: {
    title: string;
    subtitle: string;
    tenantName: string;
    tenantNamePlaceholder: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    confirmPassword: string;
    passwordMismatch: string;
    showPassword: string;
    hidePassword: string;
    submit: string;
    submitting: string;
    loginLink: string;
    loginPrompt: string;
    error: string;
    confirmEmail: string;
    rpcFailed: string;
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
    subtitle: string;
    dateLabel: string;
    totalMembers: string;
    activeMembers: string;
    expiredMembers: string;
    paymentsToday: string;
    renewals: string;
    accessLog: string;
    viewAll: string;
    colMember: string;
    colTime: string;
    colMembershipStatus: string;
    colAction: string;
    capacityTitle: string;
    occupancy: string;
    maxCapacity: string;
    present: string;
    people: string;
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
    error: string;
    notFound: string;
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
    error: string;
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
    error: string;
  };
  common: {
    loading: string;
    forbidden: string;
    back: string;
    locale: string;
    saveFailed: string;
    invalidInput: string;
  };
};

const es: Dictionary = {
  meta: {
    title: "Control de membresías",
    description: "Administración de membresías para gimnasios",
  },
  nav: {
    dashboard: "Panel",
    members: "Socios",
    payments: "Pagos",
    checkin: "Entrada",
    plans: "Planes",
    logout: "Salir",
    settings: "Configuración",
    brandTitle: "Admin Central",
    brandSubtitle: "Recepción",
  },
  shell: {
    searchPlaceholder: "Buscar socios, pagos…",
    searchLabel: "Buscar",
    gymAdmin: "GYM ADMIN",
    notifications: "Notificaciones",
    help: "Ayuda",
  },
  a11y: {
    toggleTheme: "Cambiar tema",
    moreActions: "Más acciones",
  },
  login: {
    title: "Iniciar sesión",
    subtitle: "Bienvenido de nuevo a tu espacio de gimnasio",
    email: "Correo",
    emailPlaceholder: "tu@correo.com",
    password: "Contraseña",
    submit: "Entrar",
    submitting: "Entrando…",
    registerLink: "Registrar gimnasio",
    registerPrompt: "¿No tienes cuenta?",
    error: "Credenciales inválidas",
    pendingConfirmBanner:
      "Tu gimnasio ya está creado. Abre el enlace de confirmación en tu correo y luego entra aquí con tu correo y contraseña.",
  },
  register: {
    title: "Registrar gimnasio",
    subtitle: "Crea el espacio de tu gimnasio",
    tenantName: "Nombre del gimnasio",
    tenantNamePlaceholder: "Mi gimnasio",
    fullName: "Tu nombre",
    fullNamePlaceholder: "Nombre completo",
    email: "Correo",
    emailPlaceholder: "tu@correo.com",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    passwordMismatch: "Las contraseñas no coinciden.",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    submit: "Crear cuenta",
    submitting: "Creando…",
    loginLink: "Entrar",
    loginPrompt: "¿Ya tienes cuenta?",
    error: "No se pudo completar el registro",
    confirmEmail:
      "Por favor revisa tu correo electrónico para confirmar tu cuenta y completar el registro.",
    rpcFailed: "Error al crear el gimnasio",
    emailInUse:
      "Ese correo ya está registrado. Inicia sesión o usa «Terminar registro» si confirmaste el correo y no ves tu gimnasio.",
  },
  completeSetup: {
    title: "Terminar registro del gimnasio",
    description: "Solo un paso más para empezar",
    submit: "Crear gimnasio",
    error: "No se pudo crear el gimnasio",
  },
  dashboard: {
    title: "Resumen diario",
    subtitle: "Métricas de rendimiento y actividad reciente del gimnasio.",
    dateLabel: "Fecha",
    totalMembers: "Socios totales",
    activeMembers: "Activos",
    expiredMembers: "Vencidos",
    paymentsToday: "Pagos hoy",
    renewals: "renovaciones",
    accessLog: "Registro de accesos",
    viewAll: "Ver todos",
    colMember: "Socio",
    colTime: "Hora",
    colMembershipStatus: "Estado de membresía",
    colAction: "Acción",
    capacityTitle: "Capacidad actual",
    occupancy: "Ocupación",
    maxCapacity: "Aforo máximo",
    present: "Presentes",
    people: "personas",
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
    error: "No se pudo guardar el socio",
    notFound: "Socio o plan no encontrado",
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
    error: "No se pudo registrar el pago",
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
    error: "No se pudo guardar el plan",
  },
  common: {
    loading: "Cargando…",
    forbidden: "No tienes permiso",
    back: "Volver",
    locale: "Idioma",
    saveFailed: "No se pudo guardar",
    invalidInput: "Revisa los datos e inténtalo de nuevo",
  },
};

const en: Dictionary = {
  meta: {
    title: "Membership control",
    description: "Membership admin for gyms",
  },
  nav: {
    dashboard: "Dashboard",
    members: "Members",
    payments: "Payments",
    checkin: "Check-in",
    plans: "Plans",
    logout: "Log out",
    settings: "Settings",
    brandTitle: "Admin Central",
    brandSubtitle: "Front desk",
  },
  shell: {
    searchPlaceholder: "Search members, payments…",
    searchLabel: "Search",
    gymAdmin: "GYM ADMIN",
    notifications: "Notifications",
    help: "Help",
  },
  a11y: {
    toggleTheme: "Toggle theme",
    moreActions: "More actions",
  },
  login: {
    title: "Log in",
    subtitle: "Welcome back to your gym workspace",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
    registerLink: "Register gym",
    registerPrompt: "Don't have an account?",
    error: "Invalid credentials",
    pendingConfirmBanner:
      "Your gym is ready. Open the confirmation link in your email, then sign in here with your email and password.",
  },
  register: {
    title: "Register gym",
    subtitle: "Create your gym workspace",
    tenantName: "Gym name",
    tenantNamePlaceholder: "My gym",
    fullName: "Your name",
    fullNamePlaceholder: "Full name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    confirmPassword: "Confirm password",
    passwordMismatch: "Passwords do not match.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Create account",
    submitting: "Creating…",
    loginLink: "Log in",
    loginPrompt: "Already have an account?",
    error: "Registration failed",
    confirmEmail:
      "Please check your email to confirm your account and complete the registration.",
    rpcFailed: "Could not create gym",
    emailInUse:
      "That email is already registered. Sign in, or use «Finish setup» if you confirmed email but still have no gym.",
  },
  completeSetup: {
    title: "Finish gym setup",
    description: "Just one more step to get started",
    submit: "Create gym",
    error: "Could not create gym",
  },
  dashboard: {
    title: "Daily overview",
    subtitle: "Performance metrics and recent gym activity.",
    dateLabel: "Date",
    totalMembers: "Total members",
    activeMembers: "Active",
    expiredMembers: "Expired",
    paymentsToday: "Payments today",
    renewals: "renewals",
    accessLog: "Access log",
    viewAll: "View all",
    colMember: "Member",
    colTime: "Time",
    colMembershipStatus: "Membership status",
    colAction: "Action",
    capacityTitle: "Current capacity",
    occupancy: "Occupancy",
    maxCapacity: "Max capacity",
    present: "Present",
    people: "people",
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
    error: "Could not save member",
    notFound: "Member or plan not found",
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
    error: "Could not record payment",
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
    error: "Could not save plan",
  },
  common: {
    loading: "Loading…",
    forbidden: "You do not have permission",
    back: "Back",
    locale: "Language",
    saveFailed: "Could not save",
    invalidInput: "Check the form and try again",
  },
};

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.es;
}
