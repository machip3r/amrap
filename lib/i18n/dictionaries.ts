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
    classes: string;
    logout: string;
    settings: string;
    more: string;
    myQr: string;
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
    myQrHint: string;
  };
  a11y: {
    toggleTheme: string;
    moreActions: string;
    collapseNav: string;
    expandNav: string;
    openMoreNav: string;
    closeMoreNav: string;
    showMyQr: string;
    closeMyQr: string;
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
    gymNameHint: string;
    gymAddress: string;
    gymAddressPlaceholder: string;
    gymAddressHint: string;
    branchName: string;
    branchNamePlaceholder: string;
    branchNameHint: string;
    branchAddress: string;
    branchAddressPlaceholder: string;
    branchAddressHint: string;
    plansTitle: string;
    plansSubtitle: string;
    plansExample: string;
    planNameHint: string;
    planNamePlaceholder: string;
    planPriceHint: string;
    planDurationHint: string;
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
    newTrainer: string;
    noTrainers: string;
    noResults: string;
    searchPlaceholder: string;
    joined: string;
    actions: string;
    remove: string;
    confirmRemove: string;
    reload: string;
    newBadge: string;
    error: string;
    showing: string;
    view: string;
    phone: string;
    role: string;
    notFound: string;
  };
  staffPage: {
    title: string;
    subtitle: string;
    newStaff: string;
    noStaff: string;
    noResults: string;
    searchPlaceholder: string;
    joined: string;
    actions: string;
    remove: string;
    confirmRemove: string;
    reload: string;
    newBadge: string;
    error: string;
    showing: string;
    view: string;
    phone: string;
    role: string;
    notFound: string;
  };
  teamInvites: {
    error: string;
    seatLimit: string;
    alreadyOnTeam: string;
    alreadyOwner: string;
    emailFailed: string;
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
    profile: string;
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
    reload: string;
    newBadge: string;
  };
  payments: {
    title: string;
    subtitle: string;
    newPayment: string;
    member: string;
    amount: string;
    method: string;
    date: string;
    selectMember: string;
    searchMember: string;
    noMemberMatches: string;
    submit: string;
    submitting: string;
    cancel: string;
    close: string;
    noPayments: string;
    noResults: string;
    noMembers: string;
    searchPlaceholder: string;
    reload: string;
    showing: string;
    newBadge: string;
    description: string;
    cash: string;
    transfer: string;
    error: string;
    kindLabel: string;
    kindPlan: string;
    kindDayPass: string;
    selectPlan: string;
    searchPlan: string;
    noPlanMatches: string;
    noActivePlans: string;
    dayPassNotConfigured: string;
    amountHint: string;
    statMonth: string;
    statMonthHint: string;
    statToday: string;
    statTodayHint: string;
    statPlans: string;
    statPlansHint: string;
    statDayPass: string;
    statDayPassHint: string;
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
    selectMember: string;
    confirmCheckIn: string;
    matchesHint: string;
    lookingUp: string;
    active: string;
    expired: string;
    qrInUse: string;
    cameraError: string;
    accessGranted: string;
    accessDenied: string;
    qrSuccessTitle: string;
    qrSuccessHint: string;
    waitingResult: string;
    waitingResultHint: string;
    expiresIn: string;
    days: string;
    weekAttendance: string;
    noPlan: string;
    nextScan: string;
    classReserved: string;
    walkInTitle: string;
    walkInEnroll: string;
    walkInFull: string;
    noOpenClasses: string;
    todayTitle: string;
    todayEmpty: string;
    historyEmpty: string;
    viewAllCheckIns: string;
    historyTitle: string;
    historySubtitle: string;
    filterDate: string;
    filterApply: string;
    filterClear: string;
    colMember: string;
    colTime: string;
    colPlan: string;
    colSource: string;
    sourceQr: string;
    sourceManual: string;
    sourceKiosk: string;
    calendarTitle: string;
    calendarSubtitle: string;
    calendarPrev: string;
    calendarNext: string;
    calendarToday: string;
    checkInsOnDay: string;
    noCheckInsOnDay: string;
    noCheckInsMonth: string;
    backToHistory: string;
    backToCheckIn: string;
    visitsThisMonth: string;
    visitsLabel: string;
    daysPresent: string;
    daysPresentHint: string;
    bySource: string;
    selectedDayTitle: string;
    visitCount: string;
    viewMemberProfile: string;
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
    archiving: string;
    restoring: string;
    cancel: string;
    close: string;
    edit: string;
    archive: string;
    archiveConfirm: string;
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
    dayPassTitle: string;
    dayPassSubtitle: string;
    dayPassPrice: string;
    dayPassHint: string;
    dayPassSave: string;
    dayPassNotSet: string;
  };
  classes: {
    title: string;
    subtitle: string;
    newClass: string;
    className: string;
    description: string;
    descriptionHint: string;
    capacity: string;
    capacityHint: string;
    duration: string;
    durationHint: string;
    tags: string;
    tagsHint: string;
    trainers: string;
    trainersHint: string;
    noTrainers: string;
    save: string;
    saving: string;
    archiving: string;
    restoring: string;
    cancel: string;
    close: string;
    edit: string;
    archive: string;
    archiveConfirm: string;
    restore: string;
    active: string;
    archived: string;
    noClasses: string;
    createTitle: string;
    createDescription: string;
    editTitle: string;
    editDescription: string;
    unlimited: string;
    trainerCount: string;
    error: string;
    bookError: string;
    duplicateError: string;
    scheduleCreatePartial: string;
    advancedSettings: string;
    advancedHint: string;
    addScheduleNow: string;
    tabCatalog: string;
    tabCalendar: string;
    schedule: string;
    scheduleTitle: string;
    scheduleHint: string;
    recurrence: string;
    recurrenceNone: string;
    recurrenceWeekly: string;
    days: string;
    time: string;
    validFrom: string;
    validUntil: string;
    timezone: string;
    thisWeek: string;
    prevWeek: string;
    nextWeek: string;
    seats: string;
    waitlist: string;
    cancelled: string;
    noSessions: string;
    duplicate: string;
    duplicateTitle: string;
    duplicateHint: string;
    targetGym: string;
    noOtherGyms: string;
    dayMon: string;
    dayTue: string;
    dayWed: string;
    dayThu: string;
    dayFri: string;
    daySat: string;
    daySun: string;
    roster: string;
    rosterEmpty: string;
    waitlistEmpty: string;
    cancelSession: string;
    cancelBooking: string;
    bookMember: string;
    selectMember: string;
    book: string;
    markAttended: string;
    markNoShow: string;
    loading: string;
  };
  member: {
    title: string;
    home: string;
    classes: string;
    inbox: string;
    qr: string;
    logout: string;
    gyms: string;
    activeUntil: string;
    switchGym: string;
    upcoming: string;
    myBookings: string;
    history: string;
    book: string;
    joinWaitlist: string;
    cancel: string;
    seats: string;
    waitlist: string;
    emptySessions: string;
    emptyBookings: string;
    emptyInbox: string;
    statusConfirmed: string;
    statusWaitlisted: string;
    statusCancelled: string;
    statusAttended: string;
    statusNoShow: string;
    qrHint: string;
    bookError: string;
    cancelError: string;
  };
  organization: {
    title: string;
    subtitle: string;
    currentPlan: string;
    subscriptionTitle: string;
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
    contactSales: string;
    current: string;
    checkoutComingSoon: string;
    contactProPlan: string;
    createGymComingSoon: string;
    gymCapContact: string;
    retentionNote: string;
    planFreemium: string;
    planStarter: string;
    planGrowth: string;
    planPro: string;
    priceFree: string;
    pricePerOrg: string;
    pricePerGym: string;
    priceContact: string;
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
    previous: string;
    next: string;
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
    confirmRemoveLogo: string;
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
    whitelabelLocked: string;
    whitelabelLockedHint: string;
    upgradeWhitelabel: string;
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
    classes: "Clases",
    logout: "Salir",
    settings: "Configuración",
    more: "Más",
    myQr: "Mi QR",
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
    myQrHint: "Muestra este código en recepción para registrar tu entrada.",
  },
  a11y: {
    toggleTheme: "Cambiar tema",
    moreActions: "Más acciones",
    collapseNav: "Ocultar menú",
    expandNav: "Mostrar menú",
    openMoreNav: "Abrir más opciones de navegación",
    closeMoreNav: "Cerrar más opciones de navegación",
    showMyQr: "Mostrar mi código QR",
    closeMyQr: "Cerrar mi código QR",
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
    stepPlans: "Membresías",
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
    gymSubtitle:
      "El gimnasio es la marca. La sucursal es el lugar físico (después puedes agregar más).",
    gymName: "Nombre del gimnasio",
    gymNamePlaceholder: "Ej. Titan Fitness",
    gymNameHint: "Cómo se llama tu gym o brand para socios y staff.",
    gymAddress: "Dirección del gimnasio (opcional)",
    gymAddressPlaceholder: "Calle, colonia, ciudad",
    gymAddressHint:
      "Dirección general o principal de la marca. Si solo tienes un local, puede ser la misma que la sucursal.",
    branchName: "Nombre de esta ubicación",
    branchNamePlaceholder: "Ej. Centro, Norte, Sucursal 1",
    branchNameHint:
      "Un nombre corto para este local. Si dejas vacío, usamos “Principal”.",
    branchAddress: "Dirección de esta ubicación (opcional)",
    branchAddressPlaceholder: "Calle y número donde entran los socios",
    branchAddressHint: "La dirección física de este local.",
    plansTitle: "Qué le cobras a tus socios",
    plansSubtitle:
      "Aquí defines los paquetes que vendes en tu gym (por ejemplo Mensual $500 por 30 días). Después los usarás al dar de alta o renovar socios. Es opcional: puedes saltarlo y crearlos luego.",
    plansExample:
      "Ejemplo: “Mensual” · $500 · 30 días. O “Trimestral” · $1,350 · 90 días.",
    planNameHint: "El nombre que usarás al vender o renovar membresías.",
    planNamePlaceholder: "Ej. Mensual, Semanal, Trimestral",
    planPriceHint: "Lo que paga el socio por ese paquete (MXN).",
    planDurationHint: "Cuántos días dura la membresía. 30 ≈ un mes.",
    addPlan: "Agregar paquete",
    skipPlans: "Saltar por ahora",
    planLimit: "En el plan gratuito puedes crear hasta 2 paquetes en este paso",
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
    newTrainer: "Nuevo entrenador",
    noTrainers: "No hay entrenadores aún.",
    noResults: "Ningún entrenador coincide con tu búsqueda.",
    searchPlaceholder: "Buscar por nombre o correo…",
    joined: "Alta",
    actions: "Acciones",
    remove: "Quitar",
    confirmRemove: "¿Quitar este entrenador del gimnasio?",
    reload: "Recargar",
    newBadge: "Nuevo",
    error: "No se pudo guardar el entrenador",
    showing: "Mostrando {from}–{to} de {total}",
    view: "Ver",
    phone: "Teléfono",
    role: "Rol",
    notFound: "Entrenador no encontrado",
  },
  staffPage: {
    title: "Personal",
    subtitle: "Gestiona recepción, admin y permisos del staff del gimnasio.",
    newStaff: "Nuevo staff",
    noStaff: "No hay personal aún.",
    noResults: "Ningún miembro del personal coincide con tu búsqueda.",
    searchPlaceholder: "Buscar por nombre o correo…",
    joined: "Alta",
    actions: "Acciones",
    remove: "Quitar",
    confirmRemove: "¿Quitar este miembro del personal del gimnasio?",
    reload: "Recargar",
    newBadge: "Nuevo",
    error: "No se pudo guardar el personal",
    showing: "Mostrando {from}–{to} de {total}",
    view: "Ver",
    phone: "Teléfono",
    role: "Rol",
    notFound: "Personal no encontrado",
  },
  teamInvites: {
    error: "No se pudo enviar la invitación",
    seatLimit: "Alcanzaste el límite de asientos de staff de tu plan",
    alreadyOnTeam: "Esa persona ya está en el equipo de este gimnasio",
    alreadyOwner: "Esa persona ya es dueño de este gimnasio",
    emailFailed: "Se registró, pero el correo de invitación no se pudo enviar",
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
    profile: "Perfil",
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
    reload: "Recargar",
    newBadge: "Nuevo",
  },
  payments: {
    title: "Pagos",
    subtitle: "Consulta cobros registrados y anota pagos de socios.",
    newPayment: "Registrar pago",
    member: "Socio",
    amount: "Monto",
    method: "Método",
    date: "Fecha",
    selectMember: "Seleccionar socio",
    searchMember: "Buscar socio por nombre o correo…",
    noMemberMatches: "Ningún socio coincide.",
    submit: "Registrar",
    submitting: "Registrando…",
    cancel: "Cancelar",
    close: "Cerrar",
    noPayments: "Sin pagos registrados.",
    noResults: "Ningún pago coincide con tu búsqueda.",
    noMembers: "No hay socios para registrar un pago. Agrega un miembro primero.",
    searchPlaceholder: "Buscar por socio o método…",
    reload: "Recargar",
    showing: "Mostrando {from}–{to} de {total}",
    newBadge: "Nuevo",
    description: "Elige socio, qué paga (plan o visita) y el método.",
    cash: "Efectivo",
    transfer: "Transferencia",
    error: "No se pudo registrar el pago",
    kindLabel: "Concepto",
    kindPlan: "Plan / membresía",
    kindDayPass: "Pase del día / visita",
    selectPlan: "Seleccionar plan",
    searchPlan: "Buscar plan…",
    noPlanMatches: "Ningún plan coincide.",
    noActivePlans: "No hay planes activos. Crea uno en Planes.",
    dayPassNotConfigured: "Configura el precio del pase del día en Planes.",
    amountHint: "Se rellena con el precio del plan o pase; puedes cambiarlo.",
    statMonth: "Este mes",
    statMonthHint: "{count} pagos registrados",
    statToday: "Hoy",
    statTodayHint: "{count} pagos hoy",
    statPlans: "Membresías",
    statPlansHint: "{count} renovaciones este mes",
    statDayPass: "Pases del día",
    statDayPassHint: "{count} visitas este mes",
  },
  checkin: {
    title: "Entrada",
    subtitle: "Registra accesos con QR o búsqueda manual.",
    scanTitle: "Escanea tu QR",
    scanHint:
      "Acerca tu código QR a la cámara para registrar el acceso automáticamente.",
    manualTitle: "Búsqueda manual",
    manualLabel: "Socio",
    manualPlaceholder: "Nombre, correo, teléfono, QR o ID…",
    lookup: "Buscar",
    clear: "Limpiar",
    scanning: "Escaneando…",
    stopCamera: "Detener cámara",
    startCamera: "Activar cámara",
    resultOk: "Órale, todo en orden",
    resultDenied: "No ha pagado. No puede pasar",
    memberNotFound: "Socio no encontrado",
    selectMember: "Elige al socio",
    confirmCheckIn: "Registrar entrada",
    matchesHint: "{count} coincidencias — selecciona para confirmar",
    lookingUp: "Buscando…",
    active: "Activo",
    expired: "Vencido",
    qrInUse: "Esta credencial ya está en uso en otro gimnasio",
    cameraError: "No se pudo usar la cámara",
    accessGranted: "Acceso permitido",
    accessDenied: "Acceso denegado",
    qrSuccessTitle: "¡Asistencia registrada!",
    qrSuccessHint: "Toca para continuar",
    waitingResult: "Listo para escanear",
    waitingResultHint: "El resultado del socio aparecerá aquí.",
    expiresIn: "Vencimiento en",
    days: "días",
    weekAttendance: "Asistencias semanales",
    noPlan: "Sin plan",
    nextScan: "Siguiente entrada",
    classReserved: "Reserva para {class} · {time}",
    walkInTitle: "Clases abiertas ahora",
    walkInEnroll: "Inscribir e ingresar",
    walkInFull: "Llena",
    noOpenClasses: "Sin clases en curso.",
    todayTitle: "Entradas de hoy",
    todayEmpty: "Aún no hay entradas hoy.",
    historyEmpty: "No hay entradas registradas.",
    viewAllCheckIns: "Ver todas las entradas",
    historyTitle: "Historial de entradas",
    historySubtitle: "Todas las entradas registradas en este gimnasio.",
    filterDate: "Fecha",
    filterApply: "Filtrar",
    filterClear: "Quitar filtro",
    colMember: "Socio",
    colTime: "Hora",
    colPlan: "Plan",
    colSource: "Origen",
    sourceQr: "QR",
    sourceManual: "Manual",
    sourceKiosk: "Kiosco",
    calendarTitle: "Asistencia",
    calendarSubtitle: "Entradas del mes para este socio.",
    calendarPrev: "Mes anterior",
    calendarNext: "Mes siguiente",
    calendarToday: "Mes actual",
    checkInsOnDay: "Entradas el {date}",
    noCheckInsOnDay: "Sin entradas este día.",
    noCheckInsMonth: "Sin entradas este mes.",
    backToHistory: "Volver al historial",
    backToCheckIn: "Volver a entrada",
    visitsThisMonth: "{count} visitas",
    visitsLabel: "Visitas del mes",
    daysPresent: "{count} días",
    daysPresentHint: "Días con al menos una entrada",
    bySource: "Por origen",
    selectedDayTitle: "Detalle del día",
    visitCount: "{count} entradas",
    viewMemberProfile: "Ver ficha del socio",
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
    archiving: "Archivando…",
    restoring: "Restaurando…",
    cancel: "Cancelar",
    close: "Cerrar",
    edit: "Editar",
    archive: "Archivar",
    archiveConfirm:
      "“{name}” dejará de estar disponible para nuevas membresías. Puedes restaurarlo después.",
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
      "El plan gratuito permite hasta 2 planes activos. Archiva uno o mejora tu plan para crear más.",
    upgradePlans: "Mejorar plan",
    quotaLabel: "{used} / {max} planes activos",
    freemium: "Plan gratuito",
    planLimit: "El plan gratuito permite hasta 2 planes activos",
    error: "No se pudo guardar el plan",
    dayPassTitle: "Pase del día / visita",
    dayPassSubtitle: "Precio de una sola visita (no cuenta como plan de membresía).",
    dayPassPrice: "Precio del pase",
    dayPassHint: "Se usa al registrar un pago de visita en Pagos.",
    dayPassSave: "Guardar precio",
    dayPassNotSet: "Sin precio",
  },
  classes: {
    title: "Clases",
    subtitle: "Catálogo, horarios, cupos y lista de espera.",
    newClass: "Nueva clase",
    className: "Nombre",
    description: "Descripción",
    descriptionHint: "Opcional. Breve detalle de la clase.",
    capacity: "Cupo",
    capacityHint: "Opcional. Déjalo vacío para sin límite.",
    duration: "Duración (min)",
    durationHint: "Duración por defecto de cada sesión.",
    tags: "Etiquetas",
    tagsHint: "Separadas por comas (yoga, hiit, etc.).",
    trainers: "Entrenadores",
    trainersHint: "Puedes asignar uno o varios.",
    noTrainers: "Aún no hay entrenadores. Regístralos en Entrenadores.",
    save: "Guardar",
    saving: "Guardando…",
    archiving: "Archivando…",
    restoring: "Restaurando…",
    cancel: "Cancelar",
    close: "Cerrar",
    edit: "Editar",
    archive: "Archivar",
    archiveConfirm:
      "“{name}” dejará de mostrarse en el catálogo activo. Puedes restaurarla después.",
    restore: "Restaurar",
    active: "Activa",
    archived: "Archivadas",
    noClasses: "Todavía no hay clases. Crea la primera.",
    createTitle: "Nueva clase",
    createDescription: "Define el nombre y asigna entrenadores.",
    editTitle: "Editar clase",
    editDescription: "Actualiza datos o trainers de la clase.",
    unlimited: "Sin límite",
    trainerCount: "{count} entrenadores",
    error: "No se pudo guardar la clase",
    bookError: "No se pudo reservar el cupo",
    duplicateError: "No se pudo duplicar la clase",
    scheduleCreatePartial:
      "La clase se creó, pero el horario no. Ábrela y añade el horario.",
    advancedSettings: "Ajustes avanzados",
    advancedHint: "Duración, etiquetas y horario opcional.",
    addScheduleNow: "Programar horario ahora",
    tabCatalog: "Lista",
    tabCalendar: "Calendario",
    schedule: "Horario",
    scheduleTitle: "Añadir horario",
    scheduleHint: "Crea sesiones recurrentes o una fecha única.",
    recurrence: "Repetición",
    recurrenceNone: "Una sola vez",
    recurrenceWeekly: "Semanal",
    days: "Días",
    time: "Hora",
    validFrom: "Desde",
    validUntil: "Hasta (opcional)",
    timezone: "Zona horaria",
    thisWeek: "Esta semana",
    prevWeek: "Anterior",
    nextWeek: "Siguiente",
    seats: "Cupos",
    waitlist: "Lista de espera",
    cancelled: "Cancelada",
    noSessions: "No hay sesiones esta semana. Añade un horario a una clase.",
    duplicate: "Duplicar",
    duplicateTitle: "Duplicar a otro gym",
    duplicateHint: "Copia la clase y sus horarios. Sin socios ni trainers.",
    targetGym: "Gimnasio destino",
    noOtherGyms: "No hay otros gimnasios en la organización.",
    dayMon: "Lun",
    dayTue: "Mar",
    dayWed: "Mié",
    dayThu: "Jue",
    dayFri: "Vie",
    daySat: "Sáb",
    daySun: "Dom",
    roster: "Inscritos",
    rosterEmpty: "Nadie inscrito aún.",
    waitlistEmpty: "Lista de espera vacía.",
    cancelSession: "Cancelar sesión",
    cancelBooking: "Cancelar reserva",
    bookMember: "Inscribir socio",
    selectMember: "Elige un socio",
    book: "Reservar",
    markAttended: "Asistió",
    markNoShow: "No show",
    loading: "Cargando clases…",
  },
  member: {
    title: "Mi espacio",
    home: "Inicio",
    classes: "Clases",
    inbox: "Buzón",
    qr: "Mi QR",
    logout: "Salir",
    gyms: "Mis gimnasios",
    activeUntil: "Activo hasta",
    switchGym: "Cambiar gym",
    upcoming: "Próximas clases",
    myBookings: "Mis reservas",
    history: "Historial",
    book: "Reservar",
    joinWaitlist: "Lista de espera",
    cancel: "Cancelar",
    seats: "Cupos",
    waitlist: "Espera",
    emptySessions: "No hay clases próximas.",
    emptyBookings: "Aún no tienes reservas.",
    emptyInbox: "Sin mensajes.",
    statusConfirmed: "Confirmada",
    statusWaitlisted: "En espera",
    statusCancelled: "Cancelada",
    statusAttended: "Asistió",
    statusNoShow: "No show",
    qrHint: "Muestra este código en recepción.",
    bookError: "No se pudo reservar",
    cancelError: "No se pudo cancelar",
  },
  organization: {
    title: "Organización",
    subtitle: "Planes, facturación y sedes de tu organización",
    currentPlan: "Plan actual",
    subscriptionTitle: "Suscripción AMRAP",
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
    contactSales: "Contactar a AMRAP",
    current: "Actual",
    checkoutComingSoon:
      "El pago de suscripción AMRAP llegará pronto. Mientras tanto, contacta soporte para cambiar de plan.",
    contactProPlan:
      "Pro es un acuerdo personalizado. Escríbenos a hello@amrap.space (o usa Contacto en la web) si necesitas más de 3 gyms o términos a medida.",
    createGymComingSoon:
      "La creación de gimnasios adicionales llega con Growth / Multi-Gym (2–3 gyms, tarifa plana). Si necesitas más, contacta a AMRAP para Pro.",
    gymCapContact:
      "Alcanzaste el límite de gyms de tu plan. Mejora tu plan AMRAP.",
    retentionNote:
      "Tras confirmar, hay {days} días de retención antes del borrado definitivo (export CSV disponible).",
    planFreemium: "Plan gratuito",
    planStarter: "Starter / Solo",
    planGrowth: "Growth / Multi-Gym",
    planPro: "Pro",
    priceFree: "$0",
    pricePerOrg: "por organización (tarifa plana)",
    pricePerGym: "por gym activo",
    priceContact: "A medida",
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
    confirmRemoveLogo: "¿Quitar este logo?",
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
    whitelabelLocked: "Personalización no incluida en plan gratuito",
    whitelabelLockedHint:
      "Logo y tema personalizados están en Starter y superiores. En plan gratuito se usa la marca AMRAP.",
    upgradeWhitelabel: "Mejorar plan",
  },
  common: {
    loading: "Cargando…",
    forbidden: "No tienes permiso",
    back: "Volver",
    locale: "Idioma",
    saveFailed: "No se pudo guardar",
    invalidInput: "Revisa los datos e inténtalo de nuevo",
    previous: "Anterior",
    next: "Siguiente",
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
    phonePlaceholder: "Teléfono",
    countryCode: "Código de país",
    email: "Correo",
    emailPlaceholder: "nombre@ejemplo.com",
    close: "Cerrar",
    cancel: "Cancelar",
    submit: "Registrar",
    submitting: "Registrando…",
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
    classes: "Classes",
    logout: "Log out",
    settings: "Settings",
    more: "More",
    myQr: "My QR",
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
    myQrHint: "Show this code at the front desk to check in.",
  },
  a11y: {
    toggleTheme: "Toggle theme",
    moreActions: "More actions",
    collapseNav: "Collapse menu",
    expandNav: "Expand menu",
    openMoreNav: "Open more navigation options",
    closeMoreNav: "Close more navigation options",
    showMyQr: "Show my QR code",
    closeMyQr: "Close my QR code",
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
    stepPlans: "Memberships",
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
    gymSubtitle:
      "The gym is the brand. The branch is the physical location (you can add more later).",
    gymName: "Gym name",
    gymNamePlaceholder: "e.g. Titan Fitness",
    gymNameHint: "What members and staff call your gym or brand.",
    gymAddress: "Gym address (optional)",
    gymAddressPlaceholder: "Street, neighborhood, city",
    gymAddressHint:
      "Main or general address for the brand. If you only have one site, it can match the branch.",
    branchName: "Name for this location",
    branchNamePlaceholder: "e.g. Downtown, North, Location 1",
    branchNameHint:
      "A short label for this site. Leave blank and we'll use \"Main\".",
    branchAddress: "Address for this location (optional)",
    branchAddressPlaceholder: "Street and number where members enter",
    branchAddressHint: "The physical address of this site.",
    plansTitle: "What members pay you",
    plansSubtitle:
      "These are the packages you sell at your gym (for example Monthly $500 for 30 days). You'll pick them when you add or renew members. Optional — you can skip and add them later.",
    plansExample:
      "Example: \"Monthly\" · $500 · 30 days. Or \"Quarterly\" · $1,350 · 90 days.",
    planNameHint: "The name you’ll pick when selling or renewing memberships.",
    planNamePlaceholder: "e.g. Monthly, Weekly, Quarterly",
    planPriceHint: "What the member pays for that package.",
    planDurationHint: "How many days the membership lasts. 30 ≈ one month.",
    addPlan: "Add package",
    skipPlans: "Skip for now",
    planLimit: "On free plan you can create up to 2 packages in this step",
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
    newTrainer: "New trainer",
    noTrainers: "No trainers yet.",
    noResults: "No trainers match your search.",
    searchPlaceholder: "Search by name or email…",
    joined: "Joined",
    actions: "Actions",
    remove: "Remove",
    confirmRemove: "Remove this trainer from the gym?",
    reload: "Reload",
    newBadge: "New",
    error: "Could not save trainer",
    showing: "Showing {from}–{to} of {total}",
    view: "View",
    phone: "Phone",
    role: "Role",
    notFound: "Trainer not found",
  },
  staffPage: {
    title: "Staff",
    subtitle: "Manage front desk, admin, and gym staff permissions.",
    newStaff: "New staff",
    noStaff: "No staff yet.",
    noResults: "No staff match your search.",
    searchPlaceholder: "Search by name or email…",
    joined: "Joined",
    actions: "Actions",
    remove: "Remove",
    confirmRemove: "Remove this staff member from the gym?",
    reload: "Reload",
    newBadge: "New",
    error: "Could not save staff",
    showing: "Showing {from}–{to} of {total}",
    view: "View",
    phone: "Phone",
    role: "Role",
    notFound: "Staff member not found",
  },
  teamInvites: {
    error: "Could not send the invitation",
    seatLimit: "You've reached your plan's staff seat limit",
    alreadyOnTeam: "That person is already on this gym's team",
    alreadyOwner: "That person is already the owner of this gym",
    emailFailed: "Saved, but the invitation email could not be sent",
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
    profile: "Profile",
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
    reload: "Reload",
    newBadge: "New",
  },
  payments: {
    title: "Payments",
    subtitle: "Review recorded charges and log member payments.",
    newPayment: "Record payment",
    member: "Member",
    amount: "Amount",
    method: "Method",
    date: "Date",
    selectMember: "Select member",
    searchMember: "Search member by name or email…",
    noMemberMatches: "No members match.",
    submit: "Save",
    submitting: "Saving…",
    cancel: "Cancel",
    close: "Close",
    noPayments: "No payments recorded.",
    noResults: "No payments match your search.",
    noMembers: "No members yet. Add a member before recording a payment.",
    searchPlaceholder: "Search by member or method…",
    reload: "Reload",
    showing: "Showing {from}–{to} of {total}",
    newBadge: "New",
    description: "Choose a member, what they're paying for (plan or visit), and method.",
    cash: "Cash",
    transfer: "Transfer",
    error: "Could not record payment",
    kindLabel: "What for",
    kindPlan: "Plan / membership",
    kindDayPass: "Day pass / visit",
    selectPlan: "Select plan",
    searchPlan: "Search plan…",
    noPlanMatches: "No plans match.",
    noActivePlans: "No active plans. Create one under Plans.",
    dayPassNotConfigured: "Set the day-pass price on the Plans page.",
    amountHint: "Filled from the plan or pass price; you can change it.",
    statMonth: "This month",
    statMonthHint: "{count} payments recorded",
    statToday: "Today",
    statTodayHint: "{count} payments today",
    statPlans: "Memberships",
    statPlansHint: "{count} renewals this month",
    statDayPass: "Day passes",
    statDayPassHint: "{count} visits this month",
  },
  checkin: {
    title: "Check-in",
    subtitle: "Record access with QR or manual lookup.",
    scanTitle: "Scan your QR",
    scanHint: "Hold your QR code to the camera to check in automatically.",
    manualTitle: "Manual lookup",
    manualLabel: "Member",
    manualPlaceholder: "Name, email, phone, QR, or ID…",
    lookup: "Search",
    clear: "Clear",
    scanning: "Scanning…",
    stopCamera: "Stop camera",
    startCamera: "Start camera",
    resultOk: "You're good to go",
    resultDenied: "Membership expired. Entry denied",
    memberNotFound: "Member not found",
    selectMember: "Choose the member",
    confirmCheckIn: "Check in",
    matchesHint: "{count} matches — select one to confirm",
    lookingUp: "Looking up…",
    active: "Active",
    expired: "Expired",
    qrInUse: "This credential is already in use at another gym",
    cameraError: "Camera could not be started",
    accessGranted: "Access granted",
    accessDenied: "Access denied",
    qrSuccessTitle: "Check-in recorded!",
    qrSuccessHint: "Tap to continue",
    waitingResult: "Ready to scan",
    waitingResultHint: "Member results will show up here.",
    expiresIn: "Expires in",
    days: "days",
    weekAttendance: "Weekly check-ins",
    noPlan: "No plan",
    nextScan: "Next check-in",
    classReserved: "Reserved for {class} · {time}",
    walkInTitle: "Open classes now",
    walkInEnroll: "Enroll & check in",
    walkInFull: "Full",
    noOpenClasses: "No classes in progress.",
    todayTitle: "Today’s check-ins",
    todayEmpty: "No check-ins yet today.",
    historyEmpty: "No check-ins recorded.",
    viewAllCheckIns: "View all check-ins",
    historyTitle: "Check-in history",
    historySubtitle: "All recorded check-ins at this gym.",
    filterDate: "Date",
    filterApply: "Filter",
    filterClear: "Clear filter",
    colMember: "Member",
    colTime: "Time",
    colPlan: "Plan",
    colSource: "Source",
    sourceQr: "QR",
    sourceManual: "Manual",
    sourceKiosk: "Kiosk",
    calendarTitle: "Attendance",
    calendarSubtitle: "This member’s check-ins for the month.",
    calendarPrev: "Previous month",
    calendarNext: "Next month",
    calendarToday: "Current month",
    checkInsOnDay: "Check-ins on {date}",
    noCheckInsOnDay: "No check-ins on this day.",
    noCheckInsMonth: "No check-ins this month.",
    backToHistory: "Back to history",
    backToCheckIn: "Back to check-in",
    visitsThisMonth: "{count} visits",
    visitsLabel: "Visits this month",
    daysPresent: "{count} days",
    daysPresentHint: "Days with at least one check-in",
    bySource: "By source",
    selectedDayTitle: "Day detail",
    visitCount: "{count} check-ins",
    viewMemberProfile: "View member profile",
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
    archiving: "Archiving…",
    restoring: "Restoring…",
    cancel: "Cancel",
    close: "Close",
    edit: "Edit",
    archive: "Archive",
    archiveConfirm:
      "“{name}” will no longer be available for new memberships. You can restore it later.",
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
      "The free plan allows up to 2 active plans. Archive one or upgrade to create more.",
    upgradePlans: "Upgrade plan",
    quotaLabel: "{used} / {max} active plans",
    freemium: "Free plan",
    planLimit: "The free plan allows up to 2 active plans",
    error: "Could not save plan",
    dayPassTitle: "Day pass / visit",
    dayPassSubtitle: "Price for a single visit (does not count as a membership plan).",
    dayPassPrice: "Pass price",
    dayPassHint: "Used when recording a visit payment on Payments.",
    dayPassSave: "Save price",
    dayPassNotSet: "Not set",
  },
  classes: {
    title: "Classes",
    subtitle: "Catalog, schedules, capacity, and waitlist.",
    newClass: "New class",
    className: "Name",
    description: "Description",
    descriptionHint: "Optional. Short detail about the class.",
    capacity: "Capacity",
    capacityHint: "Optional. Leave empty for unlimited.",
    duration: "Duration (min)",
    durationHint: "Default length of each session.",
    tags: "Tags",
    tagsHint: "Comma-separated (yoga, hiit, etc.).",
    trainers: "Trainers",
    trainersHint: "You can assign one or more.",
    noTrainers: "No trainers yet. Add them under Trainers.",
    save: "Save",
    saving: "Saving…",
    archiving: "Archiving…",
    restoring: "Restoring…",
    cancel: "Cancel",
    close: "Close",
    edit: "Edit",
    archive: "Archive",
    archiveConfirm:
      "“{name}” will be hidden from the active catalog. You can restore it later.",
    restore: "Restore",
    active: "Active",
    archived: "Archived",
    noClasses: "No classes yet. Create the first one.",
    createTitle: "New class",
    createDescription: "Set a name and assign trainers.",
    editTitle: "Edit class",
    editDescription: "Update details or trainers for this class.",
    unlimited: "Unlimited",
    trainerCount: "{count} trainers",
    error: "Could not save the class",
    bookError: "Could not book a spot",
    duplicateError: "Could not duplicate the class",
    scheduleCreatePartial:
      "Class was created, but the schedule was not. Open it and add a schedule.",
    advancedSettings: "Advanced settings",
    advancedHint: "Duration, tags, and an optional schedule.",
    addScheduleNow: "Add a schedule now",
    tabCatalog: "List",
    tabCalendar: "Calendar",
    schedule: "Schedule",
    scheduleTitle: "Add schedule",
    scheduleHint: "Create recurring sessions or a one-off date.",
    recurrence: "Repeat",
    recurrenceNone: "One-time",
    recurrenceWeekly: "Weekly",
    days: "Days",
    time: "Time",
    validFrom: "From",
    validUntil: "Until (optional)",
    timezone: "Timezone",
    thisWeek: "This week",
    prevWeek: "Previous",
    nextWeek: "Next",
    seats: "Seats",
    waitlist: "Waitlist",
    cancelled: "Cancelled",
    noSessions: "No sessions this week. Add a schedule to a class.",
    duplicate: "Duplicate",
    duplicateTitle: "Duplicate to another gym",
    duplicateHint: "Copies the class and schedules. No members or trainers.",
    targetGym: "Target gym",
    noOtherGyms: "No other gyms in the organization.",
    dayMon: "Mon",
    dayTue: "Tue",
    dayWed: "Wed",
    dayThu: "Thu",
    dayFri: "Fri",
    daySat: "Sat",
    daySun: "Sun",
    roster: "Roster",
    rosterEmpty: "No one booked yet.",
    waitlistEmpty: "Waitlist is empty.",
    cancelSession: "Cancel session",
    cancelBooking: "Cancel booking",
    bookMember: "Book a member",
    selectMember: "Choose a member",
    book: "Book",
    markAttended: "Attended",
    markNoShow: "No-show",
    loading: "Loading classes…",
  },
  member: {
    title: "My space",
    home: "Home",
    classes: "Classes",
    inbox: "Inbox",
    qr: "My QR",
    logout: "Log out",
    gyms: "My gyms",
    activeUntil: "Active until",
    switchGym: "Switch gym",
    upcoming: "Upcoming classes",
    myBookings: "My bookings",
    history: "History",
    book: "Book",
    joinWaitlist: "Join waitlist",
    cancel: "Cancel",
    seats: "Seats",
    waitlist: "Waitlist",
    emptySessions: "No upcoming classes.",
    emptyBookings: "You have no bookings yet.",
    emptyInbox: "No messages.",
    statusConfirmed: "Confirmed",
    statusWaitlisted: "Waitlisted",
    statusCancelled: "Cancelled",
    statusAttended: "Attended",
    statusNoShow: "No-show",
    qrHint: "Show this code at the front desk.",
    bookError: "Could not book",
    cancelError: "Could not cancel",
  },
  organization: {
    title: "Organization",
    subtitle: "Plans, billing, and locations for your organization",
    currentPlan: "Current plan",
    subscriptionTitle: "AMRAP subscription",
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
    contactSales: "Contact AMRAP",
    current: "Current",
    checkoutComingSoon:
      "AMRAP subscription checkout is coming soon. Contact support to change plans for now.",
    contactProPlan:
      "Pro is a custom agreement. Email hello@amrap.space (or use Contact on the site) if you need more than 3 gyms or tailored terms.",
    createGymComingSoon:
      "Creating additional gyms ships with Growth / Multi-Gym (2–3 gyms, flat rate). Need more? Contact AMRAP for Pro.",
    gymCapContact:
      "You’ve hit your plan’s gym limit. Upgrade AMRAP plan.",
    retentionNote:
      "After confirmation, there is a {days}-day retention window before permanent deletion (CSV export available).",
    planFreemium: "Free plan",
    planStarter: "Starter / Solo",
    planGrowth: "Growth / Multi-Gym",
    planPro: "Pro",
    priceFree: "$0",
    pricePerOrg: "per organization (flat rate)",
    pricePerGym: "per active gym",
    priceContact: "Custom",
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
    confirmRemoveLogo: "Remove this logo?",
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
    whitelabelLocked: "Customization is not included in free plan",
    whitelabelLockedHint:
      "Custom logos and themes unlock on Starter and above. The free plan keeps AMRAP branding.",
    upgradeWhitelabel: "Upgrade plan",
  },
  common: {
    loading: "Loading…",
    forbidden: "You do not have permission",
    back: "Back",
    locale: "Language",
    saveFailed: "Could not save",
    invalidInput: "Check the form and try again",
    previous: "Previous",
    next: "Next",
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
    phonePlaceholder: "Phone number",
    countryCode: "Country code",
    email: "Email",
    emailPlaceholder: "name@example.com",
    close: "Close",
    cancel: "Cancel",
    submit: "Register",
    submitting: "Registering…",
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
