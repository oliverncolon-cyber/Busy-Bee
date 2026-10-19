import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BedrockActionExtractor } from './bedrockExtractor.js';
import { BeeConnector } from './beeConnector.js';
import { CalendarService } from './calendarService.js';
import { AmazonService } from './amazonService.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Initialize Core Services
const beeConnector = new BeeConnector();
const bedrockExtractor = new BedrockActionExtractor({
  region: process.env.AWS_REGION || 'us-east-1',
  modelId: process.env.AWS_BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  sessionToken: process.env.AWS_SESSION_TOKEN || ''
});

// Helper to compute current Amazon bundle metadata
function getAmazonBundleMeta(cards = []) {
  const pendingAmazon = cards.filter((a) => a.status === 'pending' && a.type === 'amazon_order');
  const totalEstimatedUsd = Number(
    pendingAmazon
      .reduce((sum, item) => sum + (Number(item.details?.totalPrice ?? item.details?.unitPrice) || 0), 0)
      .toFixed(2)
  );
  return {
    count: pendingAmazon.length,
    totalEstimatedUsd,
    formattedTotal: `$${totalEstimatedUsd.toFixed(2)}`,
    bundleUrl: AmazonService.generateBundleUrl(pendingAmazon)
  };
}

// Demo Mode Factory — populates all core features on first launch
function getDemoInitialState() {
  const history = [
    {
      id: 'demo-msg-1',
      speaker: 'Oliver',
      text: 'Morning! Quick ambient check on the home office and kitchen before standup.',
      timestamp: new Date(Date.now() - 1000 * 60 * 16).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasAction: false
    },
    {
      id: 'demo-msg-2',
      speaker: 'Household',
      text: "We're out of whole milk and we also need more organic coffee beans for tomorrow.",
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasAction: true
    },
    {
      id: 'demo-msg-3',
      speaker: 'Oliver',
      text: "Got it, I'll restock those on Amazon. Also, let's meet tomorrow at 3 PM to review the deck with Sarah.",
      timestamp: new Date(Date.now() - 1000 * 60 * 7).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasAction: true
    },
    {
      id: 'demo-msg-4',
      speaker: 'Oliver',
      text: 'Remind me to finalize the Q4 financial report before Friday.',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      hasAction: true
    }
  ];

  const cards = [
    {
      id: 'action-prime-milk',
      type: 'amazon_order',
      title: 'Order Organic Whole Milk',
      dialogueQuote: "We're out of whole milk",
      confidence: 0.98,
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      status: 'pending',
      details: {
        ...AmazonService.enrichProduct('whole milk', '1 Gallon'),
        rawQuote: "We're out of whole milk"
      }
    },
    {
      id: 'action-prime-coffee',
      type: 'amazon_order',
      title: 'Order Whole Bean Coffee',
      dialogueQuote: 'need more organic coffee beans for tomorrow',
      confidence: 0.96,
      createdAt: new Date(Date.now() - 1000 * 60 * 11).toISOString(),
      status: 'pending',
      details: {
        ...AmazonService.enrichProduct('coffee beans', '12 oz Bag'),
        rawQuote: 'need more organic coffee beans for tomorrow'
      }
    },
    {
      id: 'action-calendar-deck',
      type: 'schedule_meeting',
      title: 'Review the Deck (with Sarah)',
      dialogueQuote: "let's meet tomorrow at 3 PM to review the deck with Sarah",
      confidence: 0.97,
      createdAt: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
      status: 'pending',
      details: {
        dateTime: 'Tomorrow at 3:00 PM',
        durationMinutes: 45,
        attendees: 'Sarah',
        location: 'Amazon Chime / Conference Room',
        conflictStatus: 'Calendar Verified • Slot Available',
        dialogueQuote: "let's meet tomorrow at 3 PM to review the deck with Sarah",
        description: 'Scheduled via Busy Bee Ambient Intelligence',
        googleCalendarUrl: CalendarService.generateGoogleCalendarUrl('Review the Deck (with Sarah)', {
          dateTime: 'Tomorrow at 3:00 PM',
          durationMinutes: 45,
          attendees: 'Sarah',
          location: 'Amazon Chime / Conference Room',
          dialogueQuote: "let's meet tomorrow at 3 PM to review the deck with Sarah",
          description: 'Scheduled via Busy Bee Ambient Intelligence'
        }),
        outlookUrl: CalendarService.generateOutlookCalendarUrl('Review the Deck (with Sarah)', {
          dateTime: 'Tomorrow at 3:00 PM',
          durationMinutes: 45,
          attendees: 'Sarah',
          location: 'Amazon Chime / Conference Room',
          dialogueQuote: "let's meet tomorrow at 3 PM to review the deck with Sarah",
          description: 'Scheduled via Busy Bee Ambient Intelligence'
        }),
        icsDownloadUrl: '/api/calendar/ics/action-calendar-deck'
      }
    },
    {
      id: 'action-task-taxes',
      type: 'bee_task',
      title: 'Finalize Q4 Financial Report before Friday',
      dialogueQuote: 'Remind me to finalize the Q4 financial report before Friday',
      confidence: 0.94,
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      status: 'pending',
      details: {
        priority: 'high',
        dueDate: 'Friday 5:00 PM',
        beeSyncReady: true
      }
    }
  ];

  return { history, cards };
}

// Global Ambient State initialized in Demo Mode
const initialState = getDemoInitialState();
let isDemoMode = true;
let dialogueHistory = [...initialState.history];
let actionCards = [...initialState.cards];

// Active SSE Connections
const sseClients = new Set();

function broadcastEvent(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep SSE connections alive through proxies/browsers
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': heartbeat\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 25000);

/**
 * Background Live Bee Wearable Polling Worker (with mutex lock)
 */
const processedBeeUtterances = new Set();
let isPollingBee = false;

async function pollLiveBeeWearable() {
  if (isPollingBee) return;
  isPollingBee = true;

  try {
    const convos = await beeConnector.getLatestConversations({ onlyNew: true });
    if (!Array.isArray(convos)) return;

    for (const convo of convos) {
      const text = convo?.transcript || convo?.text || convo?.summary || convo?.rawText;
      const key = convo?.id || (text ? text.trim() : '');
      if (!text || !text.trim() || processedBeeUtterances.has(key)) continue;

      processedBeeUtterances.add(key);
      if (processedBeeUtterances.size > 1000) {
        const oldestKey = processedBeeUtterances.values().next().value;
        processedBeeUtterances.delete(oldestKey);
      }

      const extractionResult = await bedrockExtractor.extractActions(text, convo?.speaker || 'Bee Wearable');
      const newActions = extractionResult.actions || [];

      const historyItem = {
        id: uuidv4(),
        speaker: convo?.speaker || 'Bee Wearable',
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAction: newActions.length > 0,
        extractedActions: newActions,
        source: 'bee-device'
      };

      dialogueHistory.unshift(historyItem);
      if (dialogueHistory.length > 50) dialogueHistory.pop();

      for (const act of newActions) {
        actionCards.unshift(act);
      }
      if (actionCards.length > 100) actionCards.length = 100;

      broadcastEvent('new_dialogue', {
        dialogue: historyItem,
        actions: newActions,
        amazonBundle: getAmazonBundleMeta(actionCards),
        meta: {
          engine: extractionResult.engine,
          latencyMs: extractionResult.latencyMs,
          reasoning: extractionResult.reasoning
        }
      });
    }
  } catch {
    // Silent background poll
  } finally {
    isPollingBee = false;
  }
}

setInterval(pollLiveBeeWearable, 12000);

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  sseClients.add(res);
  res.write(`event: init\ndata: ${JSON.stringify({ status: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.get('/api/status', async (req, res) => {
  const beeStatus = await beeConnector.checkStatus();
  const bedrockStatus = bedrockExtractor.getStatus();

  res.json({
    appName: 'Busy Bee',
    tagline: 'Ambient Action Intelligence for Bee Wearable & Amazon Bedrock',
    demoModeActive: isDemoMode,
    bee: beeStatus,
    bedrock: bedrockStatus,
    activeActionsCount: actionCards.filter((a) => a.status === 'pending').length,
    executedActionsCount: actionCards.filter((a) => a.status === 'executed').length,
    amazonBundle: getAmazonBundleMeta(actionCards),
    historyLength: dialogueHistory.length,
    serverTime: new Date().toISOString()
  });
});

/**
 * Toggle Demo Mode ON / OFF
 * When OFF: starts clean in Live Mode for actual voice/wearable capture
 * When ON: loads full showcase scenario data
 */
app.post('/api/demo/toggle', (req, res) => {
  const { enable } = req.body || {};
  isDemoMode = enable !== undefined ? Boolean(enable) : !isDemoMode;

  if (isDemoMode) {
    const fresh = getDemoInitialState();
    dialogueHistory = [...fresh.history];
    actionCards = [...fresh.cards];
  } else {
    dialogueHistory = [];
    actionCards = [];
  }

  const amazonBundle = getAmazonBundleMeta(actionCards);

  broadcastEvent('demo_mode_changed', {
    demoModeActive: isDemoMode,
    dialogueHistory,
    actions: actionCards,
    amazonBundle
  });

  res.json({
    success: true,
    demoModeActive: isDemoMode,
    history: dialogueHistory,
    actions: actionCards,
    amazonBundle
  });
});

/**
 * Test Amazon Bedrock Credentials live (and persist if valid)
 */
app.post('/api/bedrock/test-connection', async (req, res) => {
  const { region, modelId, accessKeyId, secretAccessKey, sessionToken } = req.body || {};
  const tempExtractor = new BedrockActionExtractor({
    region: region || bedrockExtractor.region || 'us-east-1',
    modelId: modelId || bedrockExtractor.modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    accessKeyId,
    secretAccessKey,
    sessionToken
  });

  const result = await tempExtractor.testConnection();
  if (result.ok) {
    // Automatically apply verified credentials to the active instance
    bedrockExtractor.updateConfig({
      region: tempExtractor.region,
      modelId: tempExtractor.modelId,
      accessKeyId,
      secretAccessKey,
      sessionToken
    });
    res.json({
      success: true,
      message: 'Verified live connection to Amazon Bedrock!',
      modelId: result.modelId,
      region: result.region,
      status: bedrockExtractor.getStatus()
    });
  } else {
    res.status(400).json({
      success: false,
      error: result.error
    });
  }
});

/**
 * Reset Application into Full Demo Mode
 */
app.post('/api/demo/reset', (req, res) => {
  isDemoMode = true;
  const fresh = getDemoInitialState();
  dialogueHistory = [...fresh.history];
  actionCards = [...fresh.cards];
  const amazonBundle = getAmazonBundleMeta(actionCards);

  broadcastEvent('demo_reset', {
    dialogueHistory,
    actions: actionCards,
    amazonBundle
  });

  res.json({
    success: true,
    message: 'Demo showcase state loaded',
    demoModeActive: true,
    history: dialogueHistory,
    actions: actionCards,
    amazonBundle
  });
});

app.post('/api/dialogue/ingest', async (req, res) => {
  const { text, speaker = 'Oliver' } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text prompt is required' });
  }

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const entryId = uuidv4();

  const extractionResult = await bedrockExtractor.extractActions(text, speaker);
  const newActions = extractionResult.actions || [];

  const historyItem = {
    id: entryId,
    speaker,
    text: text.trim(),
    timestamp,
    hasAction: newActions.length > 0,
    extractedActions: newActions
  };

  dialogueHistory.unshift(historyItem);
  if (dialogueHistory.length > 50) dialogueHistory.pop();

  for (const act of newActions) {
    actionCards.unshift(act);
  }
  if (actionCards.length > 100) actionCards.length = 100;

  const amazonBundle = getAmazonBundleMeta(actionCards);

  broadcastEvent('new_dialogue', {
    dialogue: historyItem,
    actions: newActions,
    amazonBundle,
    meta: {
      engine: extractionResult.engine,
      latencyMs: extractionResult.latencyMs,
      reasoning: extractionResult.reasoning
    }
  });

  res.json({
    success: true,
    dialogue: historyItem,
    detectedActions: newActions,
    amazonBundle,
    meta: extractionResult
  });
});

app.get('/api/dialogue/history', (req, res) => {
  res.json({ history: dialogueHistory });
});

app.post('/api/dialogue/clear', (req, res) => {
  dialogueHistory = [];
  broadcastEvent('history_cleared', {});
  res.json({ success: true });
});

app.get('/api/actions', (req, res) => {
  res.json({
    actions: actionCards,
    amazonBundle: getAmazonBundleMeta(actionCards)
  });
});

app.patch('/api/actions/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const action = actionCards.find((a) => a.id === id);

  if (!action) {
    return res.status(404).json({ error: 'Action not found' });
  }

  if (updates.title) action.title = updates.title;
  if (updates.details) {
    action.details = { ...action.details, ...updates.details };
  }

  // Re-compute downstream URLs if calendar or Amazon fields were modified
  if (action.type === 'schedule_meeting' && (updates.title || updates.details)) {
    action.details.googleCalendarUrl = CalendarService.generateGoogleCalendarUrl(action.title, action.details);
    action.details.outlookUrl = CalendarService.generateOutlookCalendarUrl(action.title, action.details);
  } else if (action.type === 'amazon_order' && updates.details && (updates.details.productName || updates.details.quantity)) {
    const refreshedProduct = AmazonService.enrichProduct(
      action.details.productName,
      action.details.quantity
    );
    action.details = {
      ...action.details,
      ...refreshedProduct
    };
  }

  const amazonBundle = getAmazonBundleMeta(actionCards);
  broadcastEvent('action_updated', { action, amazonBundle });
  res.json({ success: true, action, amazonBundle });
});

app.post('/api/actions/:id/execute', async (req, res) => {
  const { id } = req.params;
  const action = actionCards.find((a) => a.id === id);

  if (!action) {
    return res.status(404).json({ error: 'Action not found' });
  }

  action.status = 'executed';
  action.executedAt = new Date().toISOString();

  let beeSyncResult = null;
  if (action.type === 'bee_task') {
    beeSyncResult = await beeConnector.addTodo(action.title);
  }

  const amazonBundle = getAmazonBundleMeta(actionCards);
  broadcastEvent('action_updated', { action, beeSyncResult, amazonBundle });

  res.json({
    success: true,
    action,
    beeSyncResult,
    amazonBundle,
    message: `Action executed: ${action.title}`
  });
});

app.post('/api/actions/bundle/execute', (req, res) => {
  const executed = [];
  for (const act of actionCards) {
    if (act.status === 'pending' && act.type === 'amazon_order') {
      act.status = 'executed';
      act.executedAt = new Date().toISOString();
      executed.push(act);
    }
  }
  const amazonBundle = getAmazonBundleMeta(actionCards);
  for (const act of executed) {
    broadcastEvent('action_updated', { action: act, amazonBundle });
  }
  res.json({ success: true, executedCount: executed.length, executed, amazonBundle });
});

app.post('/api/actions/clear', (req, res) => {
  actionCards = [];
  const amazonBundle = getAmazonBundleMeta(actionCards);
  broadcastEvent('actions_cleared', { actions: [], amazonBundle });
  res.json({ success: true, actions: [], amazonBundle });
});

app.post('/api/actions/:id/dismiss', (req, res) => {
  const { id } = req.params;
  const action = actionCards.find((a) => a.id === id);

  if (action) {
    action.status = 'dismissed';
    const amazonBundle = getAmazonBundleMeta(actionCards);
    broadcastEvent('action_updated', { action, amazonBundle });
  }

  res.json({ success: true, id, amazonBundle: getAmazonBundleMeta(actionCards) });
});

app.get('/api/calendar/ics/:id', (req, res) => {
  const { id } = req.params;
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  const action = actionCards.find((a) => a.id === id);

  const title = action ? action.title : 'Meeting Sync';
  const details = action?.details || {
    dateTime: 'Tomorrow at 3:00 PM',
    durationMinutes: 45,
    description: 'Scheduled via Busy Bee Ambient Intelligence'
  };

  const icsContent = CalendarService.generateIcs(title, details);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="busy-bee-event-${safeId || 'invite'}.ics"`);
  res.send(icsContent);
});

app.post('/api/bee/sync', async (req, res) => {
  const result = await beeConnector.triggerSync();
  await pollLiveBeeWearable();
  res.json(result);
});

app.get('/api/bee/now', async (req, res) => {
  const convos = await beeConnector.getLatestConversations();
  res.json({ conversations: convos });
});

app.get('/api/bee/today', async (req, res) => {
  const brief = await beeConnector.getTodayBrief();
  res.json({
    brief: brief || {
      date: new Date().toISOString().split('T')[0],
      summary: 'Ambient stream active. Ready to capture meetings, Amazon restocks, and Bee tasks.',
      pendingActions: actionCards.filter((a) => a.status === 'pending').length
    }
  });
});

app.get('/api/config', (req, res) => {
  res.json(bedrockExtractor.getStatus());
});

app.post('/api/config', (req, res) => {
  const { region, modelId, accessKeyId, secretAccessKey, sessionToken } = req.body || {};
  bedrockExtractor.updateConfig({ region, modelId, accessKeyId, secretAccessKey, sessionToken });
  res.json({
    success: true,
    status: bedrockExtractor.getStatus()
  });
});

// Serve static production frontend bundle if built
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/events') return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🐝 Busy Bee Server listening on http://localhost:${PORT} (Demo Mode Active)`);
  console.log(`🤖 Amazon Bedrock Engine: ${bedrockExtractor.modelId} (Region: ${bedrockExtractor.region})`);
  console.log(`👓 Bee Wearable CLI / Proxy / MCP Bridge active.`);
});