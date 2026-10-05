import React, { useState } from 'react';
import { useSaaS } from '../context/SaaSContext';
import { GlobalRole, SaaSPlan } from '../types/saas';
import { matchAnyTextAccentInsensitive } from '../services/searchUtils';
import {
  ShieldCheck,
  Users,
  Building,
  TrendingUp,
  Cpu,
  Search,
  X,
  Crown,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  ArrowUpRight,
  UserCog
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    allUsers,
    allTeams,
    metrics,
    currentUser,
    isSuperAdmin,
    updateUserRole,
    updateUserPlan,
    updateUserStatus,
    updateTeamPlan,
  } = useSaaS();

  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'teams' | 'ai_config'>('metrics');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter((u) => {
    if (!searchQuery.trim()) return true;
    return matchAnyTextAccentInsensitive([u.name, u.email], searchQuery);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 dark:bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-[#0b0f17] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Panel de Administración SaaS
                </h2>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                  {isSuperAdmin ? 'Superadmin' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control de usuarios, workspaces, métricas comerciales y cuotas de IA
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

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 text-xs font-medium shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'metrics'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Métricas & MRR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Usuarios ({allUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'teams'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Equipos ({allTeams.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai_config')}
            className={`px-3 py-2 border-b-2 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ai_config'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-indigo-500" />
            <span>Motor IA & Cuotas</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: METRICS & MRR */}
          {activeTab === 'metrics' && (
            <div className="space-y-5">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>MRR Estimado</span>
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                    ${metrics.estimatedMRR} <span className="text-xs font-normal text-slate-400">/mes</span>
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" /> +18.4% este mes
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>Usuarios Activos</span>
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                  </div>
                  <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {metrics.activeUsers} <span className="text-xs font-normal text-slate-400">/ {metrics.totalUsers}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">100% retención</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>Workspaces</span>
                    <Building className="h-3.5 w-3.5 text-teal-500" />
                  </div>
                  <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {metrics.totalTeams}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Equipos colaborativos</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>Consumo IA</span>
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {(metrics.aiTokensUsedThisMonth / 1000).toFixed(1)}k <span className="text-xs font-normal text-slate-400">tokens</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Gemini 2.5/3.8 Flash</p>
                </div>
              </div>

              {/* Plan Distribution Progress */}
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Distribución de Suscripciones por Plan
                </h3>

                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${(metrics.planDistribution.enterprise / metrics.totalUsers) * 100}%` }}
                    className="bg-indigo-600 h-full"
                    title={`Enterprise: ${metrics.planDistribution.enterprise}`}
                  />
                  <div
                    style={{ width: `${(metrics.planDistribution.pro / metrics.totalUsers) * 100}%` }}
                    className="bg-teal-500 h-full"
                    title={`Pro: ${metrics.planDistribution.pro}`}
                  />
                  <div
                    style={{ width: `${(metrics.planDistribution.starter / metrics.totalUsers) * 100}%` }}
                    className="bg-slate-300 dark:bg-slate-600 h-full"
                    title={`Starter: ${metrics.planDistribution.starter}`}
                  />
                </div>

                <div className="flex items-center gap-6 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <span className="text-slate-600 dark:text-slate-400">Enterprise:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{metrics.planDistribution.enterprise}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <span className="text-slate-600 dark:text-slate-400">Team Pro:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{metrics.planDistribution.pro}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400">Starter:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{metrics.planDistribution.starter}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o correo electrónico..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Usuario</th>
                      <th className="px-4 py-3 font-semibold">Rol Global</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredUsers.map((user) => {
                      const isSelf = user.id === currentUser.id;
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                              />
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  {user.name}
                                  {isSelf && (
                                    <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 px-1 rounded">
                                      Tú
                                    </span>
                                  )}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role selector */}
                          <td className="px-4 py-3">
                            <select
                              value={user.role}
                              disabled={isSelf || !isSuperAdmin}
                              onChange={(e) => updateUserRole(user.id, e.target.value as GlobalRole)}
                              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="superadmin">Superadmin</option>
                              <option value="admin">Admin</option>
                              <option value="member">Miembro</option>
                            </select>
                          </td>

                          {/* Plan selector */}
                          <td className="px-4 py-3">
                            <select
                              value={user.plan}
                              onChange={(e) => updateUserPlan(user.id, e.target.value as SaaSPlan)}
                              className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none uppercase font-mono text-[10px]"
                            >
                              <option value="starter">Starter</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                user.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                              }`}
                            >
                              {user.status === 'active' ? 'Activo' : 'Suspendido'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateUserStatus(
                                    user.id,
                                    user.status === 'active' ? 'suspended' : 'active'
                                  )
                                }
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                  user.status === 'active'
                                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                    : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                }`}
                              >
                                {user.status === 'active' ? 'Suspender' : 'Reactivar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TEAMS DIRECTORY */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allTeams.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-500" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {team.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                          {team.plan}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {team.members.length} de {team.maxMembers} miembros · Capacidad: {team.maxGoals} metas
                      </p>

                      <div className="flex items-center -space-x-2 mb-3">
                        {team.members.map((m) => (
                          <img
                            key={m.userId}
                            src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                            alt={m.name}
                            title={`${m.name} (${m.role})`}
                            className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {team.slug}
                      </span>
                      <select
                        value={team.plan}
                        onChange={(e) => updateTeamPlan(team.id, e.target.value as SaaSPlan)}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AI & SYSTEM CONFIG */}
          {activeTab === 'ai_config' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Orquestación del Motor de Inteligencia Artificial
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Las solicitudes de generación de los 8 pilares, 64 acciones y recalibraciones 9x9 son procesadas a través del SDK de Google Gemini.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Modelo Gemini Predeterminado
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                    gemini-2.5-flash / gemini-3.8-flash
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Baja latencia (&lt;1500ms) y alta precisión en taxonomía estratégica.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2">
                  <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    Políticas de Cuotas por Plan
                  </span>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                    <li>• <strong>Starter</strong>: 10 consultas IA / día</li>
                    <li>• <strong>Team Pro</strong>: Consultas ilimitadas con rate limit</li>
                    <li>• <strong>Enterprise</strong>: Cuota dedicada y soporte prioritario</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
