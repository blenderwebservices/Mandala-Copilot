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
import { fetchGeneratedActions, GeneratedAction } from './services/api';

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
      />

      {/* Main View Area */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
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
    </div>
  );
}
