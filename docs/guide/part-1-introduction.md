# Part 1: Introduction & Overview

Welcome to the Recovera Documentation Guide. This 6-part series explains exactly how Recovera works, component by component, with detailed examples.

## What is Recovera?
Recovera is an AI-assisted Site Reliability Engineering (SRE) platform. It bridges the gap between production anomalies and resolution by automating root-cause analysis (RCA) and remediation safely.

### Example Scenario
Imagine you have an e-commerce platform. Suddenly, checkout starts failing. 
- **Without Recovera**: On-call engineers scramble, checking logs, tracing recent commits, and figuring out what broke.
- **With Recovera**: Recovera instantly detects the error rate spike, correlates it with a recent deployment, uses AI to analyze the stack trace, and opens a Pull Request with the fix.

## The 6-Part Guide
1. **Part 1: Introduction & Overview** (You are here)
2. **Part 2: Architecture & Foundation**: How AWS, Next.js, and Redis work together.
3. **Part 3: Ingestion & Anomaly Detection**: How logs stream in and anomalies are flagged.
4. **Part 4: AI Root Cause Analysis**: How Gemini/xAI analyze the logs.
5. **Part 5: Remediation & Safety**: How patches are generated and gated by policies.
6. **Part 6: Adding Custom Integrations**: Extending the platform.
