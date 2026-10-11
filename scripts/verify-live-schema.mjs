import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import postgres from "postgres";

const envPath = resolve(process.cwd(), ".env.local");

for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([^#][^=]+)=(.*)$/);

  if (!match) {
    continue;
  }

  const name = match[1].trim();
  let value = match[2].trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  process.env[name] = value;
}

const expectedTables = [
  "profiles",
  "knowledge_sources",
  "source_contents",
  "source_chunks",
  "chunk_embeddings",
  "ingestion_jobs",
  "collections",
  "collection_sources",
  "tags",
  "source_tags",
  "chat_threads",
  "chat_messages",
  "retrieval_runs",
  "retrieval_results",
  "answer_citations",
];

const expectedColumns = {
  collections: ["image_url"],
};

if (!process.env.DATABASE_URL) {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: "require",
});

try {
  const tables = await sql`
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename = any(${expectedTables}::text[])
    order by tablename
  `;

  const extension = await sql`
    select extname
    from pg_extension
    where extname = 'vector'
  `;

  const rls = await sql`
    select relname, relrowsecurity
    from pg_class
    join pg_namespace on pg_namespace.oid = pg_class.relnamespace
    where nspname = 'public'
      and relname = any(${expectedTables}::text[])
    order by relname
  `;

  const policies = await sql`
    select tablename, count(*)::int as count
    from pg_policies
    where schemaname = 'public'
      and tablename = any(${expectedTables}::text[])
    group by tablename
    order by tablename
  `;

  const indexes = await sql`
    select count(*)::int as count
    from pg_indexes
    where schemaname = 'public'
      and tablename = any(${expectedTables}::text[])
  `;

  const constraints = await sql`
    select contype, count(*)::int as count
    from pg_constraint
    join pg_namespace on pg_namespace.oid = pg_constraint.connamespace
    where nspname = 'public'
    group by contype
    order by contype
  `;

  const requiredColumnTables = Object.keys(expectedColumns);
  const columns = await sql`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = any(${requiredColumnTables}::text[])
    order by table_name, column_name
  `;

  const tableNames = new Set(tables.map((table) => table.tablename));
  const missingTables = expectedTables.filter(
    (table) => !tableNames.has(table),
  );
  const liveColumns = new Set(
    columns.map((column) => `${column.table_name}.${column.column_name}`),
  );
  const missingRequiredColumns = Object.entries(expectedColumns)
    .flatMap(([tableName, columnNames]) =>
      columnNames.map((columnName) => `${tableName}.${columnName}`),
    )
    .filter((columnName) => !liveColumns.has(columnName));
  const tablesWithoutRls = rls
    .filter((table) => !table.relrowsecurity)
    .map((table) => table.relname);

  const summary = {
    expectedTables: expectedTables.length,
    liveTables: tables.length,
    missingTables,
    missingRequiredColumns,
    vectorExtension: extension.length === 1,
    tablesWithoutRls,
    policyTables: policies.length,
    policyCount: policies.reduce((count, policy) => count + policy.count, 0),
    indexCount: indexes[0]?.count ?? 0,
    constraints: Object.fromEntries(
      constraints.map((constraint) => [constraint.contype, constraint.count]),
    ),
  };

  console.log(JSON.stringify(summary, null, 2));

  if (
    missingTables.length > 0 ||
    missingRequiredColumns.length > 0 ||
    !summary.vectorExtension ||
    tablesWithoutRls.length > 0 ||
    summary.policyTables !== expectedTables.length
  ) {
    process.exitCode = 1;
  }
} finally {
  await sql.end();
}
