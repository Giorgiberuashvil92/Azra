require("dotenv").config();

const crypto = require("node:crypto");
const fs = require("node:fs");
const { Client } = require("pg");

async function main() {
  const migrationName = "20260905093000_add_discounts";
  const sql = fs.readFileSync(`prisma/migrations/${migrationName}/migration.sql`, "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  await client.connect();
  try {
    await client.query(sql);
  } catch (error) {
    if (!String(error.message).includes("already exists")) throw error;
  }

  await client.query(
    `INSERT INTO "_prisma_migrations"
      (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
     VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)
     ON CONFLICT DO NOTHING`,
    [
      "20260905093000_discounts",
      crypto.createHash("sha256").update(sql).digest("hex"),
      migrationName,
    ],
  );
  await client.end();
  console.log("discounts migration applied");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
