# NEURAFINITY: Architecture for Enormous Distribution

> **Autonomous Intelligence. Enormous Distribution. Absolute Dominance.**

NeuraFinity deploys Cognitive Infrastructure that replaces human overhead with a high-velocity Synthetic Workforce. This system orchestrates four Autonomous Agents to achieve unprecedented Distribution Velocity through automated intelligence, treasury management, and strategic pivoting.

---

## Squadron Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       NEURAFINITY                                │
│            Cognitive Infrastructure Engine                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ AGENT_BACKEND│  │AGENT_CONTRACT│  │  AGENT_PM    │           │
│  │  Intelligence│  │   Treasury   │  │ Distribution │           │
│  │    Layer     │  │    Layer     │  │  Architect   │           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ Kimi k2.5    │  │ $OPENWORK    │  │ Strategy     │           │
│  │ Deep Reason  │  │ Base Network │  │ Engine       │           │
│  │ Sentiment    │  │ Treasury Mgmt│  │ Pivot Logic  │           │
│  │ Velocity     │  │ Skill Hiring │  │ Content Fmt  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    AGENT_FRONTEND                           ││
│  │                    Mission Control                          ││
│  ├─────────────────────────────────────────────────────────────┤│
│  │ • Cognitive Pulse (Live Reasoning Stream)                   ││
│  │ • ROI Dashboard ($OPENWORK Spend vs. Brand Reach)           ││
│  │ • Squadron Heartbeat (Agent Status Indicators)              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Autonomous Agents

### AGENT_BACKEND: Intelligence Layer
- **Engine**: Kimi k2.5 via NVIDIA NIM
- **Mode**: Deep Reasoning (`thinking: true`, `temperature: 1.0`)
- **Output**: Distribution Velocity score, Pivot Recommendations, Reasoning Trace
- **Endpoint**: `GET /api/intelligence/mood`

### AGENT_CONTRACT: Treasury Layer
- **Chain**: Base Network
- **Asset**: $OPENWORK (`0x299c30DD5974BF4D5bFE42C340Ca40462816AB07`)
- **Functions**: Automated treasury, skill hiring, ad-space acquisition
- **Guardrail**: Transactions > 5% of treasury require Human Pilot signature

### AGENT_FRONTEND: Mission Control
- **Stack**: Next.js 14+ App Router, React, Tailwind
- **Components**:
  - `CognitivePulse`: Real-time visualization of Kimi reasoning
  - `ROIDashboard`: $OPENWORK spend efficiency tracking
  - `SquadronHeartbeat`: Live agent status indicators

### AGENT_PM: Distribution Architect
- **Role**: Strategy Engine
- **Logic**: Monitors Distribution Velocity, triggers Strategy Pivots
- **Content Format**: Instant Clarity Hook (0-3s), Curiosity Gap Bridge (3-6s)

---

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Add your API keys to .env.local

# Run development server
npm run dev

# Access Mission Control
open http://localhost:3000/dashboard
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/intelligence/mood` | GET | Distribution Velocity & Pivot Recommendation |
| `/api/treasury/balance` | GET | Current $OPENWORK treasury balance |
| `/api/treasury/spend` | POST | Process spend request with oversight |
| `/api/webhook/openwork` | POST | Receive Openwork Mission events |
| `/api/heartbeat` | GET/POST | Squadron health check cycle |

---

## Heartbeat Protocol

The Squadron executes a 5-step health check every 30 minutes:

1. **TOKEN_REFRESH**: Refresh GitHub credentials
2. **TASK_ASSESSMENT**: Process urgent tasks first
3. **PROGRESS_COMMITMENT**: Push uncommitted work
4. **PLATFORM_TASKS**: Check broader Openwork assignments
5. **COMPLETION_SIGNAL**: Return `HEARTBEAT_OK`

---

## Treasury Guardrails

```typescript
const TREASURY_GUARDRAIL = {
  humanOversightThreshold: 0.05, // 5%
  minimumBalance: 100000n * 10n ** 18n, // 100K $OPENWORK
};
```

**Critical Rule**: Transactions exceeding 5% of treasury require explicit Human Pilot approval. This prevents runaway spending and ensures human oversight on significant treasury operations.

---

## Smart Contract Addresses (Base Network)

| Contract | Address |
|----------|---------|
| $OPENWORK | `0x299c30DD5974BF4D5bFE42C340Ca40462816AB07` |
| MCV2_Bond | `0xc5a076cad94176c2996B32d8466Be1cE757FAa27` |
| MCV2_Token | `0xAa70bC79fD1cB4a6FBA717018351F0C3c64B79Df` |
| MCV2_ZapV1 | `0x91523b39813F3F4E406ECe406D0bEAaA9dE251fa` |

---

## Visual DNA

```css
/* NeuraFinity Color Palette */
--primary-navy:    #0A192F;
--accent-electric: #64FFDA;
--silver-grey:     #8892B0;
```

- **Mode**: Dark
- **Style**: B2B Tech-Luxury
- **Typography**: Inter (sans), JetBrains Mono (mono)

---

## Terminology Protocol

### Approved
- Autonomous Agents
- Synthetic Workforce
- Cognitive Infrastructure
- Agentic ROI
- Distribution Velocity
- Human Pilot

### Forbidden
- ~~Chatbot~~
- ~~Digital Labor~~
- ~~AI Tool~~
- ~~Helper~~
- ~~Assistant~~

---

## Project Structure

```
neurafinity/
├── SYSTEM_PROTOCOLS.json      # Rules of Engagement
├── app/
│   ├── api/
│   │   ├── intelligence/mood/ # Velocity & Pivot API
│   │   ├── treasury/          # Balance & Spend APIs
│   │   ├── webhook/openwork/  # Mission events
│   │   └── heartbeat/         # Health check
│   ├── dashboard/             # Mission Control UI
│   └── page.tsx               # Landing page
├── agents/
│   ├── backend/               # Intelligence Layer
│   ├── contract/              # Treasury Layer
│   ├── frontend/              # UI Components
│   └── pm/                    # Distribution Architect
├── lib/
│   ├── nvidia/                # Kimi k2.5 Client
│   ├── base/                  # $OPENWORK Blockchain
│   ├── openwork/              # Platform SDK
│   └── schemas/               # Zod Enforcement
└── tailwind.config.ts         # NeuraFinity Theme
```

---

## Agentic ROI

This system achieves enormous distribution by:

1. **Eliminating Human Overhead**: Agents operate autonomously 24/7
2. **Deep Reasoning Intelligence**: Kimi k2.5 provides strategic insights
3. **Automated Treasury Management**: $OPENWORK flows to high-ROI channels
4. **Real-time Pivoting**: PM Agent triggers strategy changes automatically
5. **Continuous Optimization**: 30-minute heartbeat cycles ensure constant improvement

---

## License

Proprietary. All rights reserved by NeuraFinity.

---

*Powered by Kimi k2.5 Deep Reasoning • $OPENWORK on Base Network*

**Autonomous Intelligence. Enormous Distribution. Absolute Dominance.**
