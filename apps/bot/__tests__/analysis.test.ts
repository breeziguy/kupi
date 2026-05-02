import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("../ai/client.js", () => ({
  openai: { chat: { completions: { create: mockCreate } } },
}));

const { analyzeConversation } = await import("../ai/analysis.js");

describe("analyzeConversation", () => {
  beforeEach(() => mockCreate.mockReset());

  it("returns interest, compatibility, red and green flags", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              interestLevel: 75,
              compatibilityScore: 68,
              redFlags: ["Limited emotional depth"],
              greenFlags: ["Openness about personal matters"],
            }),
          },
        },
      ],
      usage: { total_tokens: 400 },
    });

    const result = await analyzeConversation({
      personName: "Lisa",
      messages: [{ sender: "them", text: "I love long walks" }],
    });

    expect(result.interestLevel).toBe(75);
    expect(result.compatibilityScore).toBe(68);
    expect(result.redFlags).toHaveLength(1);
    expect(result.greenFlags).toHaveLength(1);
    expect(result.tokensUsed).toBe(400);
  });

  it("returns defaults on missing fields", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "{}" } }],
      usage: { total_tokens: 50 },
    });

    const result = await analyzeConversation({ personName: "X", messages: [] });
    expect(result.interestLevel).toBe(50);
    expect(result.compatibilityScore).toBe(50);
    expect(result.redFlags).toEqual([]);
    expect(result.greenFlags).toEqual([]);
  });
});
