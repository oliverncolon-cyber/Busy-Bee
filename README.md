# 🐝 Busy Bee — Ambient Wearable AI Copilot

> **Ambient dialog intelligence for the Bee Wearable & Apple Watch.**  
> Detects actionable words in real-time conversations to trigger **1-Click Calendar Scheduling**, **Amazon Shopping Re-Orders**, and **Bee Todo Sync** using **AWS Bedrock**.

[![Apache 2.0 License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Track](https://img.shields.io/badge/Primary%20Track-Bee%20(Wearable%20AI)-FF9900.svg)](#hackathon-tracks)
[![AWS Builder](https://img.shields.io/badge/Mini%20Challenge-AWS%20Builder%20(Bedrock)-232F3E.svg)](#aws-builder-integration)
[![Open Source](https://img.shields.io/badge/Mini%20Challenge-Open%20Source-22c55e.svg)](#open-source-mini-challenge)

---

## 🌟 What is Busy Bee?

When you're talking with friends, colleagues, or family, actionable thoughts happen naturally:
* *"Oh, we're completely out of whole milk and coffee beans."*
* *"Let's meet tomorrow at 3 PM to review the deck with Sarah."*
* *"I need to order fresh AA batteries on Amazon."*
* *"Remind me to submit the quarterly taxes before Friday."*

Normally, capturing these moments requires stopping your conversation, pulling out your phone, unlocking it, opening multiple apps, typing, and searching. Often, people simply forget.

**Busy Bee** transforms the **Bee wearable device** (or Apple Watch running Bee software) into an ambient action copilot:
1. **Passive Audio & Dialog Ingestion:** Monitors real-life conversations captured locally via `@beeai/cli` (`bee now --json`, `bee sync`, `bee proxy`) or live microphone speech.
2. **Real-Time AWS Bedrock Extraction:** Spoken utterances are processed through **AWS Bedrock** (`@aws-sdk/client-bedrock-runtime` Converse API with Claude 3.5 Sonnet / Amazon Nova / Titan) to parse conversational intent, attendees, times, and products.
3. **Proactive 1-Click Action Hub:** Live Server-Sent Events (SSE) immediately render clean Action Cards with 1-click execution:
   * 🛒 **Order on Amazon:** Pre-populated Amazon search & cart URLs with estimated pricing and quantity.
   * 📅 **Add to Calendar:** Pre-filled Google Calendar, Outlook Web, and RFC 5545 `.ics` file downloads.
   * 📋 **Sync to Bee Todos:** Pushes tasks directly back into the Bee daemon via `bee todo add`.

### 🛡️ Privacy & Ambient Data Policy
- **Ephemeral Audio Buffer:** Audio is processed in memory via local streaming buffers; raw audio is never written to disk or retained.
- **Selective Intent Dispatch:** AWS Bedrock only receives parsed utterance text when keyword activation or speech-to-text filters detect actionable patterns.
- **Local Fallback:** Runs entirely offline using the local deterministic extractor when cloud sync is disabled.

| 🛒 Shopping Card | 📅 Calendar Card | 📋 Bee Task Card |
|---|---|---|
| ![Amazon Cart UI](docs/assets/cart-card.png) | ![Calendar UI](docs/assets/calendar-card.png) | ![Bee Sync UI](docs/assets/todo-card.png) |

---

## 🏆 Hackathon Tracks & Challenges

| Track / Challenge | Status | Implementation Details |
|---|---|---|
| **Primary Track: Bee (Wearable AI)** | ✅ Active | Direct integration with `@beeai/cli` commands (`bee now`, `bee sync`, `bee today`), Bee local HTTP proxy (`/v1/*`), MCP Server specification (`2025-11-25`), and live ambient wearable stream. |
| **Mini Challenge: AWS Builder** | ✅ Active | Powered by **AWS Bedrock Runtime** (`@aws-sdk/client-bedrock-runtime`). Utilizes the Bedrock Converse API with structured JSON schemas for zero-shot intent and entity extraction. |
| **Mini Challenge: Open Source** | ✅ Active | **Apache 2.0 License** included. Repository: [https://github.com/oliverncolon-cyber/Busy-Bee](https://github.com/oliverncolon-cyber/Busy-Bee) • GitHub: `@oliverncolon-cyber`. |

### 🌐 Open Source Mini Challenge Submission Info
* **GitHub Repository URL:** [https://github.com/oliverncolon-cyber/Busy-Bee](https://github.com/oliverncolon-cyber/Busy-Bee)
* **GitHub Username:** `oliverncolon-cyber`
* **License:** Apache 2.0 (Open Source Initiative approved with full patent grant)
* **What We Built:** An ambient wearable AI copilot for the Bee wearable & Apple Watch powered by AWS Bedrock.
* **How It Works:** Ingests live conversational audio turns via `@beeai/cli` / MCP / Web Speech, extracts actionable intents via AWS Bedrock Converse API structured tool-calling (`toolConfig`), and dispatches 1-click Amazon shopping orders, calendar invites, and Bee todo sync.
* **Why It Matters:** Eliminates manual smartphone task entry, provides zero ambient audio retention for privacy, and demonstrates the power of combining wearable hardware with AWS Bedrock intelligence.

---

## 🏗️ Architecture

```
                       ┌────────────────────────────────┐
                       │   Bee Wearable / Apple Watch   │
                       │   (Live Ambient Audio Stream)  │
                       └───────────────┬────────────────┘
                                       │
                      bee now --json   │   Web Speech API / Mic
                      bee sync / proxy │
                                       ▼
                       ┌────────────────────────────────┐
                       │      Busy Bee Node Server      │
                       │     (Express + SSE Bridge)     │
                       └───────────────┬────────────────┘
                                       │
            Bedrock Converse API       │   Structured JSON Schema
            (anthropic.claude-3-5 /    │   Prompt Engineering
             amazon.nova-pro / titan)  │
                                       ▼
                       ┌────────────────────────────────┐
                       │        AWS Bedrock Engine      │
                       │  • Detects Meeting Intent      │
                       │  • Detects Amazon Buy Intent   │
                       │  • Detects Tasks & Deadlines   │
                       └───────────────┬────────────────┘
                                       │
                         Real-Time SSE │ Push Event
                                       ▼
                       ┌────────────────────────────────┐
                       │    Proactive Action Hub UI     │
                       │       (React 18 + Tailwind)    │
                       ├────────────────────────────────┤
                       │  🛒 [Order on Amazon (1-Click)]│
                       │  📅 [Google / Outlook / .ICS]  │
                       │  📋 [Sync to Bee CLI Todos]    │
                       └────────────────────────────────┘
```

---

## 🚀 Quickstart & Setup

### Prerequisites
* **Node.js** v18+ (tested on Node v24)
* **npm** v9+
* Optional: AWS IAM credentials with Bedrock access (`bedrock:InvokeModel`)
* Optional: Bee CLI (`npm install -g @beeai/cli && bee login`)

### 1. Installation
Install project dependencies:
```bash
git clone https://github.com/oliverncolon-cyber/Busy-Bee.git
cd Busy-Bee
npm install
```

### 2. Configure AWS Bedrock (Optional for Live AWS Endpoint)
Copy the environment template:
```bash
cp .env.example .env
```
Edit `.env` with your AWS credentials:
```env
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
```
*(Note: If AWS credentials are not yet entered, Busy Bee includes a high-fidelity local deterministic Bedrock parser, allowing judges and developers to test all live scenarios immediately without configuration hurdles!)*

### 3. Run Application
Run both backend server and frontend client concurrently:
```bash
npm run dev
```

Open your browser to:
👉 **`http://localhost:5173`** (Frontend Dashboard)  
Backend API runs on: **`http://localhost:3002`**

---

## 🧪 Testing the Live Demo

You can test Busy Bee in three distinct ways:

1. **🎙️ Live Microphone Dictation:**
   Click the **"Mic"** button in the dashboard, allow microphone access, and speak naturally:
   > *"Hey, we are totally out of milk and eggs, could you get some?"*
   Watch the ambient audio visualizer pulse and the Amazon 1-Click Order card appear!

2. **⚡ Preset Scenario Buttons:**
   Click any of the top presets:
   * **🥛 "Out of Milk"** &rarr; Triggers Amazon Fresh Grocery Order Card.
   * **📅 "Meeting at 3 PM"** &rarr; Triggers Calendar Card with pre-filled Google Calendar & `.ics` links.
   * **🔋 "AA Batteries & Cable"** &rarr; Triggers Amazon Electronics Re-order Card.
   * **📋 "File Taxes Task"** &rarr; Triggers Bee CLI task sync.

3. **💬 Manual Text Input:**
   Type any conversational sentence into the chat bar and hit Enter.

---

## 🔒 Private GitHub Repository & Collaborator Instructions

If submitting as a private GitHub repository, navigate to **Settings > Collaborators > Add people** on your repo and invite the official Amazon Developer Relations judges:

```text
chris-trag, knmeiss, giolaq, anishamalde, mosesroth, emersonsklar
```

> ⚠️ **Note:** GitHub collaborator invitations expire after 7 days. Send the invitations close to your submission deadline!

---

## 🎬 3-Minute Demo Video Script & Storyboard

* **[0:00 - 0:30] Hook & Problem:** Show ambient wearability. Normal conversations generate countless micro-tasks that are lost or disrupt real-life interactions.
* **[0:30 - 1:15] Amazon Shopping Demo:** Say *"We're completely out of whole milk and coffee filters."* Show AWS Bedrock parse the dialogue in <400ms and display the 1-Click Amazon Card with quantity and price. Click "Order on Amazon".
* **[1:15 - 2:00] Meeting Scheduling Demo:** Say *"Let's meet tomorrow at 3 PM to review the deck with Sarah."* Show the Calendar Card pop up. Click "Google Calendar" to show the pre-populated event details.
* **[2:00 - 2:30] Code Architecture:** Walk through `beeConnector.js` (Bee CLI/proxy integration) and `bedrockExtractor.js` (AWS Bedrock Converse API).
* **[2:30 - 3:00] Wrap-up:** Highlight time saved (~15-20 min/day), privacy advantages of local Bee processing, and thank Amazon Developer Relations.

---

## 📝 Friction Log & Developer Feedback (10% Bonus Opportunity)

### 1. Bee CLI Streaming API
* **Task:** Ingesting conversational lifelogs continuously from the Bee wearable device.
* **Expected:** A native persistent WebSocket or SSE stream from `bee proxy` with speaker diarization.
* **Actual:** `bee now --json` requires manual polling or file watching over `bee sync` markdown files.
* **Severity:** Medium.
* **Workaround:** Implemented an event-driven adapter in `beeConnector.js`.
* **Suggestion:** Add a `--watch` flag to `bee now` or a native WebSocket endpoint at `http://127.0.0.1:3000/v1/stream`.

### 2. AWS Bedrock Converse API Structured Outputs
* **Task:** Enforcing structured JSON responses for multi-category intent cards.
* **Expected:** Native JSON schema parameter directly in `inferenceConfig` without requiring tool framing.
* **Actual:** Implemented schema-constrained tool-use (`toolConfig` with `toolSpec.inputSchema.json`) with a robust regex markdown fallback parser in `bedrockExtractor.js` to handle non-agent model variants cleanly.
* **Severity:** Low.
* **Workaround:** Dual-layer extraction architecture in `bedrockExtractor.js`: native `toolConfig` structured tool calling for Claude 3.5 Sonnet / Amazon Nova, paired with a deterministic regex markdown parser for maximum offline and low-tier model resiliency.

---

## 📄 License
This project is licensed under the [Apache 2.0 License](LICENSE) — providing robust patent and intellectual property protection while maintaining full open-source eligibility.
