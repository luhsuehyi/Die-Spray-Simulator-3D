import React from 'react';
import { useSimulationStore } from '../../store/simulationStore';

const phases = {
  '01_MOLD_CLOSE': ['合模', 'Close mold', '確認機器人與鑄件已離開模具區域。', 'Confirm robots and the casting have cleared the mold area.'],
  '02_INJECTION': ['射出與保壓', 'Inject and hold', '合模完成後射出；此模型未驗證金屬流動或凝固。', 'Injection follows clamping; metal flow and solidification are not validated by this model.'],
  '03_MOLD_OPEN': ['開模', 'Open mold', '等待開模完成，才可進入模具區域。', 'Wait for confirmed mold opening before entering the mold area.'],
  '04_PART_EXTRACTION': ['取件', 'Extract casting', '夾取鑄件並退出模具，完成取件後才噴塗。', 'Grip the casting and withdraw from the mold before spraying.'],
  '05_SPRAY_LUBE': ['噴塗與吹氣', 'Spray and dry', '鑄件取出後噴塗並吹乾，再退出模具區域。', 'Spray and dry after extraction, then withdraw from the mold area.'],
  '06_CYCLE_RESET': ['回到待機', 'Return to standby', '確認機器人退出，準備下一循環。', 'Confirm robot withdrawal before the next cycle.']
};

export function OperatorGuide() {
  const s = useSimulationStore();
  const zh = s.language === 'zh-TW';
  const pick = (cn: string, en: string) => zh ? cn : en;
  const phase = phases[s.currentCyclePhase];
  const ready = s.aiPlanCompleted && !!s.aiPlanResult && !s.collisionResult.hasCollision && s.waypoints.length > 1;
  const blockers = !s.aiPlanCompleted
    ? pick('先產生新模具的規劃。', 'Generate a plan for this mold first.')
    : s.collisionResult.hasCollision
      ? pick('模型偵測到碰撞。請進入進階編輯修正路徑或配置。', 'The model detects a collision. Adjust the path or layout in Advanced.')
      : pick('可播放教學示意。計算結果仍須由工程人員驗證。', 'Ready for an illustrative preview. Calculations still require engineering validation.');
  return <aside className="shrink-0 border-t border-slate-700 bg-slate-900 px-4 py-3 max-h-[35vh] overflow-y-auto" aria-label={pick('操作導引', 'Operator guide')}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="font-semibold text-yellow-300">{pick('新手操作導引', 'First-time operator guide')}</h2>
        <p className="text-xs text-slate-400">{pick('選擇鑄件 → 產生規劃 → 檢查結果 → 播放示意 → 換模重新規劃', 'Choose part → generate plan → inspect results → preview → change mold and replan')}</p></div>
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-2 bg-slate-700 rounded" onClick={() => s.setIsCollisionAuditOpen(true)}>{pick('檢查碰撞詳情', 'Inspect collisions')}</button>
        <button className="px-3 py-2 bg-blue-600 rounded disabled:opacity-40" disabled={!ready} onClick={() => { s.resetSimulation(); s.setIsPlaying(true); }}>{pick('從頭播放示意', 'Preview from start')}</button>
        <button className="px-3 py-2 bg-slate-700 rounded" onClick={() => s.setIsPlaying(false)}>{pick('暫停', 'Pause')}</button>
        <button className="px-3 py-2 bg-slate-700 rounded" onClick={() => { s.resetSimulation(); s.resetAiPlan(); s.setPrimaryAction('ai-plan'); }}>{pick('換模／重新規劃', 'Change mold / replan')}</button>
      </div>
    </div>
    <p role="status" className={`text-sm mt-2 ${ready ? 'text-slate-300' : 'text-amber-300'}`}>{blockers}</p>
    {phase && <p className="text-sm mt-2"><strong>{zh ? phase[0] : phase[1]}:</strong> {zh ? phase[2] : phase[3]}</p>}
    <div className="flex flex-wrap gap-1 mt-2">{Object.entries(phases).map(([key, labels]) => <button key={key} className={`text-xs px-2 py-1 rounded border ${s.currentCyclePhase === key ? 'border-blue-400 bg-blue-950' : 'border-slate-700'}`} onClick={() => { s.setIsPlaying(false); s.jumpToCyclePhase(key as keyof typeof phases); }}>{zh ? labels[0] : labels[1]}</button>)}</div>
    <p className="text-xs text-slate-400 mt-2">{pick('教學與規劃示意，非設備控制。模具包絡、機器人動作、碰撞模型與噴塗物理仍有簡化；不能直接用於生產。', 'Training and planning preview, not equipment control. Mold envelopes, robot movements, collision geometry and spray physics are simplified; this is not ready for production.')}</p>
  </aside>;
}
