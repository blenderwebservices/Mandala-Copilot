/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Goal, Pillar, MandalaAction, SaasTier, PRESET_GOALS } from './types/mandala';
import { Navbar, ActiveViewType } from './components/Navbar';
import { GlobalFilterBar, GlobalFilterStatus, GlobalFilterStats } from './components/GlobalFilterBar';
import { MandalaGrid9x9 } from './components/MandalaGrid9x9';
import { MandalaHierarchyView } from './components/MandalaHierarchyView';
import { MandalaGanttView } from './components/MandalaGanttView';
import { PillarFocusModal } from './components/PillarFocusModal';
import { OnboardingModal } from './components/OnboardingModal';
import { RecalibrateModal } from './components/RecalibrateModal';
import { WeeklyCheckinModal } from './components/WeeklyCheckinModal';
import { SaaSTierModal } from './components/SaaSTierModal';
import { ExportPrintModal } from './components/ExportPrintModal';
import { GoalsLibraryView } from './components/GoalsLibraryView';
import { MainGoalModal } from './components/MainGoalModal';
import { matchAnyTextAccentInsensitive } from './services/searchUtils';
import { 
  fetchGeneratedActions, 
  GeneratedAction, 
  GeminiStatusResult, 
  fetchGeminiStatus 
} from './services/api';
import { AiStatusModal } from './components/AiStatusModal';
import { DocumentManagerModal, DocumentModalTab } from './components/DocumentManagerModal';
import { downloadDocumentFile, duplicateGoal, stripPollution, getGoalFingerprint } from './services/documentService';
import { SaaSProvider, useSaaS } from './context/SaaSContext';
import { TeamManagementModal } from './components/TeamManagementModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { AuthModal } from './components/AuthModal';
import { AlertCircle, Key, X } from 'lucide-react';

const STORAGE_KEY = 'mandala_copilot_goals_v1';
const TIER_STORAGE_KEY = 'mandala_copilot_tier_v1';

function AppContent() {
  const { currentTeam, currentUser } = useSaaS();

  // Load goals from localStorage or fallback to preset with schema validation (Pilar 5 & 13)
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const rawParsed = JSON.parse(stored);
        if (Array.isArray(rawParsed) && rawParsed.length > 0) {
          // Strictly validate structural integrity of each goal
          const validGoals = rawParsed.filter(
            (g) =>
              g &&
              typeof g === 'object' &&
              typeof g.id === 'string' &&
              typeof g.title === 'string' &&
              Array.isArray(g.pillars) &&
              g.pillars.length > 0 &&
              g.pillars.every((p: any) => p && typeof p === 'object' && Array.isArray(p.actions))
          );
          if (validGoals.length > 0) {
            return stripPollution(validGoals);
          }
        }
      }
    } catch (e) {
      console.error('Error loading saved goals:', e);
    }
    return PRESET_GOALS;
  });

  const [currentGoalId, setCurrentGoalId] = useState<string>(() => {
    return goals[0]?.id || PRESET_GOALS[0].id;
  });

  const [tier, setTier] = useState<SaasTier>(() => {
    try {
      const stored = localStorage.getItem(TIER_STORAGE_KEY);
      if (stored === 'free' || stored === 'pro') return stored;
    } catch (e) {
      // ignore
    }
    return 'pro'; // Default to Pro Copilot so user experiences all AI features
  });

  // Active view
  const [activeView, setActiveView] = useState<ActiveViewType>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'hierarchy';
    }
    return 'grid';
  });

  // Modals & Panels
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number | null>(null);

  // Global persistent search & status filter across all views
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalStatusFilter, setGlobalStatusFilter] = useState<GlobalFilterStatus>('all');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isMainGoalModalOpen, setIsMainGoalModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Gemini AI Status & Diagnostics
  const [aiStatus, setAiStatus] = useState<GeminiStatusResult | null>(null);
  const [isLoadingAiStatus, setIsLoadingAiStatus] = useState(true);
  const [isAiStatusModalOpen, setIsAiStatusModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Document Manager Modal State & Toast
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [documentModalTab, setDocumentModalTab] = useState<DocumentModalTab>('open');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Global keyboard shortcuts (Cmd+S / Ctrl+S to save, Cmd+O / Ctrl+O to open)
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          setDocumentModalTab('saveAs');
        } else {
          setDocumentModalTab('save');
        }
        setIsDocumentModalOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setDocumentModalTab('open');
        setIsDocumentModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, []);

  const handleOpenDocumentModal = (tab: DocumentModalTab = 'open') => {
    setDocumentModalTab(tab);
    setIsDocumentModalOpen(true);
  };

  const handleImportGoal = (importedGoal: Goal) => {
    setGoals((prev) => {
      const existsIndex = prev.findIndex((g) => g.id === importedGoal.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = importedGoal;
        return updated;
      }
      return [importedGoal, ...prev];
    });
    setCurrentGoalId(importedGoal.id);
    setSavedGoalFingerprint(getGoalFingerprint(importedGoal));
    setSavedGoalTime(importedGoal.updatedAt || importedGoal.createdAt);
    setActiveView('grid');
    showToast(`Documento "${importedGoal.title}" abierto en la matriz.`);
  };

  const handleDuplicateGoal = (goalToDup: Goal) => {
    const alreadyInList = goals.some((g) => g.id === goalToDup.id);
    const cloned = alreadyInList ? duplicateGoal(goalToDup) : goalToDup;
    setGoals((prev) => [cloned, ...prev.filter((g) => g.id !== cloned.id)]);
    setCurrentGoalId(cloned.id);
    setSavedGoalFingerprint(getGoalFingerprint(cloned));
    setSavedGoalTime(cloned.updatedAt || cloned.createdAt);
    setActiveView('grid');
    if (alreadyInList) {
      showToast(`Copia creada: "${cloned.title}".`);
    }
  };

  const handleSaveGoalToFile = (goalToSave: Goal) => {
    downloadDocumentFile(goalToSave);
    showToast(`Documento "${goalToSave.title}" descargado en archivo .mandala.`);
  };

  // Check Gemini connection on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAiStatus(true);
    fetchGeminiStatus()
      .then((status) => {
        if (isMounted) {
          setAiStatus(status);
          setIsLoadingAiStatus(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error al comprobar Gemini:", err);
          setIsLoadingAiStatus(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Recalibrate target
  const [recalibrateTarget, setRecalibrateTarget] = useState<{
    action: MandalaAction;
    actionIndex: number;
    pillarTitle: string;
    pillarIndex: number;
  } | null>(null);

  // Pillar generation loading state
  const [isGeneratingPillar, setIsGeneratingPillar] = useState<number | null>(null);
  const [isRegeneratingQuadrant, setIsRegeneratingQuadrant] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch (e) {
      console.error('Failed to save goals:', e);
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem(TIER_STORAGE_KEY, tier);
    } catch (e) {
      console.error('Failed to save tier:', e);
    }
  }, [tier]);

  const currentGoal = goals.find((g) => g.id === currentGoalId) || goals[0] || PRESET_GOALS[0];

  // Baseline fingerprint and timestamp tracking for change detection
  const [savedGoalFingerprint, setSavedGoalFingerprint] = useState<string>(() =>
    getGoalFingerprint(currentGoal)
  );
  const [savedGoalTime, setSavedGoalTime] = useState<string>(() =>
    currentGoal.updatedAt || currentGoal.createdAt
  );

  // Sync baseline when switching goals
  useEffect(() => {
    setSavedGoalFingerprint(getGoalFingerprint(currentGoal));
    setSavedGoalTime(currentGoal.updatedAt || currentGoal.createdAt);
  }, [currentGoalId]);

  // Compute global filter stats for current goal
  const globalFilterStats: GlobalFilterStats = useMemo(() => {
    let total = 0;
    let matches = 0;
    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    let blocked = 0;
    let recurring = 0;
    let oneTime = 0;

    const q = globalSearchQuery.toLowerCase().trim();

    currentGoal.pillars.forEach((p) => {
      p.actions.forEach((a) => {
        total++;
        if (a.isCompleted || a.progress === 100) completed++;
        else pending++;

        if (a.status === 'in_progress' || (a.progress && a.progress > 0 && a.progress < 100)) inProgress++;
        if (a.status === 'blocked' || a.isStuck) blocked++;
        if (a.type === 'recurring') recurring++;
        if (a.type === 'one_time') oneTime++;

        const matchesSearch = matchAnyTextAccentInsensitive(
          [a.title, p.title, a.notes, a.assignee],
          globalSearchQuery
        );

        let matchesStatus = true;
        if (globalStatusFilter === 'pending') matchesStatus = !a.isCompleted && a.progress !== 100;
        else if (globalStatusFilter === 'completed') matchesStatus = a.isCompleted || a.progress === 100;
        else if (globalStatusFilter === 'in_progress') matchesStatus = !a.isCompleted && ((a.progress && a.progress > 0) || a.status === 'in_progress');
        else if (globalStatusFilter === 'blocked') matchesStatus = !!a.isStuck || a.status === 'blocked';
        else if (globalStatusFilter === 'recurring') matchesStatus = a.type === 'recurring';
        else if (globalStatusFilter === 'one_time') matchesStatus = a.type === 'one_time';

        if (matchesSearch && matchesStatus) {
          matches++;
        }
      });
    });

    return { total, matches, completed, pending, inProgress, blocked, recurring, oneTime };
  }, [currentGoal, globalSearchQuery, globalStatusFilter]);

  // Current fingerprint and whether there are unsaved changes
  const currentFingerprint = getGoalFingerprint(currentGoal);
  const hasUnsavedChanges = currentFingerprint !== savedGoalFingerprint;

  // Helper to update current goal reactively
  const updateCurrentGoal = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
  };

  // Explicit Save handler for overwriting/confirming current goal
  const handleSaveGoal = (savedGoal: Goal) => {
    updateCurrentGoal(savedGoal);
    setSavedGoalFingerprint(getGoalFingerprint(savedGoal));
    setSavedGoalTime(savedGoal.updatedAt || new Date().toISOString());
  };

  // Toggle Action Complete / Incomplete
  const handleToggleAction = (pillarIndex: number, actionIndex: number) => {
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[pillarIndex] };
    const actions = [...pillar.actions];
    const action = { ...actions[actionIndex] };

    action.isCompleted = !action.isCompleted;
    if (action.isCompleted) {
      action.completedAt = new Date().toISOString();
      if (action.type === 'recurring') {
        action.streakCount = (action.streakCount || 0) + 1;
      }
    } else {
      action.completedAt = undefined;
      if (action.type === 'recurring' && action.streakCount > 0) {
        action.streakCount = Math.max(0, action.streakCount - 1);
      }
    }

    actions[actionIndex] = action;
    pillar.actions = actions;
    updatedPillars[pillarIndex] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
  };

  // Update Action Title
  const handleUpdateActionTitle = (actionIndex: number, newTitle: string, explicitPillarIndex?: number) => {
    const pIdx = explicitPillarIndex !== undefined ? explicitPillarIndex : selectedPillarIndex;
    if (pIdx === null || pIdx === undefined) return;
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[pIdx] };
    const actions = [...pillar.actions];

    actions[actionIndex] = {
      ...actions[actionIndex],
      title: newTitle,
    };

    pillar.actions = actions;
    updatedPillars[pIdx] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle Action Type (one_time vs recurring)
  const handleToggleActionType = (actionIndex: number, explicitPillarIndex?: number) => {
    const pIdx = explicitPillarIndex !== undefined ? explicitPillarIndex : selectedPillarIndex;
    if (pIdx === null || pIdx === undefined) return;
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[pIdx] };
    const actions = [...pillar.actions];
    const target = actions[actionIndex];

    const nextType = target.type === 'recurring' ? 'one_time' : 'recurring';
    actions[actionIndex] = {
      ...target,
      type: nextType,
      streakCount: nextType === 'recurring' ? 1 : 0,
      habitDays: nextType === 'recurring' ? [false, false, false, false, false, false, false] : [],
    };

    pillar.actions = actions;
    updatedPillars[pIdx] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle Habit Day of the week
  const handleToggleHabitDay = (actionIndex: number, dayIndex: number, explicitPillarIndex?: number) => {
    const pIdx = explicitPillarIndex !== undefined ? explicitPillarIndex : selectedPillarIndex;
    if (pIdx === null || pIdx === undefined) return;
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[pIdx] };
    const actions = [...pillar.actions];
    const target = { ...actions[actionIndex] };

    const days = [...(target.habitDays || [false, false, false, false, false, false, false])];
    days[dayIndex] = !days[dayIndex];
    target.habitDays = days;

    // Recalculate streak
    const activeDays = days.filter(Boolean).length;
    target.streakCount = activeDays;
    target.isCompleted = activeDays >= 4; // Considered met if active on 4+ days

    actions[actionIndex] = target;
    pillar.actions = actions;
    updatedPillars[pIdx] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
  };

  // Update specific attributes of an action (Gantt, dates, progress, dependencies, status, etc.)
  const handleUpdateAction = (pillarIndex: number, actionIndex: number, updates: Partial<MandalaAction>) => {
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[pillarIndex] };
    const actions = [...pillar.actions];
    actions[actionIndex] = {
      ...actions[actionIndex],
      ...updates,
    };
    pillar.actions = actions;
    updatedPillars[pillarIndex] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
  };

  // Batch update multiple actions (e.g. from Auto-Scheduler)
  const handleBatchUpdateActions = (updatesList: { pillarIndex: number; actionIndex: number; updates: Partial<MandalaAction> }[]) => {
    const updatedPillars = currentGoal.pillars.map((p) => ({
      ...p,
      actions: [...p.actions],
    }));

    updatesList.forEach(({ pillarIndex, actionIndex, updates }) => {
      if (updatedPillars[pillarIndex] && updatedPillars[pillarIndex].actions[actionIndex]) {
        updatedPillars[pillarIndex].actions[actionIndex] = {
          ...updatedPillars[pillarIndex].actions[actionIndex],
          ...updates,
        };
      }
    });

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
    showToast('Cronograma de proyecto auto-programado con éxito.');
  };

  // Update all actions of a pillar (e.g. from manual editor in PillarFocusModal)
  const handleUpdateAllPillarActions = (newActions: MandalaAction[]) => {
    if (selectedPillarIndex === null) return;
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[selectedPillarIndex] };
    pillar.actions = newActions;
    updatedPillars[selectedPillarIndex] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
    showToast(`Acciones del pilar "${pillar.title}" actualizadas.`);
  };

  // Save goal from MainGoalModal
  const handleSaveFromMainGoalModal = (updatedGoal: Goal) => {
    handleSaveGoal(updatedGoal);
    showToast(`Meta "${updatedGoal.title}" y pilares actualizados.`);
  };

  // Generate 8 actions for a pillar on demand
  const handleGeneratePillarActions = async (pillarIndex: number) => {
    if (tier === 'free') {
      setIsTierModalOpen(true);
      return;
    }

    setIsGeneratingPillar(pillarIndex);
    const targetPillar = currentGoal.pillars[pillarIndex];

    try {
      const allPillarTitles = currentGoal.pillars.map((p) => p.title);
      const generated = await fetchGeneratedActions(
        currentGoal.title,
        targetPillar.title,
        allPillarTitles
      );

      const newActions: MandalaAction[] = generated.map((g, aIdx) => ({
        id: `action-${Date.now()}-${pillarIndex}-${aIdx}`,
        position: aIdx,
        title: g.title,
        type: g.type,
        isCompleted: false,
        streakCount: 0,
        habitDays: [false, false, false, false, false, false, false],
      }));

      const updatedPillars = [...currentGoal.pillars];
      updatedPillars[pillarIndex] = {
        ...targetPillar,
        actions: newActions,
      };

      updateCurrentGoal({
        ...currentGoal,
        pillars: updatedPillars,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPillar(null);
    }
  };

  // Regenerate a single quadrant with custom prompt
  const handleRegenerateQuadrant = async (focusPrompt: string) => {
    if (selectedPillarIndex === null) return;
    setIsRegeneratingQuadrant(true);
    const targetPillar = currentGoal.pillars[selectedPillarIndex];

    try {
      const allPillarTitles = currentGoal.pillars.map((p) => p.title);
      const generated = await fetchGeneratedActions(
        currentGoal.title,
        targetPillar.title,
        allPillarTitles,
        focusPrompt
      );

      const newActions: MandalaAction[] = generated.map((g, aIdx) => ({
        id: `action-${Date.now()}-${selectedPillarIndex}-${aIdx}`,
        position: aIdx,
        title: g.title,
        type: g.type,
        isCompleted: false,
        streakCount: 0,
        habitDays: [false, false, false, false, false, false, false],
      }));

      const updatedPillars = [...currentGoal.pillars];
      updatedPillars[selectedPillarIndex] = {
        ...targetPillar,
        actions: newActions,
      };

      updateCurrentGoal({
        ...currentGoal,
        pillars: updatedPillars,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegeneratingQuadrant(false);
    }
  };

  // Open Recalibrate Modal
  const handleRequestRecalibrate = (action: MandalaAction, actionIndex: number, explicitPillarIndex?: number) => {
    const pIdx = explicitPillarIndex !== undefined ? explicitPillarIndex : selectedPillarIndex;
    if (pIdx === null || pIdx === undefined) return;
    const pillarTitle = currentGoal.pillars[pIdx].title;
    setRecalibrateTarget({
      action,
      actionIndex,
      pillarTitle,
      pillarIndex: pIdx,
    });
  };

  // Apply Recalibration Replacement
  const handleApplyReplacement = (actionIndex: number, newActions: GeneratedAction[]) => {
    if (!recalibrateTarget) return;
    const pIdx = recalibrateTarget.pillarIndex;
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[pIdx] };
    const actions = [...pillar.actions];

    // Replace the stalled action with the primary micro-action
    actions[actionIndex] = {
      ...actions[actionIndex],
      title: newActions[0].title,
      type: newActions[0].type,
      isCompleted: false,
      streakCount: 0,
    };

    pillar.actions = actions;
    updatedPillars[pIdx] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });

    setRecalibrateTarget(null);
  };

  // Create New Goal
  const handleGoalCreated = (newGoal: Goal) => {
    const goalWithTeam: Goal = {
      ...newGoal,
      teamId: currentTeam.id,
      ownerId: currentUser.id,
      visibility: 'team',
    };
    setGoals((prev) => [goalWithTeam, ...prev]);
    setCurrentGoalId(goalWithTeam.id);
    setActiveView('grid');
    showToast(`Nueva meta "${goalWithTeam.title}" creada en el equipo ${currentTeam.name}.`);
  };

  // Delete Goal
  const handleDeleteGoal = (id: string) => {
    if (goals.length <= 1) return;
    const remaining = goals.filter((g) => g.id !== id);
    setGoals(remaining);
    if (currentGoalId === id) {
      setCurrentGoalId(remaining[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-150">
      {/* Top Navbar */}
      <Navbar
        currentGoal={currentGoal}
        allGoals={goals}
        onSelectGoal={(id) => {
          setCurrentGoalId(id);
          setActiveView('grid');
        }}
        onNewGoal={() => setIsOnboardingOpen(true)}
        onOpenCheckin={() => setIsCheckinOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTierModal={() => setIsTierModalOpen(true)}
        tier={tier}
        activeView={activeView}
        setActiveView={setActiveView}
        aiStatus={aiStatus}
        isLoadingAiStatus={isLoadingAiStatus}
        onOpenAiStatus={() => setIsAiStatusModalOpen(true)}
        onOpenDocumentModal={handleOpenDocumentModal}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Global Persistent Search & Filter Bar across all views */}
      <GlobalFilterBar
        searchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
        statusFilter={globalStatusFilter}
        onStatusFilterChange={setGlobalStatusFilter}
        onClearFilters={() => {
          setGlobalSearchQuery('');
          setGlobalStatusFilter('all');
        }}
        stats={globalFilterStats}
        currentGoalTitle={currentGoal.title}
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {/* Warning notification banner if Gemini is not working */}
        {aiStatus && !aiStatus.ok && !isBannerDismissed && (
          <div className="mb-6 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 sm:p-4 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm dark:shadow-lg dark:shadow-amber-950/20 backdrop-blur-sm transition-colors">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-amber-950 dark:text-amber-100">
                  {aiStatus.status === 'placeholder_key' 
                    ? "GEMINI_API_KEY no configurada:" 
                    : "Google Gemini no conectado:"}
                </span>{" "}
                <span className="text-amber-800 dark:text-amber-300 font-medium">{aiStatus.message}</span>{" "}
                <span className="text-slate-600 dark:text-slate-400 block sm:inline">
                  (El generador usará plantillas estáticas de respaldo)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsAiStatusModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm cursor-pointer"
              >
                <Key className="h-3.5 w-3.5" />
                <span>Configurar y Probar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                className="p-1 rounded-lg text-amber-700/80 hover:text-amber-950 hover:bg-amber-100 dark:text-amber-400/80 dark:hover:text-white dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                title="Descartar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {activeView === 'grid' && (
          <MandalaGrid9x9
            goal={currentGoal}
            onSelectPillar={(idx) => setSelectedPillarIndex(idx)}
            onToggleAction={handleToggleAction}
            onGeneratePillarActions={handleGeneratePillarActions}
            isGeneratingPillar={isGeneratingPillar}
            onOpenCheckin={() => setIsCheckinOpen(true)}
            onOpenMainGoalModal={() => setIsMainGoalModalOpen(true)}
            searchQuery={globalSearchQuery}
            statusFilter={globalStatusFilter}
            onStatusFilterChange={setGlobalStatusFilter}
          />
        )}

        {activeView === 'hierarchy' && (
          <MandalaHierarchyView
            goal={currentGoal}
            onToggleAction={handleToggleAction}
            onUpdateActionTitle={(pIdx, aIdx, newTitle) => handleUpdateActionTitle(aIdx, newTitle, pIdx)}
            onToggleActionType={(pIdx, aIdx) => handleToggleActionType(aIdx, pIdx)}
            onToggleHabitDay={(pIdx, aIdx, dIdx) => handleToggleHabitDay(aIdx, dIdx, pIdx)}
            onRequestRecalibrate={(action, aIdx, pIdx) => handleRequestRecalibrate(action, aIdx, pIdx)}
            onSelectPillar={(idx) => setSelectedPillarIndex(idx)}
            onGeneratePillarActions={handleGeneratePillarActions}
            isGeneratingPillar={isGeneratingPillar}
            onOpenCheckin={() => setIsCheckinOpen(true)}
            onOpenMainGoalModal={() => setIsMainGoalModalOpen(true)}
            searchQuery={globalSearchQuery}
            onSearchChange={setGlobalSearchQuery}
            statusFilter={globalStatusFilter}
            onStatusFilterChange={setGlobalStatusFilter}
          />
        )}

        {activeView === 'gantt' && (
          <MandalaGanttView
            goal={currentGoal}
            onUpdateAction={handleUpdateAction}
            onBatchUpdateActions={handleBatchUpdateActions}
            onToggleAction={handleToggleAction}
            onRequestRecalibrate={(action, aIdx, pIdx) => handleRequestRecalibrate(action, aIdx, pIdx)}
            onOpenMainGoalModal={() => setIsMainGoalModalOpen(true)}
            searchQuery={globalSearchQuery}
            onSearchChange={setGlobalSearchQuery}
            statusFilter={globalStatusFilter}
            onStatusFilterChange={setGlobalStatusFilter}
          />
        )}

        {activeView === 'goals' && (
          <GoalsLibraryView
            goals={goals}
            currentGoalId={currentGoalId}
            onSelectGoal={(id) => {
              setCurrentGoalId(id);
              setActiveView((prev) => (prev === 'goals' ? (window.innerWidth < 768 ? 'hierarchy' : 'grid') : prev));
            }}
            onDeleteGoal={handleDeleteGoal}
            onNewGoal={() => setIsOnboardingOpen(true)}
            tier={tier}
            onOpenTierModal={() => setIsTierModalOpen(true)}
            onOpenDocumentModal={handleOpenDocumentModal}
            onDuplicateGoal={handleDuplicateGoal}
            onSaveGoalToFile={handleSaveGoalToFile}
            searchQuery={globalSearchQuery}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-[#070a0f] py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-500 transition-colors">
        <p>
          Mandala Copilot AI · Metodología Harada 9x9 con Recalibración Adaptativa Continua
        </p>
      </footer>

      {/* Micro Zoom Focus Modal (Pillar Focus) */}
      {selectedPillarIndex !== null && currentGoal.pillars[selectedPillarIndex] && (
        <PillarFocusModal
          pillar={currentGoal.pillars[selectedPillarIndex]}
          pillarIndex={selectedPillarIndex}
          goalTitle={currentGoal.title}
          onClose={() => setSelectedPillarIndex(null)}
          onNavigatePillar={(newIdx) => setSelectedPillarIndex(newIdx)}
          onToggleAction={(aIdx) => handleToggleAction(selectedPillarIndex, aIdx)}
          onUpdateActionTitle={handleUpdateActionTitle}
          onToggleActionType={handleToggleActionType}
          onToggleHabitDay={handleToggleHabitDay}
          onRegenerateQuadrant={handleRegenerateQuadrant}
          isRegenerating={isRegeneratingQuadrant}
          onRequestRecalibrate={handleRequestRecalibrate}
          onUpdateAllPillarActions={handleUpdateAllPillarActions}
        />
      )}

      {/* Main Goal Configuration & Regeneration Modal */}
      <MainGoalModal
        isOpen={isMainGoalModalOpen}
        onClose={() => setIsMainGoalModalOpen(false)}
        goal={currentGoal}
        onSaveGoal={handleSaveFromMainGoalModal}
        tier={tier}
        onOpenTierModal={() => setIsTierModalOpen(true)}
      />

      {/* Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onGoalCreated={handleGoalCreated}
        presetGoals={PRESET_GOALS}
      />

      {/* Recalibrate Modal */}
      <RecalibrateModal
        isOpen={!!recalibrateTarget}
        onClose={() => setRecalibrateTarget(null)}
        goalTitle={currentGoal.title}
        pillarTitle={recalibrateTarget?.pillarTitle || ''}
        action={recalibrateTarget?.action || null}
        actionIndex={recalibrateTarget?.actionIndex ?? 0}
        onApplyReplacement={handleApplyReplacement}
      />

      {/* Weekly Check-in Modal */}
      <WeeklyCheckinModal
        isOpen={isCheckinOpen}
        onClose={() => setIsCheckinOpen(false)}
        goal={currentGoal}
        onJumpToPillar={(pIdx) => setSelectedPillarIndex(pIdx)}
      />

      {/* SaaS Tier Comparison & Toggle Modal */}
      <SaaSTierModal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        currentTier={tier}
        onSwitchTier={(newTier) => setTier(newTier)}
      />

      {/* Export / Print Modal */}
      <ExportPrintModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        goal={currentGoal}
      />

      {/* AI Status & Diagnostics Modal */}
      <AiStatusModal
        isOpen={isAiStatusModalOpen}
        onClose={() => setIsAiStatusModalOpen(false)}
        currentStatus={aiStatus}
        onStatusUpdated={(newStatus) => {
          setAiStatus(newStatus);
          if (newStatus.ok) setIsBannerDismissed(false);
        }}
      />

      {/* Document Manager Modal (Guardar y Abrir) */}
      <DocumentManagerModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        initialTab={documentModalTab}
        currentGoal={currentGoal}
        allGoals={goals}
        onSelectGoal={(id) => {
          setCurrentGoalId(id);
          setActiveView('grid');
        }}
        onSaveGoal={handleSaveGoal}
        onImportGoal={handleImportGoal}
        onDeleteGoal={handleDeleteGoal}
        onDuplicateGoal={handleDuplicateGoal}
        onShowToast={showToast}
        baselineFingerprint={savedGoalFingerprint}
        lastSavedTime={savedGoalTime}
      />

      {/* Team Workspace & Members Management Modal */}
      <TeamManagementModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

      {/* SaaS Global Administration Dashboard Modal */}
      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* User Profile & Demo Auth Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-indigo-500/40 text-white text-xs font-medium shadow-2xl shadow-indigo-950/60 backdrop-blur-md animate-fade-in">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SaaSProvider>
      <AppContent />
    </SaaSProvider>
  );
}
