# Railway Deployment

## Web service

Railway service settings:

- Root Directory: `/apps/web`
- Build Command: `npm run build`
- Start Command: `npm run start -- -H 0.0.0.0 -p $PORT`

This app uses `output: "standalone"` in `next.config.ts`, which is the recommended production output for Railway.

## Variables

Add these on the web service:

```bash
AZLA_API_URL=https://your-api-service.up.railway.app/api
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

`AZLA_API_URL` is used by the current Next API proxy routes. `DATABASE_URL` is ready for PostgreSQL, but the current UI still needs a real persistence layer before POS sales, distribution orders, and products are stored in the database.

## PostgreSQL

In the Railway project:

1. Click `+ New`.
2. Select `Database`.
3. Select `PostgreSQL`.
4. Open the web service variables.
5. Add a reference variable for `DATABASE_URL` from the Postgres service.

## Public URL

Open the web service:

1. Go to `Settings`.
2. Open `Networking`.
3. Click `Generate Domain`.

## Next backend step

To make the product fully database-backed, add a schema and migrations for:

- companies
- branches
- products
- stock
- retail sales
- receipt items
- shifts
- distributor stores
- distributor products
- offers
- distributor orders
- campaigns
- aggregated demand signals
