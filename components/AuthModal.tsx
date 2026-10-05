import React, { useState } from 'react';
import { useSaaS } from '../context/SaaSContext';
import { X, Check, UserCheck, Shield, Users, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTeamModal: () => void;
  onOpenAdminModal: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenTeamModal,
  onOpenAdminModal,
}) => {
  const { allUsers, currentUser, switchUser, isSuperAdmin, isAdmin } = useSaaS();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Perfil de Usuario & Sesión SaaS
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alterna entre roles para probar permisos de usuario y administrador
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

        {/* Current Active User Banner */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/30 dark:bg-indigo-950/15">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Plan activo: <strong className="text-indigo-600 dark:text-indigo-400 uppercase font-mono">{currentUser.plan}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminModal();
                }}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Panel Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTeamModal();
              }}
              className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Mi Equipo</span>
            </button>
          </div>
        </div>

        {/* Fast User Switcher */}
        <div className="p-5 space-y-3">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Cambiar de Identidad (Demo Switcher)
          </p>

          <div className="space-y-2">
            {allUsers.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    switchUser(u.id);
                  }}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 ring-1 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {u.role.toUpperCase()} · Plan {u.plan.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-indigo-600 dark:text-indigo-400">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
