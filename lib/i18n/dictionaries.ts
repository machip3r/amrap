import type { Locale } from "./config";

export type Dictionary = {
  meta: { title: string; description: string };
  nav: {
    dashboard: string;
    members: string;
    trainers: string;
    staff: string;
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
    poweredBy: string;
  };
  a11y: {
    toggleTheme: string;
    moreActions: string;
    collapseNav: string;
    expandNav: string;
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
    activeMembers: string;
    activeMembersHint: string;
    checkInsToday: string;
    checkInsTodayHint: string;
    expiringSoon: string;
    expiringSoonHint: string;
    weeklyAttendance: string;
    last7Days: string;
    alerts: string;
    alertExpired: string;
    alertExpiring: string;
    alertActionRequired: string;
    viewAllAlerts: string;
    noAlerts: string;
    accessLog: string;
    realtime: string;
    viewFullHistory: string;
    viewAll: string;
    colMember: string;
    colTime: string;
    colPlan: string;
    colStatus: string;
    colAction: string;
    renew: string;
    noCheckIns: string;
    noPlan: string;
    quickActions: string;
    quickCheckIn: string;
    quickNewMember: string;
    quickNewTrainer: string;
    quickNewStaff: string;
  };
  team: {
    title: string;
    comingSoon: string;
    comingSoonHint: string;
  };
  trainers: {
    title: string;
    subtitle: string;
    comingSoon: string;
    comingSoonHint: string;
  };
  staffPage: {
    title: string;
    subtitle: string;
    comingSoon: string;
    comingSoonHint: string;
  };
  members: {
    title: string;
    subtitle: string;
    newMember: string;
    name: string;
    email: string;
    phone: string;
    plan: string;
    noPlan: string;
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
    noResults: string;
    error: string;
    notFound: string;
    searchPlaceholder: string;
    filterAll: string;
    filterActive: string;
    filterExpired: string;
    filterPlan: string;
    filterPlanAll: string;
    showing: string;
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
    subtitle: string;
    scanTitle: string;
    scanHint: string;
    manualTitle: string;
    manualLabel: string;
    manualPlaceholder: string;
    lookup: string;
    clear: string;
    scanning: string;
    stopCamera: string;
    startCamera: string;
    resultOk: string;
    resultDenied: string;
    memberNotFound: string;
    qrInUse: string;
    cameraError: string;
    accessGranted: string;
    accessDenied: string;
    waitingResult: string;
    waitingResultHint: string;
    expiresIn: string;
    days: string;
    weekAttendance: string;
    noPlan: string;
    nextScan: string;
  };
  plans: {
    title: string;
    subtitle: string;
    newPlan: string;
    editPlan: string;
    planName: string;
    price: string;
    durationDays: string;
    save: string;
    saving: string;
    cancel: string;
    close: string;
    edit: string;
    archive: string;
    restore: string;
    delete: string;
    active: string;
    archived: string;
    noPlans: string;
    membersEnrolled: string;
    perDays: string;
    perMonth: string;
    perMonths: string;
    createTitle: string;
    createDescription: string;
    editTitle: string;
    editDescription: string;
    limitReached: string;
    limitReachedHint: string;
    upgradePlans: string;
    quotaLabel: string;
    freemium: string;
    planLimit: string;
    error: string;
  };
  organization: {
    title: string;
    subtitle: string;
    currentPlan: string;
    subscriptionTitle: string;
    subscriptionHint: string;
    gymsTitle: string;
    gymsHint: string;
    addGym: string;
    addGymTitle: string;
    addGymDescription: string;
    gymName: string;
    currentGym: string;
    scheduledDeletion: string;
    cancelDeletion: string;
    deleteGym: string;
    deleteGymTitle: string;
    deleteGymHint: string;
    deleteOrg: string;
    deleteOrgTitle: string;
    deleteOrgHint: string;
    dangerTitle: string;
    dangerHint: string;
    confirmName: string;
    confirmNamePlaceholder: string;
    confirmDelete: string;
    confirmNameMismatch: string;
    cancel: string;
    close: string;
    save: string;
    upgrade: string;
    current: string;
    checkoutComingSoon: string;
    createGymComingSoon: string;
    upgradeForMoreGyms: string;
    retentionNote: string;
    planFreemium: string;
    planStarter: string;
    planGrowth: string;
    planPro: string;
    priceFree: string;
    pricePerOrg: string;
    pricePerGym: string;
    perMonth: string;
    gymQuota: string;
    invalidPlan: string;
    deleteFailed: string;
    gymDeletionScheduled: string;
    deletionCancelled: string;
  };
  common: {
    loading: string;
    forbidden: string;
    back: string;
    locale: string;
    saveFailed: string;
    invalidInput: string;
  };
  registerUser: {
    open: string;
    title: string;
    description: string;
    roleLabel: string;
    roleMember: string;
    roleTrainer: string;
    roleStaff: string;
    namePlaceholder: string;
    phonePlaceholder: string;
    countryCode: string;
    email: string;
    emailPlaceholder: string;
    close: string;
    cancel: string;
    submit: string;
    submitting: string;
    staffComingSoon: string;
    staffComingSoonHint: string;
    success: string;
    noPlans: string;
    planPrice: string;
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
    hexColor: string;
  };
  settings: {
    title: string;
    subtitle: string;
    personalization: string;
    personalizationHint: string;
    logo: string;
    logoHint: string;
    logoLight: string;
    logoDark: string;
    uploadLogo: string;
    removeLogo: string;
    palettes: string;
    palettesHint: string;
    paletteAmrap: string;
    paletteOcean: string;
    paletteCharcoal: string;
    applyPalette: string;
    lightMode: string;
    darkMode: string;
    colorPrimary: string;
    colorBg: string;
    colorSurface: string;
    saveColors: string;
    saving: string;
    resetDefaults: string;
    saved: string;
    error: string;
    logoError: string;
    preview: string;
  };
};

const es: Dictionary = {
  meta: {
    title: "Control de membresías",
    description: "Administración de membresías para gimnasios",
  },
  nav: {
    dashboard: "Vista general",
    members: "Miembros",
    trainers: "Entrenadores",
    staff: "Personal",
    payments: "Pagos",
    checkin: "Entrada",
    plans: "Planes",
    logout: "Salir",
    settings: "Configuración",
    brandTitle: "Admin Central",
    brandSubtitle: "Recepción",
  },
  shell: {
    searchPlaceholder: "Buscar miembros, pagos…",
    searchLabel: "Buscar",
    gymAdmin: "GYM ADMIN",
    provisionalOwner: "Dueño provisional",
    notifications: "Notificaciones",
    help: "Ayuda",
    poweredBy: "Powered by",
  },
  a11y: {
    toggleTheme: "Cambiar tema",
    moreActions: "Más acciones",
    collapseNav: "Ocultar menú",
    expandNav: "Mostrar menú",
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
    activeMembers: "Miembros activos",
    activeMembersHint: "Membresías vigentes",
    checkInsToday: "Check-ins hoy",
    checkInsTodayHint: "Accesos registrados hoy",
    expiringSoon: "Por vencer",
    expiringSoonHint: "Próximos 7 días",
    weeklyAttendance: "Asistencia semanal",
    last7Days: "Últimos 7 días",
    alerts: "Alertas críticas",
    alertExpired: "Membresía vencida",
    alertExpiring: "Vence pronto",
    alertActionRequired: "Acción requerida",
    viewAllAlerts: "Ver todas las alertas",
    noAlerts: "Sin alertas por ahora",
    accessLog: "Últimos check-ins",
    realtime: "En tiempo real",
    viewFullHistory: "Ver historial completo",
    viewAll: "Ver todos",
    colMember: "Socio",
    colTime: "Hora",
    colPlan: "Plan",
    colStatus: "Estado",
    colAction: "Acción",
    renew: "Renovar",
    noCheckIns: "Aún no hay check-ins",
    noPlan: "Sin plan",
    quickActions: "Acciones rápidas",
    quickCheckIn: "Registrar entrada",
    quickNewMember: "Nuevo miembro",
    quickNewTrainer: "Nuevo entrenador",
    quickNewStaff: "Nuevo personal",
  },
  team: {
    title: "Equipo",
    comingSoon: "Las invitaciones al equipo llegarán pronto.",
    comingSoonHint:
      "Podrás invitar entrenadores y staff por correo desde aquí.",
  },
  trainers: {
    title: "Entrenadores",
    subtitle: "Gestiona coaches e invitaciones a tu equipo de entrenamiento.",
    comingSoon: "Las invitaciones a entrenadores llegarán pronto.",
    comingSoonHint:
      "Podrás invitar entrenadores por correo y asignar accesos desde aquí.",
  },
  staffPage: {
    title: "Personal",
    subtitle: "Gestiona recepción, admin y permisos del staff del gimnasio.",
    comingSoon: "Las invitaciones al personal llegarán pronto.",
    comingSoonHint:
      "Podrás invitar staff por correo y definir roles desde aquí.",
  },
  members: {
    title: "Gestión de miembros",
    subtitle: "Administra membresías, accesos y el estado de tu comunidad.",
    newMember: "Añadir miembro",
    name: "Nombre",
    email: "Correo",
    phone: "Teléfono",
    plan: "Plan",
    noPlan: "Sin plan",
    status: "Estado",
    expires: "Vencimiento",
    active: "Activo",
    expired: "Vencido",
    actions: "Acciones",
    view: "Ver",
    createTitle: "Nuevo miembro",
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
    noMembers: "No hay miembros aún.",
    noResults: "Ningún miembro coincide con tu búsqueda.",
    error: "No se pudo guardar el miembro",
    notFound: "Miembro o plan no encontrado",
    searchPlaceholder: "Buscar por nombre, email o teléfono…",
    filterAll: "Todos",
    filterActive: "Activos",
    filterExpired: "Vencidos",
    filterPlan: "Plan",
    filterPlanAll: "Todos los planes",
    showing: "Mostrando {from}–{to} de {total}",
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
    subtitle: "Registra accesos con QR o búsqueda manual.",
    scanTitle: "Escanea tu QR",
    scanHint:
      "Acerca tu código QR a la cámara para registrar el acceso automáticamente.",
    manualTitle: "Búsqueda manual",
    manualLabel: "Código o ID",
    manualPlaceholder: "Código QR, token o ID de membresía…",
    lookup: "Buscar",
    clear: "Limpiar",
    scanning: "Escaneando…",
    stopCamera: "Detener cámara",
    startCamera: "Activar cámara",
    resultOk: "Órale, todo en orden",
    resultDenied: "No ha pagado. No puede pasar",
    memberNotFound: "Socio no encontrado",
    qrInUse: "Esta credencial ya está en uso en otro gimnasio",
    cameraError: "No se pudo usar la cámara",
    accessGranted: "Acceso permitido",
    accessDenied: "Acceso denegado",
    waitingResult: "Listo para escanear",
    waitingResultHint: "El resultado del socio aparecerá aquí.",
    expiresIn: "Vencimiento en",
    days: "días",
    weekAttendance: "Asistencias semanales",
    noPlan: "Sin plan",
    nextScan: "Siguiente entrada",
  },
  plans: {
    title: "Planes",
    subtitle: "Configura las membresías y tarifas de tu gimnasio",
    newPlan: "Añadir plan",
    editPlan: "Editar plan",
    planName: "Nombre",
    price: "Precio",
    durationDays: "Duración (días)",
    save: "Guardar",
    saving: "Guardando…",
    cancel: "Cancelar",
    close: "Cerrar",
    edit: "Editar",
    archive: "Archivar",
    restore: "Restaurar",
    delete: "Eliminar",
    active: "Activo",
    archived: "Archivado",
    noPlans: "No hay planes. Crea uno para renovar membresías.",
    membersEnrolled: "{count} socios inscritos",
    perDays: "/ {n} días",
    perMonth: "/ mes",
    perMonths: "/ {n} meses",
    createTitle: "Nuevo plan",
    createDescription: "Define el nombre, precio y duración de la membresía.",
    editTitle: "Editar plan",
    editDescription: "Actualiza los datos del plan. Los socios actuales no cambian.",
    limitReached: "Límite alcanzado",
    limitReachedHint:
      "Freemium permite hasta 2 planes activos. Archiva uno o mejora tu plan para crear más.",
    upgradePlans: "Ver planes AMRAP",
    quotaLabel: "{used} / {max} planes activos",
    freemium: "Freemium",
    planLimit: "Freemium permite hasta 2 planes activos",
    error: "No se pudo guardar el plan",
  },
  organization: {
    title: "Organización",
    subtitle: "Suscripción AMRAP, gimnasios y eliminación de cuenta",
    currentPlan: "Plan actual",
    subscriptionTitle: "Suscripción AMRAP",
    subscriptionHint:
      "La organización paga a AMRAP. Los socios pagan a tu gimnasio.",
    gymsTitle: "Gimnasios",
    gymsHint: "Gestiona las sedes de esta organización.",
    addGym: "Añadir gimnasio",
    addGymTitle: "Nuevo gimnasio",
    addGymDescription: "Crea otra sede bajo la misma organización y factura.",
    gymName: "Nombre del gimnasio",
    currentGym: "Actual",
    scheduledDeletion: "Eliminación el {date}",
    cancelDeletion: "Cancelar eliminación",
    deleteGym: "Eliminar",
    deleteGymTitle: "Eliminar gimnasio",
    deleteGymHint:
      "Se programará el borrado. Escribe el nombre exacto del gimnasio para confirmar.",
    deleteOrg: "Eliminar organización",
    deleteOrgTitle: "Eliminar organización",
    deleteOrgHint:
      "Borra la cuenta de facturación y todos sus gimnasios. Escribe el nombre de la organización para confirmar.",
    dangerTitle: "Zona de peligro",
    dangerHint: "Estas acciones son irreversibles tras el periodo de retención.",
    confirmName: "Escribe el nombre para confirmar",
    confirmNamePlaceholder: "Escribe “{name}”",
    confirmDelete: "Confirmar eliminación",
    confirmNameMismatch: "El nombre no coincide",
    cancel: "Cancelar",
    close: "Cerrar",
    save: "Continuar",
    upgrade: "Mejorar plan",
    current: "Actual",
    checkoutComingSoon:
      "El pago de suscripción AMRAP llegará pronto. Mientras tanto, contacta soporte para cambiar de plan.",
    createGymComingSoon:
      "La creación de gimnasios adicionales llegará con la facturación multi-gym.",
    upgradeForMoreGyms: "Mejorar para más gyms",
    retentionNote:
      "Tras confirmar, hay {days} días de retención antes del borrado definitivo (export CSV disponible).",
    planFreemium: "Freemium",
    planStarter: "Starter",
    planGrowth: "Growth",
    planPro: "Pro",
    priceFree: "$0",
    pricePerOrg: "por organización",
    pricePerGym: "por gym activo",
    perMonth: "/ mes",
    gymQuota: "{used} / {max} gimnasios",
    invalidPlan: "Plan no válido",
    deleteFailed: "No se pudo programar la eliminación",
    gymDeletionScheduled: "Eliminación del gimnasio programada",
    deletionCancelled: "Eliminación cancelada",
  },
  settings: {
    title: "Configuración",
    subtitle: "Ajusta la apariencia de tu panel",
    personalization: "Personalización",
    personalizationHint:
      "Colores y logos de este gimnasio en el panel (claro y oscuro).",
    logo: "Logos",
    logoHint: "PNG, JPG o WebP. Máx. 2 MB. Usa un logo por modo.",
    logoLight: "Logo (modo claro)",
    logoDark: "Logo (modo oscuro)",
    uploadLogo: "Subir logo",
    removeLogo: "Quitar logo",
    palettes: "Paletas",
    palettesHint: "Plantillas con versión clara y oscura. Un clic las aplica.",
    paletteAmrap: "Coral AMRAP",
    paletteOcean: "Azul océano",
    paletteCharcoal: "Carbón",
    applyPalette: "Aplicar",
    lightMode: "Tema claro",
    darkMode: "Tema oscuro",
    colorPrimary: "Primario",
    colorBg: "Fondo",
    colorSurface: "Superficie",
    saveColors: "Guardar colores",
    saving: "Guardando…",
    resetDefaults: "Restablecer colores",
    saved: "Cambios guardados",
    error: "No se pudo guardar la personalización",
    logoError: "No se pudo actualizar el logo",
    preview: "Vista previa",
  },
  common: {
    loading: "Cargando…",
    forbidden: "No tienes permiso",
    back: "Volver",
    locale: "Idioma",
    saveFailed: "No se pudo guardar",
    invalidInput: "Revisa los datos e inténtalo de nuevo",
  },
  registerUser: {
    open: "Registrar",
    title: "Registrar usuario",
    description: "Elige el tipo de usuario e introduce los datos.",
    roleLabel: "Tipo de usuario",
    roleMember: "Miembro",
    roleTrainer: "Entrenador",
    roleStaff: "Personal",
    namePlaceholder: "Nombre completo",
    phonePlaceholder: "Número local",
    countryCode: "Código de país",
    email: "Correo",
    emailPlaceholder: "nombre@ejemplo.com",
    close: "Cerrar",
    cancel: "Cancelar",
    submit: "Registrar",
    submitting: "Registrando…",
    staffComingSoon: "Las invitaciones al equipo llegarán pronto.",
    staffComingSoonHint:
      "Podrás invitar entrenadores y personal por correo aquí.",
    success: "Usuario registrado",
    noPlans: "Crea un plan antes de registrar miembros.",
    planPrice: "{days} días · ${price}",
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
    otp: "Código inválido (6 dígitos)",
    message: "El mensaje es demasiado corto o contiene caracteres no válidos",
    amount: "Introduce un monto válido",
    duration: "Introduce una duración en días válida",
    date: "Introduce una fecha válida",
    invalid: "Valor no válido",
    hexColor: "Usa un color hexadecimal (#RRGGBB)",
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
    trainers: "Trainers",
    staff: "Staff",
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
    poweredBy: "Powered by",
  },
  a11y: {
    toggleTheme: "Toggle theme",
    moreActions: "More actions",
    collapseNav: "Collapse menu",
    expandNav: "Expand menu",
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
    activeMembers: "Active members",
    activeMembersHint: "Current memberships",
    checkInsToday: "Check-ins today",
    checkInsTodayHint: "Access recorded today",
    expiringSoon: "Expiring soon",
    expiringSoonHint: "Next 7 days",
    weeklyAttendance: "Weekly attendance",
    last7Days: "Last 7 days",
    alerts: "Critical alerts",
    alertExpired: "Membership expired",
    alertExpiring: "Expiring soon",
    alertActionRequired: "Action required",
    viewAllAlerts: "View all alerts",
    noAlerts: "No alerts right now",
    accessLog: "Recent check-ins",
    realtime: "Live",
    viewFullHistory: "View full history",
    viewAll: "View all",
    colMember: "Member",
    colTime: "Time",
    colPlan: "Plan",
    colStatus: "Status",
    colAction: "Action",
    renew: "Renew",
    noCheckIns: "No check-ins yet",
    noPlan: "No plan",
    quickActions: "Quick actions",
    quickCheckIn: "Check in",
    quickNewMember: "New member",
    quickNewTrainer: "New trainer",
    quickNewStaff: "New staff",
  },
  team: {
    title: "Team",
    comingSoon: "Team invites are coming soon.",
    comingSoonHint: "You’ll be able to invite trainers and staff by email here.",
  },
  trainers: {
    title: "Trainers",
    subtitle: "Manage coaches and invites for your training team.",
    comingSoon: "Trainer invites are coming soon.",
    comingSoonHint:
      "You’ll be able to invite trainers by email and set access here.",
  },
  staffPage: {
    title: "Staff",
    subtitle: "Manage front desk, admin, and gym staff permissions.",
    comingSoon: "Staff invites are coming soon.",
    comingSoonHint:
      "You’ll be able to invite staff by email and assign roles here.",
  },
  members: {
    title: "Member management",
    subtitle: "Manage memberships, access, and your community status.",
    newMember: "Add member",
    name: "Name",
    email: "Email",
    phone: "Phone",
    plan: "Plan",
    noPlan: "No plan",
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
    noResults: "No members match your search.",
    error: "Could not save member",
    notFound: "Member or plan not found",
    searchPlaceholder: "Search by name, email, or phone…",
    filterAll: "All",
    filterActive: "Active",
    filterExpired: "Expired",
    filterPlan: "Plan",
    filterPlanAll: "All plans",
    showing: "Showing {from}–{to} of {total}",
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
    subtitle: "Record access with QR or manual lookup.",
    scanTitle: "Scan your QR",
    scanHint: "Hold your QR code to the camera to check in automatically.",
    manualTitle: "Manual lookup",
    manualLabel: "Code or ID",
    manualPlaceholder: "QR code, token, or membership ID…",
    lookup: "Search",
    clear: "Clear",
    scanning: "Scanning…",
    stopCamera: "Stop camera",
    startCamera: "Start camera",
    resultOk: "You're good to go",
    resultDenied: "Membership expired. Entry denied",
    memberNotFound: "Member not found",
    qrInUse: "This credential is already in use at another gym",
    cameraError: "Camera could not be started",
    accessGranted: "Access granted",
    accessDenied: "Access denied",
    waitingResult: "Ready to scan",
    waitingResultHint: "Member results will show up here.",
    expiresIn: "Expires in",
    days: "days",
    weekAttendance: "Weekly check-ins",
    noPlan: "No plan",
    nextScan: "Next check-in",
  },
  plans: {
    title: "Plans",
    subtitle: "Configure your gym’s memberships and pricing",
    newPlan: "Add plan",
    editPlan: "Edit plan",
    planName: "Name",
    price: "Price",
    durationDays: "Duration (days)",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    close: "Close",
    edit: "Edit",
    archive: "Archive",
    restore: "Restore",
    delete: "Delete",
    active: "Active",
    archived: "Archived",
    noPlans: "No plans yet. Create one to renew memberships.",
    membersEnrolled: "{count} members enrolled",
    perDays: "/ {n} days",
    perMonth: "/ month",
    perMonths: "/ {n} months",
    createTitle: "New plan",
    createDescription: "Set the membership name, price, and duration.",
    editTitle: "Edit plan",
    editDescription: "Update plan details. Existing members are unchanged.",
    limitReached: "Limit reached",
    limitReachedHint:
      "Freemium allows up to 2 active plans. Archive one or upgrade to create more.",
    upgradePlans: "View AMRAP plans",
    quotaLabel: "{used} / {max} active plans",
    freemium: "Freemium",
    planLimit: "Freemium allows up to 2 active plans",
    error: "Could not save plan",
  },
  organization: {
    title: "Organization",
    subtitle: "AMRAP subscription, gyms, and account deletion",
    currentPlan: "Current plan",
    subscriptionTitle: "AMRAP subscription",
    subscriptionHint:
      "The organization pays AMRAP. Members pay your gym.",
    gymsTitle: "Gyms",
    gymsHint: "Manage locations under this organization.",
    addGym: "Add gym",
    addGymTitle: "New gym",
    addGymDescription: "Create another location under the same organization and invoice.",
    gymName: "Gym name",
    currentGym: "Current",
    scheduledDeletion: "Deletion on {date}",
    cancelDeletion: "Cancel deletion",
    deleteGym: "Delete",
    deleteGymTitle: "Delete gym",
    deleteGymHint:
      "Deletion will be scheduled. Type the exact gym name to confirm.",
    deleteOrg: "Delete organization",
    deleteOrgTitle: "Delete organization",
    deleteOrgHint:
      "Removes the billing account and all its gyms. Type the organization name to confirm.",
    dangerTitle: "Danger zone",
    dangerHint: "These actions are irreversible after the retention window.",
    confirmName: "Type the name to confirm",
    confirmNamePlaceholder: "Type “{name}”",
    confirmDelete: "Confirm deletion",
    confirmNameMismatch: "The name does not match",
    cancel: "Cancel",
    close: "Close",
    save: "Continue",
    upgrade: "Upgrade",
    current: "Current",
    checkoutComingSoon:
      "AMRAP subscription checkout is coming soon. Contact support to change plans for now.",
    createGymComingSoon:
      "Creating additional gyms ships with multi-gym billing.",
    upgradeForMoreGyms: "Upgrade for more gyms",
    retentionNote:
      "After confirmation, there is a {days}-day retention window before permanent deletion (CSV export available).",
    planFreemium: "Freemium",
    planStarter: "Starter",
    planGrowth: "Growth",
    planPro: "Pro",
    priceFree: "$0",
    pricePerOrg: "per organization",
    pricePerGym: "per active gym",
    perMonth: "/ month",
    gymQuota: "{used} / {max} gyms",
    invalidPlan: "Invalid plan",
    deleteFailed: "Could not schedule deletion",
    gymDeletionScheduled: "Gym deletion scheduled",
    deletionCancelled: "Deletion cancelled",
  },
  settings: {
    title: "Settings",
    subtitle: "Customize how your dashboard looks",
    personalization: "Personalization",
    personalizationHint:
      "Logos and colors for this gym in the admin dashboard (light and dark).",
    logo: "Logos",
    logoHint: "PNG, JPG, or WebP. Max 2 MB. One logo per mode.",
    logoLight: "Logo (light mode)",
    logoDark: "Logo (dark mode)",
    uploadLogo: "Upload logo",
    removeLogo: "Remove logo",
    palettes: "Palettes",
    palettesHint: "Templates with light and dark versions. One click applies both.",
    paletteAmrap: "AMRAP coral",
    paletteOcean: "Ocean blue",
    paletteCharcoal: "Charcoal",
    applyPalette: "Apply",
    lightMode: "Light theme",
    darkMode: "Dark theme",
    colorPrimary: "Primary",
    colorBg: "Background",
    colorSurface: "Surface",
    saveColors: "Save colors",
    saving: "Saving…",
    resetDefaults: "Reset colors",
    saved: "Changes saved",
    error: "Could not save personalization",
    logoError: "Could not update logo",
    preview: "Preview",
  },
  common: {
    loading: "Loading…",
    forbidden: "You do not have permission",
    back: "Back",
    locale: "Language",
    saveFailed: "Could not save",
    invalidInput: "Check the form and try again",
  },
  registerUser: {
    open: "Register",
    title: "Register user",
    description: "Choose a role and enter their details.",
    roleLabel: "User type",
    roleMember: "Member",
    roleTrainer: "Trainer",
    roleStaff: "Staff",
    namePlaceholder: "Full name",
    phonePlaceholder: "Local number",
    countryCode: "Country code",
    email: "Email",
    emailPlaceholder: "name@example.com",
    close: "Close",
    cancel: "Cancel",
    submit: "Register",
    submitting: "Registering…",
    staffComingSoon: "Team invites are coming soon.",
    staffComingSoonHint:
      "You’ll be able to invite trainers and staff by email here.",
    success: "User registered",
    noPlans: "Create a plan before registering members.",
    planPrice: "{days} days · ${price}",
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
    otp: "Invalid code (6 digits)",
    message: "Message is too short or contains invalid characters",
    amount: "Enter a valid amount",
    duration: "Enter a valid duration in days",
    date: "Enter a valid date",
    invalid: "Invalid value",
    hexColor: "Use a hex color (#RRGGBB)",
  },
};

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.es;
}
