# Troubleshooting

## Overview

This document provides solutions for common setup, configuration, and runtime issues when working with Recovera.

---

## Application Does Not Start

### Possible Causes

- Missing dependencies
- Incorrect Node.js version
- Environment variables not configured

### Solution

Verify your setup:

```bash
node -v
npm install
```

Make sure your `.env` file exists and contains the required values.

---

## Prisma Migration Errors

### Problem

Database migrations fail or Prisma client generation does not work.

### Solution

Run:

```bash
npx prisma generate
npx prisma migrate dev
```

Also verify that PostgreSQL is running and `DATABASE_URL` is configured correctly.

---

## Redis Connection Issues

### Problem

Background workers fail to start or queues are not processing.

### Solution

Make sure Redis is installed and running locally.

Example check:

```bash
redis-cli ping
```

Expected output:

```text
PONG
```

---

## GitHub Authentication Issues

### Problem

GitHub login or repository access fails.

### Solution

Verify:

- `GITHUB_ID`
- `GITHUB_SECRET`
- GitHub OAuth callback configuration

Make sure the OAuth application settings match your local environment.

---

## AI Provider Errors

### Problem

AI analysis or remediation generation does not work.

### Solution

Verify your API keys:

- `GEMINI_API_KEY`
- Other configured provider credentials

You can also enable mock mode during development:

```env
AGENT_MOCK=true
```

---

## Environment Variable Problems

### Problem

The application reports missing configuration values.

### Solution

Check that:

- `.env` exists
- Required variables are configured
- No values are left empty

Refer to `.env.example` for guidance.

---

## Build or Dependency Issues

### Problem

The project fails to build or dependencies conflict.

### Solution

Remove existing dependencies and reinstall:

```bash
rm -rf node_modules
npm install
```

---

## Port Already In Use

### Problem

The development server cannot start because the port is occupied.

### Solution

Stop the running process or change the application port.

Example:

```bash
npm run dev -- --port 3001
```

---

## Recommended Debugging Steps

When troubleshooting issues:

1. Verify environment variables
2. Check database connectivity
3. Confirm Redis is running
4. Inspect application logs
5. Reinstall dependencies if necessary
6. Review recent configuration changes
