---
name: bee-ambient-actions
version: 1.0.0
description: Ambient intent detection and 1-click fulfillment skill for Bee Wearable & Amazon Bedrock. Converts live Bee conversations into Amazon Prime / Fresh cart bundles, conflict-checked calendar events, and synced Bee todos.
mcp_spec: "2025-11-25"
tools:
  - bee_now_conversations
  - bee_today_brief
  - bee_todos_sync
  - bedrock_converse_intent
  - amazon_cart_builder
  - calendar_event_dispatcher
---

# Bee Ambient Actions Skill

This skill connects to a user's live Bee Wearable stream (`bee now --json`, `bee proxy` `/v1/conversations`, or Bee MCP) and uses **Amazon Bedrock** (`ConverseCommand`) to identify high-confidence actionable utterances in real time:

1. **Commerce & Household Restock (`amazon_order`)**: Detects depleted supplies or purchase intent (e.g., *"out of oat milk"*, *"need AA batteries"*) and builds a 1-Click Amazon Prime / Amazon Fresh checkout payload.
2. **Schedule & Calendar Coordination (`schedule_meeting`)**: Detects proposed meetings or calls, verifies local schedule availability, and generates Google Calendar, Outlook, and RFC 5545 `.ics` invites.
3. **Personal Memory & Task Sync (`bee_task` / `memory_fact`)**: Writes actionable follow-ups directly back to the user's Bee wearable task list via `bee todo add` and `/v1/todos`.
