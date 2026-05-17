# demo-app

A tiny Express + Postgres + React user management demo used as a fixture for
PR Party end-to-end testing.

## Stack
- Node 20, TypeScript 5
- Express 4, `pg` for Postgres
- React 18 on the client
- Jest + Supertest for tests

## Scripts
```bash
npm install
npm run dev      # backend on :8080
npm run client   # frontend on :3000
npm test
```

## Endpoints
- `POST /api/auth/login` — email + password, returns JWT
- `GET  /api/users/:id` — fetch single user
- `GET  /api/users`     — list users (paginated)

See `openapi.yaml` for the full spec.
