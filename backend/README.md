# AZLA API

NestJS backend for AZLA ERP.

## Local Database

From the repository root:

```bash
docker compose up -d postgres
```

Then from `apps/api`:

```bash
cp .env.example .env
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Demo login:

```text
admin@azla.ge
admin123
```
