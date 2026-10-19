import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FirstRunBanner } from './components/FirstRunBanner';
import { WearableStream } from './components/WearableStream';
import { ActionFeed } from './components/ActionFeed';
import { BedrockSettingsModal } from './components/BedrockSettingsModal';

export function App() {
  const [status, setStatus] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [dialogueHistory, setDialogueHistory] = useState([]);
  const [actions, setActions] = useState([]);
  const [amazonBundle, setAmazonBundle] = useState(null);
  const [lastExtractionMeta, setLastExtractionMeta] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return localStorage.getItem('busybee_banner_dismissed') === 'true';
  });

  const fetchData = async () => {
    try {
      const [statusRes, actionsRes, historyRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/actions'),
        fetch('/api/dialogue/history')
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setStatus(sData);
        if (sData.demoModeActive !== undefined) {
          setIsDemoMode(sData.demoModeActive);
        }
      }
      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setActions(data.actions || []);
        setAmazonBundle(data.amazonBundle || null);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setDialogueHistory(data.history || []);
      }
    } catch (err) {
      console.warn('Initial fetch notice:', err);
    }
  };

  useEffect(() => {
    fetchData();

    const eventSource = new EventSource('/events');

    eventSource.addEventListener('new_dialogue', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.dialogue) {
          setDialogueHistory((prev) => [data.dialogue, ...prev]);
        }
        if (data.actions && data.actions.length > 0) {
          setActions((prev) => [...data.actions, ...prev]);
        }
        if (data.amazonBundle) {
          setAmazonBundle(data.amazonBundle);
        }
        if (data.meta) {
          setLastExtractionMeta(data.meta);
        }
      } catch (err) {
        console.error('SSE new_dialogue error:', err);
      }
    });

    eventSource.addEventListener('action_updated', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action) {
          setActions((prev) => prev.map((a) => (a.id === data.action.id ? data.action : a)));
        }
        if (data.amazonBundle) {
          setAmazonBundle(data.amazonBundle);
        }
      } catch (err) {
        console.error('SSE action_updated error:', err);
      }
    });

    eventSource.addEventListener('demo_mode_changed', (event) => {
      try {
        const data = JSON.parse(event.data);
        setIsDemoMode(data.demoModeActive);
        if (data.dialogueHistory) setDialogueHistory(data.dialogueHistory);
        if (data.actions) setActions(data.actions);
        if (data.amazonBundle) setAmazonBundle(data.amazonBundle);
      } catch (err) {
        console.error('SSE demo_mode_changed error:', err);
      }
    });

    eventSource.addEventListener('demo_reset', (event) => {
      try {
        const data = JSON.parse(event.data);
        setIsDemoMode(true);
        if (data.dialogueHistory) setDialogueHistory(data.dialogueHistory);
        if (data.actions) setActions(data.actions);
        if (data.amazonBundle) setAmazonBundle(data.amazonBundle);
      } catch (err) {
        console.error('SSE demo_reset error:', err);
      }
    });

    eventSource.addEventListener('actions_cleared', (event) => {
      try {
        const data = JSON.parse(event.data);
        setActions([]);
        if (data.amazonBundle) setAmazonBundle(data.amazonBundle);
      } catch (err) {
        setActions([]);
      }
    });

    eventSource.addEventListener('history_cleared', () => {
      setDialogueHistory([]);
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const handleToggleDemoMode = async (enable) => {
    try {
      const res = await fetch('/api/demo/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable })
      });
      if (res.ok) {
        const data = await res.json();
        setIsDemoMode(data.demoModeActive);
        setDialogueHistory(data.history || []);
        setActions(data.actions || []);
        setAmazonBundle(data.amazonBundle || null);
      }
    } catch (err) {
      console.error('Toggle demo mode error:', err);
    }
  };

  const handleIngestDialogue = async (text, speaker) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/dialogue/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speaker })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.meta) {
          setLastExtractionMeta(result.meta);
        }
        if (result.amazonBundle) {
          setAmazonBundle(result.amazonBundle);
        }
      }
    } catch (err) {
      console.error('Failed to ingest dialogue:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteAction = async (id) => {
    try {
      const res = await fetch(`/api/actions/${id}/execute`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActions((prev) => prev.map((a) => (a.id === id ? data.action : a)));
        if (data.amazonBundle) {
          setAmazonBundle(data.amazonBundle);
        }
      }
    } catch (err) {
      console.error('Execute action error:', err);
    }
  };

  const handleExecuteBundle = async () => {
    try {
      const res = await fetch('/api/actions/bundle/execute', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.amazonBundle) {
          setAmazonBundle(data.amazonBundle);
        }
        await fetchData();
      }
    } catch (err) {
      console.error('Execute bundle error:', err);
    }
  };

  const handleUpdateAction = async (id, updates) => {
    try {
      const res = await fetch(`/api/actions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setActions((prev) => prev.map((a) => (a.id === id ? data.action : a)));
        if (data.amazonBundle) {
          setAmazonBundle(data.amazonBundle);
        }
      }
    } catch (err) {
      console.error('Update action error:', err);
    }
  };

  const handleDismissAction = async (id) => {
    try {
      const res = await fetch(`/api/actions/${id}/dismiss`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'dismissed' } : a)));
        if (data.amazonBundle) {
          setAmazonBundle(data.amazonBundle);
        }
      }
    } catch (err) {
      console.error('Dismiss action error:', err);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch('/api/dialogue/clear', { method: 'POST' });
      setDialogueHistory([]);
    } catch (err) {
      console.error('Clear history error:', err);
    }
  };

  const handleSyncBee = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/bee/sync', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = async (config) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        const data = await res.json();
        setStatus((prev) => ({ ...prev, bedrock: data.status }));
      }
    } catch (err) {
      console.error('Save config error:', err);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsDemoMode(true);
        setDialogueHistory(data.history || []);
        setActions(data.actions || []);
        setAmazonBundle(data.amazonBundle || null);
      }
    } catch (err) {
      console.error('Reset demo error:', err);
    }
  };

  const handlePlayDemoTour = async () => {
    if (isPlayingDemo) return;
    setIsPlayingDemo(true);

    try {
      // Clear previous dialogue and actions to start a pristine live tour
      await Promise.all([
        fetch('/api/dialogue/clear', { method: 'POST' }),
        fetch('/api/actions/clear', { method: 'POST' })
      ]);
      setDialogueHistory([]);
      setActions([]);
      setAmazonBundle({ count: 0, totalEstimatedUsd: 0, formattedTotal: '$0.00', bundleUrl: 'https://www.amazon.com' });

      await new Promise((resolve) => setTimeout(resolve, 350));

      const tourSteps = [
        {
          text: "We're completely out of whole milk and organic eggs, can you please order some on Amazon?",
          speaker: 'Household',
          delay: 500
        },
        {
          text: 'Also we really need to buy fresh AA batteries for the smoke detectors.',
          speaker: 'Household',
          delay: 2400
        },
        {
          text: "Got it! Also let's meet tomorrow at 3 PM to review the Q4 architecture deck with Sarah.",
          speaker: 'Oliver',
          delay: 2400
        },
        {
          text: 'Remind me to finalize the quarterly financial report before Friday.',
          speaker: 'Oliver',
          delay: 2200
        }
      ];

      for (const step of tourSteps) {
        await new Promise((resolve) => setTimeout(resolve, step.delay));
        await handleIngestDialogue(step.text, step.speaker);
      }
    } finally {
      setIsPlayingDemo(false);
    }
  };

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem('busybee_banner_dismissed', 'true');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d14]">
      <Navbar
        status={status}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSyncBee={handleSyncBee}
        syncing={isSyncing}
        onPlayDemoTour={handlePlayDemoTour}
        onResetDemo={handleResetDemo}
        isPlayingDemo={isPlayingDemo}
      />

      <div className="pt-3">
        <FirstRunBanner
          isDemoMode={isDemoMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleDemoMode={handleToggleDemoMode}
          onDismiss={handleDismissBanner}
          dismissed={bannerDismissed}
        />
      </div>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 pb-4 lg:px-6 lg:pb-6 grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-140px)]">
        {/* Left Column: Bee Live Transcript Feed (5 cols) */}
        <section className="lg:col-span-5 h-[500px] lg:h-full">
          <WearableStream
            dialogueHistory={dialogueHistory}
            onIngestDialogue={handleIngestDialogue}
            onClearHistory={handleClearHistory}
            isProcessing={isProcessing || isPlayingDemo}
          />
        </section>

        {/* Right Column: Ambient Action Center (7 cols) */}
        <section className="lg:col-span-7 h-[550px] lg:h-full">
          <ActionFeed
            actions={actions}
            amazonBundle={amazonBundle}
            onExecuteAction={handleExecuteAction}
            onExecuteBundle={handleExecuteBundle}
            onUpdateAction={handleUpdateAction}
            onDismissAction={handleDismissAction}
            lastExtractionMeta={lastExtractionMeta}
          />
        </section>
      </main>

      <BedrockSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentStatus={status?.bedrock}
        onSaveConfig={handleSaveConfig}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
      />
    </div>
  );
}

export default App;
