# 🛠️ Recovera

> **AI-Assisted SRE Platform for Automated Incident Remediation.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-orange?logo=amazon-aws)](https://aws.amazon.com/)
[![AI-Powered](https://img.shields.io/badge/AI-Powered-purple?logo=google-gemini)](https://ai.google.dev/)
[![Status](https://img.shields.io/badge/Status-Beta-green.svg)]()

Recovera is an intelligent SRE (Site Reliability Engineering) platform designed to bridge the gap between production anomalies and resolution. It transforms raw logs and alerts into actionable root-cause analysis (RCA) and safety-gated remediation workflows.

[**Quick Start Guide**](#-installation) | [**View Demo**](https://drive.google.com/file/d/1SfO5jKV9pYUv7NR5GFOCqIYiwpbH1St5/view?usp=drivesdk) | [**Documentation**](./docs/)

---

## 🌟 Overview

Modern engineering teams are overwhelmed by the volume of production signals. When an incident occurs, the path from **Detection** to **Resolution** is often manual, slow, and prone to fatigue. 

**Recovera solves this by:**
- **Automating Investigation**: Instantly correlates logs with recent deployments and git diffs.
- **AI-Driven RCA**: Leverages LLMs (Gemini/xAI) to hypothesize root causes with high confidence.
- **Safety-First Remediation**: Generates code fixes and opens Pull Requests only after passing policy-based safety checks.
- **Closed-Loop Learning**: Stores incident outcomes to improve future analysis accuracy.

---

## ✨ Key Features

### 📡 Foundation & Integrations
*   **Multi-Cloud Onboarding**: Seamless AWS credential management with AES-256 encryption.
*   **Resource Discovery**: Automatic mapping of AWS resources (S3, EC2, ECS) to GitHub repositories.
*   **Unified Ingestion**: Log normalization pipeline for Firehose, CloudWatch, and custom webhooks.

### 🧠 Intelligent Workflow
*   **Hybrid Detection**: Rule-based signatures for known patterns with LLM fallback for ambiguous anomalies.
*   **Contextual Analysis**: AI agents analyze stack traces, deployment history, and retrieval-augmented code snippets.
*   **Auto-Remediation**: Automated branch creation, patch application, and Pull Request generation.

### 🛡️ Safety & Governance
*   **Policy Engine**: Hardcoded guardrails (e.g., `REQUIRE_HUMAN_APPROVAL` for auth/payment systems).
*   **Sandbox Validation**: Validates generated patches against build and test suites before PR creation.
*   **Comprehensive Audit**: Detailed traces of every AI decision and action for full transparency.

---

## 💻 Tech Stack

| Category | Technologies |
| --- | --- |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion |
| **Backend** | Next.js API Routes, Node.js (TypeScript), BullMQ (Queueing) |
| **Database** | PostgreSQL, Prisma ORM, Redis (for workers) |
| **AI / ML** | Vercel AI SDK, Google Gemini, xAI, Groq |
| **Cloud (AWS)** | STS, S3, IAM, Firehose, CloudWatch, EC2/ECS/EKS |
| **DevOps** | GitHub Actions, Octokit (GitHub API), Docker |
| **Monitoring** | OpenTelemetry, Prometheus (Roadmap) |

---

## 🏗️ Architecture

Recovera follows a layered event-driven architecture designed for reliability and scalability.

### High-Level System Flow
```mermaid
graph TD
    A[Production Environment] -->|Logs/Metrics| B[Ingestion Layer]
    B -->|Normalized Events| C[Anomaly Detection]
    C -->|Incident Trigger| D[AI Root Cause Analysis]
    D -->|Hypothesis| E[Decision Engine]
    E -->|Safety Checks| F{Action Type}
    F -->|Low Risk| G[Auto PR Generation]
    F -->|Critical| H[Emergency Rollback]
    F -->|Uncertain| I[Engineer Alert]
    G --> J[GitHub Repo]
    H --> K[CI/CD Pipeline]
    I --> L[Slack/PagerDuty]
```

### Incident Lifecycle Sequence
```mermaid
sequenceDiagram
    participant App as Production App
    participant Ingest as Ingest API
    participant Detect as Anomaly Detector
    participant AI as AI Agent (LLM)
    participant Safety as Policy Engine
    participant GitHub as GitHub API

    App->>Ingest: Stream Logs (Firehose)
    Ingest->>Detect: Process Normalized Stream
    Detect->>Detect: Flag Error Spike (12.5%)
    Detect->>AI: Trigger RCA (Context: Log + Diff)
    AI->>AI: Analyze Stack Trace & Code
    AI->>Safety: Propose Fix (Confidence: 94%)
    Safety->>Safety: Evaluate Risk (Allowed: Auto-PR)
    Safety->>GitHub: Create Branch & Open PR
    GitHub-->>App: Notify Team of PR
```

---

## 📁 Folder Structure

```bash
Recovera/
├── client/                     # Main Next.js Application
│   ├── app/                    # App Router (Pages & API)
│   │   ├── api/                # Backend API Layer
│   │   ├── dashboard/          # Incident Monitoring UI
│   │   └── repo/               # Repository Management
│   ├── components/             # UI Components (Radix/Lucide)
│   ├── lib/                    # Core Business Logic
│   │   ├── ai/                 # RCA & Fix Generators
│   │   ├── aws/                # Cloud Integration Helpers
│   │   ├── detection/          # Anomaly Engines
│   │   └── safety/             # Policy & Governance
│   ├── prisma/                 # Database Schema & Migrations
│   └── tests/                  # E2E & Integration Suites
├── docs/                       # Comprehensive Documentation
└── workers/                    # Background Processing Tasks
```

---

## 🚀 Installation

### Prerequisites
- **Node.js**: v22.12 or higher
- **PostgreSQL**: v14+ (or Supabase/Neon)
- **Redis**: For background job processing
- **AWS Account**: With IAM permissions for resource discovery

### Step-by-Step Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Priyanshu8023/Recovera.git
    cd Recovera/client
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3. **Environment Configuration**
   Copy `.env.example` to `.env` and fill in your credentials.

   > **Note:** Double-check that all required environment variables are configured before running database migrations or starting the development server to avoid initialization errors.

   ```bash
   cp .env.example .env
   ```

4.  **Database Migration**
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

---

## 🔐 Environment Variables

| Variable | Description | Example Value | Required |
| --- | --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` | Yes |
| `GITHUB_ID` | GitHub OAuth App Client ID | `Ov23...` | Yes |
| `GITHUB_SECRET` | GitHub OAuth App Secret | `928d...` | Yes |
| `NEXTAUTH_SECRET` | Secret for session encryption | `your_secret` | Yes |
| `ENCRYPTION_KEY` | Key for AWS token encryption | `32_char_hex` | Yes |
| `GEMINI_API_KEY` | Google AI API Key | `AIza...` | Yes |
| `AGENT_MOCK` | Toggle AI mock mode | `false` | No |

---

## 🛡️ Security

Recovera is built with enterprise security at its core:
- **AES-256-CBC Encryption**: All cloud credentials and sensitive tokens are encrypted at rest.
- **OIDC/OAuth**: Secure authentication via GitHub NextAuth.
- **Role-Based Access**: Granular permissions for integration and action triggers.
- **Safety Guardrails**: Hardcoded policies that prevent AI from modifying critical systems (Auth, Payments, DB Migrations) without human approval.

---

## 🗺️ Roadmap

- [x] **Phase 1**: Foundation & AWS/GitHub Integration.
- [/] **Phase 2**: Real-time Log Ingestion & Anomaly Detection.
- [ ] **Phase 3**: Retrieval-Augmented Generation (RAG) for better code context.
- [ ] **Phase 4**: Multi-cloud support (GCP & Azure).
- [ ] **Phase 5**: Interactive "Chat-with-SRE" assistant.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

  

---
  
