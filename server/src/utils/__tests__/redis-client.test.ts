import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = {
  connect: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
  get: vi.fn().mockResolvedValue("cached-value"),
  set: vi.fn().mockResolvedValue("OK"),
  del: vi.fn().mockResolvedValue(1),
  setEx: vi.fn().mockResolvedValue("OK"),
  disconnect: vi.fn().mockResolvedValue(undefined),
  sendCommand: vi.fn().mockResolvedValue("OK"),
  on: vi.fn(),
  isReady: false,
  isOpen: false,
};

vi.mock("redis", () => ({
  createClient: vi.fn(() => mockClient),
}));

describe("redis-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.connect.mockRejectedValue(new Error("ECONNREFUSED"));
    mockClient.isOpen = false;
    mockClient.isReady = false;
    delete process.env.REDIS_DISABLED;
    process.env.REDIS_URL = "redis://localhost:6379";
  });


  it("registers redis lifecycle event listeners", async () => {
    await import("../redis-client");

    expect(mockClient.on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith("ready", expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith("end", expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith(
      "reconnecting",
      expect.any(Function),
    );
  });

  it("returns degraded status when redis is disconnected", async () => {
    const redisClient = (await import("../redis-client")).default;

    expect(redisClient.getStatus()).toBe("down");
  });

  it("returns null for GET when connection cannot be established", async () => {
    const redisClient = (await import("../redis-client")).default;

    const result = await redisClient.get("missing-key");
    expect(result).toBeNull();
  });

  it("returns null for SET when connection cannot be established", async () => {
    const redisClient = (await import("../redis-client")).default;

    const result = await redisClient.set("test-key", "test-value");
    expect(result).toBeNull();
  });

  it("does not throw on disconnect if redis connection is closed", async () => {
    const redisClient = (await import("../redis-client")).default;

    await expect(redisClient.disconnect()).resolves.toBeUndefined();
    expect(mockClient.disconnect).not.toHaveBeenCalled();
  });
});
