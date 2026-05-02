import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetSubscription = vi.fn();
vi.mock("../convex/subscriptions.js", () => ({
  getSubscription: mockGetSubscription,
}));

const mockSpaceSend = vi.fn();
const mockSpace = { send: mockSpaceSend } as any;

const { checkBilling } = await import("../handlers/billing.js");

describe("checkBilling", () => {
  beforeEach(() => {
    mockGetSubscription.mockReset();
    mockSpaceSend.mockReset();
  });

  it("returns true for users on active trial with time remaining", async () => {
    const user = {
      _id: "user1",
      plan: "trial" as const,
      trialEndsAt: Date.now() + 10 * 24 * 60 * 60 * 1000,
      name: "Jake",
    };

    const result = await checkBilling(mockSpace, user);
    expect(result).toBe(true);
    expect(mockSpaceSend).not.toHaveBeenCalled();
  });

  it("returns true and warns when trial ends in 1 day", async () => {
    const user = {
      _id: "user1",
      plan: "trial" as const,
      trialEndsAt: Date.now() + 20 * 60 * 60 * 1000, // ~20 hours
      name: "Jake",
    };

    const result = await checkBilling(mockSpace, user);
    expect(result).toBe(true);
    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("trial ends"));
  });

  it("returns false and sends nudge when trial expired", async () => {
    const user = {
      _id: "user1",
      plan: "trial" as const,
      trialEndsAt: Date.now() - 1000,
      name: "Jake",
    };

    const result = await checkBilling(mockSpace, user);
    expect(result).toBe(false);
    expect(mockSpaceSend).toHaveBeenCalledWith(expect.stringContaining("trial ended"));
  });

  it("returns true for active paid subscription", async () => {
    mockGetSubscription.mockResolvedValueOnce({ status: "active" });
    const user = {
      _id: "user1",
      plan: "basic" as const,
      trialEndsAt: 0,
      name: "Jake",
    };

    const result = await checkBilling(mockSpace, user);
    expect(result).toBe(true);
    expect(mockSpaceSend).not.toHaveBeenCalled();
  });
});
