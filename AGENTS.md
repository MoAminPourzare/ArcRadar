# ArcRadar Engineering Notes

- Use Next.js App Router conventions.
- Keep blockchain integration in `src/config`, `src/wallet`, and focused client
  components.
- Treat Arc Testnet as the only supported network until mainnet requirements are
  explicitly added.
- Keep project data typed through `src/types/project.ts` and future database
  records typed through Drizzle schema.
- Never assume native USDC gas decimals are the same surface as ERC-20 USDC
  transfers.
