# Architecture

## Overview

Recovera follows a layered architecture designed for reliability, scalability, and automated incident remediation.

The platform combines AI-assisted analysis, cloud integrations, and automated workflows to help engineering teams investigate and resolve production incidents faster.

---

## High-Level Flow

1. Logs and alerts are collected from cloud services.
2. The detection layer identifies anomalies and suspicious behavior.
3. AI agents analyze logs, deployment history, and related code context.
4. Recovera generates remediation suggestions or patches.
5. Safety policies validate actions before execution.
6. Pull Requests and remediation workflows are created automatically.

---

## Main Components

### Frontend

Built with:

- Next.js
- React
- Tailwind CSS
- Framer Motion

The frontend provides dashboards, repository management, and incident monitoring interfaces.

---

### Backend

The backend is implemented using:

- Next.js API Routes
- Node.js
- BullMQ workers

It handles orchestration, queue processing, integrations, and remediation workflows.

---

### Database Layer

Recovera uses:

- PostgreSQL
- Prisma ORM
- Redis

PostgreSQL stores application and incident data, while Redis powers background job queues.

---

### AI Layer

Recovera integrates with:

- Google Gemini
- xAI
- Groq
- Vercel AI SDK

These services are used for root-cause analysis, contextual reasoning, and remediation generation.

---

### Cloud Integrations

Recovera supports AWS integrations including:

- CloudWatch
- Firehose
- IAM
- EC2/ECS/EKS
- S3

These services provide monitoring, ingestion, and infrastructure context.

---

## Folder Structure

```text
Recovera/
├── client/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── prisma/
│   └── tests/
├── docs/
└── workers/
```

---

## Safety and Governance

Recovera includes multiple safety mechanisms:

- Policy-based restrictions
- Human approval gates
- Audit logging
- Sandbox validation
- Encrypted credential storage

These protections help reduce the risk of unsafe automated actions.
