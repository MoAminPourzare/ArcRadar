# ArcRadar

ArcRadar is a curated discovery and tipping hub for builders shipping on Arc
Testnet. The first product surface is a high-signal directory for Arc projects,
network onboarding, wallet connection, and the foundation for USDC tipping.

## Stack

- **Next.js 16 App Router** for Vercel-native routing, server components, and
  production deployment.
- **TypeScript strict mode** for safer product and smart-contract integration.
- **Tailwind CSS v4** for a fast, custom interface system.
- **wagmi + viem** for EVM wallet connection, Arc Testnet config, and future
  USDC transactions.
- **TanStack Query** for wallet and transaction state.
- **Drizzle ORM + Postgres** for typed relational data without locking the app
  to one managed provider. Neon Postgres is the preferred deployment target for
  Vercel, while Supabase remains a viable option if auth/storage/realtime become
  first-class needs.

## Arc Testnet

```txt
Network: Arc Testnet
Chain ID: 5042002
RPC: https://rpc.testnet.arc.network
Explorer: https://testnet.arcscan.app
Faucet: https://faucet.circle.com
ERC-20 USDC: 0x3600000000000000000000000000000000000000
```

Arc uses native USDC for gas. ERC-20 USDC on Arc Testnet uses the official USDC
contract interface and should be treated separately from native gas balance
decimals when implementing tips.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Create `.env.local` from `.env.example` when adding deployment settings.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
DATABASE_URL=
DATABASE_URL_UNPOOLED=
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
```

WalletConnect is optional in phase zero. Injected wallets, MetaMask, and
Coinbase Wallet are already configured.
Set `ADMIN_PASSWORD` before deploying any `/admin/*` route. In production,
ArcRadar returns `503` for admin pages until this password is configured.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Phase Zero Scope

- Next.js/Vercel app foundation.
- Arc Testnet chain constants and official links.
- Wallet provider architecture.
- Curated project seed data.
- Initial home surface with project cards, network onboarding, and leaderboard.
- Typed Postgres schema for projects and future onchain tip indexing.

## Phase One Scope

- Product identity system for ArcRadar as an Arc ecosystem command center.
- Data-backed radar visual for project signal and ranking.
- Searchable, filterable, sortable project directory.
- Richer project model with stage, signal score, weekly tips, featured state,
  last signal, and accent metadata.
- Upgraded leaderboard with total tips, supporters, and weekly momentum.
- Stronger Arc Testnet onboarding strip for chain, gas, RPC, finality, faucet,
  explorer, and ERC-20 USDC reference.
- Footer and navigation aligned with the product information architecture.

## Phase Two Scope

- Project repository layer in `src/server/projects/repository.ts` so UI reads
  through a replaceable data access boundary instead of importing seed data
  directly.
- Static project profile pages at `/projects/[slug]` with metadata, roadmap,
  curation notes, activity, related projects, tip wallet, and explorer links.
- Rich project profiles in seed data for problem, solution, why Arc, ideal user,
  roadmap, curation notes, and activity.
- Internal curation intake with local validation, readiness checks, and a
  candidate packet preview.
- Database schema expanded for project profiles, activity, and future
  `project_submissions` moderation queue.
- Header navigation updated to work across home, detail, and submit routes.

## Database Activation Checklist

Phase two is database-ready, but not database-connected in production because it
needs a real `DATABASE_URL`.

1. Create a Neon Postgres project.
2. Add the connection string to `.env.local` and Vercel as `DATABASE_URL`.
3. Run `npm run db:generate`.
4. Run `npm run db:migrate`.
5. Replace the seed-backed repository with Drizzle queries.
6. Use `/admin/projects/new` to insert internal candidates into
   `project_submissions`.

## Phase Three Scope

- Neon Postgres configured through `.env.local` with pooled runtime and
  unpooled migration connection strings.
- Drizzle migrations generated and applied to Neon.
- Seed script added at `npm run db:seed` and used to upsert the current six
  ArcRadar projects into Neon.
- Project repository upgraded to read from Neon when available, with seed data
  fallback for local/offline safety.
- Internal candidate form wired to a server action that persists validated
  entries into `project_submissions`.
- Admin preview queue added at `/admin/submissions`.
- Home and project profile pages marked dynamic so production builds do not
  depend on build-time database queries.
- Project profile pages completed with builder notes, latest tips, per-project
  supporter leaderboard, tip wallet, metrics, roadmap, activity, and related
  projects.
- Public `/submit` removed. Project intake is internal-only at
  `/admin/projects/new` because ArcRadar curates projects itself.

## Phase Four Scope

- Wallet console added to the home surface at `/#wallet`.
- Connector picker for injected wallets, MetaMask, Coinbase Wallet, and optional
  WalletConnect.
- Arc Testnet switch action wired through wagmi.
- Live native USDC gas balance read with 18 decimals.
- Live ERC-20 USDC balance read from
  `0x3600000000000000000000000000000000000000` with 6 decimals.
- Readiness checklist for wallet connection, Arc network, gas funding, and tip
  balance.
- Faucet, explorer, docs, refresh, copy-address, and disconnect actions.
- Header navigation updated with a direct Wallet entry.
- Production admin routes protected by a basic auth guard driven by
  `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## Next Phases

1. Add authentication and approve/reject actions for the admin queue.
2. Convert approved submissions into public project profiles.
3. Deploy `TipRouter` smart contract and index `ProjectTipped` events.
4. Build weekly/monthly leaderboards and builder verification.
5. Add admin-only project publishing workflow from the database.
