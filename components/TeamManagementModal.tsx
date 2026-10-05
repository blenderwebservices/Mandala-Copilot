import React, { useState } from 'react';
import { useSaaS } from '../context/SaaSContext';
import { TeamRole, SaaSPlan } from '../types/saas';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  X,
  Check,
  Crown,
  Sparkles,
  Building,
  Mail,
  ChevronRight,
  Plus
} from 'lucide-react';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentTeam,
    currentUser,
    userTeams,
    isTeamAdmin,
    inviteTeamMember,
    removeTeamMember,
    updateMemberRole,
    updateTeamPlan,
    createTeam,
    switchTeam,
  } = useSaaS();

  const [activeTab, setActiveTab] = useState<'members' | 'invite' | 'new_team' | 'plans'>('members');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('editor');
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // New team form
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPlan, setNewTeamPlan] = useState<SaaSPlan>('pro');

  if (!isOpen) return null;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    const ok = inviteTeamMember(currentTeam.id, inviteEmail.trim(), inviteRole, inviteName.trim());
    if (ok) {
      setInviteFeedback(`¡Invitación enviada exitosamente a ${inviteEmail}!`);
      setInviteEmail('');
      setInviteName('');
      setTimeout(() => {
        setInviteFeedback(null);
        setActiveTab('members');
      }, 1500);
    } else {
      setInviteFeedback('El usuario ya pertenece a este equipo o hubo un error.');
    }
  };

  const handleCreateNewTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const team = createTeam(newTeamName.trim(), newTeamPlan);
    setNewTeamName('');
    setActiveTab('members');
  };

  const roleLabels: Record<TeamRole, { label: string; badge: string }> = {
    owner: { label: 'Propietario', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border-amber-300 dark:border-amber-500/30' },
    admin: { label: 'Administrador', badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30' },
    editor: { label: 'Editor', badge: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300 border-teal-300 dark:border-teal-500/30' },
    viewer: { label: 'Lector', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentTeam.name}
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  Plan {currentTeam.plan.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestión de integrantes, permisos y espacios compartidos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 text-xs font-medium shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Integrantes ({currentTeam.members.length})</span>
          </button>

          {isTeamAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('invite')}
              className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'invite'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Invitar Miembro</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('new_team')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'new_team'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Crear Equipo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'plans'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            <span>Planes de Equipo</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: MEMBERS LIST */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span>
                  Límite de integrantes: <strong className="text-slate-700 dark:text-slate-200">{currentTeam.members.length}</strong> de {currentTeam.maxMembers}
                </span>
                <span className="text-[11px]">
                  Capacidad de metas: <strong>{currentTeam.maxGoals}</strong> metas
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {currentTeam.members.map((member) => {
                  const isCurrent = member.userId === currentUser.id;
                  const isOwner = member.role === 'owner';

                  return (
                    <div
                      key={`team-member-${member.userId}`}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                          alt={member.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {member.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold">
                                Tú
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">
                            {member.email}
                          </span>
                        </div>
                      </div>

                      {/* Role selection & actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isTeamAdmin && !isOwner && !isCurrent ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              updateMemberRole(
                                currentTeam.id,
                                member.userId,
                                e.target.value as TeamRole
                              )
                            }
                            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="admin">Administrador</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Lector</option>
                          </select>
                        ) : (
                          <span
                            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border ${
                              roleLabels[member.role]?.badge || 'bg-slate-100'
                            }`}
                          >
                            {roleLabels[member.role]?.label || member.role}
                          </span>
                        )}

                        {isTeamAdmin && !isOwner && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => removeTeamMember(currentTeam.id, member.userId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Remover del equipo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INVITE FORM */}
          {activeTab === 'invite' && (
            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/30 text-xs text-indigo-900 dark:text-indigo-200">
                <p className="font-semibold mb-1">Colaboración en tiempo real</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Los miembros invitados tendrán acceso a las metas asignadas a <strong>{currentTeam.name}</strong> y podrán colaborar según el rol asignado.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico del Miembro
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colega@empresa.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre (Opcional)
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ej. Roberto Gómez"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rol y Permisos
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { role: 'editor', title: 'Editor', desc: 'Puede editar y completar acciones' },
                    { role: 'admin', title: 'Admin', desc: 'Gestiona integrantes y metas' },
                    { role: 'viewer', title: 'Lector', desc: 'Solo lectura y visualización' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => setInviteRole(r.role as TeamRole)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        inviteRole === r.role
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{r.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {inviteFeedback && (
                <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-xs font-medium border border-teal-200 dark:border-teal-500/30">
                  {inviteFeedback}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span>Enviar Invitación al Equipo</span>
              </button>
            </form>
          )}

          {/* TAB 3: CREATE NEW TEAM */}
          {activeTab === 'new_team' && (
            <form onSubmit={handleCreateNewTeam} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                <p className="font-semibold mb-1">Crea un nuevo Workspace o Squad</p>
                <p className="text-slate-500 dark:text-slate-400">
                  Cada equipo cuenta con su propia biblioteca de metas 9x9 aisladas, integrantes y configuraciones de colaboración.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Equipo
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Ej. Marketing Growth Squad, Frontend Core"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nivel de Plan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { plan: 'starter', title: 'Starter', desc: 'Hasta 3 miembros' },
                    { plan: 'pro', title: 'Team Pro', desc: 'Hasta 15 miembros' },
                    { plan: 'enterprise', title: 'Enterprise', desc: 'Hasta 50 miembros' },
                  ].map((p) => (
                    <button
                      key={p.plan}
                      type="button"
                      onClick={() => setNewTeamPlan(p.plan as SaaSPlan)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        newTeamPlan === p.plan
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Crear Workspace y Cambiar a él</span>
              </button>
            </form>
          )}

          {/* TAB 4: PLANS & LIMITS */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    plan: 'starter' as SaaSPlan,
                    name: 'Starter',
                    price: '$0',
                    features: ['3 Integrantes', '5 Metas activas', 'Soporte estándar'],
                  },
                  {
                    plan: 'pro' as SaaSPlan,
                    name: 'Team Pro',
                    price: '$19 / mes',
                    features: ['15 Integrantes', '30 Metas 9x9', 'IA Gemini Ilimitada', 'Roles Editor y Admin'],
                  },
                  {
                    plan: 'enterprise' as SaaSPlan,
                    name: 'Enterprise',
                    price: '$79 / mes',
                    features: ['50 Integrantes', '100 Metas', 'Auditoría & SSO', 'Soporte prioritario 24/7'],
                  },
                ].map((tier) => {
                  const isCurrent = currentTeam.plan === tier.plan;
                  return (
                    <div
                      key={tier.plan}
                      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/50'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">{tier.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold">
                              Actual
                            </span>
                          )}
                        </div>
                        <p className="text-base font-extrabold font-mono text-slate-900 dark:text-white mb-2">
                          {tier.price}
                        </p>
                        <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                          {tier.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => updateTeamPlan(currentTeam.id, tier.plan)}
                          disabled={isCurrent || !isTeamAdmin}
                          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isCurrent
                              ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                          }`}
                        >
                          {isCurrent ? 'Plan Activo' : 'Elegir Plan'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
