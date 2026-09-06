/** Minimal ERC-8183 commerce + policy surfaces for read-only indexing. */
export const commerceAbi = [
  {
    type: "function",
    name: "getJob",
    stateMutability: "view",
    inputs: [{ name: "jobId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "client", type: "address" },
          { name: "provider", type: "address" },
          { name: "evaluator", type: "address" },
          { name: "description", type: "string" },
          { name: "budget", type: "uint256" },
          { name: "expiredAt", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "hook", type: "address" },
          { name: "submittedAt", type: "uint256" },
          { name: "deliverable", type: "bytes32" },
        ],
      },
    ],
  },
] as const;

export const policyEvents = [
  {
    type: "event",
    name: "JobInitialised",
    inputs: [
      { name: "jobId", type: "uint256", indexed: true },
      { name: "deliverable", type: "bytes32", indexed: false },
      { name: "submittedAt", type: "uint64", indexed: false },
      { name: "optParams", type: "bytes", indexed: false },
    ],
  },
] as const;

export const JOB_STATUS = [
  "OPEN",
  "FUNDED",
  "SUBMITTED",
  "COMPLETED",
  "REJECTED",
  "EXPIRED",
] as const;
