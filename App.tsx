/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Goal, Pillar, MandalaAction, SaasTier, PRESET_GOALS } from './types/mandala';
import { Navbar } from './components/Navbar';
import { MandalaGrid9x9 } from './components/MandalaGrid9x9';
import { PillarFocusModal } from './components/PillarFocusModal';
import { OnboardingModal } from './components/OnboardingModal';
import { RecalibrateModal } from './components/RecalibrateModal';
import { WeeklyCheckinModal } from './components/WeeklyCheckinModal';
import { SaaSTierModal } from './components/SaaSTierModal';
import { ExportPrintModal } from './components/ExportPrintModal';
import { GoalsLibraryView } from './components/GoalsLibraryView';
import { 
  fetchGeneratedActions, 
  GeneratedAction, 
  GeminiStatusResult, 
  fetchGeminiStatus 
} from './services/api';
import { AiStatusModal } from './components/AiStatusModal';
import { DocumentManagerModal, DocumentModalTab } from './components/DocumentManagerModal';
import { downloadDocumentFile, duplicateGoal } from './services/documentService';
import { AlertCircle, Key, X } from 'lucide-react';

const STORAGE_KEY = 'mandala_copilot_goals_v1';
const TIER_STORAGE_KEY = 'mandala_copilot_tier_v1';

export default function App() {
  // Load goals from localStorage or fallback to preset
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
  const [activeView, setActiveView] = useState<'grid' | 'goals'>('grid');

  // Modals & Panels
  const [selectedPillarIndex, setSelectedPillarIndex] = useState<number | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);

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
        setDocumentModalTab('save');
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
    setActiveView('grid');
    showToast(`Documento "${importedGoal.title}" abierto en la matriz.`);
  };

  const handleDuplicateGoal = (goalToDup: Goal) => {
    const cloned = duplicateGoal(goalToDup);
    setGoals((prev) => [cloned, ...prev]);
    setCurrentGoalId(cloned.id);
    setActiveView('grid');
    showToast(`Copia creada: "${cloned.title}".`);
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

  // Helper to update current goal
  const updateCurrentGoal = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
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
  const handleUpdateActionTitle = (actionIndex: number, newTitle: string) => {
    if (selectedPillarIndex === null) return;
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[selectedPillarIndex] };
    const actions = [...pillar.actions];

    actions[actionIndex] = {
      ...actions[actionIndex],
      title: newTitle,
    };

    pillar.actions = actions;
    updatedPillars[selectedPillarIndex] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle Action Type (one_time vs recurring)
  const handleToggleActionType = (actionIndex: number) => {
    if (selectedPillarIndex === null) return;
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[selectedPillarIndex] };
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
    updatedPillars[selectedPillarIndex] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle Habit Day of the week
  const handleToggleHabitDay = (actionIndex: number, dayIndex: number) => {
    if (selectedPillarIndex === null) return;
    const updatedPillars = [...currentGoal.pillars];
    const pillar = { ...updatedPillars[selectedPillarIndex] };
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
    updatedPillars[selectedPillarIndex] = pillar;

    updateCurrentGoal({
      ...currentGoal,
      pillars: updatedPillars,
      updatedAt: new Date().toISOString(),
    });
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
  const handleRequestRecalibrate = (action: MandalaAction, actionIndex: number) => {
    if (selectedPillarIndex === null) return;
    const pillarTitle = currentGoal.pillars[selectedPillarIndex].title;
    setRecalibrateTarget({
      action,
      actionIndex,
      pillarTitle,
      pillarIndex: selectedPillarIndex,
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
    setGoals((prev) => [newGoal, ...prev]);
    setCurrentGoalId(newGoal.id);
    setActiveView('grid');
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
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
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
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        {/* Warning notification banner if Gemini is not working */}
        {aiStatus && !aiStatus.ok && !isBannerDismissed && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 sm:p-4 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/20 backdrop-blur-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-amber-100">
                  {aiStatus.status === 'placeholder_key' 
                    ? "GEMINI_API_KEY no configurada:" 
                    : "Google Gemini no conectado:"}
                </span>{" "}
                <span className="text-amber-300">{aiStatus.message}</span>{" "}
                <span className="text-slate-400 block sm:inline">
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
                className="p-1 rounded-lg text-amber-400/80 hover:text-white hover:bg-amber-900/40 transition-colors cursor-pointer"
                title="Descartar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {activeView === 'grid' ? (
          <MandalaGrid9x9
            goal={currentGoal}
            onSelectPillar={(idx) => setSelectedPillarIndex(idx)}
            onToggleAction={handleToggleAction}
            onGeneratePillarActions={handleGeneratePillarActions}
            isGeneratingPillar={isGeneratingPillar}
            onOpenCheckin={() => setIsCheckinOpen(true)}
          />
        ) : (
          <GoalsLibraryView
            goals={goals}
            currentGoalId={currentGoalId}
            onSelectGoal={(id) => {
              setCurrentGoalId(id);
              setActiveView('grid');
            }}
            onDeleteGoal={handleDeleteGoal}
            onNewGoal={() => setIsOnboardingOpen(true)}
            tier={tier}
            onOpenTierModal={() => setIsTierModalOpen(true)}
            onOpenDocumentModal={handleOpenDocumentModal}
            onDuplicateGoal={handleDuplicateGoal}
            onSaveGoalToFile={handleSaveGoalToFile}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#070a0f] py-4 px-6 text-center text-xs text-slate-500">
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
        />
      )}

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
        onSaveGoal={updateCurrentGoal}
        onImportGoal={handleImportGoal}
        onDeleteGoal={handleDeleteGoal}
        onDuplicateGoal={handleDuplicateGoal}
        onShowToast={showToast}
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
