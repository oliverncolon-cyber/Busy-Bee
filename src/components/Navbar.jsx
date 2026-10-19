import React from 'react';
import { Radio, Sliders, RefreshCw, Cpu, BatteryCharging, Play, RotateCcw, Key } from 'lucide-react';

export function Navbar({
  status,
  isDemoMode,
  onToggleDemoMode,
  onOpenSettings,
  onSyncBee,
  syncing,
  onPlayDemoTour,
  onResetDemo,
  isPlayingDemo
}) {
  const modelId = status?.bedrock?.modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  const shortModel = modelId.includes('claude-3-5-sonnet')
    ? 'Claude 3.5 Sonnet'
    : modelId.includes('nova-pro')
      ? 'Amazon Nova Pro'
      : modelId.includes('nova-lite')
        ? 'Amazon Nova Lite'
        : modelId.includes('titan')
          ? 'Amazon Titan'
          : 'Claude 3 Haiku';

  const deviceState = status?.bee?.deviceTelemetry?.connectionState || 'Ambient Companion Active';
  const battery = status?.bee?.deviceTelemetry?.batteryPercent || 94;

  return (
    <header className="border-b border-[#1e2736] bg-[#0d121a]/95 backdrop-blur-xl sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-b from-[#FF9900] to-[#e67e00] shadow-lg shadow-[#FF9900]/20 text-[#0f141c] font-black text-xl select-none">
            🐝
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#0d121a]"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">Busy Bee</span>
              <span className="h-3.5 w-[1px] bg-gray-700" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#FF9900]">
                Ambient Action Intelligence
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:flex items-center gap-1.5">
              <span>Bee Wearable Companion</span>
              <span className="text-gray-600">•</span>
              <span>Amazon Bedrock &amp; MCP 2025-11-25</span>
            </p>
          </div>
        </div>

        {/* Demo Mode Toggle & Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Obvious Demo Mode Toggle Switch */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141c27] border border-[#233044] shadow-sm">
            <span className="text-[11px] font-bold text-gray-300">Demo Mode:</span>
            <button
              type="button"
              onClick={() => onToggleDemoMode(!isDemoMode)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isDemoMode ? 'bg-[#FF9900]' : 'bg-gray-700'
              }`}
              title={isDemoMode ? 'Click to Shut Off Demo Mode' : 'Click to Turn On Demo Mode'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#0d121a] shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isDemoMode ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span
              className={`text-[10px] font-black uppercase tracking-wider ${
                isDemoMode ? 'text-[#FF9900]' : 'text-emerald-400'
              }`}
            >
              {isDemoMode ? 'ON' : 'OFF (LIVE)'}
            </span>
          </div>

          {/* Connect API Key Button (Prominent for 1st Run) */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141c27] hover:bg-[#1f2b3c] border border-[#FF9900]/40 hover:border-[#FF9900] text-gray-100 font-semibold text-xs transition group shadow-sm"
            title="Setup Amazon Bedrock Credentials & API Keys"
          >
            <Key className="w-3.5 h-3.5 text-[#FF9900] group-hover:rotate-45 transition" />
            <span>Connect API Key</span>
          </button>

          {/* Play Demo Walkthrough Button (when Demo is ON) */}
          {isDemoMode && (
            <button
              onClick={onPlayDemoTour}
              disabled={isPlayingDemo}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition ${
                isPlayingDemo
                  ? 'bg-amber-500 text-[#0f141c] animate-pulse'
                  : 'bg-gradient-to-r from-[#FF9900] to-[#e67e00] hover:from-[#ffad33] hover:to-[#FF9900] text-[#0f141c]'
              }`}
              title="Auto-play live speech showcase walkthrough"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isPlayingDemo ? 'animate-spin' : ''}`} />
              <span>{isPlayingDemo ? 'Playing...' : 'Play Demo Tour'}</span>
            </button>
          )}

          {/* Reset Demo State Button */}
          {isDemoMode && (
            <button
              onClick={onResetDemo}
              className="p-2 rounded-xl bg-[#141c27] hover:bg-[#1f2b3c] text-gray-400 hover:text-white border border-[#233044] transition"
              title="Reset Demo Showcase Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Bee Hardware Telemetry */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141c27] border border-[#233044] text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-gray-300 font-medium">{deviceState}</span>
            <span className="text-gray-600">|</span>
            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
              <BatteryCharging className="w-3.5 h-3.5" />
              {battery}%
            </span>
          </div>

          {/* Bedrock Model Badge */}
          <button
            onClick={onOpenSettings}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141c27] hover:bg-[#1a2433] border border-[#233044] text-xs text-gray-300"
            title="Active Model Runtime"
          >
            <Cpu className="w-3.5 h-3.5 text-[#00CAFF]" />
            <span>{shortModel}</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onSyncBee}
            disabled={syncing}
            className="p-2 rounded-xl bg-[#1c2636] hover:bg-[#253247] text-gray-200 border border-[#2e3d54] transition"
            title="Sync Bee Wearable Memory Store"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-[#FF9900]' : 'text-[#FF9900]'}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
