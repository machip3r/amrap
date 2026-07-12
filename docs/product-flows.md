# AMRAP — Flujos de producto e interfaz por rol

Documento de referencia para diseño e implementación: **quién entra**, **qué ve**, **qué hace**, y **casos borde**. Cubre MVP y fases posteriores. Complementa `README.md` (reglas de negocio); aquí el foco es la **experiencia de interfaz**.

Locales de UI: `es` (default) · `en`.

---

## Mapa de superficies

| Superficie | Quién | Ruta típica | Notas |
| ---------- | ----- | ----------- | ----- |
| Marketing | Público | `/[locale]` | Landing, precios, contacto |
| Auth | Público / pendiente | `/login`, `/register`, confirm OTP | Sin link público “confirmar correo” |
| Onboarding | Dueño / provisional | `/onboarding` | Tras registro o login sin gym listo |
| App gym (ops) | Dueño, staff, coach* | `/dashboard`, miembros, planes, … | Scope por gym activo |
| App socio | Member | `/me` o área member (fase) | QR, membresías, clases* |
| Kiosk / recepción | Staff en iPad | `/check-in` (modo kiosk) | Cámara + búsqueda |
| Platform admin | Operador AMRAP | `/platform/…` | Impersonación, orgs, billing |
| White-label member | Socio del gym | Dominio/branding del gym | Solo planes de pago |

\*Coach y área member rica = fase 2+.

---

## Jerarquía que la UI debe respetar

```
AMRAP (platform)
 └── Organization     ← factura a AMRAP
      └── Gym(s)      ← dueño único por gym; operación
           └── Branch ← lugar físico
```

- **Selector de gym** (y a veces sucursal) en el chrome de la app ops.
- **Roles son contextuales**: la misma persona puede ser dueño en A, staff en B, socio en C.
- Tras login: resolver workspace → si hay varios contextos, **home de elección de contexto** o último gym usado.

---

## 1. Públicos y auth

### 1.1 Landing (`/[locale]`)

**UI:** Hero con marca AMRAP dominante → producto → precios → contacto → footer.

**CTAs:** Empezar gratis → register · Ingresar → login · Contacto (lead).

**Casos:** Visitante; visitante ya logueado (CTA puede ir a dashboard/onboarding).

---

### 1.2 Registro — organización

**Quién:** Dueño futuro o encargado provisional.

**Pantalla:** Nombre de organización · email · password · confirmar password. Submit deshabilitado hasta campos válidos.

**Flujo feliz**

1. `signUp` → (opcional) bootstrap org vía RPC.
2. Si hay sesión → `/onboarding`.
3. Si email confirm requerido → cookie pending + UI OTP en la misma ruta register.

**Casos**

| Caso | UI |
| ---- | -- |
| Email ya registrado | Mensaje + enlace a login |
| Rate limit de email | Mensaje claro (esperar / revisar inbox) |
| OTP pendiente (cookie) | Formulario código 6+ dígitos; reenviar; volver a login |
| OTP incorrecto / expirado | Error dictionary; reenviar |
| Org no creada en signup | Tras confirm, `ensureOrganization` |

**No:** Link público genérico “confirmar email” en nav.

---

### 1.3 Login

**Pantalla:** Email · password (show/hide) · submit gated · link a register.

**Post-login**

| Estado | Destino |
| ------ | ------- |
| Email no confirmado | UI confirm OTP (pending cookie) |
| Org sin onboarding completo | `/onboarding` |
| Onboarding ok, rol ops | `/dashboard` (gym por defecto) |
| Solo rol member | Área member / home de membresías |
| Varios contextos | Elegir gym / rol o “continuar donde quedaste” |
| Platform admin | `/platform` (si aplica) |

**Casos:** Credenciales inválidas · cuenta bloqueada · rate limit auth.

---

### 1.4 Logout / sesión

Clear session + cookies pending. Redirect marketing o login.

---

## 2. Onboarding (post-registro)

**Guard:** Sin `onboarding_completed_at` → forzar `/onboarding` (no app).

### Paso 1 — Tú

- Nombre completo.
- Rol de arranque: **Dueño** vs **Encargado provisional** (full powers hasta que un dueño acepte).
- CTA Continuar.

### Paso 2 — Primer gym

- Nombre del gym · (opcional) primera sucursal.
- Freemium: 1 gym / 1 branch — UI no ofrece más aquí.

### Paso 3 — Planes (opcional)

- Hasta **2** planes en Freemium · o **Omitir**.
- Campos: nombre, precio, duración / reglas simples.

### Paso 4 — Listo

- Resumen corto · CTA a dashboard.
- Marca onboarding completo.

**Casos:** Abandono a mitad (reanudar en el paso guardado) · RPC fail (mensaje seguro) · límites Freemium al crear planes.

---

## 3. Chrome compartido (app ops)

Visible para dueño / staff (y coach en fases):

| Elemento | Comportamiento |
| -------- | -------------- |
| Logo / home | Dashboard del gym activo |
| Selector gym | Lista de gyms donde tiene rol ops; badge plan org |
| Selector branch (si >1) | Filtra asistencia / kiosk |
| Nav | Dashboard · Miembros · Planes · Pagos* · Check-in · Inbox · Equipo* · Ajustes |
| Avatar menú | Perfil · mis roles · cambiar idioma · tema · cerrar sesión |
| Banner límites | Freemium cerca de 30 miembros · grace unpaid · gym read-only |

\*Pagos ricos / equipo completo según fase y plan.

---

## 4. Dueño (Owner)

**Scope:** Un gym = un dueño. Puede poseer varios gyms (misma u otras orgs vía producto). Ve stats agregadas en Growth+.

### 4.1 Dashboard

**UI (MVP):** Hoy — check-ins · activos · vencidos / por vencer · renovaciones · alertas operativas · atajos (nuevo miembro, check-in, planes).

**Fases:** Multi-gym rollup · trends · health de facturación AMRAP.

### 4.2 Miembros / membresías

**Lista:** Buscar · filtros (activo, vencido, temporal) · estado · plan · última visita.

**Detalle:** Persona (nombre, contacto) · membresías en este gym · historial pagos · check-ins · QR status (activo / cooldown 4h) · notas internas*.

**Alta**

1. Buscar si la persona ya existe en plataforma (email/tel).
2. Si existe → vincular membresía al gym.
3. Si no → crear perfil (con o sin invitar a crear cuenta).
4. Elegir plan · fechas · método de cobro registrado (efectivo, etc.).

**Casos**

| Caso | UI |
| ---- | -- |
| Límite Freemium 30 activos | Bloqueo suave + upgrade |
| Socio sin cuenta | Badge “solo perfil”; invitar |
| Claim posterior | Socio verifica email/tel y reclama perfil |
| Day-pass / temporal | Mismo flujo; fechas cortas |
| Baja / suspensión | Estado + motivo (penalties fase 2) |

### 4.3 Planes

CRUD planes a nivel gym (o branch). Precio, duración, activo/archivado. Freemium: max 2 activos.

### 4.4 Pagos (registro ops)

Registrar pago manual (método, monto, periodo). Lista / export CSV en Starter+.

**Fase 2+:** Gateway (Mercado Pago / etc.), recurrentes, fallos de cobro, portal socio.

### 4.5 Check-in

Ver §7 (dueño puede todo lo de staff).

### 4.6 Inbox feedback

Lista mensajes internos · estado leído · respuesta interna (no público). Freemium: retención corta.

### 4.7 Equipo y permisos

Invitar staff · roles · permisos granulares · asignar branches. Invitar dueño real (si provisional) — ver §5.

### 4.8 Ajustes del gym / org

Datos gym · branches · branding (white-label en pagados). Facturación AMRAP, multi-gym y borrados: **`/[locale]/organization`**.

### 4.8.1 Organización (`/organization`)

Suscripción AMRAP (Freemium → Starter / Growth / Pro) · lista de gyms · programar borrado gym/org (retención 30 días) · crear gym adicional (fase billing).

### 4.9 Multi-gym

Crear gym adicional (según plan) · copiar planes/defaults · stats agregadas · switcher.

---

## 5. Encargado provisional → transferencia de ownership

**Quién:** Staff que registró la org porque el dueño aún no.

**UI mientras es provisional**

- Banner persistente: “Actúas con poderes de dueño hasta que el dueño acepte.”
- Mismas pantallas que dueño.
- CTA: **Invitar dueño** (email).

**Flujo transferencia**

1. Provisional invita dueño.
2. Dueño recibe email / entra a AMRAP · acepta ownership de gym(s).
3. Pantalla dueño: **qué permisos conserva** el ex-provisional (casi-owner, staff, etc.).
4. Provisional pierde banner; rol queda según elección.

**Casos:** Invitación expirada · dueño rechaza · dueño ya tiene cuenta · varios gyms en la org.

---

## 6. Staff / Manager (encargado)

**UI:** Igual ops chrome; sin (o con permisos limitados): borrar gym, billing AMRAP, transfer ownership, algunos ajustes de org.

**Día a día:** Dashboard · check-in · altas/renovaciones · registrar pagos · inbox · alertas.

**Casos:** Permiso denegado (toast/página) · asignado solo a branch A (no ve B) · gym en read-only por unpaid (solo lectura + banner).

---

## 7. Check-in (núcleo MVP)

### 7.1 Kiosk / recepción (iPad)

**UI dedicada (fullscreen):**

- Modo cámara (escanea QR) · modo teclado (buscar nombre / tel / id).
- Resultado grande: **OK / membresía vencida / sin membresía / cooldown 4h / ya checked hoy**.
- Foto/nombre · plan · vencimiento · botón override solo si permiso.
- Selector branch si aplica.
- Idle → vuelve a scan.

### 7.2 Desde dispositivo del socio

Muestra QR propio (una credencial plataforma). Staff escanea o socio muestra en torniquete futuro.

### 7.3 Reglas en UI

| Regla | Feedback |
| ----- | -------- |
| Check-in OK | Verde + hora; sesión 4h |
| QR usado en otro gym &lt;4h | Bloqueo con mensaje anti-abuso |
| Membresía inactiva | Rojo + CTA renovar (staff) |
| Historial | Lista reciente; Freemium 30 días |

---

## 8. Coach / trainer (fase 2+)

**Entrada:** Invitación a gym(s); puede coach en varios.

**UI propia / tabs**

- Mis clases / eventos · rosters · timers.
- Biblioteca de ejercicios · rutinas · templates (fork de templates del dueño).
- Anuncios a su audiencia.
- Detalle de socio **solo si** el socio lo permite o está en su clase.

**No (por defecto):** Billing org · borrar gym · inbox general (salvo permiso).

---

## 9. Member (socio)

### 9.1 Sin cuenta (perfil creado por staff)

No entra a app. Check-in manual en recepción. Invitación opcional a registrarse y **reclamar** perfil.

### 9.2 Con cuenta — MVP mínimo

- Home: gyms donde tiene membresía · estado · vencimiento.
- **Mi QR** (pantalla grande, brightness).
- Historial check-ins propio.
- Datos de perfil · privacidad (qué ven coaches).

### 9.3 Fase 2+

Clases / booking · anuncios · rutinas asignadas · PRs · progreso · community (leaderboard, streaks, achievements **por gym**) · pagar membresía online (si gym tiene gateway).

### 9.4 Multi-membresía

Lista de membresías · gym activo para community · QR único (cooldown cross-gym igual).

### 9.5 White-label

En planes de pago: colores/logo del gym en superficie member; Freemium muestra marca AMRAP.

---

## 10. Organización y billing (AMRAP ← Org)

**Quién:** Dueño / provisional / billing contact.

**UI:** Plan actual · cambio Freemium → Starter / Growth / Pro · seats gyms activos · facturas · método de pago · anual vs mensual.

**Casos**

| Caso | UI |
| ---- | -- |
| Upgrade por límite (30 miembros, 2 planes, etc.) | Paywall contextual en la acción bloqueada |
| Impago | Banner gracia 3 días → drop a Freemium: gyms extra **read-only**; elegir **un** gym editable |
| Downgrade | Confirmar qué gyms quedan activos / read-only |
| Gateway miembros | Solo Starter+; conectar cuenta merchant (onboarding legal) |

---

## 11. Platform admin (operador AMRAP)

**UI separada** (`/platform`), mismo design system, scope global.

| Módulo | Uso |
| ------ | --- |
| Orgs / gyms | Buscar, estado plan, límites, flags |
| Suscripciones | Cambios de plan, cortes, grace |
| Uso | Conteos usuarios, check-ins, growth |
| Soporte | Tickets internos · **impersonar** org/user (audit log obligatorio) |
| Equipo interno | Roles support / sales / billing (fase) |

**Impersonación:** Banner rojo “Estás impersonando X” · salir · sin poder cambiar billing crítico sin confirmación extra (política).

---

## 12. Flujos transversales

### 12.1 Cambio de locale / tema

Disponible en landing, auth y app. Preferencia persistida.

### 12.2 Errores y vacíos

Mensajes desde dictionaries (`es`/`en`). Empty states con CTA (sin miembros → alta; sin planes → crear/omitir).

### 12.3 Eliminación

- Delete gym / org → confirmación fuerte · aviso a AMRAP · retención **30 días** o export CSV a email org + AMRAP.
- UI: “Programado para borrado el …” · cancelar dentro de la ventana.

### 12.4 Anuncios (fase 2)

Composer · audiencia (todos, clase, rol, usuario) · historial.

### 12.5 Penalties (fase 2)

Staff: suspensión / multa · visible en ficha socio · bloqueo check-in si aplica.

### 12.6 Hardware acceso (largo plazo)

Readers / torniquetes consumen misma API de check-in; UI de emparejar dispositivos en ajustes gym.

### 12.7 Landing builder del gym (fase late)

Dueño publica página del gym (horarios, planes, CTA) — opcional; no confundir con landing AMRAP.

---

## 13. Matriz rol × módulo (resumen)

| Módulo | Owner | Provisional | Staff | Coach | Member | Platform |
| ------ | ----- | ----------- | ----- | ----- | ------ | -------- |
| Onboarding org | ✓ | ✓ | — | — | — | — |
| Dashboard ops | ✓ | ✓ | ✓* | parcial* | — | global |
| Miembros CRUD | ✓ | ✓ | ✓* | lectura* | — | soporte |
| Planes | ✓ | ✓ | ✓* | — | ver propios | — |
| Pagos registro | ✓ | ✓ | ✓* | — | pagar* | — |
| Check-in kiosk | ✓ | ✓ | ✓ | — | mostrar QR | — |
| Inbox | ✓ | ✓ | ✓* | — | enviar* | — |
| Equipo / perms | ✓ | ✓ | —* | — | — | — |
| Billing AMRAP | ✓ | ✓ | — | — | — | ✓ |
| Clases / rutinas | fase | fase | fase | ✓ | ✓ | — |
| Community | — | — | — | — | ✓/gym | — |
| Impersonar | — | — | — | — | — | ✓ |

\*Según permisos granulares. “fase” = no MVP.

---

## 14. Orden sugerido de pantallas a construir

1. Auth + confirm OTP + onboarding (base actual).
2. Dashboard día + miembros + planes + check-in kiosk + inbox.
3. Equipo / invites + selector multi-gym + banners Freemium/unpaid.
4. Billing org + upgrade paywalls.
5. Área member (QR + membresías).
6. Ownership transfer UI.
7. Coach + anuncios + penalties.
8. Gateway pagos miembros + white-label.
9. Community + routines + landing builder + hardware.
10. Platform admin + impersonación.

---

## 15. Principios de UI (recordatorio)

- Organización = factura · Gym = operación · Branch = lugar.
- Usuarios globales · roles contextuales · **un QR**.
- Freemium demuestra valor; paid desbloquea dinero y multi-gym.
- Misma base visual para gym ops y platform admin; cambia el **scope**.
- Copy siempre i18n; errores de servidor mapeados a dictionary.
- Una tarea por pantalla/sección; kiosk sin chrome de dashboard.
