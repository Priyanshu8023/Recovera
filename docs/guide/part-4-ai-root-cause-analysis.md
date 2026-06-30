# Part 4: AI Root Cause Analysis (RCA)

Once an anomaly is detected, Recovera acts as a senior engineer to figure out *why*.

## The Context Gathering Phase
Before asking the AI, Recovera gathers context:
1. **Recent Deployments**: Did code change recently? 
2. **Git Diffs**: Fetches the diff of the latest commit.
3. **Stack Traces**: Extracts the exact line numbers from the errors.

## AI Analysis
Recovera sends this package to an LLM (Gemini/xAI). The prompt looks something like:
> "You are an expert SRE. The service 'payment-api' is failing with a NullPointerException at line 42. Here is the recent git diff. What caused this?"

### Example Outcome
The AI responds with a structured JSON:
```json
{
  "confidence": 95,
  "root_cause": "The recent commit removed the null check for 'user.billingInfo', causing a crash when a user without a saved card tries to check out.",
  "suggested_fix_code": "if (!user.billingInfo) return res.status(400).send('No billing info');"
}
```
This structured output is then passed to the Decision Engine.
