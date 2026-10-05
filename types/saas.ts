export type SaaSPlan = 'starter' | 'pro' | 'enterprise';

export type GlobalRole = 'superadmin' | 'admin' | 'member';

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface SaaSUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: GlobalRole;
  currentTeamId: string;
  plan: SaaSPlan;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: TeamRole;
  joinedAt: string;
}

export interface SaaSTeam {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: SaaSPlan;
  members: TeamMember[];
  maxMembers: number;
  maxGoals: number;
  createdAt: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTeams: number;
  totalGoals: number;
  completedActions: number;
  estimatedMRR: number;
  aiTokensUsedThisMonth: number;
  planDistribution: {
    starter: number;
    pro: number;
    enterprise: number;
  };
}

export interface TeamInvitePayload {
  email: string;
  role: TeamRole;
}
