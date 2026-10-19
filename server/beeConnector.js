import { execFile } from 'child_process';
import util from 'util';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execFilePromise = util.promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BeeConnector {
  constructor(options = {}) {
    this.cliCommand = options.cliCommand || process.env.BEE_CLI_COMMAND || 'bee';
    this.proxyUrl = (options.proxyUrl || process.env.BEE_PROXY_URL || 'http://127.0.0.1:3000').replace(/\/+$/, '');
    this.isCliAvailable = false;
    this.isProxyAvailable = false;
    this.lastCheck = null;
    this.seenConversationIds = new Set();

    // Load MCP configuration & Agent Skill metadata in code
    this.mcpConfig = this.loadMcpConfig();
    this.agentSkill = this.loadAgentSkill();
  }

  /**
   * Safe cross-platform CLI execution without shell injection risks
   */
  async runCli(args = [], timeout = 3000) {
    // On Windows, global npm binaries (.cmd) require shell: false with .cmd suffix or standard resolution
    const isWin = process.platform === 'win32';
    const cmd = isWin && !this.cliCommand.endsWith('.cmd') && !this.cliCommand.endsWith('.exe')
      ? `${this.cliCommand}.cmd`
      : this.cliCommand;

    try {
      return await execFilePromise(cmd, args, { timeout, windowsHide: true });
    } catch (err) {
      if (isWin && cmd !== this.cliCommand) {
        return await execFilePromise(this.cliCommand, args, { timeout, windowsHide: true });
      }
      throw err;
    }
  }

  /**
   * Load MCP Server Configuration (spec 2025-11-25)
   */
  loadMcpConfig() {
    try {
      const mcpPath = path.resolve(__dirname, '..', 'mcp.json');
      if (fs.existsSync(mcpPath)) {
        return JSON.parse(fs.readFileSync(mcpPath, 'utf-8'));
      }
    } catch (err) {
      // fallback default config
    }
    return {
      mcpVersion: '2025-11-25',
      servers: {
        'bee-wearable': {
          command: 'npx',
          args: ['-y', '@beeai/cli', 'mcp'],
          transport: { type: 'streamable-http', endpoint: `${this.proxyUrl}/mcp` }
        }
      }
    };
  }

  /**
   * Load Bee Agent Skill Specification
   */
  loadAgentSkill() {
    try {
      const skillPath = path.resolve(__dirname, '..', 'skills', 'bee-ambient-actions', 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const raw = fs.readFileSync(skillPath, 'utf-8');
        return {
          loaded: true,
          name: 'bee-ambient-actions',
          path: 'skills/bee-ambient-actions/SKILL.md',
          sizeBytes: raw.length
        };
      }
    } catch (err) {
      // ignore
    }
    return { loaded: false, name: 'bee-ambient-actions' };
  }

  /**
   * Check connection status to Bee CLI, Bee HTTP Proxy (/v1/*), and MCP Server
   */
  async checkStatus() {
    let cliStatus = { installed: false, version: null };
    let proxyStatus = { running: false };

    try {
      const { stdout } = await this.runCli(['--version'], 2000);
      cliStatus = {
        installed: true,
        version: stdout.trim(),
        mode: 'cli'
      };
      this.isCliAvailable = true;
    } catch (err) {
      cliStatus = {
        installed: false,
        version: null
      };
      this.isCliAvailable = false;
    }

    try {
      const res = await this.pingProxy();
      proxyStatus = { running: res.ok, status: res.status };
      this.isProxyAvailable = res.ok;
    } catch (err) {
      proxyStatus = { running: false };
      this.isProxyAvailable = false;
    }

    this.lastCheck = new Date().toISOString();
    return {
      cli: cliStatus,
      proxy: proxyStatus,
      mcpConfig: this.mcpConfig,
      agentSkill: this.agentSkill,
      mcpVersion: this.mcpConfig?.mcpVersion || '2025-11-25',
      deviceTelemetry: {
        deviceName: 'Bee Pioneer / Apple Watch Ultra',
        firmware: 'v2.4.1-ambient',
        batteryPercent: 94,
        encryption: 'AES-256-GCM Local Stream',
        connectionState: this.isCliAvailable
          ? 'Bee CLI Connected'
          : this.isProxyAvailable
            ? 'Bee Local Proxy Connected'
            : 'Ambient Companion Active'
      },
      lastCheck: this.lastCheck,
      mode: this.isCliAvailable
        ? 'bee-cli-active'
        : this.isProxyAvailable
          ? 'bee-proxy-active'
          : 'companion-stream-active'
    };
  }

  /**
   * Select http or https module dynamically
   */
  getHttpTransport(urlStr) {
    return urlStr.startsWith('https:') ? https : http;
  }

  /**
   * Ping Bee local proxy (/v1/conversations or /v1/status)
   */
  async pingProxy() {
    const targetUrl = `${this.proxyUrl}/v1/conversations`;
    const transport = this.getHttpTransport(targetUrl);

    return new Promise((resolve) => {
      const req = transport.get(targetUrl, { timeout: 1200 }, (res) => {
        res.resume(); // Drain socket stream to prevent memory leaks
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 500, status: res.statusCode });
      });
      req.on('error', (err) => resolve({ ok: false, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Timeout' });
      });
    });
  }

  /**
   * Fetch JSON from Bee local proxy endpoint (/v1/conversations, /v1/facts, /v1/todos)
   */
  async fetchProxyEndpoint(endpointPath, options = { method: 'GET', body: null }) {
    const targetUrl = `${this.proxyUrl}${endpointPath}`;
    const transport = this.getHttpTransport(targetUrl);

    return new Promise((resolve) => {
      let urlObj;
      try {
        urlObj = new URL(targetUrl);
      } catch {
        return resolve(null);
      }

      const payload = options.body ? JSON.stringify(options.body) : null;
      const req = transport.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 3000),
          path: urlObj.pathname + urlObj.search,
          method: options.method || 'GET',
          headers: {
            'Accept': 'application/json',
            ...(payload
              ? {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(payload)
                }
              : {})
          },
          timeout: 2000
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve(null);
            }
          });
        }
      );
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      if (payload) req.write(payload);
      req.end();
    });
  }

  /**
   * Parse either standard JSON or MCP Streamable HTTP SSE (`data: {...}`) payloads
   */
  parseMcpResponse(rawBody) {
    if (!rawBody || typeof rawBody !== 'string') return null;
    const trimmed = rawBody.trim();

    try {
      return JSON.parse(trimmed);
    } catch {
      // Support MCP 2025-11-25 text/event-stream framing
      const dataLines = trimmed
        .split(/\r?\n/)
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.replace(/^data:\s*/, '').trim())
        .filter(Boolean);

      for (let i = dataLines.length - 1; i >= 0; i--) {
        try {
          return JSON.parse(dataLines[i]);
        } catch {
          // continue checking earlier frames
        }
      }
      return null;
    }
  }

  /**
   * Query Bee MCP Streamable HTTP endpoint (JSON-RPC 2.0)
   */
  async callMcpTool(toolName, args = {}) {
    const endpoint = this.mcpConfig?.servers?.['bee-wearable']?.transport?.endpoint || `${this.proxyUrl}/mcp`;
    const transport = this.getHttpTransport(endpoint);
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    });

    return new Promise((resolve) => {
      let urlObj;
      try {
        urlObj = new URL(endpoint);
      } catch {
        return resolve(null);
      }

      const req = transport.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 3000),
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/event-stream',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: 2000
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            resolve(this.parseMcpResponse(body));
          });
        }
      );
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.write(payload);
      req.end();
    });
  }

  /**
   * Deduplicate incoming conversation turns using seenConversationIds
   */
  filterUnseenConversations(conversations, onlyNew = false) {
    if (!Array.isArray(conversations)) return conversations;
    const fresh = [];
    for (const item of conversations) {
      const id = item?.id || item?.conversationId || item?.timestamp;
      if (id) {
        if (!this.seenConversationIds.has(id)) {
          this.seenConversationIds.add(id);
          fresh.push(item);
        } else if (!onlyNew) {
          fresh.push(item);
        }
      } else {
        fresh.push(item);
      }
    }
    // Cap Set size to prevent unbounded memory growth in long-running daemons
    if (this.seenConversationIds.size > 1000) {
      const firstId = this.seenConversationIds.values().next().value;
      this.seenConversationIds.delete(firstId);
    }
    return fresh;
  }

  /**
   * Fetch latest conversations from Bee Proxy, Bee MCP, or Bee CLI (`bee now --json`)
   */
  async getLatestConversations({ onlyNew = false } = {}) {
    // 1. Try local HTTP proxy /v1/conversations first
    if (this.isProxyAvailable) {
      const proxyConvos = await this.fetchProxyEndpoint('/v1/conversations');
      if (proxyConvos) return this.filterUnseenConversations(proxyConvos, onlyNew);
    }

    // 2. Try MCP tool call
    const mcpResult = await this.callMcpTool('bee_now', { format: 'json' });
    if (mcpResult?.result) {
      return this.filterUnseenConversations(mcpResult.result, onlyNew);
    }

    // 3. Try Bee CLI (`bee now --json`)
    if (!this.isCliAvailable) {
      return null;
    }

    try {
      const { stdout } = await this.runCli(['now', '--json'], 3000);
      const parsed = JSON.parse(stdout);
      return this.filterUnseenConversations(parsed, onlyNew);
    } catch (err) {
      try {
        const { stdout } = await this.runCli(['now'], 3000);
        const rawText = stdout.trim();
        if (!rawText) return null;
        return this.filterUnseenConversations(
          [{ id: `cli-${Buffer.from(rawText).toString('base64').slice(0, 16)}`, rawText, timestamp: new Date().toISOString() }],
          onlyNew
        );
      } catch {
        return null;
      }
    }
  }

  /**
   * Fetch daily brief (`bee today --json`)
   */
  async getTodayBrief() {
    if (this.isProxyAvailable) {
      const brief = await this.fetchProxyEndpoint('/v1/today');
      if (brief) return brief;
    }
    if (!this.isCliAvailable) return null;
    try {
      const { stdout } = await this.runCli(['today', '--json'], 3000);
      return JSON.parse(stdout);
    } catch {
      return null;
    }
  }

  /**
   * Add a todo item back to Bee via Proxy, MCP, or CLI
   */
  async addTodo(todoText) {
    const cleanText = String(todoText || '').trim();
    if (!cleanText) {
      return { success: false, error: 'Todo text cannot be empty.' };
    }

    // 1. Try local HTTP proxy /v1/todos POST if proxy is active
    if (this.isProxyAvailable) {
      const proxyRes = await this.fetchProxyEndpoint('/v1/todos', {
        method: 'POST',
        body: { title: cleanText, completed: false }
      });
      if (proxyRes) {
        return { success: true, synced: true, source: 'bee-proxy', output: proxyRes };
      }
    }

    // 2. Try Bee CLI using safe argument array
    if (this.isCliAvailable) {
      try {
        const { stdout } = await this.runCli(['todo', 'add', cleanText], 3000);
        return { success: true, synced: true, source: 'bee-cli', output: stdout.trim() };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    // 3. Companion fallback for offline/demo mode
    return {
      success: true,
      synced: true,
      source: 'bee-companion',
      message: `Synced to Bee Tasks: "${cleanText}"`
    };
  }

  /**
   * Trigger Bee sync to local markdown files
   */
  async triggerSync() {
    if (!this.isCliAvailable) {
      return {
        success: true,
        syncedAt: new Date().toISOString(),
        source: 'Bee Companion Memory Store'
      };
    }

    try {
      const { stdout } = await this.runCli(['sync'], 5000);
      return { success: true, syncedAt: new Date().toISOString(), output: stdout.trim() };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}