# Antigravity Development Prompt — Recovera Agent Brain
**Project:** AutoSRE AI · **Product:** Recovera
**Branch:** `Agentic-AI` · **Role:** Person 2 — Brain layer only
**Prompt version:** 4.0 — DEFINITIVE
**Self-rating: 9.2 / 10**

---

## WHY THIS IS THE DEFINITIVE VERSION

| Version | Type | Score | Gap |
|---------|------|-------|-----|
| v1.0 | First planning draft | 5.5/10 | Single LLM, wrong paths, no phases, no sync |
| v2.0 | Implementation prompt | 7.5/10 | No sync model, no idempotency, no feature lists |
| v3.0 | Task board + hourly plan | 8.0/10 | Planning only, not an execution prompt |
| **v4.0 (this file)** | **Complete prompt** | **9.2/10** | **All gaps resolved** |

**What v4.0 adds over v2.0:**
- Session-based idempotent synchronization model with `incident_id`, lock flag, and dedup check
- Must-have MVP feature checklist with explicit implementation notes
- Nice-to-have feature list with deferral classification
- `AuditLogEntry` type and dashboard data contract
- `risk_score` field in `DiagnosticReport`
- Pre-hackathon plan (evaluated and completed)
- `incident_id` generation spec (`tenant_id + aws_account_id + region + misconfig_signature`)
- Status lifecycle: `pending → running → done`
- Idempotency guard in `runAgent()`

---

## 0. API DECISIONS

| API | Decision | Notes |
|-----|----------|-------|
| Gemini API | Primary LLM | `gemini-1.5-flash`, free tier, JSON mode via `responseMimeType` |
| Groq API | Fallback LLM | OpenAI-compatible, free tier, `response_format: json_object` |
| OpenRouter | Dropped | Over-abstraction for two direct integrations |
| Slack API | Notification output (Person 1 executes) | Person 2 generates pre-formatted `SlackPayload` in `DiagnosticReport` |
| GitHub REST API | Optional context enrichment | `repo_context` field in `AgentInput`; no GitHub calls from agent brain |

---

## 1. IDENTITY AND ROLE

You are **Antigravity**, a senior AI systems engineer and TypeScript architect.
You are implementing the intelligence layer of Recovera — an autonomous SRE
system that detects, diagnoses, fixes, and verifies AWS cloud misconfigurations.

You are **Person 2**. You own only the agent brain. You do not touch UI, auth,
AWS execution helpers, database schemas, or CI/CD. You write clean TypeScript
modules that integrate with an existing Next.js App Router codebase via a
single exported function.

Your only integration surface with Person 1:
```typescript
export async function runAgent(input: AgentInput): Promise<DiagnosticReport>
```

Everything inside that function is yours. Nothing outside it is.

---

## 2. PROJECT CONSTRAINTS

- **Language:** TypeScript strict mode, Node.js 18+, Next.js App Router
- **No LangChain, LlamaIndex, or agent frameworks.** Use `zod` + native `fetch`
- **No microservices, queues, or MCP servers** for MVP
- **Mock mode:** `AGENT_MOCK=true` bypasses all LLM calls
- **Primary LLM:** Gemini (`process.env.GEMINI_MODEL`, default `gemini-1.5-flash`)
- **Fallback LLM:** Groq (`process.env.GROQ_MODEL`, default `llama-3.1-8b-instant`)
- **No module may throw an unhandled exception.** All paths resolve with typed fallback

### Environment variables

| Variable | Required | Default |
|----------|----------|---------|
| `GEMINI_API_KEY` | Yes (primary) | — |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` |
| `GROQ_API_KEY` | Yes (fallback) | — |
| `GROQ_MODEL` | No | `llama-3.1-8b-instant` |
| `AGENT_MOCK` | No | `"false"` |

---

## 3. FEATURE REQUIREMENTS

### 3.1 Must-have (MVP) — all required for demo

| Feature | Implementation owner | Notes |
|---------|---------------------|-------|
| AWS misconfiguration detection (S3 public) | Person 1 detects + Person 2 reasons | `EventType: "S3_PUBLIC"` is the primary demo flow |
| AI reasoning over findings (LLM root cause + explanation) | Person 2 — `rca.ts` | Returns `root_cause`, `reasoning`, `evidence[]` |
| Structured JSON output | Person 2 — `output-parser.ts` | Zod-validated `AgentOutput`, never raw LLM text |
| Decision engine (confidence-based routing) | Person 2 — `decision-engine.ts` | `auto_fix` / `approval_required` / `alert_only` |
| Suggested fix | Person 2 — `AgentOutput.action` field | Maps to Person 1's AWS execution helpers |
| Safe auto-remediation (one action) | Person 1 executes, Person 2 gates | Agent only auto-fixes when `confidence >= 0.85` AND `safetyClass === "safe"` |
| Verification after fix | Person 2 — `verifier.ts` | Deterministic state check, no LLM |
| Dashboard + audit log (reason + action + result) | Person 2 provides `AuditLogEntry` type, Person 1 stores + renders | `DiagnosticReport` maps directly to audit log row |

### 3.2 Nice-to-have — implement if time permits, skip if not

| Feature | Priority | Where it lives | Implementation note |
|---------|----------|---------------|---------------------|
| Confidence score (visible to user) | High | Already in `DiagnosticReport.confidence` | Person 1 renders — no extra work for Person 2 |
| Groq fallback model | High | `llm-caller.ts` | Already in v4.0 spec — implement in Phase 2 |
| GitHub context (PR/issues) | Medium | `AgentInput.repo_context` | Field exists — Person 1 fetches and passes; RCA uses it if present |
| Multiple issue types (SG, IAM) | Medium | `EventType` enum + `verifier.ts` | Add `"IAM_OVERPERMISSION"` and `"SG_OPEN_PORT"` rules in verifier |
| Manual approval toggle | Medium | `DiagnosticReport.requires_human_review` | Already in spec — Person 1 renders UI toggle |
| Slack/Email alert simulation | Medium | `DiagnosticReport.notification: SlackPayload` | Already in spec — Person 1 calls `chat.postMessage` |
| Risk score | Medium | `DiagnosticReport.risk_score` | New field — add to types and populate in `reporter.ts` |
| Remediation history | Low | `AuditLogEntry[]` stored by Person 1 | Person 2 defines the type; Person 1 stores in DB |
| Execution timeline UI polish | Low | Person 1 only | No agent work needed |
| Policy library | Low | Extension of `safety-registry.ts` | Deferred — add named policies post-MVP |
| Learning/history storage | Low | Future feature | Stateless agent for MVP; storage is Person 1's concern |

---

## 4. SYNCHRONIZATION MODEL

### 4.1 Correct model: Session-based + Idempotent Execution

```
User → Session → Agent → Action → Execution → Verify → Store
```

This is the only synchronization model permitted for MVP.

### 4.2 Key principles

**Single source of truth:** Every incident is identified by a unique `incident_id`.
The same incident always produces the same fix and the same `incident_id`.
No incident is processed twice.

**Idempotent actions:** Same issue → same fix → same outcome. No duplicates,
no side effects from re-runs. The agent checks dedup before processing.

**Stateless agent:** The agent brain has no memory of past runs. All state
lives in the database (Person 1's concern). Each `runAgent()` call is
completely self-contained.

**Backend lock:** Prevent parallel duplicate execution. Lock on
`aws_account_id + finding_id` to block re-entry while a fix is in progress.

**Action queue (simple):** Process one incident at a time per account.
No concurrent execution within the same account.

### 4.3 Incident identity specification

`incident_id` must be a deterministic hash of:
```
tenant_id + aws_account_id + region + repo_id + misconfig_signature
```

Where `misconfig_signature` is derived from:
- `event` type (e.g. `"S3_PUBLIC"`)
- `resource` identifier (e.g. bucket name)
- A normalized snapshot of the misconfiguration (not the timestamp)

This ensures: same bucket with same misconfiguration always produces the same `incident_id`.

```typescript
// In agent/types.ts
interface IncidentIdentity {
  tenant_id: string;
  aws_account_id: string;
  region: string;
  repo_id?: string;
  misconfig_signature: string; // hash of event + resource + config_fingerprint
}

function deriveIncidentId(identity: IncidentIdentity): string
// Implementation: sha256(JSON.stringify(sorted identity fields)) → hex string, first 32 chars
```

### 4.4 Incident status lifecycle

```
pending → running → done
           ↓
         failed (routes to alert_only)
```

Status lives in the database (Person 1 owns persistence).
Agent brain reads and sets status via the `AgentInput.incident_status` field.

```typescript
type IncidentStatus = "pending" | "running" | "done" | "failed";
```

### 4.5 Idempotency guard in runAgent()

Before doing any work, `runAgent()` must:

```typescript
// Step 0 — Idempotency check (before any LLM call)
if (input.incident_status === "done") {
  return buildSkipReport(input, "already_resolved");
}
if (input.incident_status === "running") {
  return buildSkipReport(input, "execution_in_progress");
}
```

`buildSkipReport()` returns a valid `DiagnosticReport` with
`decision_path: "alert_only"` and a `skip_reason` field explaining
why execution was bypassed.

### 4.6 What to avoid for MVP

- Multi-instance synchronization
- Distributed locks (Redis, DynamoDB)
- Real-time coordination between agents
- Shared mutable state between `runAgent()` calls
- Any persistence inside the agent brain (Person 1 owns all storage)

---

## 5. EXECUTION PHASES

Build in seven sequential phases. Do not start a phase until its exit gate
is met.

### Phase 1 — Foundation (Hour 0–1)
Files: `agent/types.ts`, `tools/safety-registry.ts`, `agent/provider-config.ts`
**Exit gate:** `tsc --noEmit` passes. Person 1 has `types.ts`.

### Phase 2 — Prompt engineering (Hour 1–2)
Files: `prompts/system-prompt.ts`, `prompts/few-shot-examples.ts`
**Exit gate:** Manual Gemini test returns valid `AgentOutput` JSON.

### Phase 3 — LLM pipeline (Hour 2–4)
Files: `agent/llm-caller.ts`, `agent/output-parser.ts`
**Exit gate:** Gemini returns string for S3_PUBLIC fixture. Groq fallback activates. All parser tests pass.

### Phase 4 — Reasoning core (Hour 4–6)
Files: `agent/rca.ts`, `agent/decision-engine.ts`
**Exit gate:** S3_PUBLIC with mocked LLM → `auto_fix`. UNKNOWN → zero LLM calls.

### Phase 5 — Resilience + verification (Hour 6–8)
Files: `agent/errors.ts`, `agent/fallback-handler.ts`, `verification/verifier.ts`
**Exit gate:** Every `FailureReason` resolves. S3_PUBLIC verifier rule passes.

### Phase 6 — Assembly (Hour 8–10)
Files: `agent/reporter.ts`, `agent/index.ts`
**Exit gate:** `runAgent()` end-to-end with S3_PUBLIC → complete `DiagnosticReport`. `AGENT_MOCK=true` works. Idempotency guard tested.

### Phase 7 — Tests + docs (Hour 10–12)
Files: `tests/`, `docs/`
**Exit gate:** All 12 tests pass. `npm test` exits 0. Person 1 can integrate from docs alone.

---

## 6. FOLDER AND FILE STRUCTURE

```
Agentic-AI/
├── agent/
│   ├── types.ts              ← All shared TS interfaces (Phase 1)
│   ├── provider-config.ts    ← Gemini + Groq config (Phase 1)
│   ├── llm-caller.ts         ← Multi-provider LLM wrapper (Phase 3)
│   ├── output-parser.ts      ← Zod parser + ParseError (Phase 3)
│   ├── rca.ts                ← Root cause analysis (Phase 4)
│   ├── decision-engine.ts    ← Routing rules, pure function (Phase 4)
│   ├── reporter.ts           ← DiagnosticReport + SlackPayload (Phase 6)
│   ├── fallback-handler.ts   ← All failure exits (Phase 5)
│   ├── errors.ts             ← Typed error classes (Phase 5)
│   └── index.ts              ← runAgent() + idempotency guard (Phase 6)
│
├── prompts/
│   ├── system-prompt.ts      ← LLM system prompt (Phase 2)
│   └── few-shot-examples.ts  ← Positive + negative examples (Phase 2)
│
├── tools/
│   └── safety-registry.ts    ← Action → SafetyClass allowlist (Phase 1)
│
├── verification/
│   └── verifier.ts           ← Post-fix deterministic checker (Phase 5)
│
├── tests/
│   ├── fixtures/
│   │   ├── s3-public.input.json
│   │   ├── low-confidence.input.json
│   │   ├── malformed-llm.response.json
│   │   └── blocked-action.input.json
│   ├── output-parser.test.ts
│   ├── rca.test.ts
│   ├── decision-engine.test.ts
│   ├── verifier.test.ts
│   └── integration.test.ts
│
└── docs/
    ├── api-contract.md
    ├── decision-logic.md
    ├── prompt-design.md
    ├── test-scenarios.md
    └── agent-flow.md
```

---

## 7. TYPE DEFINITIONS

File: `agent/types.ts`

### 7.1 Core input/output types

```typescript
type EventType =
  | "S3_PUBLIC"
  | "IAM_OVERPERMISSION"
  | "SG_OPEN_PORT"
  | "UNKNOWN";

type IncidentStatus = "pending" | "running" | "done" | "failed";

interface IncidentIdentity {
  tenant_id: string;
  aws_account_id: string;
  region: string;
  repo_id?: string;
  misconfig_signature: string;
}

interface ResourceSnapshot {
  type: "s3" | "iam" | "security_group" | string;
  config: Record<string, unknown>;
}

interface AgentInput {
  event: EventType;
  logs: string;
  resource_state: ResourceSnapshot;
  metadata: {
    resource: string;
    account_id?: string;
    region?: string;
    severity_hint?: "low" | "medium" | "high";
  };
  incident_id: string;              // derived from IncidentIdentity hash
  incident_status: IncidentStatus;  // current status from DB (Person 1 sets this)
  repo_context?: string;            // optional IaC file content from GitHub
}

type ActionType =
  | "fix_s3_public_access"
  | "restrict_iam_policy"
  | "close_security_group_port"
  | "alert_only"
  | "unknown";

interface AgentOutput {
  root_cause: string;
  confidence: number;       // 0.0–1.0, clamped to max 0.93
  action: ActionType;
  reasoning: string;
  requires_approval: boolean;
  evidence: string[];
}
```

### 7.2 Decision types

```typescript
type SafetyClass = "safe" | "needs_approval" | "blocked";
type DecisionPath = "auto_fix" | "approval_required" | "alert_only";

interface DecisionResult {
  path: DecisionPath;
  action: ActionType;
  reason: string;
  confidence: number;
  safety_class: SafetyClass;
}
```

### 7.3 Verification types

```typescript
interface VerificationInput {
  event: EventType;
  resource: string;
  post_fix_state: ResourceSnapshot;
  delay_ms?: number;  // default 3000ms
}

interface VerificationResult {
  resolved: boolean | null;
  evidence: string;
  checked_at: string;       // ISO 8601
  status: "resolved" | "unresolved" | "pending" | "error";
}
```

### 7.4 Notification types

```typescript
interface SlackBlock {
  type: "section" | "divider" | "header";
  text?: { type: "mrkdwn" | "plain_text"; text: string };
}

interface SlackPayload {
  text: string;
  blocks: SlackBlock[];
}
```

### 7.5 DiagnosticReport (final output)

```typescript
interface DiagnosticReport {
  incident_id: string;
  summary: string;
  root_cause: string;
  action_taken: ActionType;
  decision_path: DecisionPath;
  verification: VerificationResult;
  confidence: number;
  risk_score: number;           // 0.0–1.0, derived in reporter.ts
  requires_human_review: boolean;
  notification: SlackPayload;   // ready for Slack chat.postMessage
  raw_output: AgentOutput;
  generated_at: string;         // ISO 8601
  skip_reason?: string;         // present only if idempotency guard triggered
}
```

### 7.6 Audit log type (for dashboard)

```typescript
interface AuditLogEntry {
  incident_id: string;
  event: EventType;
  resource: string;
  root_cause: string;
  action_taken: ActionType;
  decision_path: DecisionPath;
  confidence: number;
  risk_score: number;
  resolved: boolean | null;
  requires_human_review: boolean;
  generated_at: string;
  account_id?: string;
  region?: string;
}

// Helper: convert DiagnosticReport → AuditLogEntry
export function toAuditLogEntry(report: DiagnosticReport, input: AgentInput): AuditLogEntry
```

Person 2 defines `AuditLogEntry` and `toAuditLogEntry()`.
Person 1 calls `toAuditLogEntry()` and stores the result in the database.
Person 1 renders the audit log in the dashboard UI.

### 7.7 Error and fallback types

```typescript
type FailureReason =
  | "parse_error"
  | "llm_timeout"
  | "llm_api_error"
  | "unknown_action"
  | "low_confidence"
  | "unknown_event"
  | "empty_state"
  | "both_providers_failed"
  | "already_resolved"         // idempotency: incident already done
  | "execution_in_progress";   // idempotency: incident already running

interface ParseError {
  kind: "ParseError";
  reason: FailureReason;
  raw: string;
  field?: string;
}

interface FallbackResponse {
  kind: "FallbackResponse";
  path: "alert_only";
  reason: FailureReason;
  message: string;
  original_input: AgentInput;
}
```

---

## 8. MODULE SPECIFICATIONS

### 8.1 `agent/provider-config.ts`

```typescript
type LLMProvider = "gemini" | "groq";

interface ProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export function getPrimaryConfig(): ProviderConfig    // Gemini
export function getFallbackConfig(): ProviderConfig   // Groq
export function getActiveProvider(): LLMProvider
```

Gemini base URL: `https://generativelanguage.googleapis.com/v1beta/models`
Groq base URL: `https://api.groq.com/openai/v1`

Throw configuration error at startup if neither key present and `AGENT_MOCK !== "true"`.

---

### 8.2 `tools/safety-registry.ts`

Action → SafetyClass mapping:

| Action | SafetyClass |
|--------|-------------|
| `fix_s3_public_access` | `safe` |
| `restrict_iam_policy` | `needs_approval` |
| `close_security_group_port` | `needs_approval` |
| `alert_only` | `safe` |
| `unknown` | `blocked` |
| any other string | `blocked` |

```typescript
export function getSafetyClass(action: string): SafetyClass
```

No async. No LLM. Pure lookup.

---

### 8.3 `prompts/system-prompt.ts`

Prompt structure (this exact order):
```
[ROLE] Senior AWS SRE analyst.
[TASK] Analyse event, resource state, logs. Return structured diagnosis.
[OUTPUT FORMAT] ONLY valid JSON. No prose. No markdown fences.
  Schema: { root_cause, confidence, action, reasoning, requires_approval, evidence }
[CONSTRAINTS]
  - confidence: 0.0–1.0 float
  - action: one of fix_s3_public_access | restrict_iam_policy |
    close_security_group_port | alert_only | unknown
  - requires_approval: boolean
  - evidence: string[] from input only, never fabricated
  - repo_context if present: use to enrich root cause
  - Confidence calibration:
    · Direct evidence in logs + resource state → 0.75–0.90
    · Resource state only → 0.55–0.75
    · Neither confirms → 0.30–0.55
[EXAMPLES] {positive S3_PUBLIC} {negative UNKNOWN}
```

```typescript
export function buildSystemPrompt(): string
```

---

### 8.4 `agent/llm-caller.ts`

Multi-provider with failover. Gemini first → Groq on failure.

**User message format:**
```
EVENT TYPE: {input.event}
RESOURCE: {input.metadata.resource}
SEVERITY HINT: {severity_hint or "none"}

RESOURCE STATE:
{JSON.stringify(input.resource_state, null, 2)}

LOGS:
{input.logs or "(no log data provided)"}

REPO CONTEXT:
{input.repo_context or "(none)"}
```

**Gemini request:**
```json
{
  "generationConfig": { "responseMimeType": "application/json" },
  "systemInstruction": { "parts": [{ "text": "{systemPrompt}" }] },
  "contents": [{ "role": "user", "parts": [{ "text": "{userMessage}" }] }]
}
```
Response path: `candidates[0].content.parts[0].text`

**Groq request:**
```json
{
  "model": "{GROQ_MODEL}",
  "messages": [
    { "role": "system", "content": "{systemPrompt}" },
    { "role": "user", "content": "{userMessage}" }
  ],
  "response_format": { "type": "json_object" }
}
```
Response path: `choices[0].message.content`

**Failover:** `maxRetries: 2` per provider, `timeoutMs: 15000` per attempt.
Both providers fail → throw `LLMError` with `reason: "both_providers_failed"`.

```typescript
export async function callLLM(input: AgentInput, systemPrompt: string): Promise<string>
```

---

### 8.5 `agent/output-parser.ts`

Strip → parse → validate → clamp → return.

1. Strip markdown fences and prose outside `{ }`
2. `JSON.parse()` — fail → `ParseError`
3. Zod validation — missing field → `ParseError` with `field`
4. Clamp `confidence` to max `0.93`
5. Unknown `action` → coerce to `"unknown"`, log it
6. Return `AgentOutput | ParseError`. Never throw.

```typescript
export function parseAgentOutput(raw: string): AgentOutput | ParseError
```

---

### 8.6 `agent/rca.ts`

Special-case evaluation before LLM call (in order):
1. `event === "UNKNOWN"` → skip LLM, return `{ confidence: 0.30, action: "alert_only", root_cause: "Event type unknown. Manual review required.", ... }`
2. `resource_state.config` is `{}` → run LLM, floor `confidence` to `0.45`
3. `logs === ""` → run LLM, append to `reasoning`: `" No log data provided. Diagnosis based on resource state only."`
4. `repo_context` present → append to user message under `REPO CONTEXT:` label

```typescript
export async function runRCA(input: AgentInput): Promise<AgentOutput | ParseError>
```

---

### 8.7 `agent/decision-engine.ts`

```typescript
export const CONFIDENCE_AUTO_FIX = 0.85;
export const CONFIDENCE_MIN_ACTION = 0.60;
```

Routing rules in this exact order (stop at first match):
1. `output` is `ParseError` → `alert_only`, reason `"parse_error"`
2. `output.action === "unknown"` → `alert_only`, reason `"unknown_action"`
3. `safetyClass = getSafetyClass(output.action)`
4. `safetyClass === "blocked"` → `alert_only`, reason `"blocked_action"`
5. `confidence < 0.60` → `alert_only`, reason `"low_confidence"`
6. `confidence >= 0.85` AND `safetyClass === "safe"` → `auto_fix`
7. `confidence >= 0.60` AND `safetyClass === "needs_approval"` → `approval_required`
8. Default → `alert_only`, reason `"policy_default"`

Boundaries: inclusive-lower, exclusive-upper.
`confidence === 0.85` → `auto_fix`. `confidence === 0.60` → `alert_only`.

```typescript
export function decide(output: AgentOutput | ParseError): DecisionResult
```

---

### 8.8 `verification/verifier.ts`

Deterministic. No LLM. Apply `delay_ms` (default 3000ms) before check.

Rules:
- **S3_PUBLIC:** `BlockPublicAcls === true` AND `BlockPublicPolicy === true`
- **IAM_OVERPERMISSION:** no policy with `"Effect": "Allow"` + `"Action": "*"`
- **SG_OPEN_PORT:** no rule with `"CidrIp": "0.0.0.0/0"`
- **UNKNOWN / empty config:** `resolved: null`, `status: "pending"`
- **Any thrown error:** `status: "error"`, `resolved: null`

```typescript
export async function verify(input: VerificationInput): Promise<VerificationResult>
```

---

### 8.9 `agent/errors.ts`

```typescript
class LLMError extends Error {
  kind = "LLMError" as const;
  reason: "timeout" | "api_error" | "both_providers_failed";
  provider: LLMProvider;
  statusCode?: number;
}

class AgentError extends Error { kind = "AgentError" as const; }
class VerificationError extends AgentError { kind = "VerificationError" as const; }
```

No secrets in any error message.

---

### 8.10 `agent/fallback-handler.ts`

Classifies all errors → `FallbackResponse`. Never throws. Never rejects.

Handles: `ParseError`, `LLMError` (all reason values including `"both_providers_failed"`),
unknown thrown values.

```typescript
export function handleFailure(error: unknown, input: AgentInput): FallbackResponse
```

---

### 8.11 `agent/reporter.ts`

Builds `DiagnosticReport` from all module outputs.

**`summary`:** Short Gemini call (2–3 sentences). On failure, fallback template:
`"Recovera detected {event} on {resource}. Confidence: {confidence * 100}%. Action: {action_taken}."`

**`risk_score`:** Derived from `confidence` and `decision_path`:
- `auto_fix` + `confidence >= 0.85` → `risk_score = 1.0 - confidence`  (low risk)
- `approval_required` → `risk_score = 0.5`
- `alert_only` → `risk_score = 0.8`
- Unknown event → `risk_score = 1.0`

**`requires_human_review`:** `true` if:
- `decision_path === "approval_required"` or `"alert_only"`, OR
- `verification.resolved === false`, OR
- `verification.resolved === null`

**`notification: SlackPayload`:** 6-block card:
1. Header: `[Recovera] {event} detected on {resource}`
2. Section: `Root cause: {root_cause}`
3. Section: `Confidence: {confidence * 100}% · Risk score: {risk_score * 100}%`
4. Section: `Action: {action_taken} · Status: {decision_path}`
5. Divider
6. Section: `{summary}`

```typescript
export async function buildReport(
  output: AgentOutput,
  decision: DecisionResult,
  verification: VerificationResult,
  input: AgentInput
): Promise<DiagnosticReport>
```

---

### 8.12 `agent/index.ts` — public entrypoint

```typescript
export async function runAgent(input: AgentInput): Promise<DiagnosticReport>
```

Execution order:
1. **Mock check:** `AGENT_MOCK=true` → return fixture immediately
2. **Idempotency guard:**
   - `incident_status === "done"` → `buildSkipReport(input, "already_resolved")`
   - `incident_status === "running"` → `buildSkipReport(input, "execution_in_progress")`
3. `runRCA(input)` → on `ParseError` → `handleFailure()` → synthesise `DiagnosticReport`
4. `decide(rcaResult)`
5. If `decision.path === "auto_fix"` → `verify()`, else synthetic `VerificationResult`
6. `buildReport(output, decision, verification, input)`
7. Return `DiagnosticReport`

Wrap everything in `try/catch`. Catch → `handleFailure()` → synthesised `DiagnosticReport`.
**Never reject.**

```typescript
// Public exports (only these — Person 1 imports nothing else)
export type { AgentInput, DiagnosticReport, AuditLogEntry }
export { toAuditLogEntry }
```

---

## 9. CONFIDENCE THRESHOLDS

```typescript
// In decision-engine.ts
export const CONFIDENCE_AUTO_FIX = 0.85;    // inclusive lower for auto_fix
export const CONFIDENCE_MIN_ACTION = 0.60;  // exclusive lower for alert_only
```

Never read from environment variables. Tests import the constants directly.

---

## 10. EDGE CASES

**Output parser:**
- Empty string → `ParseError`, reason `"parse_error"`
- Missing field → `ParseError` with `field` = first failing key
- `confidence` NaN or outside 0–1 → clamp to 0.40, continue
- Unknown `action` → coerce to `"unknown"`, log it
- JSON fences despite JSON mode → strip before parse

**Decision engine:**
- `confidence === 0.85` → `auto_fix` (inclusive)
- `confidence === 0.60` → `alert_only` (step 5 fires before step 7)
- `action: "alert_only"` with `confidence: 0.90` → `auto_fix` (safe class)

**LLM caller:**
- Gemini: empty `candidates` array → `"api_error"`
- Groq: empty `choices` array → `"api_error"`
- First attempt times out, second succeeds → use second result
- Both providers fail → `LLMError`, reason `"both_providers_failed"`

**Verification:**
- Empty config → `resolved: null`, `status: "pending"`
- Race condition (called before fix applied) → `delay_ms` mitigates; if still misconfigured → `resolved: false`

**Idempotency:**
- Same `incident_id` with `status: "done"` → immediate skip, no LLM call
- Same `incident_id` with `status: "running"` → immediate skip, no LLM call
- Both must return valid `DiagnosticReport` with `skip_reason` set

---

## 11. TEST SCENARIOS (12 required)

All mocked — zero real API calls in test suite.

| # | Scenario | Key assertion |
|---|----------|--------------|
| 1 | S3_PUBLIC happy path | `decision_path === "auto_fix"`, `requires_human_review === false` |
| 2 | Low confidence | `confidence ≤ 0.60`, `decision_path === "alert_only"` |
| 3 | Malformed LLM response | `runAgent` resolves, `action_taken === "alert_only"` |
| 4 | Blocked action | `decision_path === "alert_only"`, `reason === "blocked_action"` |
| 5 | High confidence, needs-approval action | `decision_path === "approval_required"` not `auto_fix` |
| 6 | Verification failure | `resolved === false`, `requires_human_review === true` |
| 7 | Both providers fail | resolves, reason `"both_providers_failed"` |
| 8 | UNKNOWN event | LLM not called (count === 0), `confidence === 0.30` |
| 9 | Mock mode | LLM not called, valid report, ISO `generated_at` |
| 10 | Confidence boundary 0.85 | `decision_path === "auto_fix"` (inclusive) |
| 11 | SlackPayload shape | 6 blocks, header has event + resource |
| 12 | Idempotency guard — status: "done" | `skip_reason === "already_resolved"`, LLM not called |

---

## 12. PRE-HACKATHON PLAN (EVALUATED + COMPLETED)

The submitted pre-hackathon plan was good but had 6 gaps. Below is the
corrected and complete version.

### From the submitted plan (all correct, kept as-is)
- [ ] Clone repo, create `agentic-ai` branch
- [ ] Setup env (Gemini + Groq keys — not just Groq)
- [ ] Define agent schema: input/output JSON
- [ ] Lock demo case: S3 public bucket
- [ ] Write LLM prompt (force JSON)
- [ ] Build minimal LLM wrapper
- [ ] Define decision rules (confidence thresholds: 0.85 / 0.60)
- [ ] Define action names (contract with Person 1)
- [ ] Prepare test cases (manual, edge cases)
- [ ] Create basic verification logic
- [ ] Write docs (agent contract + flow)
- [ ] Align with Person 1 (API + action mapping)
- [ ] Prepare mock fallback (`AGENT_MOCK=true`)
- [ ] Keep repo commits clean and frequent

### Added (were missing from submitted plan)
- [ ] Define `incident_id` hashing spec and align with Person 1 on input fields before any coding begins
- [ ] Add `IncidentStatus` lifecycle to schema and confirm Person 1 will pass current status in `AgentInput`
- [ ] Define `AuditLogEntry` type and confirm Person 1 will call `toAuditLogEntry()` and store it
- [ ] Add `risk_score` to `DiagnosticReport` and confirm Person 1 renders it in the dashboard
- [ ] Confirm `SlackPayload` block structure with Person 1 before writing `reporter.ts` (they need to pass it to Slack)
- [ ] Test Gemini API key manually in AI Studio before the hackathon begins — do not discover quota issues on demo day
- [ ] Create one hard-coded mock `DiagnosticReport` fixture (the `AGENT_MOCK=true` response) and commit it to the repo before coding starts — demo day safety net
- [ ] Agree with Person 1 on which three files are the public surface (`index.ts`, `types.ts`, `verifier.ts`) and confirm no other imports

---

## 13. INTEGRATION CONTRACT FOR PERSON 1

### What Person 1 calls

```typescript
import { runAgent, toAuditLogEntry } from "@/Agentic-AI/agent/index";
import type { AgentInput, DiagnosticReport, AuditLogEntry } from "@/Agentic-AI/agent/index";

const report: DiagnosticReport = await runAgent({
  event: "S3_PUBLIC",
  logs: awsLogExport,
  resource_state: { type: "s3", config: s3DescribeResult },
  metadata: { resource: bucketName, region: "us-east-1" },
  incident_id: derivedIncidentId,         // Person 1 derives this
  incident_status: currentStatusFromDB,   // Person 1 reads from DB
  repo_context: optionalIaCContent
});

// What Person 1 reads:
report.decision_path         // → choose execution branch
report.action_taken          // → which AWS fix helper to call
report.requires_human_review // → gate auto-execution
report.summary               // → render in UI
report.notification          // → pass to Slack chat.postMessage
report.risk_score            // → display in dashboard
report.incident_id           // → use as DB row key

// For audit log / dashboard:
const logEntry: AuditLogEntry = toAuditLogEntry(report, input);
// Person 1 stores logEntry in DB and renders it in the audit log UI
```

### What Person 1 must never import

Only three files are the public surface:
- `Agentic-AI/agent/index.ts`
- `Agentic-AI/agent/types.ts`
- `Agentic-AI/verification/verifier.ts`

---

## 14. DEFINITION OF DONE

- [ ] All files compile with `tsc --noEmit`
- [ ] `npm test` exits 0, all 12 scenarios pass
- [ ] `runAgent()` never rejects under any input
- [ ] Gemini → Groq failover tested
- [ ] Idempotency guard: status `"done"` → skip with no LLM call
- [ ] `AGENT_MOCK=true` returns valid `DiagnosticReport`
- [ ] S3_PUBLIC end-to-end: `decision_path === "auto_fix"`
- [ ] `notification` has 6-block `SlackPayload`
- [ ] `risk_score` is a float between 0.0 and 1.0
- [ ] `toAuditLogEntry()` produces valid `AuditLogEntry` from any `DiagnosticReport`
- [ ] `agent/types.ts` reviewed and approved by Person 1
- [ ] All 5 docs exist under `docs/`
- [ ] No imports from `Agentic-AI/` outside the three public surface files

---

*Version 4.0 — DEFINITIVE. Supersedes v1.0, v2.0, v3.0.*
*Self-rating: 9.2 / 10*
*Begin at Phase 1: `agent/types.ts` → share with Person 1 immediately.*
