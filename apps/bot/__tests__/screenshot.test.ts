import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExtractScreenshot = vi.fn();
const mockGenerateReplies = vi.fn();
const mockAnalyzeConversation = vi.fn();
const mockFindOrCreateFolder = vi.fn();
const mockUpdateFolder = vi.fn();
const mockLogTokens = vi.fn();

vi.mock("../ai/vision.js", () => ({ extractScreenshot: mockExtractScreenshot }));
vi.mock("../ai/reply.js", () => ({ generateReplies: mockGenerateReplies }));
vi.mock("../ai/analysis.js", () => ({ analyzeConversation: mockAnalyzeConversation }));
vi.mock("../convex/chatFolders.js", () => ({
  findOrCreateFolder: mockFindOrCreateFolder,
  updateFolder: mockUpdateFolder,
}));
vi.mock("../convex/tokenUsage.js", () => ({ logTokens: mockLogTokens }));
vi.mock("../convex/client.js", () => ({ convex: {} }));

const mockSpaceSend = vi.fn();
const mockSpace = {
  send: mockSpaceSend,
  responding: vi.fn(async (fn: () => Promise<void>) => fn()),
} as any;

const { handleScreenshot } = await import("../handlers/screenshot.js");

const mockFolder = {
  _id: "folder1",
  personName: "Lisa",
  platform: "tinder",
  messageCount: 0,
  interestLevel: 50,
  compatibilityScore: 50,
  redFlagsCount: 0,
  greenFlagsCount: 0,
};

describe("handleScreenshot", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSpace.responding.mockImplementation(async (fn: () => Promise<void>) => fn());
    mockFindOrCreateFolder.mockResolvedValue(mockFolder);
    mockUpdateFolder.mockResolvedValue(undefined);
    mockLogTokens.mockResolvedValue(undefined);

    mockExtractScreenshot.mockResolvedValue({
      personName: "Lisa",
      platform: "tinder",
      messages: [{ sender: "them", text: "hey" }],
      tokensUsed: 200,
    });
    mockGenerateReplies.mockResolvedValue({
      replies: ["Reply 1", "Reply 2", "Reply 3"],
      tokensUsed: 300,
    });
    mockAnalyzeConversation.mockResolvedValue({
      interestLevel: 70,
      compatibilityScore: 65,
      redFlags: [],
      greenFlags: ["Responsive"],
      tokensUsed: 250,
    });
  });

  it("ignores non-attachment messages", async () => {
    const msg = { content: { type: "text", text: "hello" } } as any;
    await handleScreenshot(mockSpace, msg, { _id: "u1", name: "Jake", gender: "male" });
    expect(mockExtractScreenshot).not.toHaveBeenCalled();
  });

  it("extracts screenshot, generates replies, and sends them", async () => {
    const msg = {
      content: { type: "attachment", data: Buffer.from("img"), mimeType: "image/jpeg", name: "ss.jpg" },
    } as any;
    await handleScreenshot(mockSpace, msg, { _id: "u1", name: "Jake", gender: "male" });

    expect(mockExtractScreenshot).toHaveBeenCalled();
    expect(mockGenerateReplies).toHaveBeenCalled();
    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("Lisa"));
  });

  it("sends red flag message when red flags detected", async () => {
    mockAnalyzeConversation.mockResolvedValueOnce({
      interestLevel: 40,
      compatibilityScore: 30,
      redFlags: ["Avoids commitment topics"],
      greenFlags: [],
      tokensUsed: 200,
    });

    const msg = {
      content: { type: "attachment", data: Buffer.from("img"), mimeType: "image/jpeg", name: "ss.jpg" },
    } as any;
    await handleScreenshot(mockSpace, msg, { _id: "u1", name: "Jake", gender: "male" });

    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("🚩"));
  });
});
