import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("../ai/client.js", () => ({
  openai: { chat: { completions: { create: mockCreate } } },
}));

const { generateWrap } = await import("../ai/wrap.js");

describe("generateWrap", () => {
  beforeEach(() => mockCreate.mockReset());

  it("returns summary, verdict and tokensUsed", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              summary: "Lisa is vibing with you.",
              verdict: "Ask her out.",
            }),
          },
        },
      ],
      usage: { total_tokens: 300 },
    });

    const result = await generateWrap({
      personName: "Lisa",
      interestLevel: 75,
      compatibilityScore: 68,
      redFlagsCount: 1,
      greenFlagsCount: 3,
      messageCount: 24,
    });

    expect(result.summary).toContain("Lisa");
    expect(result.verdict).toBe("Ask her out.");
    expect(result.tokensUsed).toBe(300);
  });

  it("returns empty strings on missing fields", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "{}" } }],
      usage: { total_tokens: 50 },
    });

    const result = await generateWrap({
      personName: "X",
      interestLevel: 50,
      compatibilityScore: 50,
      redFlagsCount: 0,
      greenFlagsCount: 0,
      messageCount: 0,
    });

    expect(result.summary).toBe("");
    expect(result.verdict).toBe("");
  });
});
