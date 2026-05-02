import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreate = vi.fn();

vi.mock("../ai/client.js", () => ({
  openai: {
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  },
}));

const { extractScreenshot } = await import("../ai/vision.js");

describe("extractScreenshot", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns extracted person name, platform, and messages", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              personName: "Lisa",
              platform: "tinder",
              messages: [
                { sender: "them", text: "hey" },
                { sender: "me", text: "hey" },
              ],
            }),
          },
        },
      ],
      usage: { total_tokens: 200 },
    });

    const result = await extractScreenshot(Buffer.from("fake-image"));
    expect(result.personName).toBe("Lisa");
    expect(result.platform).toBe("tinder");
    expect(result.messages).toHaveLength(2);
    expect(result.tokensUsed).toBe(200);
  });

  it("falls back to defaults when JSON is missing fields", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "{}" } }],
      usage: { total_tokens: 50 },
    });

    const result = await extractScreenshot(Buffer.from("bad-image"));
    expect(result.personName).toBe("Unknown");
    expect(result.platform).toBe("other");
    expect(result.messages).toEqual([]);
  });
});
