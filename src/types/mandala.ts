export type ActionType = 'one_time' | 'recurring';

export interface MandalaAction {
  id: string;
  position: number; // 0 to 7
  title: string;
  type: ActionType;
  isCompleted: boolean;
  completedAt?: string;
  streakCount: number;
  habitDays: boolean[]; // 7 days of the week [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  isStuck?: boolean;
  notes?: string;
}

export interface Pillar {
  id: string;
  position: number; // 0 to 7
  title: string;
  colorTheme: string;
  actions: MandalaAction[];
}

export interface Goal {
  id: string;
  title: string;
  context?: string;
  status: 'draft' | 'active' | 'completed' | 'abandoned';
  createdAt: string;
  updatedAt: string;
  pillars: Pillar[];
}

export type SaasTier = 'free' | 'pro';

export const PILLAR_COLORS = [
  { name: 'Sky', bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', badge: 'bg-sky-500/20 text-sky-300' },
  { name: 'Indigo', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300' },
  { name: 'Violet', bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', badge: 'bg-violet-500/20 text-violet-300' },
  { name: 'Fuchsia', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', badge: 'bg-fuchsia-500/20 text-fuchsia-300' },
  { name: 'Rose', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', badge: 'bg-rose-500/20 text-rose-300' },
  { name: 'Amber', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-300' },
  { name: 'Emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  { name: 'Teal', bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', badge: 'bg-teal-500/20 text-teal-300' },
];

// Presets for instant inspiration
export const PRESET_GOALS: Goal[] = [
  {
    id: 'preset-saas-launch',
    title: 'Lanzar mi SaaS B2B en 6 meses',
    context: 'Desarrollador en solitario, presupuesto inicial bajo, enfocado en resolver automatización de flujos.',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pillars: [
      {
        id: 'p-0',
        position: 0,
        title: 'Arquitectura & MVP',
        colorTheme: 'Sky',
        actions: [
          { id: 'a-0-0', position: 0, title: 'Definir modelo de datos Postgres', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-0-1', position: 1, title: 'Programar 90 min de backend diario', type: 'recurring', isCompleted: true, streakCount: 5, habitDays: [true,true,true,true,true,false,false] },
          { id: 'a-0-2', position: 2, title: 'Implementar autenticación y JWT', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-0-3', position: 3, title: 'Crear endpoints REST del core', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-0-4', position: 4, title: 'Configurar Docker compose local', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-0-5', position: 5, title: 'Escribir tests unitarios críticos', type: 'recurring', isCompleted: false, streakCount: 2, habitDays: [true,true,false,false,false,false,false] },
          { id: 'a-0-6', position: 6, title: 'Integrar pasarela Stripe Cashier', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-0-7', position: 7, title: 'Revisión de seguridad y variables', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
        ],
      },
      {
        id: 'p-1',
        position: 1,
        title: 'Infraestructura & Cloud',
        colorTheme: 'Indigo',
        actions: [
          { id: 'a-1-0', position: 0, title: 'Configurar VPS Ubuntu en Hetzner', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-1-1', position: 1, title: 'Configurar SSL con Let\'s Encrypt', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-1-2', position: 2, title: 'Configurar pipeline CI/CD GitHub Actions', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-1-3', position: 3, title: 'Monitorizar logs y uso de memoria diario', type: 'recurring', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-1-4', position: 4, title: 'Configurar backups automáticos S3', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-1-5', position: 5, title: 'Ajustar reglas de firewall y UFW', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-1-6', position: 6, title: 'Configurar alertas de caídas con Uptime', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-1-7', position: 7, title: 'Optimizar caché Redis y tiempos HTTP', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
        ],
      },
      {
        id: 'p-2',
        position: 2,
        title: 'Diseño UX & Frontend',
        colorTheme: 'Violet',
        actions: [
          { id: 'a-2-0', position: 0, title: 'Diseñar wireframes en Figma', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-2-1', position: 1, title: 'Crear sistema de diseño Tailwind', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-2-2', position: 2, title: 'Desarrollar dashboard interactivo', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-2-3', position: 3, title: 'Auditar accesibilidad y contraste', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-2-4', position: 4, title: 'Pulir microinteracciones con Motion', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-2-5', position: 5, title: 'Hacer pruebas en móvil responsive', type: 'recurring', isCompleted: true, streakCount: 4, habitDays: [true,true,true,true,false,false,false] },
          { id: 'a-2-6', position: 6, title: 'Optimizar Web Vitals para 90+ score', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-2-7', position: 7, title: 'Implementar dark mode elegante', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
        ],
      },
      {
        id: 'p-3',
        position: 3,
        title: 'Adquisición & Marketing',
        colorTheme: 'Fuchsia',
        actions: [
          { id: 'a-3-0', position: 0, title: 'Lanzar landing page con waitlist', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-3-1', position: 1, title: 'Publicar 1 hilo de #BuildInPublic diario', type: 'recurring', isCompleted: true, streakCount: 8, habitDays: [true,true,true,true,true,true,true] },
          { id: 'a-3-2', position: 2, title: 'Contactar 5 usuarios potenciales al día', type: 'recurring', isCompleted: false, streakCount: 1, habitDays: [true,false,false,false,false,false,false] },
          { id: 'a-3-3', position: 3, title: 'Preparar lanzamiento en Product Hunt', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-3-4', position: 4, title: 'Escribir 2 artículos SEO técnicos al mes', type: 'recurring', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-3-5', position: 5, title: 'Crear vídeo demo corto de 60 segundos', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-3-6', position: 6, title: 'Participar activamente en comunidades dev', type: 'recurring', isCompleted: false, streakCount: 3, habitDays: [true,true,true,false,false,false,false] },
          { id: 'a-3-7', position: 7, title: 'Medir tasa de conversión de la landing', type: 'recurring', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
        ],
      },
      {
        id: 'p-4',
        position: 4,
        title: 'Validación & Feedback',
        colorTheme: 'Rose',
        actions: [
          { id: 'a-4-0', position: 0, title: 'Conseguir 20 beta testers activos', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-4-1', position: 1, title: 'Llamada semanal con 2 usuarios beta', type: 'recurring', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-4-2', position: 2, title: 'Instalar widget de feedback in-app', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-4-3', position: 3, title: 'Analizar grabaciones de sesión (PostHog)', type: 'recurring', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-4-4', position: 4, title: 'Documentar los 5 mayores puntos de dolor', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-4-5', position: 5, title: 'Iterar el onboarding según fricción', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-4-6', position: 6, title: 'Calcular Net Promoter Score preliminar', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-4-7', position: 7, title: 'Publicar changelog semanal con mejoras', type: 'recurring', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
        ],
      },
      {
        id: 'p-5',
        position: 5,
        title: 'Monetización & Precios',
        colorTheme: 'Amber',
        actions: [
          { id: 'a-5-0', position: 0, title: 'Definir tiers Freemium vs Pro', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-5-1', position: 1, title: 'Configurar portal de facturación Stripe', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-5-2', position: 2, title: 'Establecer política de reembolsos', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-5-3', position: 3, title: 'Testear cobro recurrente con webhooks', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-5-4', position: 4, title: 'Revisión semanal de MRR y churn', type: 'recurring', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-5-5', position: 5, title: 'Crear oferta Early Bird limitada', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-5-6', position: 6, title: 'Automatizar correos de tarjeta vencida', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-5-7', position: 7, title: 'Calcular CAC vs LTV estimado', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
        ],
      },
      {
        id: 'p-6',
        position: 6,
        title: 'Disciplina & Hábitos',
        colorTheme: 'Emerald',
        actions: [
          { id: 'a-6-0', position: 0, title: 'Bloque de Deep Work de 8:00 a 11:00', type: 'recurring', isCompleted: true, streakCount: 14, habitDays: [true,true,true,true,true,true,true] },
          { id: 'a-6-1', position: 1, title: 'Caminar 30 minutos al aire libre', type: 'recurring', isCompleted: true, streakCount: 10, habitDays: [true,true,true,true,true,false,false] },
          { id: 'a-6-2', position: 2, title: 'Dormir mínimo 7.5 horas cada noche', type: 'recurring', isCompleted: false, streakCount: 3, habitDays: [false,true,true,true,false,false,false] },
          { id: 'a-6-3', position: 3, title: 'Apagar notificaciones del móvil al trabajar', type: 'recurring', isCompleted: true, streakCount: 7, habitDays: [true,true,true,true,true,true,true] },
          { id: 'a-6-4', position: 4, title: 'Check-in semanal los domingos a las 18h', type: 'recurring', isCompleted: true, streakCount: 4, habitDays: [false,false,false,false,false,false,true] },
          { id: 'a-6-5', position: 5, title: 'Leer 20 páginas de libros de negocio', type: 'recurring', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-6-6', position: 6, title: 'Mantener escritorio y entorno despejado', type: 'recurring', isCompleted: true, streakCount: 6, habitDays: [true,true,true,true,true,true,false] },
          { id: 'a-6-7', position: 7, title: 'Día de descanso digital cada dos semanas', type: 'recurring', isCompleted: false, streakCount: 1, habitDays: [false,false,false,false,false,false,false] },
        ],
      },
      {
        id: 'p-7',
        position: 7,
        title: 'Legal & Operaciones',
        colorTheme: 'Teal',
        actions: [
          { id: 'a-7-0', position: 0, title: 'Comprar dominio y configurar Google Workspace', type: 'one_time', isCompleted: true, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-7-1', position: 1, title: 'Redactar Términos y Política de Privacidad (RGPD)', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-7-2', position: 2, title: 'Abrir cuenta bancaria para el proyecto', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-7-3', position: 3, title: 'Registrar la marca comercial', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-7-4', position: 4, title: 'Configurar aviso de cookies conforme a normativa', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-7-5', position: 5, title: 'Contratar seguro o asesoría fiscal básica', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-7-6', position: 6, title: 'Archivar facturas y gastos mensuales', type: 'recurring', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
          { id: 'a-7-7', position: 7, title: 'Crear plantilla de acuerdo de confidencialidad', type: 'one_time', isCompleted: false, streakCount: 0, habitDays: [false,false,false,false,false,false,false] },
        ],
      },
    ],
  },
];
