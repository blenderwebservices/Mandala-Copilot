import { SaaSUser, SaaSTeam, TeamRole, SaaSPlan, AdminMetrics, GlobalRole } from '../types/saas';

const USERS_STORAGE_KEY = 'mandala_saas_users_v1';
const TEAMS_STORAGE_KEY = 'mandala_saas_teams_v1';
const CURRENT_USER_KEY = 'mandala_saas_current_user_v1';

export const INITIAL_USERS: SaaSUser[] = [
  {
    id: 'user-francisco',
    name: 'Francisco (Superadmin)',
    email: 'francisco@mandala.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    role: 'superadmin',
    currentTeamId: 'team-mandala-core',
    plan: 'enterprise',
    status: 'active',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'user-elena',
    name: 'Elena Rivas (Team Lead)',
    email: 'elena@growthteam.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    role: 'admin',
    currentTeamId: 'team-growth',
    plan: 'pro',
    status: 'active',
    createdAt: '2026-02-15T09:30:00.000Z',
  },
  {
    id: 'user-carlos',
    name: 'Carlos Vega (Developer)',
    email: 'carlos@devsquad.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    role: 'member',
    currentTeamId: 'team-mandala-core',
    plan: 'pro',
    status: 'active',
    createdAt: '2026-03-01T11:15:00.000Z',
  },
  {
    id: 'user-sofia',
    name: 'Sofía Méndez (Product Designer)',
    email: 'sofia@designstudio.io',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
    role: 'member',
    currentTeamId: 'team-mandala-core',
    plan: 'pro',
    status: 'active',
    createdAt: '2026-03-12T14:20:00.000Z',
  },
  {
    id: 'user-guest',
    name: 'Usuario Starter Demo',
    email: 'demo@mandala.io',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
    role: 'member',
    currentTeamId: 'team-personal-guest',
    plan: 'starter',
    status: 'active',
    createdAt: '2026-04-01T10:00:00.000Z',
  },
];

export const INITIAL_TEAMS: SaaSTeam[] = [
  {
    id: 'team-mandala-core',
    name: 'Mandala Core Team',
    slug: 'mandala-core',
    ownerId: 'user-francisco',
    plan: 'enterprise',
    maxMembers: 30,
    maxGoals: 100,
    createdAt: '2026-01-10T08:00:00.000Z',
    members: [
      {
        userId: 'user-francisco',
        name: 'Francisco (Superadmin)',
        email: 'francisco@mandala.io',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        role: 'owner',
        joinedAt: '2026-01-10T08:00:00.000Z',
      },
      {
        userId: 'user-carlos',
        name: 'Carlos Vega (Developer)',
        email: 'carlos@devsquad.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
        role: 'editor',
        joinedAt: '2026-03-01T11:15:00.000Z',
      },
      {
        userId: 'user-sofia',
        name: 'Sofía Méndez (Product Designer)',
        email: 'sofia@designstudio.io',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
        role: 'editor',
        joinedAt: '2026-03-12T14:20:00.000Z',
      },
      {
        userId: 'user-elena',
        name: 'Elena Rivas (Team Lead)',
        email: 'elena@growthteam.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
        role: 'viewer',
        joinedAt: '2026-02-15T09:30:00.000Z',
      },
    ],
  },
  {
    id: 'team-growth',
    name: 'Growth & Marketing Squad',
    slug: 'growth-squad',
    ownerId: 'user-elena',
    plan: 'pro',
    maxMembers: 12,
    maxGoals: 40,
    createdAt: '2026-02-15T09:30:00.000Z',
    members: [
      {
        userId: 'user-elena',
        name: 'Elena Rivas (Team Lead)',
        email: 'elena@growthteam.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
        role: 'owner',
        joinedAt: '2026-02-15T09:30:00.000Z',
      },
      {
        userId: 'user-francisco',
        name: 'Francisco (Superadmin)',
        email: 'francisco@mandala.io',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        role: 'admin',
        joinedAt: '2026-02-16T10:00:00.000Z',
      },
    ],
  },
  {
    id: 'team-personal-francisco',
    name: 'Espacio Personal (Francisco)',
    slug: 'francisco-personal',
    ownerId: 'user-francisco',
    plan: 'enterprise',
    maxMembers: 1,
    maxGoals: 50,
    createdAt: '2026-01-10T08:00:00.000Z',
    members: [
      {
        userId: 'user-francisco',
        name: 'Francisco (Superadmin)',
        email: 'francisco@mandala.io',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        role: 'owner',
        joinedAt: '2026-01-10T08:00:00.000Z',
      },
    ],
  },
  {
    id: 'team-personal-guest',
    name: 'Mi Espacio Personal (Starter)',
    slug: 'guest-personal',
    ownerId: 'user-guest',
    plan: 'starter',
    maxMembers: 1,
    maxGoals: 3,
    createdAt: '2026-04-01T10:00:00.000Z',
    members: [
      {
        userId: 'user-guest',
        name: 'Usuario Starter Demo',
        email: 'demo@mandala.io',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        role: 'owner',
        joinedAt: '2026-04-01T10:00:00.000Z',
      },
    ],
  },
];

export function getStoredUsers(): SaaSUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored SaaS users:', e);
  }
  return INITIAL_USERS;
}

export function saveStoredUsers(users: SaaSUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving SaaS users:', e);
  }
}

export function getStoredTeams(): SaaSTeam[] {
  try {
    const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored SaaS teams:', e);
  }
  return INITIAL_TEAMS;
}

export function saveStoredTeams(teams: SaaSTeam[]): void {
  try {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teams));
  } catch (e) {
    console.error('Error saving SaaS teams:', e);
  }
}

export function getStoredCurrentUserId(): string {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (stored) return stored;
  } catch (e) {
    // ignore
  }
  return 'user-francisco';
}

export function saveStoredCurrentUserId(userId: string): void {
  try {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } catch (e) {
    console.error('Error saving current user id:', e);
  }
}

export function calculateAdminMetrics(users: SaaSUser[], teams: SaaSTeam[], totalGoalsCount: number = 18): AdminMetrics {
  const planDistribution = {
    starter: 0,
    pro: 0,
    enterprise: 0,
  };

  users.forEach((u) => {
    if (planDistribution[u.plan] !== undefined) {
      planDistribution[u.plan]++;
    }
  });

  const activeUsers = users.filter((u) => u.status === 'active').length;
  // Estimated MRR: Starter = $0, Pro = $19/mo, Enterprise = $79/mo
  const estimatedMRR = planDistribution.pro * 19 + planDistribution.enterprise * 79;

  return {
    totalUsers: users.length,
    activeUsers,
    totalTeams: teams.length,
    totalGoals: totalGoalsCount,
    completedActions: Math.round(totalGoalsCount * 64 * 0.42),
    estimatedMRR,
    aiTokensUsedThisMonth: 184500,
    planDistribution,
  };
}
