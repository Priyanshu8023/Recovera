# Installation Guide

## Prerequisites

Before running Recovera locally, make sure you have:

- Node.js v18 or higher
- PostgreSQL v14+
- Redis
- AWS account with IAM permissions

---

## Clone the Repository

```bash
git clone https://github.com/Priyanshu8023/Recovera.git
cd Recovera/client
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Then update the `.env` file with your own credentials and API keys.

---

## Database Setup

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

---

## Start the Development Server

```bash
npm run dev
```

The application should now be running locally.

---

## Required Environment Variables

Some important environment variables include:

- `DATABASE_URL`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_KEY`
- `GEMINI_API_KEY`

Refer to `.env.example` for the full configuration.
