/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HeaderNavbar } from './components/layout/HeaderNavbar';
import { LeftSidebar } from './components/panels/LeftSidebar';
import { RightSidebar } from './components/panels/RightSidebar';
import { BottomControlBar } from './components/panels/BottomControlBar';
import { SequenceTimelineBar } from './components/panels/SequenceTimelineBar';
import { SimulationCanvas } from './components/viewport/SimulationCanvas';
import { ViewportOverlay } from './components/viewport/ViewportOverlay';
import { CellPlan2DFallback } from './components/viewport/CellPlan2DFallback';
import { ManufacturingWorkflowBar } from './components/manufacturing/ManufacturingWorkflowBar';
import { ManufacturingPanel } from './components/manufacturing/ManufacturingPanel';
import { AiAutoPlanView } from './components/aiPlan/AiAutoPlanView';
import { DemoPresentationMode } from './components/demo/DemoPresentationMode';
import { BestPositionAdvisorModal } from './components/modals/BestPositionAdvisorModal';
import { ScenarioCompareModal } from './components/modals/ScenarioCompareModal';
import { CodeExportModal } from './components/modals/CodeExportModal';
import { CollisionAuditModal } from './components/modals/CollisionAuditModal';
import { CoverageReportModal } from './components/modals/CoverageReportModal';
import { AiSprayOptimizerModal } from './components/modals/AiSprayOptimizerModal';
import { AutoSweepModal } from './components/modals/AutoSweepModal';
import { DieImportModal } from './components/modals/DieImportModal';
import { MachineSpecModal } from './components/modals/MachineSpecModal';
import { VideoExportModal } from './components/modals/VideoExportModal';
import { TopMountReferenceModal } from './components/modals/TopMountReferenceModal';
import { CellRealismModal } from './components/modals/CellRealismModal';
import { useSimulationStore } from './store/simulationStore';
import { LayoutGrid, Box, SlidersHorizontal, Sparkles } from 'lucide-react';
import { translations } from './utils/i18n';

export default function App() {
  const { primaryAction, isDemoMode, appMode, setPrimaryAction, language } = useSimulationStore();
  const t = translations[language];
  const [use2DPlanView, setUse2DPlanView] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none antialiased">
      {/* If in Demo Presentation Mode: Clean cinematic presentation full viewport */}
      {isDemoMode ? (
        <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950">
          <SimulationCanvas />
          <DemoPresentationMode />
        </div>
      ) : (
        <>
          {/* 1. Universal Top Header Navbar with 3 Primary Actions */}
          <HeaderNavbar />

          {/* 2. Route by Primary Action */}
          {primaryAction === 'ai-plan' ? (
            /* Primary Workflow Step 1: Clean AI Auto Plan Entry Point */
            <div className="flex-1 overflow-y-auto">
              <AiAutoPlanView />
            </div>
          ) : primaryAction === 'simulation' ? (
            /* Primary Workflow Step 2: Uncluttered 3D Simulation Preview */
            <div className="flex-1 flex flex-col overflow-hidden relative">
              <main className="flex-1 relative overflow-hidden bg-slate-950 flex flex-col">
                {use2DPlanView ? (
                  <CellPlan2DFallback />
                ) : (
                  <>
                    <SimulationCanvas />
                    <ViewportOverlay />
                  </>
                )}

                {/* 2D / 3D Digital Twin vs CAD Blueprint Toggle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-2">
                  <button
                    id="toggle-2d-plan-btn"
                    onClick={() => setUse2DPlanView(!use2DPlanView)}
                    className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-850 text-slate-200 text-xs font-medium rounded-md border border-slate-800 shadow-md backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {use2DPlanView ? (
                      <>
                        <Box className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t.digitalTwin3D}</span>
                      </>
                    ) : (
                      <>
                        <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t.layoutPlan2D}</span>
                      </>
                    )}
                  </button>

                  <button
                    id="sim-to-advanced-btn"
                    onClick={() => setPrimaryAction('advanced-edit')}
                    className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-850 text-slate-300 text-xs font-medium rounded-md border border-slate-800 shadow-md backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.advancedEdit}</span>
                  </button>
                </div>
              </main>

              {/* Bottom Transport Bar */}
              <BottomControlBar />
            </div>
          ) : (
            /* Primary Workflow Step 3: Comprehensive Advanced Engineering Studio */
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Optional Manufacturing Workflow Steps Bar */}
              {appMode === 'manufacturing' && <ManufacturingWorkflowBar />}

              {/* Main Engineering Studio Work Area */}
              <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar: Kinematics, Mount, Waypoints, TCP, J1-J6, IK/FK */}
                {appMode === 'manufacturing' ? <ManufacturingPanel /> : <LeftSidebar />}

                {/* Center Viewport Area */}
                <main className="flex-1 relative overflow-hidden bg-slate-950 flex flex-col">
                  {use2DPlanView ? (
                    <CellPlan2DFallback />
                  ) : (
                    <>
                      <SimulationCanvas />
                      <ViewportOverlay />
                    </>
                  )}

                  {/* 2D / 3D Digital Twin vs CAD Blueprint Toggle */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                    <button
                      id="toggle-2d-plan-btn"
                      onClick={() => setUse2DPlanView(!use2DPlanView)}
                      className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-850 text-slate-200 text-xs font-medium rounded-md border border-slate-800 shadow-md backdrop-blur-md flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {use2DPlanView ? (
                        <>
                          <Box className="w-3.5 h-3.5 text-blue-400" />
                          <span>{t.digitalTwin3D}</span>
                        </>
                      ) : (
                        <>
                          <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t.layoutPlan2D}</span>
                        </>
                      )}
                    </button>
                  </div>
                </main>

                {/* Right Sidebar: Machine, Physics, KPIs, Cost Telemetry */}
                <RightSidebar />
              </div>

              {/* HPDC Sequence Timeline & Interlocks */}
              <SequenceTimelineBar />

              {/* Bottom Transport & Quick Action Bar */}
              <BottomControlBar />
            </div>
          )}

          {/* Universal Modals & Dialogs */}
          <BestPositionAdvisorModal />
          <ScenarioCompareModal />
          <CodeExportModal />
          <CollisionAuditModal />
          <CoverageReportModal />
          <AiSprayOptimizerModal />
          <AutoSweepModal />
          <DieImportModal />
          <MachineSpecModal />
          <VideoExportModal />
          <TopMountReferenceModal />
          <CellRealismModal />
        </>
      )}
    </div>
  );
}
