import React, { useState } from 'react';
import { X, Copy, Check, Award, Video, GitBranch, ShieldAlert, FileText, ExternalLink } from 'lucide-react';

export function SubmissionGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, sectionKey) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const DEVREL_COLLABORATORS = [
    'chris-trag',
    'knmeiss',
    'giolaq',
    'anishamalde',
    'mosesroth',
    'emersonsklar'
  ];

  const devpostDescription = `### 🐝 Busy Bee — Ambient Wearable AI Copilot for Real-Time Action Extraction

#### What It Does
Busy Bee is an ambient Wearable AI application built on top of the Bee wearable device (and Apple Watch running Bee software) paired with AWS Bedrock. 
As users go about their day talking to colleagues, partners, or friends, Busy Bee listens continuously in the background to detect actionable conversational intents:
1. **Instant Amazon Re-Ordering & Groceries:** When a speaker mentions running out of something ("We're completely out of whole milk and coffee beans" or "I need to order AA batteries"), Busy Bee extracts the exact product, quantity, and urgency, and displays a proactive 1-Click Amazon Order card with pre-populated cart and search links.
2. **Context-Aware Calendar Scheduling:** When a conversational agreement to meet is made ("Let's meet tomorrow at 3 PM to review the deck with Sarah"), Busy Bee automatically extracts the title, date, start/end time, duration, and attendees, providing 1-Click Google Calendar creation, Outlook compose, and RFC 5545 .ics downloads.
3. **Bee Todo Sync:** When a user commits to a personal task ("Remind me to file the quarterly taxes before Friday"), it syncs directly to Bee's native task management via the Bee CLI (@beeai/cli) and MCP server.

#### How It Works (Architecture)
1. **Bee Wearable Data Ingestion:** Connects to the Bee hardware/watch feed through \`@beeai/cli\` (\`bee now --json\`, \`bee sync\`, and \`bee proxy\`), with MCP server support (spec 2025-11-25) and Web Speech API live microphone dictation.
2. **AWS Bedrock Action Extractor:** Spoken dialogue is processed via AWS Bedrock (Claude 3.5 Sonnet / Amazon Nova / Titan) using the Bedrock Converse API with structured JSON output enforcing intent confidence thresholds.
3. **Proactive 1-Click Action Hub:** A sleek, low-friction wearable dashboard broadcasts real-time Server-Sent Events (SSE) to display action cards that can be executed with a single tap.

#### Tracks Entered
- **Primary Track:** Bee (Wearable AI)
- **Mini Challenges:** AWS Builder (AWS Bedrock Runtime integration) & Open Source (MIT License on GitHub)`;

  const videoScript = `### 🎥 3-Minute Demo Video Script & Walkthrough
Judges have strict time limits; keep your video under 3 minutes, in English, and lead with live action!

- [0:00 - 0:30] The Problem & Hook: Show someone talking casually while wearing a Bee device or Apple Watch. Mentioning running out of milk or scheduling a meeting usually requires stopping what you're doing, taking out your phone, unlocking it, and typing manually.
- [0:30 - 1:15] Demo 1 (Amazon Groceries/Supplies): Speak into the mic or hit the "Out of Milk" preset: "We're completely out of whole milk, can you please order some?". Show Busy Bee and AWS Bedrock detect the intent in real-time, generate the Amazon Action Card, and tap "Order on Amazon" to show the 1-click cart flow.
- [1:15 - 2:00] Demo 2 (Calendar Scheduling): Speak: "Let's meet tomorrow at 3 PM to review the deck with Sarah". Show the calendar card pop up with date, time, attendees, and tap "Add to Google Calendar" or download the .ics file.
- [2:00 - 2:30] Architecture & Bee CLI/MCP Integration: Briefly show the code: @beeai/cli integration, @aws-sdk/client-bedrock-runtime Converse API, and real-time SSE.
- [2:30 - 3:00] Closing: Highlight time saved, privacy-first wearable design, and thank the Amazon Developer team!`;

  const frictionLog = `### 📝 Friction Log & Developer Feedback (10% Bonus Judging Opportunity)
1. **Bee CLI JSON Consistency:**
   - *Task:* Ingesting continuous conversation streams via \`bee now --json\`.
   - *Expected:* Structured timestamped turn array with speaker separation.
   - *Actual:* Output formats vary slightly between markdown default and JSON mode depending on Bee daemon sync state.
   - *Workaround:* Implemented regex fallback normalization in \`beeConnector.js\`.
   - *Suggestion:* Provide a streaming webhook or direct WebSocket endpoint in \`bee proxy\`.
2. **AWS Bedrock Converse API Structured Outputs:**
   - *Task:* Enforcing strict JSON schema for actions.
   - *Expected:* Native json_object schema response.
   - *Workaround:* Used strict system prompt with markdown codefence parsing fallback.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141722] border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#181c2a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Devpost Submission Kit & Amazon Team Collaborators</h3>
              <p className="text-xs text-gray-400">Everything needed to submit Busy Bee and win</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-gray-300">
          {/* GitHub Private Repo Collaborators Alert */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4" /> Required: Invite Amazon Team as Private Repo Collaborators
              </h4>
              <button
                onClick={() => copyToClipboard(DEVREL_COLLABORATORS.join(', '), 'collaborators')}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded transition"
              >
                {copiedSection === 'collaborators' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Usernames
              </button>
            </div>
            <p className="text-gray-300 mb-2 leading-relaxed">
              In your GitHub repo (if private), go to <strong>Settings &gt; Collaborators &gt; Add people</strong> and invite the official Amazon Developer Relations reviewers:
            </p>
            <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
              {DEVREL_COLLABORATORS.map((uname) => (
                <span key={uname} className="px-2 py-0.5 rounded bg-black/50 border border-amber-500/30 text-amber-200">
                  {uname}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-amber-200/70 mt-2">
              Note: Invitations expire after 7 days. Send them near submission time!
            </p>
          </div>

          {/* Devpost Project Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" /> Devpost Project Description (Ready to Paste)
              </h4>
              <button
                onClick={() => copyToClipboard(devpostDescription, 'desc')}
                className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded transition"
              >
                {copiedSection === 'desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Description
              </button>
            </div>
            <pre className="p-3 bg-black/60 rounded-xl border border-gray-800 text-[11px] text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
              {devpostDescription}
            </pre>
          </div>

          {/* 3-Minute Demo Video Script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-400" /> 3-Minute Demo Video Script
              </h4>
              <button
                onClick={() => copyToClipboard(videoScript, 'video')}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded transition"
              >
                {copiedSection === 'video' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Script
              </button>
            </div>
            <pre className="p-3 bg-black/60 rounded-xl border border-gray-800 text-[11px] text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
              {videoScript}
            </pre>
          </div>

          {/* Friction Log for 10% Bonus */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Friction Log & Feedback (10% Judging Bonus)
              </h4>
              <button
                onClick={() => copyToClipboard(frictionLog, 'friction')}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded transition"
              >
                {copiedSection === 'friction' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Friction Log
              </button>
            </div>
            <pre className="p-3 bg-black/60 rounded-xl border border-gray-800 text-[11px] text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
              {frictionLog}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
