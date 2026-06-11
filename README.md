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
- **Hardhat 3 + viem** for the TipRouter contract, local contract tests, and Arc
  Testnet deployment scripts.
- **TanStack Query** for wallet and transaction state.
- **Vercel Web Analytics** for privacy-friendly production page analytics.
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
NEXT_PUBLIC_TIP_ROUTER_ADDRESS=
DATABASE_URL=
DATABASE_URL_UNPOOLED=
DATABASE_POOL_MAX=5
ADMIN_USERNAME=admin
ADMIN_PASSWORD=
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
ARC_TESTNET_PRIVATE_KEY=
TIP_ROUTER_ADDRESS=
TIP_INDEXER_START_BLOCK=
TIP_INDEXER_CONFIRMATIONS=2
TIP_INDEXER_BLOCK_RANGE=50000
```

WalletConnect is optional in phase zero. Injected wallets, MetaMask, and
Coinbase Wallet are already configured.
Set `ADMIN_PASSWORD` before deploying any `/admin/*` route. In production,
ArcRadar returns `503` for admin pages until this password is configured. Use a
random value with at least 16 characters.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run db:generate
npm run db:migrate
npm run db:studio
npm run tips:sync
npm run contracts:compile
npm run contracts:test
npm run contracts:deploy:arc
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
- Richer project model with signal score, weekly tips, featured state,
  last signal, and accent metadata.
- Upgraded leaderboard with total tips, tip events, and weekly momentum.
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

## Phase Five Scope

- `TipRouter` Solidity contract added in `contracts/TipRouter.sol`.
- Tipping flow uses `approve` on Arc ERC-20 USDC, then
  `tip(projectId, recipient, amount, message)`.
- Contract transfers approved ERC-20 USDC from the tipper to the project wallet.
- Contract emits `ProjectTipped(projectId, tipper, recipient, amount, message)`
  so leaderboards can be indexed from onchain events.
- Input validation added for empty/long project IDs, zero recipient, zero
  amount, long messages, and failed USDC transfers.
- Mock USDC and Hardhat node tests added for successful tips, event indexing,
  validation reverts, and failed ERC-20 return values.
- TipRouter ABI/config exported from `src/config/tip-router.ts` for future app
  transaction UI and indexer code.

## Phase Six Scope

- TipRouter event cache added through the `tips` table and the new
  `tip_indexer_state` checkpoint table.
- `npm run tips:sync` reads `ProjectTipped` events from Arc Testnet RPC,
  resolves project slugs against curated database projects, stores event-backed
  tips, and advances the processed block checkpoint.
- First sync requires `TIP_INDEXER_START_BLOCK` so ArcRadar starts from the
  actual TipRouter deployment block instead of scanning the entire testnet.
- Leaderboard data only uses indexed TipRouter events and shows zero-state UI
  before real events exist.
- Home leaderboard upgraded with total ecosystem support, tip event count,
  unique tippers, active supported projects, top projects, top tippers, fresh
  project signals, weekly ranking, and monthly ranking.

## Phase Seven Scope

- Public builder submissions remain disabled. ArcRadar still curates projects
  internally through `/admin/projects/new`.
- `project_submissions` now stores a proposed project slug plus an optional
  link to the published `projects` row.
- `/admin/submissions` upgraded into a full moderation desk with queue counts,
  readiness checks, review notes, approve, reject, reopen, and publish actions.
- Approved candidates can be published into the public directory as real
  project profiles with generated profile scaffolding, social links,
  rank, signal score, and activity history.
- Publish actions guard against duplicate project slugs and missing Arc tip
  wallets before creating public project rows.

## Phase Eight Scope

- Social signal layer added on top of project and tip data without opening
  public project submissions.
- Signal score is shown as a derived composition of tip support, weekly
  velocity, social proof links, and profile quality.
- Hackathon mode groups projects into build tracks for agentic USDC, builder
  operations, and stablecoin operations.
- Mini activity feed turns tip messages and curation signals into a live-like
  crypto-native feed.
- Project profiles show a compact Signal DNA breakdown, project context, an
  honest disabled Tip interface, and an indexed tipper board.

## Phase Nine Scope

- Production security headers added through Next config.
- Admin auth hardened with no-store/noindex headers, best-effort failed-login
  throttling, timing-safe credential comparison, and a production password
  length guard.
- Admin server actions now have best-effort rate limits for project creation and
  moderation mutations.
- Runtime Postgres access now uses a small configurable pool with connection
  and idle timeouts for production request stability.
- TipRouter tests expanded for constructor validation, boundary-length inputs,
  missing allowance, missing balance, and failed ERC-20 transfer behavior.
- Tip indexer now rejects invalid project IDs, unknown project slugs, and events
  whose recipient does not match the curated project wallet.
- Wallet console now displays wallet/network/balance errors and a transaction
  guard for TipRouter readiness, Arc network, gas, and ERC-20 USDC balance.
- Public image upload remains disabled; future uploads must use the allowlisted
  JPG/PNG/WebP policy in `src/server/security/image-upload.ts`.
- Vercel Web Analytics is wired in the root layout.
- Builder-facing notes added at `docs/builders.md`.

## Production Deploy Checklist

1. In Vercel, set `NEXT_PUBLIC_APP_URL` to the production domain.
2. Add `DATABASE_URL` as the pooled Neon connection string.
3. Add `DATABASE_URL_UNPOOLED` for Drizzle migrations and one-off scripts.
4. Keep `DATABASE_POOL_MAX=5` unless production traffic requires tuning.
5. Set `ADMIN_USERNAME` and a strong `ADMIN_PASSWORD` with at least 16
   characters.
6. Keep `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` optional unless WalletConnect is
   needed.
7. After TipRouter deployment, set both `NEXT_PUBLIC_TIP_ROUTER_ADDRESS` and
   `TIP_ROUTER_ADDRESS`.
8. Set `TIP_INDEXER_START_BLOCK` to the deployment block before the first
   production `npm run tips:sync`.
9. Run `npm run db:migrate`, `npm run db:seed`, `npm run build`, and
   `npm run contracts:test` before production traffic.
10. Enable Vercel Web Analytics for the project.
11. Deploy to production only after confirming `/admin/*` returns `401` without
    credentials and the public home/profile pages render on Arc Testnet config.

## TipRouter Deployment Checklist

1. Fund a deployer wallet with native Arc Testnet USDC for gas.
2. Add `ARC_TESTNET_PRIVATE_KEY` to local env or Vercel deployment secrets.
3. Run `npm run contracts:test`.
4. Deploy with `npm run contracts:deploy:arc`.
5. Copy the deployed address into `NEXT_PUBLIC_TIP_ROUTER_ADDRESS`.
6. Copy the same address into `TIP_ROUTER_ADDRESS` for server-side sync jobs.
7. Set `TIP_INDEXER_START_BLOCK` to the TipRouter deployment block before the
   first `npm run tips:sync`.
8. Verify the contract address, USDC address, and first `ProjectTipped` event on
   ArcScan before enabling public tipping UI.
9. Run `npm run tips:sync` locally once, then configure the same command as a
   scheduled job or worker in production.

## Next Phases

1. Build the app-side approve/tip UI against TipRouter.
2. Add a production schedule for `npm run tips:sync`, then graduate to Goldsky,
   Envio, The Graph, or a dedicated worker if event volume grows.
3. Add signed wallet-based profile claim requests for already listed projects.
4. Add richer admin editing for published project profiles.
5. Add wallet-based public submissions only if ArcRadar later decides to open
   intake beyond internal curation.
