# Plan de Implementación: Desahogo de la Barra Principal de Botones en 3 Barras Responsivas

## Objetivo
Desahogar la barra de navegación superior de **Mandala Copilot** separando la multitud de botones que actualmente se apiñan en una sola barra en **tres barras responsivas independientes**, organizadas de manera semántica, intuitiva y estética:

1. **Barra 1 (Navegación & Espacio de Trabajo)**:
   - Marca: *Mandala [SaaS]*
   - Selector de Workspace / Equipo (*Tus Espacios de Trabajo*)
   - Enlaces de vistas: *Matriz 9x9*, *Jerárquica*, *Gantt*, *Documentos* y botón de acción rápida *Check-in*.
2. **Barra 2 (Operaciones de Documento y Archivo)**:
   - Botón *+ Nueva Meta* (o *+ Nuevo*)
   - Botón *Abrir* (`Cmd+O`)
   - Botón *Guardar* (`Cmd+S`, con indicador de cambios sin guardar)
   - Botón *Imprimir / Exportar*
   - Contexto del documento activo (título de la meta actual e indicador de sincronización).
3. **Barra 3 (Sistema, Equipo y Perfil / "El resto")**:
   - Panel *Admin* (visible para administradores)
   - Gestión de *Equipo* (integrantes y roles)
   - Indicador de estado de IA Gemini (*AiStatusBadge*)
   - Selector de tema (*ThemeToggle*: Claro / Oscuro / Sistema)
   - Menú de perfil de usuario (*Avatar, Nombre, Rol y Demo Switcher*)

Todas las tres barras deben ser totalmente responsivas en móviles, tablets y monitores grandes.

---

## Análisis de Estado Actual
- Actualmente en [`components/Navbar.tsx`](file:///Users/franciscogomezbarragan/Herd/Mandala-Copilot/components/Navbar.tsx), todos estos controles están comprimidos en un único contenedor `<header>` de `h-16`, lo que provoca que en resoluciones menores a 1400px los botones colisionen, se oculten mediante `hidden lg:flex` o queden difíciles de interactuar.
- Existía además un sub-navbar móvil duplicado abajo (`flex md:hidden`), que ahora quedará unificado e integrado fluidamente gracias a la responsividad nativa de cada una de las 3 barras.

---

## Fases de Implementación

### Fase 1: Arquitectura y Estructura en [`components/Navbar.tsx`](file:///Users/franciscogomezbarragan/Herd/Mandala-Copilot/components/Navbar.tsx)
1. **Barra 1 (Nivel Superior - Altura 52px-56px)**:
   - Contenedor con borde inferior sutil y efecto glassmorphism (`backdrop-blur-md`).
   - Lado izquierdo: Logotipo `Grid3X3` + Mandala [SaaS] + selector dropdown de Workspace.
   - Lado derecho / Centro: Barra de pestañas de vistas (Matriz 9x9, Jerárquica, Gantt, Documentos, Check-in).
   - En pantallas móviles: Carrusel deslizable táctil con scroll suave (`overflow-x-auto no-scrollbar`), garantizando acceso directo a todas las vistas sin romper el diseño.

2. **Barra 2 (Nivel Intermedio - Barra de Documento y Archivo - Altura 42px-46px)**:
   - Fondo sutil diferenciado (`bg-slate-50/90 dark:bg-slate-900/60`).
   - Botón de acción destacada `+ Nueva Meta` (acento índigo, micro-animación al hover).
   - Botones de acción de archivo:
     - `Abrir` (icono `FolderOpen`, etiqueta responsiva y atajo `⌘O`).
     - `Guardar` (icono `Save`, etiqueta responsiva, atajo `⌘S`, punto luminoso si `hasUnsavedChanges`).
     - `Imprimir` (icono `Printer`, etiqueta responsiva).
   - Indicador del documento activo con truncado elíptico en pantallas estrechas.

3. **Barra 3 (Nivel Inferior - Barra de Sistema y Perfil - Altura 40px-44px)**:
   - Fondo complementario limpio (`bg-slate-100/70 dark:bg-[#070b12]/80`).
   - Lado izquierdo:
     - Botón `Admin` (si `isAdmin`, botón ámbar con `ShieldCheck`).
     - Botón `Equipo` (icono `Users` con nombre o conteo de miembros).
     - Componente `AiStatusBadge` con estado de conexión Gemini y latencia.
   - Lado derecho:
     - Selector `ThemeToggle`.
     - Botón de perfil de usuario (`currentUser.avatar`, nombre abreviado en desktop, rol actual).

### Fase 2: Responsividad y UX Móvil / Tablet
1. Garantizar que en viewports de 375px a 768px:
   - Los botones mantengan un tamaño táctil mínimo adecuado (mínimo 36px-40px).
   - Los textos largos se adapten o muestren tooltips nativos claros (`title="..."`).
   - No exista ningún desbordamiento horizontal involuntario.
2. Transición suave de temas (Dark / Light mode) con contrastes HSL claros.

### Fase 3: Verificación y Pruebas
1. Verificar que no haya errores de compilación (`npm run build` o `vite build`).
2. Comprobar que todos los callbacks sigan funcionando (`onSelectGoal`, `onNewGoal`, `onOpenCheckin`, `onOpenExport`, `onOpenDocumentModal`, `onOpenTeamModal`, `onOpenAdminModal`, `onOpenAuthModal`, `setActiveView`).
3. Generar el documento de walkthrough en `docs/2026-10-08_HH-mm_walkthrough.md`.
