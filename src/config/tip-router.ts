import { arcContracts } from "@/config/arc";

const configuredTipRouterAddress = process.env.NEXT_PUBLIC_TIP_ROUTER_ADDRESS;

export const tipRouterAddress =
  configuredTipRouterAddress &&
  /^0x[a-fA-F0-9]{40}$/.test(configuredTipRouterAddress)
    ? (configuredTipRouterAddress as `0x${string}`)
    : undefined;

export const tipRouterConfig = {
  address: tipRouterAddress,
  projectIdMaxLength: 96,
  messageMaxLength: 280,
  usdc: arcContracts.usdc,
  usdcDecimals: 6,
} as const;

export const tipRouterAbi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "usdcAddress",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AmountMustBePositive",
    type: "error",
  },
  {
    inputs: [],
    name: "EmptyProjectId",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidRecipient",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidUsdc",
    type: "error",
  },
  {
    inputs: [],
    name: "MessageTooLong",
    type: "error",
  },
  {
    inputs: [],
    name: "ProjectIdTooLong",
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
      {
        indexed: false,
        internalType: "string",
        name: "projectId",
        type: "string",
      },
      {
        indexed: false,
        internalType: "address",
        name: "tipper",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "message",
        type: "string",
      },
    ],
    name: "ProjectTipped",
    type: "event",
  },
  {
    inputs: [],
    name: "MAX_MESSAGE_LENGTH",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_PROJECT_ID_LENGTH",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "projectId",
        type: "string",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "message",
        type: "string",
      },
    ],
    name: "tip",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "usdc",
    outputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
