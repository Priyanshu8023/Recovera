# Part 3: Ingestion & Anomaly Detection

Recovera needs to know when something goes wrong. This happens through continuous ingestion and intelligent anomaly detection.

## 1. Unified Ingestion
Recovera accepts logs via Webhooks, AWS Firehose, or CloudWatch streams. All logs are normalized into a standard `Event` format containing:
- `timestamp`: When it occurred.
- `service_name`: Which microservice failed.
- `severity`: ERROR, WARN, FATAL.
- `stack_trace`: The full trace.

## 2. Anomaly Detection
We use hybrid detection:
- **Rule-Based**: If `severity == FATAL` or `error_rate > 10%`, trigger an incident immediately.
- **Statistical**: Spikes in latency that deviate from the 7-day moving average.

### Example Workflow
```typescript
// Example: Normalizing a raw AWS CloudWatch log
function normalizeLog(rawLog: any): NormalizedEvent {
  return {
    id: generateId(),
    timestamp: new Date(rawLog.timestamp),
    service: rawLog.logGroup,
    message: rawLog.message,
    severity: determineSeverity(rawLog.message),
    raw: rawLog
  };
}
```
If 50 such logs arrive within a minute from a service that normally sees 2, the Anomaly Engine triggers the next phase: AI RCA.
