# LeetCode AI Companion & Interview Simulator

## Overview
This platform bridges the gap between passive algorithmic learning and proactive, FAANG-level technical interview preparation. It leverages a Chrome extension that actively tracks progress on LeetCode.com, pushing problem metadata to a centralized dashboard. Within the dashboard, users can access an **AI Interview Simulator**—a real-time, interactive assessment experience engineered to train developers under authentic 60-minute time constraints.

---

## 🏗 System Architecture

The project represents a full-stack, decoupled architecture spanning three key interfaces:

### 1. Browser Extension (`/extension`)
- **Type**: Chrome Manifest V3 Extension.
- **Role**: Operates as a passive listener on `*://leetcode.com/*`. 
- **Capabilities**: Captures submissions, authenticates users securely against the central platform by reading cookie tokens from the dashboard domain, and provides quick statistics rendering as an overlay widget.

### 2. Frontend Interface (`/frontend`)
- **Tech Stack**: React 18, Vite, TypeScript, React Router.
- **Design System**: A fully tailor-made "Dark Luxury" CSS-variable-based design system mimicking premium developer tools.
- **Key Features**:
  - **Analytics Dashboard**: Aggregates submissions, recent contests, and generates radar charts mapping out proficiency across DSA domains (e.g., Arrays, Hash Tables, DP).
  - **AI Interview Simulator**: The flagship feature. Orchestrates a 3-problem (Easy, Medium, Hard), 60-minute timed technical interview. Embeds an IDE/code surface, a problem terminal, and a streaming chat interface.

### 3. Backend API (`/backend`)
- **Tech Stack**: Express.js, TypeScript, MongoDB (Mongoose), Node.js.
- **Key Infrastructure**: Zod for runtime schema validation, Vercel-ready routing logic (`@vercel/node`), and rate limiters locking down heavy AI routes (5 per 10min).
- **Core Integrations**:
  - **LeetCode GraphQL API**: Dynamically queries problem sets matching a candidate's "weakest topics."
  - **Groq API**: High-speed AI inference (via OpenAI SDK wrappers) mimicking an interviewer.

---

## 🧠 Core Engineering Features
- **Deterministic Topic Retrieval**: Automatically parses a user's historical performance, isolating weak domains, and executing dynamic GraphQL fetches to LeetCode to isolate appropriately difficult problem sets.
- **Adaptive Memory Management**: To circumvent API token limits, the backend maintains a sliding-window context history (retaining only the system core-rules and the last 12 chronological messages) when conversing with the Groq inference engine.
- **Dynamic Grading Fallbacks**: A hyper-strict JSON parser with recursive fallback protections guaranteeing that even if the LLM hallucinates markup fences or malformed JSON during the post-interview scoring phase, the system degrades gracefully without crashing the UI.
