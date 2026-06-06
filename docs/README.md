# 📘 Recovera Documentation Portal

Welcome to the **Recovera** documentation portal. This is the central repository of knowledge detailing the inner workings, workflows, setup, and APIs of Recovera—an AI-powered virtual Site Reliability Engineer designed to bridge the gap between production telemetry anomalies and automated code remediation.

---

## 🗺️ Interactive Navigation Directory

Navigate directly to deep-dive documentation modules:

### 🏗️ Global System Spec
*   [AutoSRE Master Plan](file:///d:/Projects/GSSoC/Recovera/docs/plan.md) — Architectural overview, gaps, and milestones.
*   [Agent Build Specification](file:///d:/Projects/GSSoC/Recovera/docs/agent-build-spec.md) — Implementation criteria and requirements checklist.
*   [Architecture Roadmap](file:///d:/Projects/GSSoC/Recovera/docs/architecture-roadmap.md) — Deep dive into system components, roadmap execution, and database schemas.

### 🔐 Platform Services
*   [Database Schema](file:///d:/Projects/GSSoC/Recovera/docs/client/database-schema.md) — Explanation of models (User, Credentials, Incident, RepositoryIndex) and index tuning.
*   [Encryption Logic (`encrypt.ts`)](file:///d:/Projects/GSSoC/Recovera/docs/client/encryption-logic.md) — AES-256-CBC cipher configuration, IV structures, and error boundary handles.
*   [NextAuth Integration](file:///d:/Projects/GSSoC/Recovera/docs/client/nextauth-documentation.md) — OAuth workflow flow, cookie-based token session mapping, and routing middleware.
*   [Vector RAG Ingestion Pipeline](file:///d:/Projects/GSSoC/Recovera/docs/client/rag-ingestion-pipeline.md) — 50-line window chunking strategy, cosine similarity logic, and mock local indexing.
*   [Dashboard Logic](file:///d:/Projects/GSSoC/Recovera/docs/client/dashboard-logic.md) — Frontend layout orchestration and state synchronization.

### ⚙️ Step-by-Step Workflow Specs
1.  **Ingestion**: [Step 1 Ingestion Layer Spec](file:///d:/Projects/GSSoC/Recovera/docs/step/step-1-log-ingestion-layer.md) | [AWS Firehose Architecture](file:///d:/Projects/GSSoC/Recovera/docs/step-1/aws-firehose-architecture.md) | [AWS Integration Flow](file:///d:/Projects/GSSoC/Recovera/docs/step-1/aws-integration-flow.md)
2.  **Detection**: [Step 2 Detection & Processing](file:///d:/Projects/GSSoC/Recovera/docs/step/step-2-log-processing-issue-detection.md) | [Step 2 Completion Checklist](file:///d:/Projects/GSSoC/Recovera/docs/step/step-2-completion.md)
3.  **Root Cause Analysis**: [Step 3 RCA Spec](file:///d:/Projects/GSSoC/Recovera/docs/step/step-3-root-cause-analyzer.md) | [RCA Agent Brain Logic](file:///d:/Projects/GSSoC/Recovera/docs/step/step-3/step-3-rca-agent-brain.md)
4.  **Codebase Mapping & Search**: [Step 4 Retrieval Spec](file:///d:/Projects/GSSoC/Recovera/docs/step/step-4-codebase-mapping.md) | [AWS Instance to Git Mappings](file:///d:/Projects/GSSoC/Recovera/docs/step-1/instance-repo-mapping-flow.md) | [Log Correlator](file:///d:/Projects/GSSoC/Recovera/docs/step-1/repo-log-mapping-strategy.md)
5.  **Fix Generation**: [Step 5 Code Patch Generator](file:///d:/Projects/GSSoC/Recovera/docs/step/step-5-fix-generator.md)
6.  **PR Creation**: [Step 6 Git Automation PR Creator](file:///d:/Projects/GSSoC/Recovera/docs/step/step-6-pr-creator.md)
7.  **Safety Guardrails**: [Step 7 Safety Policy Gate](file:///d:/Projects/GSSoC/Recovera/docs/step/step-7-safety-layer.md)

---

## 🌟 1. Project Overview & Architecture

Modern software architectures stream millions of logs and alerts, generating sign fatigue for SRE teams. Recovera automates the entire loop of **Detection ➔ Diagnostics ➔ Remediation ➔ Verification** using agentic workflows.

### 🔄 High-Level Incident Lifecycle

```mermaid
graph TD
    %% Telemetry Inflow
    ProdApp[Production Environment] -->|Logs, Metrics & Events| IngestLayer[Log Ingestion Layer]
    IngestLayer -->|Normalized Payload| DetectionEngine[Anomaly Detection Engine]
    
    %% Detection Loop
    subgraph Detection Phase
        DetectionEngine -->|Rule-Based Signatures| MatchFound{Signature Match?}
        MatchFound -->|Yes| TriggerRCA[Trigger Autonomous RCA]
        MatchFound -->|No| LLMFallback[LLM Classifier Fallback]
        LLMFallback -->|Anomalous| TriggerRCA
    end
    
    %% RAG Enrichment
    TriggerRCA -->|Incident Trigger| RAGSync[Vector RAG Search]
    subgraph Codebase context retrieval
        RAGSync -->|Search Query| EmbeddingsAPI[text-embedding-004]
        EmbeddingsAPI -->|Similarity Scan| VectorStore[(vector-store.json)]
        VectorStore -->|Top-10 Code Snippets| ContextAssembler[Context Assembler]
    end
    
    %% Diagnostics
    ContextAssembler -->|Rich Context Bundle| RCAgent[Autonomous RCA Agent]
    RCAgent -->|Structured JSON Diagnostics| DecisionEngine[Decision & Policy Engine]
    
    %% Decision & Verification
    subgraph Policy Governance
        DecisionEngine -->|Evaluate Safety Policies| RiskScore{Passes Policy?}
        RiskScore -->|Yes| SandboxApply[Sandbox Validation]
        RiskScore -->|No / High Risk| AlertPage[Slack/PagerDuty Alert]
    end
    
    %% Action
    SandboxApply -->|Build & Test Passes| GitAutomation[PR Creator]
    GitAutomation -->|Pull Request| GithubRepo[GitHub Codebase]
    SandboxApply -->|Build Fails| AlertPage
    
    %% Learning Loop
    GithubRepo -->|Merge Event / Feedback| LearnSystem[Continuous Learning System]
    LearnSystem -->|Incident Metadata| VectorStore
    
    style Detection Phase fill:#fdf8e2,stroke:#f5d020,stroke-width:2px
    style Codebase context retrieval fill:#eefafc,stroke:#20b2aa,stroke-width:2px
    style Policy Governance fill:#fdf3f3,stroke:#e63946,stroke-width:2px
```

### ⏱️ Incident Lifecycle Sequence

The sequence diagram below maps the precise call flows between the services as an anomaly is captured and remediated:

```mermaid
sequenceDiagram
    autonumber
    participant App as Monitored Resource
    participant Ingest as /api/ingest/logs
    participant Queue as Redis Queue
    participant Detector as Anomaly Detector
    participant RAG as Ingestion / Search
    participant Agent as LLM RCA & Fixer
    participant Safety as Policy Engine
    participant Sandbox as Sandbox Runner
    participant Git as GitHub PR API

    App->>Ingest: Send Firehose logs payload
    Ingest-->>App: Acknowledge batch success (200 OK)
    Ingest->>Queue: Push normalized events
    Queue->>Detector: Dequeue event
    Detector->>Detector: Scan logs (Signature rules & LLM classifier)
    Note over Detector: Flag incident (status = DETECTED)
    Detector->>RAG: Request related code context
    RAG->>RAG: Semantic code lookup (Cosine Similarity)
    RAG-->>Detector: Return top-10 code segments
    Detector->>Agent: Trigger analysis (Log stacktrace + code snippets)
    Agent->>Agent: Formulate diagnostics & compile patch
    Agent->>Safety: Propose IncidentAction (PR Generation)
    Safety->>Safety: Evaluate safety rules (Auth check, risk score)
    alt Approved (Low Risk)
        Safety->>Sandbox: Spin up sandbox validator
        Sandbox->>Sandbox: Apply patch & run tests/lint/build
        alt Tests Pass
            Sandbox->>Git: Push branch & create Pull Request
            Git-->>Safety: Return PR URL
            Safety->>Safety: Log Success (status = EXECUTED)
        else Build/Tests Fail
            Sandbox-->>Safety: Return validation log errors
            Safety->>Safety: Log failure, trigger PagerDuty alert
        end
    else Blocked (High Risk / Auth / Payments)
        Safety->>Safety: Log rejection (status = BLOCK_AND_ALERT)
        Safety->>App: Alert engineer (Slack / PagerDuty)
    end
```

---

## 💻 2. Step-by-Step Local Environment Setup

### ⚙️ Prerequisites
Ensure the following are installed on your workstation:
- **Node.js**: `v22.12.0` or higher
- **PostgreSQL**: `v14+` or a hosted solution (e.g. Neon, Supabase)
- **Redis**: For background job queue management (BullMQ)

### 🛠️ 1. Clone & Set Up Directory
```bash
git clone https://github.com/Priyanshu8023/Recovera.git
cd Recovera/client
```

### 📦 2. Install Dependencies
```bash
npm install
```

### 🔐 3. Environment Variables Config
Create a `.env` file inside `client/` based on `.env.example`:
```env
# 🗄️ Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/recovera?schema=public"

# 🔑 NextAuth Setup
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_jwt_signing_secret_key"

# 🐙 GitHub OAuth App Configuration
GITHUB_ID="your_github_oauth_client_id"
GITHUB_SECRET="your_github_oauth_client_secret"

# 🛡️ Cryptographic Key (Must be exactly 32 bytes / 64 hex characters)
ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# 🧠 AI Provider Keys
GEMINI_API_KEY="your_google_gemini_api_key"

# 🧪 Developer Mock / Offline Mode
AGENT_MOCK="true"
```

### ⚡ 4. Database Provisioning & Seed
Generate the Prisma Client types and push migrations directly to your local database:
```bash
npx prisma generate
npx prisma db push
```

### 🏃‍♂️ 5. Launch Development Servers
Start the Next.js server (Frontend + API routes):
```bash
npm run dev
```
*(Optional)* In a separate terminal, launch the background worker queue process:
```bash
npm run start:worker
```

---

## 🔬 3. Core Process Flow & Usage

### 📡 Phase 1: AWS Onboarding & Multi-Cloud Ingestion
Users hook up their AWS accounts using credential provisioning. Recovera registers a **CloudCredential** model in PostgreSQL.
1. All secret tokens (`accessKeyId`, `secretAccessKey`, `roleArn`, etc.) are processed using the [Encryption Module](file:///d:/Projects/GSSoC/Recovera/client/lib/encrypt.ts) before database commits:
   $$\text{Storage Cipher} = \text{IV (16 bytes)} \mathbin{\Vert} \text{AES-256-CBC}(\text{Token}, \text{Key}, \text{IV})$$
2. Webhook listeners parse raw HTTP streams from **AWS Kinesis Firehose** or **CloudWatch subscription filters**.
3. Ingestion routes parse and normalize unstructured JSON strings into `NormalizedLogEvent` structures, flagging malformed lines to a dead-letter queue (DLQ) directory.

### 🧠 Phase 2: Anomaly Detection Engine
A background worker evaluates the normalized event streams:
* **Rule Engine**: Scans incoming log lines for deterministic error signatures:
  - `NullPointerException`
  - `Connection refused` / `ECONNREFUSED`
  - `socket timeout` / `ETIMEDOUT`
  - `Rate limit exceeded` / `HTTP 429`
* **LLM Fallback**: If standard rules cannot deduce the significance of an error rate spike, the system triggers a lightweight classifier prompt to categorize the severity and group events using deterministic fingerprints.

### 🔍 Phase 3: Codebase Indexing & Vector Search RAG
To pinpoint incident root-causes, Recovera reads source code files from the target GitHub repository:
1. **Directory Blacklist**: Ignores `node_modules/`, `.next/`, `dist/`, `build/`, `vendor/`, and `.git/`.
2. **Chunking Engine**: Uses a sliding window to compile segments:
   $$\text{Chunk Size} = 50\text{ lines} \quad | \quad \text{Chunk Overlap} = 10\text{ lines}$$
   The overlap ensures critical function boundaries are not broken.
3. **Embedding Vector Sync**: Submits chunks in batches of 20 to Google's `text-embedding-004` API, storing coordinates in `client/data/vector-store.json`.
4. **Vector Retrieval**: Computes the angular distance via **Cosine Similarity**:
   $$\text{Similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$
   Top-10 ranked chunks are injected as codebase context into the LLM diagnostic prompt.

### 🛡️ Phase 4: Autonomous Diagnosis, PR Sandbox & Safety Gates
Once the LLM engine compiles a diagnostic solution and creates a patch:
1. **Safety Policy Audit**: The proposed fix is evaluated in the [Policy Engine](file:///d:/Projects/GSSoC/Recovera/client/lib/safety/policyEngine.ts):
   - Any modifications targeting authentication (`auth`), payments (`pay`), database schemas (`migration`), or secrets are strictly **blocked** from auto-execution and routed to the engineer alert channel.
   - Max quotas restrict the agent to a maximum of 3 automated actions per incident to prevent recursive execution loop failures.
2. **Sandbox Validation**: Approved patches are cloned to a temporary directory inside the workspace. A sub-process validates the code:
   ```bash
   npm run build && npm run lint && npm run test
   ```
3. **PR Creation**: If sandbox builds succeed, the system calls GitHub's tree/commits API to publish a dedicated branch and open a Pull Request.

---

## ⚡ 4. Interactive API Endpoint Reference

| Category | Method | API Endpoint | Description / Expected Payload |
| :--- | :--- | :--- | :--- |
| **Ingestion** | `POST` | `/api/ingest/logs` | Receives raw telemetry streams from Firehose logs. |
| **Ingestion** | `POST` | `/api/ingest/metrics` | Receives structured system usage statistics. |
| **Ingestion** | `POST` | `/api/webhooks/github` | Listens to push/deployment metadata events from Git hook integrations. |
| **Projects** | `GET` | `/api/projects` | Retrieves monitored projects. |
| **Projects** | `POST` | `/api/projects` | Imports a new GitHub repository into the system. |
| **Projects** | `PATCH` | `/api/projects/:id` | Toggles status tracking triggers on or off. |
| **Incidents** | `GET` | `/api/incidents` | Lists active and historical incidents. |
| **Incidents** | `GET` | `/api/incidents/:id` | Retrieves diagnostic details, RCA records, and actions. |
| **Incidents** | `POST` | `/api/incidents/:id/analyze` | Forces a diagnostic execution cycle. |
| **Incidents** | `POST` | `/api/incidents/:id/action` | Triggers remediation manually (PR / Rollback). |
| **Analytics** | `GET` | `/api/dashboard/stats` | Calculates MTTR, incident count, and fix success rates. |
| **Analytics** | `GET` | `/api/dashboard/timeline` | Generates temporal incident event series. |

---

## 🧪 5. Developer Mock Mode (Offline Development)

Testing live AWS credentials or making thousands of LLM API requests during local development can become expensive. Recovera supports an offline **Mock Mode**:

Set `AGENT_MOCK="true"` in your `.env` configuration file to configure mock bypasses:

```
[AGENT_MOCK="true" Actions]:
- AWS scan connections containing the words "mock" or "test" bypass credentials verify checks.
- text-embedding-004 coordinates return random float arrays immediately, skipping network calls.
- Root Cause Analysis prompt execution compiles preconfigured mockup Diagnostic Reports.
- Patch generator returns mock unified diff changes.
```

---

## 🤝 6. Contribution Guidelines

We love contributions! Follow these steps to submit additions to Recovera:

1.  **Fork the repository** on GitHub.
2.  **Create a feature branch** from `main`:
    ```bash
    git checkout -b feat/my-amazing-feature
    ```
3.  **Implement your code additions**. Preserve existing JSDoc blocks and write unit tests for any new helpers.
4.  **Confirm typecheck and linter validation**:
    ```bash
    npm run lint
    npm run typecheck
    ```
5.  **Commit with descriptive titles** and push the branch:
    ```bash
    git commit -m "feat(ingest): add support for GCP logs format normalization"
    git push origin feat/my-amazing-feature
    ```
6.  **Open a Pull Request** describing what the changes accomplish.
