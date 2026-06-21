# ArcRadar

ArcRadar is a curated discovery and USDC support platform for projects building
on Arc Testnet. It combines an ecosystem directory, project profiles, wallet
onboarding, signal scoring, and an onchain tipping leaderboard.

## Product Scope

- Curated Arc Testnet project directory with search, categories, and profiles.
- Project signal scores derived from profile quality, social links, and indexed
  tip activity.
- Arc Testnet wallet connection, network switching, faucet access, and separate
  native-gas and ERC-20 USDC balances.
- TipRouter-based ERC-20 USDC support with verifiable onchain events.
- Project and tipper leaderboards backed by indexed contract events.
- Public project submissions with moderated publishing and secure logo uploads.
- Internal project administration and moderation routes protected by Basic Auth.
- Responsive light and dark interfaces deployed through Cloudflare Workers.

Builders can submit projects through `/submit`. New entries remain pending until
an ArcRadar moderator validates and publishes them.

## Technology

- Next.js 16 App Router and React 19
- TypeScript in strict mode
- Tailwind CSS 4
- wagmi, viem, and TanStack Query
- Solidity and Hardhat 3
- Drizzle ORM, PostgreSQL, and Cloudflare Hyperdrive
- Neon for managed PostgreSQL
- Cloudflare Workers and OpenNext for application hosting
- Neon PostgreSQL binary storage for moderated project logos

## Arc Testnet

| Setting | Value |
| --- | --- |
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Faucet | `https://faucet.circle.com` |
| ERC-20 USDC | `0x3600000000000000000000000000000000000000` |

Arc native gas is denominated in USDC with 18 decimals. ERC-20 USDC transfers
use 6 decimals. These balances are handled as separate surfaces throughout the
application.

## Local Development

Requirements:

- Node.js 22 or newer
- npm
- PostgreSQL or a Neon project

Install dependencies and create the local environment file:

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical application URL |
| `NEXT_PUBLIC_TIP_ROUTER_ADDRESS` | Public TipRouter contract address |
| `DATABASE_URL` | Local Node.js PostgreSQL runtime connection |
| `DATABASE_URL_UNPOOLED` | Direct PostgreSQL migration connection |
| `ADMIN_USERNAME` | Internal admin username |
| `ADMIN_PASSWORD` | Internal admin password, minimum 16 characters in production |
| `ARC_TESTNET_RPC_URL` | Preferred Arc Testnet RPC endpoint |
| `ARC_TESTNET_PRIVATE_KEY` | Contract administration key for local scripts only |
| `TIP_ROUTER_ADDRESS` | Server-side TipRouter address |
| `TIP_INDEXER_START_BLOCK` | TipRouter deployment block |
| `TIP_INDEXER_CONFIRMATIONS` | Required event confirmations |
| `TIP_INDEXER_BLOCK_RANGE` | Maximum blocks processed per sync batch |

Never expose database credentials, admin credentials, or private keys through a
`NEXT_PUBLIC_` variable.

Cloudflare Workers access Neon through the `HYPERDRIVE` binding in
`wrangler.jsonc`. Database URLs are used only for local development, migrations,
and trusted maintenance tasks.

## Project Data

Project records are stored in PostgreSQL and typed through the Drizzle schema.
The source import files live in `src/data/imports`.

```bash
npm run projects:audit-websites
npm run projects:import
npm run projects:check
```

The public tip interface is enabled only when a project has a curated receiving
wallet and the same project slug is registered in TipRouter.

## Smart Contracts and Indexing

```bash
npm run contracts:compile
npm run contracts:test
npm run contracts:deploy:arc
npm run contracts:smoke:tip
npm run tips:sync
```

TipRouter transfers approved ERC-20 USDC directly from the supporter to the
registered project wallet and emits `ProjectTipped` events. The indexer validates
the project slug and recipient against the curated database before recording an
event for leaderboard use.

## Quality Checks

Run the complete validation set before merging or deploying:

```bash
npm run typecheck
npm run lint
npm run contracts:test
npm run build
npm run cf:build
npm audit --omit=dev
```

## Production Deployment

1. Create a Neon project and apply the Drizzle migrations with
   `npm run db:migrate`.
2. Import and validate the curated project dataset.
3. Authenticate Wrangler with `npx wrangler login`.
4. Create the `HYPERDRIVE` binding and configure Worker secrets and variables.
5. Set `NEXT_PUBLIC_APP_URL` to the final production domain.
6. Confirm the TipRouter address and deployment block match ArcScan.
7. Configure `npm run tips:sync` as a scheduled job or external worker.
8. Deploy with `npm run deploy`.
9. Attach the custom domain in the Cloudflare Worker dashboard.
10. Verify public routes, wallet connection, Arc network switching, and admin
   authentication on the production deployment.

The complete Cloudflare checklist is in
[`docs/deployment-cloudflare.md`](docs/deployment-cloudflare.md). Additional
architecture notes are available in
[`docs/engineering.md`](docs/engineering.md), and builder-facing requirements
are documented in [`docs/builders.md`](docs/builders.md).
