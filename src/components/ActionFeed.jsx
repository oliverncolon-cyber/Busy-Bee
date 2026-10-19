import React, { useState } from 'react';
import {
  ShoppingCart,
  Calendar,
  CheckCircle2,
  Download,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Check,
  PackageCheck,
  Truck,
  CalendarCheck
} from 'lucide-react';

export function ActionFeed({
  actions,
  amazonBundle,
  onExecuteAction,
  onExecuteBundle,
  onUpdateAction,
  onDismissAction,
  lastExtractionMeta
}) {
  const [filter, setFilter] = useState('pending');

  const filteredActions = actions.filter((act) => {
    if (filter === 'pending') return act.status === 'pending';
    if (filter === 'executed') return act.status === 'executed';
    return act.status !== 'dismissed';
  });

  const pendingCount = actions.filter((a) => a.status === 'pending').length;
  const executedCount = actions.filter((a) => a.status === 'executed').length;
  const pendingAmazonActions = actions.filter(
    (a) => a.status === 'pending' && a.type === 'amazon_order'
  );

  return (
    <div className="flex flex-col h-full bg-[#101620] border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-[#1e293b] bg-[#141c28] flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            Ambient Action Center
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#FF9900] text-[#0f141c]">
                {pendingCount} Ready
              </span>
            )}
          </h2>
          <p className="text-[11px] text-gray-400">
            Proactive fulfillment cards synthesized by Amazon Bedrock
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 bg-[#0b0f17] p-1 rounded-lg border border-[#1e293b] text-xs">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              filter === 'pending'
                ? 'bg-[#FF9900] text-[#0f141c] shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Ready ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('executed')}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              filter === 'executed'
                ? 'bg-emerald-500 text-[#0f141c] shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Completed ({executedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              filter === 'all'
                ? 'bg-[#253247] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Telemetry Sub-Bar */}
      <div className="px-4 py-2 bg-[#0c1018] border-b border-[#1e293b] flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
            <TrendingUp className="w-3.5 h-3.5" /> Est. Time Saved: {executedCount * 4 + pendingCount * 2} mins
          </span>
          <span className="text-gray-700">|</span>
          <span className="flex items-center gap-1 text-gray-300 text-[11px]">
            <Zap className="w-3.5 h-3.5 text-[#FF9900]" />
            Runtime:{' '}
            <strong className="text-white font-mono">
              {lastExtractionMeta?.engine || 'Amazon Bedrock • Claude 3.5 Sonnet'}
            </strong>
          </span>
        </div>
        {lastExtractionMeta?.latencyMs && (
          <span className="text-cyan-400 text-[11px] font-mono">
            Inference: {lastExtractionMeta.latencyMs}ms
          </span>
        )}
      </div>

      {/* Multi-Item Amazon Prime Restock Bundle Bar */}
      {filter === 'pending' && pendingAmazonActions.length >= 2 && (
        <div className="mx-4 mt-3.5 p-3 rounded-xl bg-gradient-to-r from-[#1b2536] via-[#1f2937] to-[#261f14] border border-[#FF9900]/40 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#FF9900]/20 text-[#FF9900]">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Amazon Prime Smart Restock Bundle ({pendingAmazonActions.length} Items)
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#00A8E1]/20 text-[#00CAFF] border border-[#00A8E1]/40">
                  prime
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                Combine {pendingAmazonActions.map((a) => a.details?.productName).join(' + ')} into a single Prime dispatch
              </p>
            </div>
          </div>

          <a
            href={amazonBundle?.bundleUrl || 'https://www.amazon.com'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onExecuteBundle}
            className="px-3.5 py-1.5 rounded-lg bg-[#FF9900] hover:bg-[#ffad33] text-[#0f141c] font-bold text-xs flex items-center gap-1.5 shadow transition whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>1-Click Restock Bundle</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Action Cards Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
        {filteredActions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
            <Sparkles className="w-11 h-11 text-gray-600 mb-3" />
            <p className="text-sm font-semibold text-gray-300">No Active Actions in Queue</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Ambient utterances mentioning supplies, groceries, meetings, or tasks will automatically surface here.
            </p>
          </div>
        ) : (
          filteredActions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onExecute={onExecuteAction}
              onUpdate={onUpdateAction}
              onDismiss={onDismissAction}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ActionCard({ action, onExecute, onUpdate, onDismiss }) {
  const isPending = action.status === 'pending';
  const isExecuted = action.status === 'executed';

  // 1. Amazon Prime / Amazon Fresh Retail Card
  if (action.type === 'amazon_order') {
    const details = action.details || {};
    return (
      <div
        className={`rounded-xl border p-4 transition-all relative overflow-hidden ${
          isPending
            ? 'bg-gradient-to-br from-[#171f2c] to-[#121822] border-[#29374d] hover:border-[#FF9900]/60 shadow-lg'
            : 'bg-[#121721]/60 border-gray-800/80 opacity-75'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#FF9900]/15 border border-[#FF9900]/40 text-[#FF9900] font-bold text-[11px] flex items-center gap-1.5">
              <ShoppingCart className="w-3 h-3" /> {details.category || 'Amazon Prime'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#00A8E1]/15 border border-[#00A8E1]/30 text-[#00CAFF] font-semibold text-[10px] flex items-center gap-1">
              <Truck className="w-3 h-3" /> {details.deliveryBadge || 'Prime Same-Day'}
            </span>
            <span className="text-[11px] text-gray-400 font-mono">
              {Math.round((action.confidence || 0.96) * 100)}% Match
            </span>
          </div>

          {isPending && (
            <button
              onClick={() => onDismiss(action.id)}
              className="text-gray-500 hover:text-gray-300 p-1 rounded-lg hover:bg-gray-800 transition"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isExecuted && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" /> Dispatched to Amazon
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2 mb-1">
          <h3 className="text-base font-bold text-white">{action.title}</h3>
          <span className="text-xs font-medium text-gray-400">{details.brand}</span>
        </div>

        <div className="bg-[#0b0f17] rounded-lg px-3 py-2 mb-3 border border-[#1e293b] text-xs text-gray-300 italic">
          Captured Context: &ldquo;{action.dialogueQuote}&rdquo;
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs mb-3.5">
          <div className="bg-[#0e141f] p-2 rounded-lg border border-[#1e293b]">
            <span className="text-gray-400 text-[10px] block">Product</span>
            <span className="font-semibold text-white capitalize">{details.productName || 'Item'}</span>
          </div>
          <div className="bg-[#0e141f] p-2 rounded-lg border border-[#1e293b]">
            <span className="text-gray-400 text-[10px] block">Quantity / Option</span>
            {isPending ? (
              <select
                value={details.quantity || '1 Unit'}
                onChange={(e) =>
                  onUpdate(action.id, { details: { ...details, quantity: e.target.value } })
                }
                className="bg-transparent font-semibold text-[#FF9900] focus:outline-none w-full cursor-pointer"
              >
                {(() => {
                  const baseUnit = details.defaultQty || '1 Unit';
                  const qtyOptions = Array.from(new Set([
                    baseUnit,
                    details.quantity || baseUnit,
                    '2 Units (Family Pack)',
                    'Subscribe & Save (Monthly)'
                  ]));
                  return qtyOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#0f141c]">
                      {opt}
                    </option>
                  ));
                })()}
              </select>
            ) : (
              <span className="font-semibold text-[#FF9900]">{details.quantity || '1 Unit'}</span>
            )}
          </div>
          <div className="bg-[#0e141f] p-2 rounded-lg border border-[#1e293b]">
            <span className="text-gray-400 text-[10px] block">Prime Price</span>
            <span className="font-semibold text-emerald-400">{details.estimatedPrice || '$4.99'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={details.amazonUrl || 'https://www.amazon.com'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onExecute(action.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-b from-[#FF9900] to-[#e68a00] hover:from-[#ffad33] hover:to-[#FF9900] text-[#0f141c] font-bold text-xs shadow-md transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Buy Now on Amazon</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <a
            href={details.cartUrl || 'https://www.amazon.com'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onExecute(action.id)}
            className="py-2 px-3.5 rounded-lg bg-[#1c2636] hover:bg-[#253247] text-gray-200 font-semibold text-xs border border-[#2e3d54] transition"
          >
            <span>Add to Cart</span>
          </a>
        </div>
      </div>
    );
  }

  // 2. Schedule Meeting Card
  if (action.type === 'schedule_meeting') {
    const details = action.details || {};
    return (
      <div
        className={`rounded-xl border p-4 transition-all relative overflow-hidden ${
          isPending
            ? 'bg-gradient-to-br from-[#141f30] to-[#121822] border-[#253954] hover:border-[#00CAFF]/60 shadow-lg'
            : 'bg-[#121721]/60 border-gray-800/80 opacity-75'
        }`}
      >
        <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#00CAFF]/15 border border-[#00CAFF]/30 text-[#00CAFF] font-bold text-[11px] flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Calendar Invitation
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium text-[10px] flex items-center gap-1">
              <CalendarCheck className="w-3 h-3" /> {details.conflictStatus || 'Slot Available'}
            </span>
          </div>

          {isPending && (
            <button
              onClick={() => onDismiss(action.id)}
              className="text-gray-500 hover:text-gray-300 p-1 rounded-lg hover:bg-gray-800 transition"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isExecuted && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
              <Check className="w-3.5 h-3.5" /> Scheduled
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-white mb-1">{action.title}</h3>

        <div className="bg-[#0b0f17] rounded-lg px-3 py-2 mb-3 border border-[#1e293b] text-xs text-gray-300 italic">
          Captured Context: &ldquo;{action.dialogueQuote}&rdquo;
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs mb-3.5">
          <div className="bg-[#0e141f] p-2 rounded-lg border border-[#1e293b]">
            <span className="text-gray-400 text-[10px] block">Proposed Slot</span>
            <span className="font-semibold text-[#00CAFF]">{details.dateTime || 'Tomorrow 3:00 PM'}</span>
          </div>
          <div className="bg-[#0e141f] p-2 rounded-lg border border-[#1e293b]">
            <span className="text-gray-400 text-[10px] block">Participants</span>
            <span className="font-semibold text-white">{details.attendees || 'Team'}</span>
          </div>
          <div className="bg-[#0e141f] p-2 rounded-lg border border-[#1e293b]">
            <span className="text-gray-400 text-[10px] block">Duration</span>
            {isPending ? (
              <select
                value={details.durationMinutes || 45}
                onChange={(e) =>
                  onUpdate(action.id, {
                    details: { ...details, durationMinutes: Number(e.target.value) }
                  })
                }
                className="bg-transparent font-semibold text-gray-100 focus:outline-none w-full cursor-pointer"
              >
                <option value={15} className="bg-[#0f141c]">15 mins</option>
                <option value={30} className="bg-[#0f141c]">30 mins</option>
                <option value={45} className="bg-[#0f141c]">45 mins</option>
                <option value={60} className="bg-[#0f141c]">60 mins</option>
              </select>
            ) : (
              <span className="font-semibold text-gray-200">{details.durationMinutes || 45} mins</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={details.googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onExecute(action.id)}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#00A8E1] hover:bg-[#00bfff] text-[#0f141c] font-bold text-xs shadow-md transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Add to Calendar</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <a
            href={details.outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onExecute(action.id)}
            className="py-2 px-3 rounded-lg bg-[#1c2636] hover:bg-[#253247] text-gray-200 font-semibold text-xs border border-[#2e3d54] transition"
          >
            <span>Outlook</span>
          </a>

          <a
            href={`/api/calendar/ics/${action.id}`}
            download
            onClick={() => onExecute(action.id)}
            className="py-2 px-3 rounded-lg bg-[#1c2636] hover:bg-[#253247] text-gray-200 font-semibold text-xs border border-[#2e3d54] transition flex items-center gap-1.5"
            title="Export RFC 5545 .ics Calendar Invite"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.ICS</span>
          </a>
        </div>
      </div>
    );
  }

  // 3. Bee Wearable Task Sync Card
  return (
    <div
      className={`rounded-xl border p-4 transition-all relative overflow-hidden ${
        isPending
          ? 'bg-gradient-to-br from-[#19192b] to-[#121822] border-[#2e2f4f] hover:border-amber-400/60 shadow-lg'
          : 'bg-[#121721]/60 border-gray-800/80 opacity-75'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-[11px] flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3" /> Bee Wearable Todo Sync
        </span>

        {isPending && (
          <button
            onClick={() => onDismiss(action.id)}
            className="text-gray-500 hover:text-gray-300 p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isExecuted && (
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" /> Synced to Bee
          </span>
        )}
      </div>

      <h3 className="text-base font-bold text-white mb-1">{action.title}</h3>

      <div className="bg-[#0b0f17] rounded-lg px-3 py-2 mb-3 border border-[#1e293b] text-xs text-gray-300 italic">
        Captured Context: &ldquo;{action.dialogueQuote}&rdquo;
      </div>

      {isPending && (
        <button
          onClick={() => onExecute(action.id)}
          className="w-full py-2 px-3 rounded-lg bg-[#1c2636] hover:bg-[#FF9900] text-white hover:text-[#0f141c] font-bold text-xs border border-[#2e3d54] hover:border-[#FF9900] transition flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sync to Bee Wearable Tasks</span>
        </button>
      )}
    </div>
  );
}
