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
    provisionalOwner: string;
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
    showPassword: string;
    hidePassword: string;
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
    organizationName: string;
    organizationNamePlaceholder: string;
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
    emailRateLimited: string;
  };
  confirmEmail: {
    title: string;
    subtitle: string;
    sentTitle: string;
    sentBody: string;
    otpLabel: string;
    otpPlaceholder: string;
    verify: string;
    verifying: string;
    resend: string;
    resending: string;
    resendOk: string;
    resendFailed: string;
    resendRateLimited: string;
    invalidOtp: string;
    backToLoginPrompt: string;
    backToLoginLink: string;
  };
  onboarding: {
    title: string;
    subtitle: string;
    stepsLabel: string;
    stepYou: string;
    stepGym: string;
    stepPlans: string;
    stepDone: string;
    profileTitle: string;
    profileSubtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    roleLegend: string;
    roleOwner: string;
    roleOwnerHint: string;
    roleManager: string;
    roleManagerHint: string;
    orgLabel: string;
    gymLabel: string;
    gymTitle: string;
    gymSubtitle: string;
    gymName: string;
    gymNamePlaceholder: string;
    branchName: string;
    branchNamePlaceholder: string;
    plansTitle: string;
    plansSubtitle: string;
    addPlan: string;
    skipPlans: string;
    planLimit: string;
    doneTitle: string;
    doneSubtitle: string;
    goDashboard: string;
    continue: string;
    saving: string;
    errorAuth: string;
    errorSave: string;
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
    qrInUse: string;
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
  validation: {
    required: string;
    email: string;
    password: string;
    passwordMin: string;
    passwordMismatch: string;
    personName: string;
    entityName: string;
    phone: string;
    otp: string;
    message: string;
    amount: string;
    duration: string;
    date: string;
    invalid: string;
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
    provisionalOwner: "Dueño provisional",
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
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    submit: "Entrar",
    submitting: "Entrando…",
    registerLink: "Registrar gimnasio",
    registerPrompt: "¿No tienes cuenta?",
    error: "Credenciales inválidas",
    pendingConfirmBanner:
      "Tu organización ya está creada. Confirma el correo y luego inicia sesión para completar la configuración.",
  },
  register: {
    title: "Crear cuenta",
    subtitle: "Empieza con tu organización en AMRAP",
    organizationName: "Nombre de la organización",
    organizationNamePlaceholder: "Mi empresa o grupo de gimnasios",
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
      "Revisa tu correo para confirmar la cuenta. Después inicia sesión y completa la configuración.",
    rpcFailed: "Error al crear la organización",
    emailInUse:
      "Ese correo ya está registrado. Inicia sesión o usa el enlace de confirmación si aún no terminaste.",
    emailRateLimited:
      "Demasiados correos enviados. Espera un minuto e inténtalo de nuevo, o revisa tu bandeja si ya te llegó un código.",
  },
  confirmEmail: {
    title: "Confirma tu correo",
    subtitle: "Ingresa el código que te enviamos para activar tu cuenta",
    sentTitle: "Revisa tu bandeja de entrada",
    sentBody: "Enviamos un código de confirmación a",
    otpLabel: "Código de verificación",
    otpPlaceholder: "123456",
    verify: "Confirmar cuenta",
    verifying: "Confirmando…",
    resend: "Reenviar código",
    resending: "Reenviando…",
    resendOk: "Código reenviado. Revisa tu correo.",
    resendFailed: "No se pudo reenviar el código. Intenta de nuevo.",
    resendRateLimited:
      "Espera unos segundos antes de pedir otro código e inténtalo de nuevo.",
    invalidOtp: "Código inválido o expirado. Intenta de nuevo.",
    backToLoginPrompt: "¿Ya tienes cuenta?",
    backToLoginLink: "Iniciar sesión",
  },
  onboarding: {
    title: "Configura tu espacio",
    subtitle: "Unos pasos rápidos para dejar tu gimnasio listo",
    stepsLabel: "Progreso",
    stepYou: "Tú",
    stepGym: "Gimnasio",
    stepPlans: "Planes",
    stepDone: "Listo",
    profileTitle: "Sobre ti",
    profileSubtitle: "Así te reconoceremos en el equipo",
    fullName: "Tu nombre",
    fullNamePlaceholder: "Nombre completo",
    roleLegend: "Tu rol inicial",
    roleOwner: "Soy el dueño",
    roleOwnerHint: "Tendrás el control total de este gimnasio",
    roleManager: "Soy encargado",
    roleManagerHint:
      "Actuarás como dueño provisional hasta que invites al dueño",
    orgLabel: "Organización",
    gymLabel: "Gimnasio",
    gymTitle: "Tu primer gimnasio",
    gymSubtitle: "Puedes agregar más después desde el panel",
    gymName: "Nombre del gimnasio",
    gymNamePlaceholder: "Mi gimnasio",
    branchName: "Sucursal principal (opcional)",
    branchNamePlaceholder: "Principal",
    plansTitle: "Planes de membresía",
    plansSubtitle:
      "Opcional. En Freemium puedes crear hasta 2 planes; también puedes saltar este paso",
    addPlan: "Agregar plan",
    skipPlans: "Saltar por ahora",
    planLimit: "Freemium permite hasta 2 planes en este paso",
    doneTitle: "Todo listo",
    doneSubtitle: "Tu espacio ya está creado. Entra al panel para empezar.",
    goDashboard: "Ir al panel",
    continue: "Continuar",
    saving: "Guardando…",
    errorAuth: "Debes iniciar sesión",
    errorSave: "No se pudo guardar. Intenta de nuevo.",
  },
  completeSetup: {
    title: "Terminar registro",
    description: "Completa la configuración de tu organización",
    submit: "Continuar",
    error: "No se pudo continuar",
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
    qrInUse: "Esta credencial ya está en uso en otro gimnasio",
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
  validation: {
    required: "Este campo es obligatorio",
    email: "Introduce un correo válido en minúsculas",
    password: "La contraseña contiene caracteres no permitidos",
    passwordMin: "La contraseña debe tener al menos 8 caracteres",
    passwordMismatch: "Las contraseñas no coinciden",
    personName: "Usa solo letras, espacios y puntuación simple",
    entityName: "Nombre no válido (evita < > y caracteres de control)",
    phone: "Introduce un teléfono válido",
    otp: "Código inválido (6–12 caracteres alfanuméricos)",
    message: "El mensaje es demasiado corto o contiene caracteres no válidos",
    amount: "Introduce un monto válido",
    duration: "Introduce una duración en días válida",
    date: "Introduce una fecha válida",
    invalid: "Valor no válido",
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
    provisionalOwner: "Provisional owner",
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
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Sign in",
    submitting: "Signing in…",
    registerLink: "Register",
    registerPrompt: "Don't have an account?",
    error: "Invalid credentials",
    pendingConfirmBanner:
      "Your organization is ready. Confirm your email, then sign in to finish setup.",
  },
  register: {
    title: "Create account",
    subtitle: "Start with your organization on AMRAP",
    organizationName: "Organization name",
    organizationNamePlaceholder: "My company or gym group",
    email: "Email",
    emailPlaceholder: "you@email.com",
    password: "Password",
    confirmPassword: "Confirm password",
    passwordMismatch: "Passwords do not match.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    submit: "Create account",
    submitting: "Creating…",
    loginLink: "Log in",
    loginPrompt: "Already have an account?",
    error: "Registration could not be completed",
    confirmEmail:
      "Check your email to confirm your account. Then log in and finish setup.",
    rpcFailed: "Could not create the organization",
    emailInUse:
      "That email is already registered. Log in or use the confirmation link if you have not finished setup.",
    emailRateLimited:
      "Too many emails sent. Wait a minute and try again, or check your inbox if you already received a code.",
  },
  confirmEmail: {
    title: "Confirm your email",
    subtitle: "Enter the code we sent to activate your account",
    sentTitle: "Check your inbox",
    sentBody: "We sent a confirmation code to",
    otpLabel: "Verification code",
    otpPlaceholder: "123456",
    verify: "Confirm account",
    verifying: "Confirming…",
    resend: "Resend code",
    resending: "Resending…",
    resendOk: "Code resent. Check your email.",
    resendFailed: "Could not resend the code. Try again.",
    resendRateLimited:
      "Wait a few seconds before requesting another code, then try again.",
    invalidOtp: "Invalid or expired code. Try again.",
    backToLoginPrompt: "Already have an account?",
    backToLoginLink: "Log in",
  },
  onboarding: {
    title: "Set up your space",
    subtitle: "A few quick steps to get your gym ready",
    stepsLabel: "Progress",
    stepYou: "You",
    stepGym: "Gym",
    stepPlans: "Plans",
    stepDone: "Done",
    profileTitle: "About you",
    profileSubtitle: "How your team will recognize you",
    fullName: "Your name",
    fullNamePlaceholder: "Full name",
    roleLegend: "Your starting role",
    roleOwner: "I am the owner",
    roleOwnerHint: "You will have full control of this gym",
    roleManager: "I am a manager",
    roleManagerHint:
      "You will act as provisional owner until you invite the owner",
    orgLabel: "Organization",
    gymLabel: "Gym",
    gymTitle: "Your first gym",
    gymSubtitle: "You can add more later from the dashboard",
    gymName: "Gym name",
    gymNamePlaceholder: "My gym",
    branchName: "Main branch (optional)",
    branchNamePlaceholder: "Main",
    plansTitle: "Membership plans",
    plansSubtitle:
      "Optional. Freemium allows up to 2 plans here — you can skip this step",
    addPlan: "Add plan",
    skipPlans: "Skip for now",
    planLimit: "Freemium allows up to 2 plans in this step",
    doneTitle: "You're all set",
    doneSubtitle: "Your space is ready. Head to the dashboard to get started.",
    goDashboard: "Go to dashboard",
    continue: "Continue",
    saving: "Saving…",
    errorAuth: "You need to log in",
    errorSave: "Could not save. Please try again.",
  },
  completeSetup: {
    title: "Finish registration",
    description: "Complete your organization setup",
    submit: "Continue",
    error: "Could not continue",
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
    qrInUse: "This credential is already in use at another gym",
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
  validation: {
    required: "This field is required",
    email: "Enter a valid lowercase email",
    password: "Password contains characters that are not allowed",
    passwordMin: "Password must be at least 8 characters",
    passwordMismatch: "Passwords do not match",
    personName: "Use letters, spaces, and simple punctuation only",
    entityName: "Invalid name (avoid < > and control characters)",
    phone: "Enter a valid phone number",
    otp: "Invalid code (6–12 alphanumeric characters)",
    message: "Message is too short or contains invalid characters",
    amount: "Enter a valid amount",
    duration: "Enter a valid duration in days",
    date: "Enter a valid date",
    invalid: "Invalid value",
  },
};

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.es;
}
