import { describe, it, expect, vi, beforeEach } from "vitest";

const mockListFolders = vi.fn();
const mockListMemories = vi.fn();
const mockCreateMemory = vi.fn();
const mockLogTokens = vi.fn();
const mockGenerateConversationReply = vi.fn();
const mockGenerateWrap = vi.fn();

vi.mock("../convex/chatFolders.js", () => ({ listFolders: mockListFolders }));
vi.mock("../convex/memories.js", () => ({
  listMemories: mockListMemories,
  createMemory: mockCreateMemory,
}));
vi.mock("../convex/tokenUsage.js", () => ({ logTokens: mockLogTokens }));
vi.mock("../ai/conversation.js", () => ({
  generateConversationReply: mockGenerateConversationReply,
}));
vi.mock("../ai/wrap.js", () => ({ generateWrap: mockGenerateWrap }));

const mockSpaceSend = vi.fn();
const mockSpace = {
  send: mockSpaceSend,
  responding: vi.fn(async (fn: () => Promise<void>) => fn()),
} as any;

const mockUser = { _id: "user1", name: "Jake", gender: "male" };

const { handleCommand } = await import("../handlers/commands.js");

const mockFolder = {
  _id: "folder1",
  personName: "Lisa",
  platform: "tinder",
  interestLevel: 75,
  compatibilityScore: 68,
  redFlagsCount: 1,
  greenFlagsCount: 3,
  messageCount: 24,
};

describe("handleCommand", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockSpace.responding.mockImplementation(async (fn: () => Promise<void>) => fn());
    mockLogTokens.mockResolvedValue(undefined);
    mockListFolders.mockResolvedValue([]);
    mockListMemories.mockResolvedValue([]);
    mockCreateMemory.mockResolvedValue(undefined);
    mockGenerateConversationReply.mockResolvedValue({
      reply: "I hear you. Tell me the situation.",
      memories: [],
      tokensUsed: 25,
    });
  });

  it("responds to 'help' with command list", async () => {
    const msg = { content: { type: "text", text: "help" } } as any;
    await handleCommand(mockSpace, msg, mockUser);
    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("vibe read"));
  });

  it("responds to '?' with command list", async () => {
    const msg = { content: { type: "text", text: "?" } } as any;
    await handleCommand(mockSpace, msg, mockUser);
    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("reply options"));
  });

  it("responds to 'wrap' with wrap summary", async () => {
    mockListFolders.mockResolvedValue([mockFolder]);
    mockGenerateWrap.mockResolvedValue({
      summary: "Lisa is vibing with you.",
      verdict: "Ask her out.",
      tokensUsed: 200,
    });

    const msg = { content: { type: "text", text: "wrap" } } as any;
    await handleCommand(mockSpace, msg, mockUser);
    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("Lisa"));
  });

  it("responds to 'wrap' with no chats message when no folders", async () => {
    mockListFolders.mockResolvedValue([]);
    const msg = { content: { type: "text", text: "wrap" } } as any;
    await handleCommand(mockSpace, msg, mockUser);
    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("screenshot"));
  });

  it("responds to 'red flags' with flag summary", async () => {
    mockListFolders.mockResolvedValue([mockFolder]);
    const msg = { content: { type: "text", text: "red flags" } } as any;
    await handleCommand(mockSpace, msg, mockUser);
    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("🚩"));
  });

  it("sends a rizz report link for the latest chat", async () => {
    mockListFolders.mockResolvedValue([mockFolder]);
    const msg = { content: { type: "text", text: "rizz report" } } as any;
    await handleCommand(mockSpace, msg, mockUser);
    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("/rizz-report/folder1"));
  });

  it("answers unknown text through the AI wingman path", async () => {
    const msg = { content: { type: "text", text: "hello there" } } as any;
    await handleCommand(mockSpace, msg, mockUser);
    expect(mockGenerateConversationReply).toHaveBeenCalledWith(
      expect.objectContaining({ text: "hello there" })
    );
    expect(mockSpaceSend).toHaveBeenCalledWith("I hear you. Tell me the situation.");
  });
});
