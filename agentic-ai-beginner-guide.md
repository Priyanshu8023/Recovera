# 🤖 Recovera's Agentic AI — Explained Like You're a Beginner

---

## What Even Is "Agentic AI"?

Think of regular AI like **Google Translate** — you give it input, it gives you output, and that's it. It doesn't *do* anything in the real world.

**Agentic AI** is different. It's AI that can **think, decide, AND take action** on its own — like a robot that doesn't just diagnose a problem but also fixes it.

In Recovera's case, the AI agent:
1. 🔍 **Reads** the error logs from your server
2. 🧠 **Thinks** about what went wrong (root cause analysis)
3. ⚖️ **Decides** whether it's safe to fix it automatically
4. 🔧 **Writes** the actual code fix
5. 📬 **Opens a Pull Request** on GitHub with the fix

It's like having a **junior engineer who never sleeps**, automatically responding to production incidents at 3 AM.

---

## The Robot Doctor Analogy 🏥

Imagine a robot doctor in a hospital:

| Step | Robot Doctor | Recovera's AI Agent |
|------|-------------|-------------------|
| 1 | Patient arrives with symptoms | An error log arrives from AWS |
| 2 | Doctor reads the medical history | AI reads the logs + server configuration |
| 3 | Doctor diagnoses the disease | AI figures out the **root cause** of the error |
| 4 | Doctor decides the treatment plan | AI decides: fix it automatically? or call a human? |
| 5 | Doctor checks: is this surgery safe? | AI checks: is this code change risky? |
| 6 | Doctor performs the surgery | AI generates a code fix and opens a Pull Request |
| 7 | Doctor checks if patient is healthy after | AI verifies the fix actually worked |
| 8 | Doctor writes a report | AI creates a full diagnostic report |

Now let's see how each of these steps works in the actual code.

---

## Step 1: The AI Receives an Incident

When something breaks in your AWS infrastructure (e.g., an S3 bucket accidentally becomes public), the system packages up all the information into a neat object called `AgentInput`:

```
📦 AgentInput = {
  event: "S3_PUBLIC",                    ← What type of problem?
  logs: "CloudTrail: PutBucketPolicy..." ← What do the logs say?
  resource_state: {                      ← What does the server look like right now?
    type: "s3",
    config: { BlockPublicAcls: false }   ← Uh oh, public access is ON
  },
  metadata: {
    resource: "my-company-data-bucket",  ← Which resource is affected?
    severity_hint: "high"                ← How bad is it?
  },
  incident_id: "inc_abc123"             ← Unique ID for tracking
}
```

**File**: `client/agent/agent/types.ts` — This file defines what the input looks like.

---

## Step 2: Safety Checks Before Doing Anything

Before the AI even starts thinking, it does two quick checks:

### Check 1: "Am I in test mode?"
```
if AGENT_MOCK === "true" → return fake data (don't call the real AI)
```
This is like a **fire drill** — you don't want to call the real fire department during practice. During development, the AI returns fake results so you don't waste money on API calls.

### Check 2: "Has someone already handled this?"
```
if incident is already "done"    → skip (don't redo work)
if incident is already "running" → skip (someone else is on it)
```
This prevents the AI from working on the same problem twice. Imagine two doctors both trying to operate on the same patient — that's bad!

**File**: `client/agent/agent/index.ts` — The main entry point that runs these checks.

---

## Step 3: Ask the AI "What Went Wrong?" (Root Cause Analysis)

Now the AI calls an LLM (Large Language Model — like ChatGPT) to analyze the problem.

### How the LLM is called:

```
📝 System Prompt (instructions to the AI):
   "You are a Senior AWS SRE analyst.
    Analyze the event, resource state, and logs.
    Return your diagnosis as JSON."

📨 User Message (the actual problem):
   "EVENT: S3_PUBLIC
    RESOURCE: my-company-data-bucket
    LOGS: CloudTrail shows PutBucketPolicy...
    CONFIG: BlockPublicAcls = false"

🤖 AI Response:
   {
     "rootCauseSummary": "Bucket has public read access",
     "confidence": 0.88,
     "recommendedAction": "generate_fix",
     "fixStrategy": ["Enable Public Access Block"]
   }
```

### What if the AI is down?

The system has a **backup plan**:

```
Try Gemini (Google's AI) ──→ Works? Great, use it!
         │
         ↓ (fails after 2 tries, 15 seconds each)
         │
Try Groq (alternative AI) ──→ Works? Great, use it!
         │
         ↓ (also fails)
         │
Return error → System degrades to "just alert humans"
```

It's like having **two hospitals** — if the first one is full, you go to the second one. If both are full, you call 911 (alert the engineers).

**Files**:
- `client/agent/agent/rca.ts` — Runs the root cause analysis
- `client/agent/agent/llm-caller.ts` — Handles calling the AI with retry logic
- `client/agent/prompts/system-prompt.ts` — The instructions given to the AI

---

## Step 4: "Can I Trust This Answer?" (Output Parsing)

Here's the thing — **AI can be wrong**. It can return garbage, broken JSON, or be overconfident. So before trusting anything the AI says, the system runs it through a **trust filter**:

### What the parser does:

1. **Strips junk** — Sometimes the AI wraps its answer in markdown code blocks. The parser removes those.

2. **Validates the shape** — Uses a library called **Zod** to check: "Does this response have ALL the required fields?" If not → error.

3. **Clamps confidence** — This is the smartest part:
   - If the AI says confidence is `0.99` → the system **forces it down to 0.93**
   - Why? Because AI tends to be **overconfident**. It's like a student who always answers "100% sure" on a test — you know that can't be right.

4. **Validates the action** — If the AI suggests an action that doesn't exist in the system (like `"restart_everything"`), it's changed to `"unknown"` which will trigger a human review.

```
AI says: confidence = 0.97  →  System clamps to: 0.93
AI says: confidence = -0.5  →  System clamps to: 0.40
AI says: action = "delete_database"  →  System changes to: "unknown"
```

**File**: `client/agent/agent/output-parser.ts`

---

## Step 5: "What Should We Do?" (Decision Engine)

Now comes the critical question: **should the AI fix this automatically, or should a human look at it first?**

This is decided by a simple set of rules based on **confidence** (how sure the AI is):

```
                    ┌──────────────────────────────────────────────┐
                    │           CONFIDENCE SCALE                   │
                    │                                              │
   0.0 ─────── 0.60 ────────── 0.85 ──────────── 0.93 ── 1.0    │
   │             │               │                  │              │
   │  🚫 DO      │  ⚠️ ASK A     │  ✅ FIX IT       │  (capped)   │
   │  NOTHING    │  HUMAN FIRST  │  AUTOMATICALLY   │              │
   │  (alert     │  (approval    │  (auto_fix)      │              │
   │   only)     │   required)   │                  │              │
   └──────────────────────────────────────────────────────────────┘
```

In plain English:
- **Below 60%** sure → "I don't know enough. Just alert the engineers."
- **60% to 84%** sure → "I think I know what's wrong, but let a human verify before we touch anything."
- **85% and above** sure → "I'm very confident. Let me fix it automatically."

But there's a **second check** — the **safety class** of the action:

| Action the AI wants to take | Safety Class | Allowed to auto-fix? |
|---|---|---|
| `generate_fix` (write code) | ✅ Safe | Yes (if confidence ≥ 85%) |
| `alert_only` (just notify) | ✅ Safe | N/A (no fix needed) |
| `rollback` (undo changes) | ⚠️ Needs Approval | Never auto — always ask human |
| `human_only` (too complex) | 🛑 Blocked | Never — always escalate |
| `unknown` (AI confused) | 🛑 Blocked | Never — always escalate |

So even if the AI is 95% confident, if it wants to do a `rollback`, a human must approve it first.

**Files**:
- `client/agent/agent/decision-engine.ts` — The decision rules
- `client/agent/tools/safety-registry.ts` — Maps actions to safety classes

---

## Step 6: "Did the Fix Actually Work?" (Verification)

If the AI decided to auto-fix, the system checks whether the fix **actually worked** by looking at the resource's current state:

| Problem Type | What It Checks | ✅ Fixed If |
|---|---|---|
| S3 bucket is public | Is public access blocked now? | `BlockPublicAcls = true` AND `BlockPublicPolicy = true` |
| IAM has too many permissions | Does the policy still have `"*"` wildcard? | No wildcard `Allow *` statements found |
| Security group is open | Is `0.0.0.0/0` still allowed? | No rules allowing traffic from everywhere |

If the fix didn't work → the report says `resolved: false` and a human is notified.

**File**: `client/agent/verification/verifier.ts`

---

## Step 7: Build the Final Report

Everything gets packaged into a **DiagnosticReport**:

```
📋 DiagnosticReport = {
  incident_id: "inc_abc123",
  summary: "S3 bucket had public access. AI fixed it.",
  root_cause: "Public Access Block was disabled",
  action_taken: "generate_fix",
  decision_path: "auto_fix",
  confidence: 0.88,
  risk_score: 0.12,              ← Lower = safer (1.0 - 0.88 = 0.12)
  requires_human_review: false,
  verification: {
    resolved: true,
    evidence: "BlockPublicAcls is now enabled"
  },
  notification: { ... }          ← Slack message for the team
}
```

The report also includes a **Slack notification** so the engineering team gets a formatted message about what happened.

**File**: `client/agent/agent/reporter.ts`

---

## Step 8: Generate the Actual Code Fix (Background)

After the report is saved, a **second pipeline** runs in the background to generate the actual code:

```
1. 🧠 Call AI again → "Write a code patch for this problem"
   └─ AI returns a unified diff (like what you see in GitHub PRs)

2. ✅ Validate the patch
   └─ Is it valid? Not too many files changed? Not touching auth/payment code?

3. 🛡️ Safety policy check
   └─ Circuit breaker active? Confidence high enough? Touching risky code?

4. 🧪 Sandbox test
   └─ Clone the repo → apply the patch → run lint → does it pass?

5. 📬 Open Pull Request
   └─ Push to a new branch → create PR on GitHub via Octokit
```

### The Safety Policy Engine (Last Line of Defense)

Before any code change reaches your GitHub repo, it passes through a **3-layer safety wall**:

```
Layer 1: CIRCUIT BREAKER
  "Have too many recent AI fixes failed?"
  If 5+ patches failed in the last hour → 🛑 BLOCK EVERYTHING

Layer 2: CONFIDENCE CHECK  
  Below 70% → 🛑 BLOCK
  70-85%    → ⚠️ REQUIRE HUMAN APPROVAL
  Above 85% → ✅ PROCEED

Layer 3: DOMAIN RISK CHECK
  Does the code patch touch any of these keywords?
  auth, login, billing, payment, stripe, secret, key, migration
  If yes → ⚠️ REQUIRE HUMAN APPROVAL (even if confidence is high)
```

Think of it like airport security:
- **Layer 1**: "Is the airport on lockdown?" (circuit breaker)
- **Layer 2**: "Does this passenger have valid ID?" (confidence check)
- **Layer 3**: "Is the passenger carrying anything dangerous?" (domain risk)

**Files**:
- `client/lib/ai/orchestrator.ts` — Runs the background pipeline
- `client/lib/ai/fixGenerator.ts` — Generates the code patch
- `client/lib/safety/policyEngine.ts` — The 3-layer safety wall

---

## What Happens When Things Go Wrong?

The system is designed to **never crash**. Here's what happens at every failure point:

| What Goes Wrong | What the System Does |
|---|---|
| AI returns broken/invalid JSON | Parser catches it → returns `ParseError` → decision becomes `alert_only` |
| Gemini (primary AI) is down | Automatically switches to Groq (backup AI) |
| Both AIs are down | Returns `both_providers_failed` → alerts humans |
| AI is less than 60% confident | Decision engine says `alert_only` → no fix attempted |
| The code fix breaks the build | Sandbox validation catches it → no PR is opened |
| Too many AI fixes have failed recently | Circuit breaker trips → ALL auto-fixes are paused globally |
| The entire agent crashes with an exception | `handleFailure()` catches it → still returns a valid report |

The golden rule: **When in doubt, just alert humans. Never take a risky action.**

**File**: `client/agent/agent/fallback-handler.ts`

---

## The Complete Picture (Simple Version)

```
  🌩️ Server Error Happens
        │
        ↓
  📥 Logs arrive via AWS Firehose
        │
        ↓
  🔍 Detector picks up the error
        │
        ↓
  🤖 AI Agent starts working
        │
        ├─ Step 1: "What went wrong?" ──→ Calls Gemini AI
        │                                  (backup: Groq AI)
        │
        ├─ Step 2: "Can I trust the AI?" ─→ Validates output
        │                                    Clamps confidence
        │
        ├─ Step 3: "What should I do?" ──→ Decision Engine
        │           │                       (confidence thresholds)
        │           │
        │           ├─ < 60% ──→ 🚫 Just alert humans
        │           ├─ 60-84% ─→ ⚠️ Ask human to approve
        │           └─ 85%+ ───→ ✅ Fix automatically
        │
        ├─ Step 4: "Did it work?" ───────→ Verify fix
        │
        └─ Step 5: Build report ─────────→ Save to database
                                            Send Slack notification
        │
        ↓ (in background)
  🔧 Generate code fix
        │
        ↓
  🛡️ Safety checks (circuit breaker, domain risk)
        │
        ↓
  🧪 Sandbox test (clone repo, apply patch, run lint)
        │
        ↓
  📬 Open Pull Request on GitHub
        │
        ↓
  👨‍💻 Engineer reviews and merges
```

---

## Summary: Why Is This "Agentic"?

Regular AI: **"Here's what I think the problem is."** (just an answer)

Recovera's Agentic AI: **"Here's what I think the problem is, here's a code fix, I've tested it, it's safe, and I've already opened a Pull Request for you."** (thinks + decides + acts)

The "agentic" part means the AI doesn't just analyze — it **takes autonomous action** in the real world (writing code, opening PRs), while having **guardrails** at every step to prevent it from doing anything dangerous.
