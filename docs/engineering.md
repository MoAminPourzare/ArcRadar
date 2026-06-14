# Engineering Notes

## Application Boundaries

- Use Next.js App Router conventions for routes, metadata, and server actions.
- Keep Arc chain configuration in `src/config`.
- Keep wallet configuration and token helpers in `src/wallet`.
- Keep transaction interfaces in focused client components.
- Treat Arc Testnet as the only supported network until mainnet requirements are
  explicitly defined.

## Data Model

- Public project records are curated and stored in PostgreSQL.
- Project domain types live in `src/types/project.ts`.
- Database records are defined through the Drizzle schema in
  `src/server/db/schema.ts`.
- Public submissions remain disabled; project creation and moderation are
  internal administrative workflows.

## USDC Handling

- Native Arc gas uses USDC with 18 decimals.
- ERC-20 USDC transfers use 6 decimals.
- Never reuse native balance formatting for ERC-20 tip amounts.
- Only TipRouter events for known project slugs and matching recipients may be
  indexed.

## Security

- Private keys, database URLs, and admin credentials must remain server-only.
- Production admin routes require a strong password and return no-store and
  noindex headers.
- Public image upload remains disabled until managed storage, MIME validation,
  size limits, and safe object paths are configured.
- External project URLs are curated data and must be validated before import.

## Cloudflare Runtime

- Production runs as a Cloudflare Worker through the OpenNext adapter.
- Runtime PostgreSQL access uses a request-scoped Drizzle client through the
  `HYPERDRIVE` binding and a dedicated Neon application role.
- Database migrations, seed operations, contract administration, and event
  indexing remain trusted Node.js tasks outside the public Worker.
- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, and `ARC_TESTNET_PRIVATE_KEY` must
  never be configured as Worker variables or secrets.
- Static assets are served by Cloudflare and receive explicit immutable or
  seven-day cache headers depending on their path.
