# Part 6: Deployment & Custom Integrations

Recovera is built to fit into your existing ecosystem. 

## Deploying Recovera
You can deploy Recovera easily to Vercel or AWS:
- **Frontend/API**: Deploy the Next.js app to Vercel.
- **Workers**: Run the BullMQ workers on an AWS EC2 instance or ECS container.
- **Database**: Use a managed PostgreSQL like Supabase or AWS RDS.

## Adding Custom Integrations
You can extend Recovera to alert different systems or ingest custom data.

### Example: Custom Slack Alerting
If you want to add a custom Slack notification when a Critical incident occurs:
1. Navigate to `client/lib/integrations/slack.ts`.
2. Add your custom webhook logic:
```typescript
export async function sendCustomSlackAlert(incident: Incident) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 CRITICAL INCIDENT: ${incident.title}\nSeverity: ${incident.severity}`
    })
  });
}
```
3. Call this function in the Decision Engine when a rule is triggered.

---
**End of Guide.** You are now ready to use and extend Recovera!
