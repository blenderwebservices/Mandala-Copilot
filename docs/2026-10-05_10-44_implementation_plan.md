# Plan de Implementación: Transformación a SaaS Multi-Tenant con Usuarios, Administradores y Equipos (Teams)

## Objetivo
Evolucionar Mandala Copilot de una aplicación monocuenta local a una plataforma SaaS multi-inquilino completa, que incluya autenticación de usuarios, roles y permisos (Superadmin, Admin de Equipo, Miembro), espacios de trabajo compartidos (**Teams**), panel de control para administradores del SaaS y segregación de metas personales vs. metas de equipo.

---

## Requisitos y Especificaciones

### 1. Modelo de Datos SaaS (`types/saas.ts`)
- **Usuario (`SaaSUser`)**:
  - `id`, `name`, `email`, `avatar`, `role` (`'superadmin' | 'admin' | 'member'`), `currentTeamId`, `plan` (`'free' | 'pro' | 'enterprise'`), `status` (`'active' | 'suspended'`), `createdAt`.
- **Equipo / Workspace (`SaaSTeam`)**:
  - `id`, `name`, `slug`, `ownerId`, `plan` (`'starter' | 'pro' | 'enterprise'`), `members` (`TeamMember[]`), `maxMembers`, `maxGoals`, `createdAt`.
- **Membresía (`TeamMember`)**:
  - `userId`, `name`, `email`, `avatar`, `role` (`'owner' | 'admin' | 'editor' | 'viewer'`), `joinedAt`.
- **Meta Extendida (`Goal`)**:
  - Soporte de `teamId` (asociación a un equipo o personal), `ownerId`, `visibility` (`'private' | 'team'`), y `assignedMembers` en pilares/acciones.

### 2. Capa de Estado y Contexto (`context/SaaSContext.tsx`)
- Estado global reactivo para:
  - `currentUser`, `currentTeam`, `userTeams`, `allUsers` (para admins), `allTeams`.
  - Roles derivados: `isSuperAdmin`, `isTeamAdmin`, `canEditCurrentGoal`.
  - Métodos:
    - `switchTeam(teamId)`: Cambia el espacio de trabajo activo.
    - `switchUser(userId)`: Cambio rápido entre usuarios demo (Francisco Admin, Elena Team Lead, Carlos Developer, etc.).
    - `createTeam(name, plan)`: Crea un nuevo espacio colaborativo.
    - `inviteTeamMember(teamId, email, role)`: Invita a nuevos miembros al equipo.
    - `removeTeamMember(teamId, userId)`: Remueve miembros del equipo.
    - `updateMemberRole(teamId, userId, role)`: Asigna permisos de equipo.
    - `updateUserRole(userId, newRole)`: Permiso exclusivo de administradores.
    - `updateUserPlan(userId, plan)`: Actualización de suscripción.

### 3. Interfaz de Usuario y Componentes

1. **Selector de Equipos en el Encabezado ([`components/Navbar.tsx`](file:///Users/francisco/Herd/Mandala-Copilot/components/Navbar.tsx))**:
   - Dropdown interactivo con el equipo activo, badge de plan (`Pro`, `Enterprise`), lista de equipos del usuario y botón para crear un nuevo equipo.
2. **Menú de Perfil & Roles**:
   - Muestra avatar, nombre, email, badge de rol.
   - Enlace directo al **Panel de Administración** si es Superadmin/Admin.
   - Enlace directo a **Configuración del Equipo**.
   - Selector rápido de usuarios para pruebas instantáneas sin fricción de contraseñas.
3. **Modal de Gestión de Equipos (`components/TeamManagementModal.tsx`)**:
   - Gestión de integrantes: ver lista, cambiar roles (`Admin`, `Editor`, `Lector`), revocar accesos.
   - Formulario para invitar miembros por email.
   - Vista de uso del plan (miembros actuales vs. límite del plan, metas activas).
4. **Panel de Administración del SaaS (`components/AdminDashboardModal.tsx`)**:
   - **Tab 1: Métricas Globales**: Usuarios activos, MRR estimado, distribución de planes, consumo de IA.
   - **Tab 2: Directorio de Usuarios**: Listado completo, edición de roles (promover a Superadmin/Admin), estado y plan.
   - **Tab 3: Directorio de Equipos**: Vista de todos los workspaces de la plataforma.
   - **Tab 4: Configuración Global de IA & SaaS**: Modelos por defecto de Gemini y límites.
5. **Modal de Autenticación / Switcher (`components/AuthModal.tsx`)**:
   - Login, registro y selector de identidades para demostración.

### 4. Backend y Persistencia (`server.ts` & `services/saasService.ts`)
- Endpoints REST en Express para operaciones SaaS:
  - `GET /api/saas/me`: Obtiene el usuario actual y sus equipos.
  - `GET /api/saas/admin/metrics`: Métricas globales para el panel admin.
  - `GET /api/saas/admin/users`: Directorio de usuarios para administradores.
  - `POST /api/saas/admin/users/:id/role`: Cambio de rol administrativo.
  - `GET /api/saas/teams`: Listado de equipos.
  - `POST /api/saas/teams`: Creación de equipo.
  - `POST /api/saas/teams/:id/members`: Invitación de miembros.
  - `DELETE /api/saas/teams/:id/members/:userId`: Expulsión de miembros.
- Persistencia local en archivo `data/saas_store.json` con fallback en memoria.

---

## Fases de Ejecución

1. **Fase 1: Tipos y Almacén Backend**:
   - Crear `types/saas.ts` con todas las definiciones de datos.
   - Crear almacenamiento backend en `server.ts` con datos semilla (Superadmin Francisco, Team Mandala Core, etc.) y endpoints REST.
2. **Fase 2: Servicio y Contexto Frontend**:
   - Crear `services/saasService.ts` para comunicarse con la API de SaaS.
   - Crear `context/SaaSContext.tsx` con soporte completo de estado reactivo y persistencia local/remota.
3. **Fase 3: Componentes de Equipos y Administración**:
   - Crear `components/TeamManagementModal.tsx`.
   - Crear `components/AdminDashboardModal.tsx`.
   - Crear `components/AuthModal.tsx`.
4. **Fase 4: Integración en Navbar y App**:
   - Actualizar `components/Navbar.tsx` para incorporar el selector de equipos, el botón del panel admin y el menú de usuario.
   - Actualizar `App.tsx` para envolver la app con `SaaSProvider`, conectar los modales y asociar las metas a los equipos.
5. **Fase 5: Verificación, Build y Walkthrough**:
   - Ejecutar `npm run lint` y `npm run build`.
   - Verificar la navegación y el cambio de equipos y roles.
   - Registrar entrega en `docs/2026-10-05_10-44_walkthrough.md`.
