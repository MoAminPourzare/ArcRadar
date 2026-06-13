import { arcContracts } from "@/config/arc";

const configuredTipRouterAddress = process.env.NEXT_PUBLIC_TIP_ROUTER_ADDRESS;

export const tipRouterAddress =
  configuredTipRouterAddress &&
  /^0x[a-fA-F0-9]{40}$/.test(configuredTipRouterAddress)
    ? (configuredTipRouterAddress as `0x${string}`)
    : undefined;

export const tipRouterConfig = {
  address: tipRouterAddress,
  messageMaxLength: 280,
  projectIdMaxLength: 96,
  usdc: arcContracts.usdc,
  usdcDecimals: 6,
} as const;

export const tipRouterAbi = [
  {
    inputs: [],
    name: "AmountMustBePositive",
    type: "error",
  },
  {
    inputs: [],
    name: "MessageTooLong",
    type: "error",
  },
  {
    inputs: [],
    name: "ProjectNotRegistered",
    type: "error",
  },
  {
    inputs: [],
    name: "UsdcTransferFailed",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "projectId", type: "string" },
      { indexed: true, name: "tipper", type: "address" },
      { indexed: true, name: "recipient", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "message", type: "string" },
    ],
    name: "ProjectTipped",
    type: "event",
  },
  {
    inputs: [{ name: "projectId", type: "string" }],
    name: "getProjectRecipient",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "projectId", type: "string" },
      { name: "amount", type: "uint256" },
      { name: "message", type: "string" },
    ],
    name: "tip",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
