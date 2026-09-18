/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
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
import { LayoutGrid, Box } from 'lucide-react';

export default function App() {
  const {
    isPlaying,
    currentTimeSec,
    setCurrentTimeSec,
    playbackSpeed,
    trajectoryPlan,
    resetSimulation,
    appMode
  } = useSimulationStore();

  const [use2DPlanView, setUse2DPlanView] = useState(false);
  const lastTimeRef = useRef<number | null>(null);

  // High-Precision Animation Tick Loop for Smooth Playback
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = null;
      return;
    }

    let animFrame: number;
    const tick = (now: number) => {
      if (lastTimeRef.current !== null) {
        const deltaSec = (now - lastTimeRef.current) / 1000;
        const totalDuration = trajectoryPlan.totalDurationSec || 10;
        const nextTime = currentTimeSec + deltaSec * playbackSpeed;

        if (nextTime >= totalDuration) {
          // Loop or stop
          setCurrentTimeSec(0);
        } else {
          setCurrentTimeSec(nextTime);
        }
      }
      lastTimeRef.current = now;
      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, currentTimeSec, playbackSpeed, trajectoryPlan.totalDurationSec, setCurrentTimeSec]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none antialiased">
      {/* 1. Top Header Navbar */}
      <HeaderNavbar />

      {/* 2. Manufacturing Step-by-Step Workflow Bar (when in manufacturing mode) */}
      {appMode === 'manufacturing' && <ManufacturingWorkflowBar />}

      {/* 3. Main Studio Work Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Manufacturing Assistant vs Engineer Jog Sequencer */}
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

          {/* 2D / 3D Layout View Toggle Button in Bottom Left */}
          <div className="absolute bottom-4 left-4 z-30 pointer-events-auto">
            <button
              id="toggle-2d-plan-btn"
              onClick={() => setUse2DPlanView(!use2DPlanView)}
              className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 shadow-lg backdrop-blur flex items-center gap-1.5 transition cursor-pointer"
            >
              {use2DPlanView ? (
                <>
                  <Box className="w-3.5 h-3.5 text-blue-400" />
                  <span>3D Digital Twin View</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2D CAD Blueprint View</span>
                </>
              )}
            </button>
          </div>
        </main>

        {/* Right Sidebar: Machine, Physics, KPIs, Cost Telemetry */}
        <RightSidebar />
      </div>

      {/* 4. HPDC Sequence Timeline & Interlocks */}
      <SequenceTimelineBar />

      {/* 5. Bottom Transport & Quick Action Bar */}
      <BottomControlBar />

      {/* 6. Modals & Dialogs */}
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
    </div>
  );
}
