# Integrations

## Overview

Recovera integrates with multiple cloud services, AI providers, and developer tools to automate incident investigation and remediation workflows.

---

## AWS Integrations

Recovera supports several AWS services for monitoring and infrastructure analysis.

### Supported AWS Services

- CloudWatch
- Firehose
- IAM
- S3
- EC2
- ECS
- EKS

These integrations help Recovera collect logs, monitor infrastructure, and analyze production incidents.

---

## GitHub Integration

Recovera integrates with GitHub to support:

- Repository linking
- Pull Request generation
- Deployment analysis
- Git diff inspection
- Automated remediation workflows

GitHub OAuth is used for secure authentication and repository access.

---

## AI Providers

Recovera uses AI providers for:

- Root-cause analysis
- Log interpretation
- Contextual reasoning
- Patch generation
- Incident summarization

### Supported Providers

- Google Gemini
- xAI
- Groq
- Vercel AI SDK

---

## Queue and Background Workers

Recovera uses:

- BullMQ
- Redis

These services manage asynchronous jobs such as:

- Log processing
- AI analysis
- Remediation execution
- Notification handling

---

## Database Integration

Recovera uses PostgreSQL with Prisma ORM for:

- Incident storage
- User management
- Audit records
- Workflow tracking

Redis is additionally used for worker queues and temporary processing.

---

## Authentication

Recovera supports secure authentication using:

- GitHub OAuth
- NextAuth

Authentication data and sensitive credentials are protected using encryption and secure session management.

---

## Future Integrations

Planned future integrations include:

- Google Cloud Platform (GCP)
- Microsoft Azure
- Prometheus
- OpenTelemetry
- Additional AI providers
