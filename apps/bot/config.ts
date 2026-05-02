export const config = {
  wingmanName: "KUPI",
  ai: {
    model: "gpt-4o-mini" as const,
    visionModel: "gpt-4o-mini" as const,
    maxTokens: 1000,
  },
  trial: {
    daysAllowed: 7,
    warningDaysBeforeEnd: 2,
  },
  tokenLimitDefault: 2_000_000,
} as const;
