# Cloudflare Workers Deployment

ArcRadar is deployed as a full-stack Next.js application on Cloudflare Workers
using the OpenNext adapter. Neon remains the production PostgreSQL provider.
Production builds use Next.js Webpack output because it is currently the more
predictable OpenNext artifact across local Windows verification and Linux CI.

## Prerequisites

- A verified Cloudflare account with Workers enabled
- Access to the ArcRadar GitHub repository
- A working Neon production branch
- Node.js 22 or newer

## Local Verification

Install dependencies and run the standard and Worker-specific builds:

```bash
npm install
npm run typecheck
npm run lint
npm run contracts:test
npm run build
npm run cf:build
npx wrangler deploy --dry-run
```

Use `npm run preview` to run the generated application in the local Workers
runtime. The command maps the ignored `.env.local` database URL to the local
Hyperdrive emulator without printing or committing it.

## Authenticate Wrangler

```bash
npx wrangler login
npx wrangler whoami
```

The login command opens Cloudflare's authorization page. Approve Wrangler for
the account that will own the ArcRadar Worker.

## Runtime Variables

Public runtime values are versioned under `vars` in `wrangler.jsonc`. Configure
only the password under **Workers & Pages > arcradar > Settings > Variables and
Secrets** after the first deployment.

| Name | Type | Production value |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Secret | Strong password with at least 16 characters |

`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TIP_ROUTER_ADDRESS`,
`ARC_TESTNET_RPC_URL`, `TIP_ROUTER_ADDRESS`, and `ADMIN_USERNAME` are committed
as non-sensitive Worker variables. Update `NEXT_PUBLIC_APP_URL` when the custom
domain becomes canonical.

Do not configure `DATABASE_URL`, `DATABASE_URL_UNPOOLED`,
`ARC_TESTNET_PRIVATE_KEY`, or `TIP_DEMO_RECIPIENT_PRIVATE_KEY` in Cloudflare.
They belong only in trusted local or CI environments. Production database
access is granted through the `HYPERDRIVE` binding in `wrangler.jsonc`.

When using Cloudflare Git builds, add `NEXT_PUBLIC_APP_URL` and
`NEXT_PUBLIC_TIP_ROUTER_ADDRESS` under **Settings > Builds > Variables and
secrets**. Next.js needs those public values during compilation.

## First Deployment

Project logos are stored in the existing Neon database and served through
`/api/project-logos/:key`; no separate object-storage account is required.

```bash
npm run deploy
```

Wrangler creates the `arcradar` Worker and provides a `workers.dev` URL. Add the
runtime variables and secrets, then deploy once more so the live Worker receives
the complete configuration.

Verify these endpoints before attaching a domain:

- `/api/health`
- `/`
- `/projects`
- `/submit`
- `/api/project-logos/:key`
- `/leaderboard`
- `/network`
- `/wallet`
- `/admin/submissions`

## GitHub Deployments

In the Cloudflare dashboard, open the Worker and connect the GitHub repository
under **Settings > Builds**.

Use these settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | Repository root |
| Build command | `npm run cf:build` |
| Deploy command | `npm run deploy:built` |
| Non-production branch deploys | Enabled only when preview deployments are needed |

The deployment wrapper preserves dashboard secrets, uses the already generated
OpenNext artifact, and provides only the local placeholder Hyperdrive requires
while preparing an upload. Production traffic still uses the bound Hyperdrive
configuration.

## Custom Domain

1. Add the purchased domain to Cloudflare under **Websites**.
2. Replace the registrar nameservers with the two nameservers Cloudflare shows.
3. Wait until the zone status becomes **Active**.
4. Open **Workers & Pages > arcradar > Settings > Domains & Routes**.
5. Choose **Add > Custom Domain** and enter the preferred hostname.
6. Add the alternate hostname and redirect it to the canonical hostname.
7. Change `NEXT_PUBLIC_APP_URL` in both runtime and build variables.
8. Deploy again and confirm metadata, sitemap, wallet flows, and admin access.

Cloudflare provisions and renews the TLS certificate automatically once the
domain is active on its nameservers.

## Production Checks

- Confirm `/api/health` returns HTTP 200.
- Confirm Neon-backed pages load without connection errors.
- Test wallet connect, Arc Testnet switching, faucet navigation, and balances.
- Test a real Arc Testnet tip only after the project wallet is curated and its
  slug is registered in TipRouter.
- Confirm `/admin/*` prompts for Basic Auth and is not indexed.
- Review Worker logs and errors after the first public traffic.
- Keep `npm run tips:sync` on a trusted scheduler; it is not executed by the web
  Worker automatically.
