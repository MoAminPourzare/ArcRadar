import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const envPath = resolve(process.cwd(), ".env.local");
const envContents = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
const existingPrivateKey = readEnvValue(
  envContents,
  "TIP_DEMO_RECIPIENT_PRIVATE_KEY",
);
const privateKey =
  existingPrivateKey && /^0x[a-fA-F0-9]{64}$/.test(existingPrivateKey)
    ? (existingPrivateKey as `0x${string}`)
    : generatePrivateKey();
const account = privateKeyToAccount(privateKey);
const nextContents = setEnvValue(
  setEnvValue(envContents, "TIP_DEMO_RECIPIENT_PRIVATE_KEY", privateKey),
  "TIP_DEMO_RECIPIENT_ADDRESS",
  account.address,
);

writeFileSync(envPath, nextContents, "utf8");

console.log(
  JSON.stringify(
    {
      address: account.address,
      envPath,
      privateKeyStored: true,
    },
    null,
    2,
  ),
);

function readEnvValue(contents: string, key: string) {
  const line = contents
    .split(/\r?\n/)
    .find((candidate) => candidate.startsWith(`${key}=`));

  return line?.slice(key.length + 1).replace(/^"|"$/g, "");
}

function setEnvValue(contents: string, key: string, value: string) {
  const lines = contents.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith(`${key}=`));

  if (index >= 0) {
    lines[index] = `${key}=${value}`;
  } else {
    const insertionIndex = lines.at(-1) === "" ? lines.length - 1 : lines.length;
    lines.splice(insertionIndex, 0, `${key}=${value}`);
  }

  return `${lines.filter((line, lineIndex) => line || lineIndex < lines.length - 1).join("\n")}\n`;
}
