import React, { useState } from 'react';
import {
  X,
  Shield,
  Check,
  Zap,
  Cpu,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export function BedrockSettingsModal({
  isOpen,
  onClose,
  currentStatus,
  onSaveConfig,
  isDemoMode,
  onToggleDemoMode
}) {
  if (!isOpen) return null;

  const [region, setRegion] = useState(currentStatus?.region || 'us-east-1');
  const [modelId, setModelId] = useState(
    currentStatus?.modelId || 'anthropic.claude-3-5-sonnet-20241022-v2:0'
  );
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [sessionToken, setSessionToken] = useState('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestConnection = async () => {
    if (!accessKeyId.trim() || !secretAccessKey.trim()) {
      setTestResult({
        ok: false,
        message: 'Please enter both an AWS Access Key ID and Secret Access Key.'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/bedrock/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region,
          modelId,
          accessKeyId: accessKeyId.trim(),
          secretAccessKey: secretAccessKey.trim(),
          sessionToken: sessionToken.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult({
          ok: true,
          message: data.message || 'Live connection verified! Amazon Bedrock responded successfully.'
        });
      } else {
        setTestResult({
          ok: false,
          message: data.error || 'Connection failed. Check your IAM permissions and Bedrock model access.'
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: err.message || 'Failed to reach backend connection test service.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig({
      region,
      modelId,
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      sessionToken: sessionToken.trim()
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#111722] border border-[#243247] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#151d2b]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#FF9900]/15 text-[#FF9900] border border-[#FF9900]/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Amazon Bedrock Cloud Setup &amp; API Key Guide
              </h3>
              <p className="text-xs text-gray-400">
                1st Run Walkthrough • Switch between Demo Mode and Live Inference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Demo Mode Quick Switch Box */}
          <div className="p-3.5 rounded-xl bg-[#162030] border border-[#2a3b54] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#FF9900]" />
              <div>
                <span className="font-bold text-white block">
                  Demo Showcase Mode: {isDemoMode ? 'ENABLED' : 'DISABLED'}
                </span>
                <span className="text-gray-400 text-[11px]">
                  {isDemoMode
                    ? 'Turn off Demo Mode to clear preloaded data and listen for live speech.'
                    : 'Turn on Demo Mode to reload sample lifelogs for demonstration.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleDemoMode(!isDemoMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                isDemoMode
                  ? 'bg-amber-500/20 text-[#FF9900] border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {isDemoMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span>{isDemoMode ? 'Shut Off Demo Mode' : 'Turn On Demo Mode'}</span>
            </button>
          </div>

          {/* 3-Step Visual Process Guide for First Run */}
          <div className="p-4 rounded-xl bg-[#0b0f17] border border-[#1e293b] space-y-3">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs">
              <Shield className="w-3.5 h-3.5 text-[#00CAFF]" /> How to Add Your AWS Bedrock Keys in 3 Steps:
            </h4>

            <div className="space-y-2 text-[11px] text-gray-300">
              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#FF9900]/20 text-[#FF9900] font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong>Enable Model Access in AWS Bedrock:</strong> Sign in to the AWS Console, open{' '}
                  <span className="text-[#00CAFF]">Amazon Bedrock &gt; Model access</span>, and click{' '}
                  <em>Enable all models</em> (specifically <strong>Anthropic Claude 3.5 Sonnet</strong> or{' '}
                  <strong>Amazon Nova Pro</strong>).
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#FF9900]/20 text-[#FF9900] font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong>Generate IAM Access Key:</strong> Navigate to{' '}
                  <span className="text-[#00CAFF]">AWS IAM &gt; Users &gt; [Your User] &gt; Security credentials</span>,
                  click <em>Create access key</em>, and select <em>Command Line Interface (CLI)</em>.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#FF9900]/20 text-[#FF9900] font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong>Paste &amp; Verify Below:</strong> Paste your Access Key ID and Secret Access Key into the form.
                  Click <em>Test Connection</em> to confirm, then save.
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-gray-300 font-semibold mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#00CAFF]" /> Amazon Bedrock Foundation Model
              </label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full bg-[#0b0f17] border border-[#263449] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#FF9900]"
              >
                <option value="anthropic.claude-3-5-sonnet-20241022-v2:0">
                  Anthropic Claude 3.5 Sonnet v2 (Recommended for Intent Extraction)
                </option>
                <option value="amazon.nova-pro-v1:0">
                  Amazon Nova Pro v1.0 (Amazon Multimodal &amp; Retail Reasoning)
                </option>
                <option value="amazon.nova-lite-v1:0">
                  Amazon Nova Lite v1.0 (Low-Latency Ambient Stream)
                </option>
                <option value="amazon.titan-text-express-v1">
                  Amazon Titan Text Express v1
                </option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">AWS Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-[#263449] rounded-lg p-2.5 text-white focus:outline-none focus:border-[#FF9900]"
                >
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                  <option value="ap-northeast-1">ap-northeast-1 (Tokyo)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">AWS Access Key ID</label>
                <input
                  type="text"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  className="w-full bg-[#0b0f17] border border-[#263449] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF9900] font-mono text-[11px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">AWS Secret Access Key</label>
              <input
                type="password"
                value={secretAccessKey}
                onChange={(e) => setSecretAccessKey(e.target.value)}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                className="w-full bg-[#0b0f17] border border-[#263449] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF9900] font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-gray-400 font-medium mb-1">
                Session Token (Optional / STS Temporary Credential)
              </label>
              <input
                type="password"
                value={sessionToken}
                onChange={(e) => setSessionToken(e.target.value)}
                placeholder="Optional temporary token"
                className="w-full bg-[#0b0f17] border border-[#263449] rounded-lg p-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#FF9900] font-mono text-[11px]"
              />
            </div>

            {/* Test Connection Result Box */}
            {testResult && (
              <div
                className={`p-3 rounded-lg flex items-start gap-2 text-[11px] ${
                  testResult.ok
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1c2636] hover:bg-[#253247] text-gray-200 border border-[#2e3d54] text-xs font-semibold transition"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF9900]" /> : <Zap className="w-3.5 h-3.5 text-[#FF9900]" />}
                <span>{testing ? 'Testing Endpoint...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-[#141c27] hover:bg-[#1f2b3b] text-gray-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FF9900] hover:bg-[#ffad33] text-[#0f141c] font-bold transition shadow-md"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      <span>Save &amp; Connect</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
