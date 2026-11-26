# Migrations before a push or promotion

**Read migration integration settings and record them with the read date.** The release doc must say which case applies:

- **The push applies nothing to the database.** Production's database remains untouched without warning. Calling a missing database function produces a `500` on every affected page.
- **The push also applies migrations.** This happens when the database provider's git integration deploys on push to the production branch. On Supabase, its GitHub integration with *Deploy to production* on applies new migration files when that branch is pushed or merged (Supabase's docs, read `2026-10-25`). The build and the migration run then start together with nothing ordering them, and the provider takes every file in the migrations directory.

**Unread means on.** Read the provider dashboard's integration settings and the production branch's provider commit checks. On Supabase, check the project's GitHub integration, its production branch and *Deploy to production*.

**Apply pending migrations by CLI before pushing after the owner's go.** Before the go, read production's ledger and dry-run pending migrations. After the go, apply them before the push and reread the ledger, leaving nothing pending to race the build. Keep files you do not intend to run out of the migrations directory.

**Reach production through its connection string only.** Keep the CLI unlinked for both environments. Reach production through `--db-url` on the Supabase CLI; use development's own connection string for development. Avoid `db push --linked --project-ref <production ref>`: precedence is not reliable across versions. A dummy-ref probe used the typed ref for its first request (Supabase CLI 2.122.0, read `2026-10-25`). A connection string names one database across versions. Apply `supabase-production` for the ledger and `environments` for the window where deployed code meets the new schema.
