import { spawnSync } from "node:child_process";

import { loadLocalEnv } from "../src/server/env/load-local-env";

const supportedCommands = ["deploy", "preview", "upload"] as const;
type CloudflareCommand = (typeof supportedCommands)[number];

const command = process.argv[2] as CloudflareCommand | undefined;
const skipBuild = process.argv.includes("--skip-build");

if (!command || !supportedCommands.includes(command)) {
  throw new Error(
    `Expected one of: ${supportedCommands.join(", ")}.`,
  );
}

loadLocalEnv();

const localDatabaseUrl =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (localDatabaseUrl) {
  process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE ??=
    localDatabaseUrl;
} else if (command !== "preview") {
  process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE ??=
    "postgresql://local:local@127.0.0.1:5432/arcradar";
}

if (!skipBuild) {
  run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "cf:build"]);
}

const openNextArguments = ["opennextjs-cloudflare", command];

if (command !== "preview") {
  openNextArguments.push("--", "--keep-vars");
}

run(process.platform === "win32" ? "npx.cmd" : "npx", openNextArguments);

function run(executable: string, arguments_: string[]) {
  const result = spawnSync(executable, arguments_, {
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
