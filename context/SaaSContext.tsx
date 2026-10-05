import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  SaaSUser,
  SaaSTeam,
  TeamRole,
  GlobalRole,
  SaaSPlan,
  AdminMetrics,
  TeamMember,
} from '../types/saas';
import {
  getStoredUsers,
  saveStoredUsers,
  getStoredTeams,
  saveStoredTeams,
  getStoredCurrentUserId,
  saveStoredCurrentUserId,
  calculateAdminMetrics,
} from '../services/saasService';

interface SaaSContextType {
  currentUser: SaaSUser;
  currentTeam: SaaSTeam;
  userTeams: SaaSTeam[];
  allUsers: SaaSUser[];
  allTeams: SaaSTeam[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isTeamAdmin: boolean;
  metrics: AdminMetrics;
  switchUser: (userId: string) => void;
  switchTeam: (teamId: string) => void;
  createTeam: (name: string, plan?: SaaSPlan) => SaaSTeam;
  inviteTeamMember: (teamId: string, email: string, role: TeamRole, name?: string) => boolean;
  removeTeamMember: (teamId: string, userId: string) => boolean;
  updateMemberRole: (teamId: string, userId: string, newRole: TeamRole) => boolean;
  updateUserRole: (userId: string, newRole: GlobalRole) => void;
  updateUserPlan: (userId: string, newPlan: SaaSPlan) => void;
  updateUserStatus: (userId: string, newStatus: 'active' | 'suspended') => void;
  updateTeamPlan: (teamId: string, newPlan: SaaSPlan) => void;
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

export const SaaSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<SaaSUser[]>(getStoredUsers);
  const [teams, setTeams] = useState<SaaSTeam[]>(getStoredTeams);
  const [currentUserId, setCurrentUserId] = useState<string>(getStoredCurrentUserId);
  const [currentTeamId, setCurrentTeamId] = useState<string>(() => {
    const user = getStoredUsers().find((u) => u.id === getStoredCurrentUserId());
    return user?.currentTeamId || getStoredTeams()[0]?.id || 'team-mandala-core';
  });

  // Persist whenever state changes
  useEffect(() => {
    saveStoredUsers(users);
  }, [users]);

  useEffect(() => {
    saveStoredTeams(teams);
  }, [teams]);

  useEffect(() => {
    saveStoredCurrentUserId(currentUserId);
  }, [currentUserId]);

  const currentUser: SaaSUser =
    users.find((u) => u.id === currentUserId) || users[0];

  // Teams that the current user belongs to
  const userTeams = teams.filter((t) =>
    t.members.some((m) => m.userId === currentUser.id)
  );

  const currentTeam: SaaSTeam =
    teams.find((t) => t.id === currentTeamId) ||
    userTeams[0] ||
    teams[0];

  const isSuperAdmin = currentUser.role === 'superadmin';
  const isAdmin = currentUser.role === 'superadmin' || currentUser.role === 'admin';

  const teamMemberRecord = currentTeam.members.find((m) => m.userId === currentUser.id);
  const isTeamAdmin =
    isSuperAdmin ||
    currentTeam.ownerId === currentUser.id ||
    teamMemberRecord?.role === 'owner' ||
    teamMemberRecord?.role === 'admin';

  const metrics = calculateAdminMetrics(users, teams);

  const switchUser = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    setCurrentUserId(userId);
    // Auto switch to their team
    if (targetUser.currentTeamId) {
      setCurrentTeamId(targetUser.currentTeamId);
    } else {
      const userTeam = teams.find((t) => t.members.some((m) => m.userId === userId));
      if (userTeam) setCurrentTeamId(userTeam.id);
    }
  };

  const switchTeam = (teamId: string) => {
    const target = teams.find((t) => t.id === teamId);
    if (target) {
      setCurrentTeamId(teamId);
      // Update user current team
      setUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id ? { ...u, currentTeamId: teamId } : u
        )
      );
    }
  };

  const createTeam = (name: string, plan: SaaSPlan = 'pro'): SaaSTeam => {
    const newTeam: SaaSTeam = {
      id: `team-${Date.now()}`,
      name: name.trim(),
      slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      ownerId: currentUser.id,
      plan,
      maxMembers: plan === 'enterprise' ? 50 : plan === 'pro' ? 15 : 3,
      maxGoals: plan === 'enterprise' ? 100 : plan === 'pro' ? 30 : 5,
      createdAt: new Date().toISOString(),
      members: [
        {
          userId: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          role: 'owner',
          joinedAt: new Date().toISOString(),
        },
      ],
    };

    setTeams((prev) => [newTeam, ...prev]);
    setCurrentTeamId(newTeam.id);
    return newTeam;
  };

  const inviteTeamMember = (
    teamId: string,
    email: string,
    role: TeamRole,
    name?: string
  ): boolean => {
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam) return false;

    // Check if user exists in system
    let existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!existingUser) {
      // Auto-provision user account for the invited member
      const cleanName = name || email.split('@')[0];
      const newUser: SaaSUser = {
        id: `user-${Date.now()}`,
        name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        email: email.trim().toLowerCase(),
        avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 999999)}?w=100&h=100&fit=crop&crop=faces`,
        role: 'member',
        currentTeamId: teamId,
        plan: targetTeam.plan,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
      existingUser = newUser;
    }

    // Check if already member
    if (targetTeam.members.some((m) => m.userId === existingUser!.id)) {
      return false; // Already in team
    }

    const newMember: TeamMember = {
      userId: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      avatar: existingUser.avatar,
      role,
      joinedAt: new Date().toISOString(),
    };

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: [...t.members, newMember],
            }
          : t
      )
    );

    return true;
  };

  const removeTeamMember = (teamId: string, userId: string): boolean => {
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam) return false;
    // Cannot remove owner
    if (targetTeam.ownerId === userId) return false;

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: t.members.filter((m) => m.userId !== userId),
            }
          : t
      )
    );
    return true;
  };

  const updateMemberRole = (teamId: string, userId: string, newRole: TeamRole): boolean => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.userId === userId ? { ...m, role: newRole } : m
              ),
            }
          : t
      )
    );
    return true;
  };

  const updateUserRole = (userId: string, newRole: GlobalRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const updateUserPlan = (userId: string, newPlan: SaaSPlan) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
    );
  };

  const updateUserStatus = (userId: string, newStatus: 'active' | 'suspended') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
  };

  const updateTeamPlan = (teamId: string, newPlan: SaaSPlan) => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              plan: newPlan,
              maxMembers: newPlan === 'enterprise' ? 50 : newPlan === 'pro' ? 15 : 3,
              maxGoals: newPlan === 'enterprise' ? 100 : newPlan === 'pro' ? 30 : 5,
            }
          : t
      )
    );
  };

  return (
    <SaaSContext.Provider
      value={{
        currentUser,
        currentTeam,
        userTeams,
        allUsers: users,
        allTeams: teams,
        isSuperAdmin,
        isAdmin,
        isTeamAdmin,
        metrics,
        switchUser,
        switchTeam,
        createTeam,
        inviteTeamMember,
        removeTeamMember,
        updateMemberRole,
        updateUserRole,
        updateUserPlan,
        updateUserStatus,
        updateTeamPlan,
      }}
    >
      {children}
    </SaaSContext.Provider>
  );
};

export const useSaaS = (): SaaSContextType => {
  const context = useContext(SaaSContext);
  if (!context) {
    throw new Error('useSaaS must be used within a SaaSProvider');
  }
  return context;
};
