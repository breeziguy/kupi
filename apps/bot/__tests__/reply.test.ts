import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("../ai/client.js", () => ({
  openai: { chat: { completions: { create: mockCreate } } },
}));

const { generateReplies } = await import("../ai/reply.js");

describe("generateReplies", () => {
  beforeEach(() => mockCreate.mockReset());

  it("returns 3 reply suggestions and tokensUsed", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              replies: ["Reply 1", "Reply 2", "Reply 3"],
            }),
          },
        },
      ],
      usage: { total_tokens: 350 },
    });

    const result = await generateReplies({
      userName: "Jake",
      userGender: "male",
      personName: "Lisa",
      recentMessages: [{ sender: "them", text: "hey" }],
      previousContext: null,
    });

    expect(result.replies).toHaveLength(3);
    expect(result.tokensUsed).toBe(350);
  });

  it("returns empty replies on malformed JSON", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "{}" } }],
      usage: { total_tokens: 100 },
    });

    const result = await generateReplies({
      userName: "Jake",
      userGender: "male",
      personName: "Lisa",
      recentMessages: [],
      previousContext: null,
    });

    expect(result.replies).toEqual([]);
  });
});
