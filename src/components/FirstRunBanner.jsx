import React from 'react';
import { Key, Sparkles, ArrowRight, X, Radio } from 'lucide-react';

export function FirstRunBanner({
  isDemoMode,
  onOpenSettings,
  onToggleDemoMode,
  onDismiss,
  dismissed
}) {
  if (dismissed) return null;

  return (
    <div className="mb-4 mx-auto max-w-[1440px] px-4 lg:px-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#172233] via-[#151c27] to-[#261f14] border border-[#FF9900]/40 p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Information & Step Guide */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/30 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white">
                  {isDemoMode ? 'Demo Showcase Mode is Active' : 'Live Mode Active'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/40">
                  {isDemoMode ? 'Preloaded Walkthrough' : 'Listening for Live Audio'}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed max-w-2xl">
                {isDemoMode
                  ? 'Showing preloaded ambient lifelogs to demonstrate 1-Click Amazon orders, calendar scheduling, and Bee todo sync. You can shut off Demo Mode anytime or add your Amazon Bedrock credentials for live cloud inference.'
                  : 'Demo Mode is OFF. The system is listening for live microphone audio or streaming directly from your Bee Wearable device.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FF9900] hover:bg-[#ffad33] text-[#0f141c] font-bold text-xs shadow-md transition"
            >
              <Key className="w-4 h-4" />
              <span>Connect API Key (1st Run Guide)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onToggleDemoMode(!isDemoMode)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c2636] hover:bg-[#253247] text-gray-200 border border-[#2e3d54] text-xs font-semibold transition"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isDemoMode ? 'Shut Off Demo Mode' : 'Restore Demo Mode'}</span>
            </button>

            <button
              onClick={onDismiss}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/60 transition"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
