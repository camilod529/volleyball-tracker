# Volleyball Tracker — Sync API

A small NestJS API that the [Volleyball Tracker app](../README.md) talks to for manual two-way cloud sync. Production database is MySQL on Hostinger; this API is meant to run on a managed Node host (Railway/Render) since Hostinger's shared hosting can't run a persistent Node process. See [`../docs/SYNC_PROTOCOL.md`](../docs/SYNC_PROTOCOL.md) for the actual push/pull contract this implements.

## What this does (and doesn't) do

- Two endpoints: `POST /sync/push` (client sends its changed rows) and `GET /sync/pull?since=` (client asks for what changed on the server). Both require an `X-API-Key` header — one shared static key, no per-user login.
- Conflict rule is last-write-wins by `updatedAt`. No real-time/automatic sync — the app only calls this when the user taps "Sync Now".
- No auth system, no rate limiting, no multi-tenancy — this is a small personal-scale API, not a public product. Don't expose the API key or point this at data you don't want mutually visible to everyone holding that key.

## Local development

Requires Docker (for a disposable local MySQL — **not** the production Hostinger database) and Node 20+.

```bash
npm install
docker compose up -d          # starts local MySQL on localhost:3306
cp .env.example .env          # then edit the DB_* vars to point at the local Docker DB, set any API_KEY
npm run db:migrate            # applies src/db/migrations against it
npm run start:dev             # http://localhost:3000, restarts on file changes
```

`.env` for local dev, matching `docker-compose.yml`'s defaults:

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=volleyball
DB_PASSWORD=volleyball
DB_NAME=volleyball_tracker
API_KEY=local-dev-test-key
PORT=3000
```

Quick manual check once it's running:

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/sync/push -H "X-API-Key: local-dev-test-key" -H "Content-Type: application/json" -d '{"teams":[],"players":[],"matches":[],"sets":[],"actionEvents":[]}'
curl http://localhost:3000/sync/pull -H "X-API-Key: local-dev-test-key"
```

`docker compose down` stops the local database; add `-v` to also wipe its data volume.

## Testing

```bash
npm test
```

Covers the auth guard and the last-write-wins merge decision (`shouldWriteIncomingRow` in `src/sync/sync.merge.ts`) as pure/mocked unit tests — no database needed. The actual DB-touching push/pull wiring is thin by design; verify it against the local Docker MySQL with the curl commands above (or `npm run start:dev` + Postman/Insomnia) after any change to `sync.service.ts`.

## Deploying

### 1. Enable remote access on the Hostinger MySQL database

By default Hostinger's MySQL only accepts connections from within its own network. In hPanel: **Databases → MySQL Databases → Remote MySQL**, add the IP address(es) your API host will connect from (Railway/Render publish their outbound IPs, or use `%` to allow any IP if your database user's password is strong — narrower is better if the host's IP is stable). hPanel shows you the host, port, database name, username, and password directly — that's exactly `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` below, no need to assemble a connection string by hand (and no risk of a password with special characters breaking one).

### 2. Deploy the API (Railway)

1. Push this repo (or just the `server/` folder, depending on how you set up the Railway project) to GitHub.
2. In Railway: New Project → Deploy from GitHub repo, pointing at this `server/` directory as the root.
3. In Railway's **Variables** tab, add each of these individually (copy-paste straight from hPanel — no URL to construct): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, plus `API_KEY` (generate one: `openssl rand -hex 32`). Railway sets `PORT` itself.
4. Railway builds with `npm run build` and starts with `npm run start:prod` (Nest's defaults) — no extra config needed for a standard Node buildpack.
5. Once deployed, run `npm run db:migrate` **once** against production to create the tables — either locally with your `.env` temporarily pointed at production, or as a one-off Railway command/shell.
6. Confirm with `curl https://<your-railway-url>/health`.

(Render works the same way — connect the repo, set the same env vars, build command `npm run build`, start command `npm run start:prod`. A single `DATABASE_URL` also still works instead of the `DB_*` vars, if you ever point this at a host that hands you one directly — see `.env.example`.)

### 3. Point the app at it

In the Volleyball Tracker app's Settings → Cloud Sync, enter the deployed API's base URL and the `API_KEY` you generated.

## Environment variables

See [`.env.example`](./.env.example).
