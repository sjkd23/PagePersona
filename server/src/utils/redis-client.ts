import { createClient, type RedisClientType, type RedisFunctions, type RedisModules, type RedisScripts } from "redis";
import { logger } from "./logger";

type BaseRedisClient = RedisClientType<RedisModules, RedisFunctions, RedisScripts>;

const REDIS_CONNECT_TIMEOUT_MS = Number(process.env.REDIS_CONNECT_TIMEOUT_MS ?? "10000");
const REDIS_KEEP_ALIVE_MS = Number(process.env.REDIS_KEEP_ALIVE_MS ?? "5000");
const REDIS_MAX_RETRY_DELAY_MS = Number(process.env.REDIS_MAX_RETRY_DELAY_MS ?? "3000");
const REDIS_MAX_RETRIES = Number(process.env.REDIS_MAX_RETRIES ?? "50");

function sanitizeRedisUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.password) {
      parsed.password = "***";
    }

    if (parsed.username) {
      parsed.username = "***";
    }

    return parsed.toString();
  } catch {
    return "[invalid redis url]";
  }
}

function validateRedisUrl(redisUrl: string): void {
  if (!redisUrl) {
    return;
  }

  const safeUrl = sanitizeRedisUrl(redisUrl);

  if (!/^rediss?:\/\//i.test(redisUrl)) {
    logger.warn("REDIS_URL does not use redis:// or rediss://", {
      redisUrl: safeUrl,
    });
    return;
  }

  const isSecureScheme = redisUrl.startsWith("rediss://");
  const tlsHint = /tls|ssl|upstash|render\.com|aws|azure|gcp/i.test(redisUrl);

  if (!isSecureScheme && tlsHint) {
    logger.warn(
      "REDIS_URL may require TLS but is configured with redis://. Consider rediss:// for managed providers.",
      {
        redisUrl: safeUrl,
      },
    );
  }
}

const redisUrl = process.env.REDIS_URL;
const redisDisabled = process.env.REDIS_DISABLED === "true" || !redisUrl;

if (redisDisabled) {
  logger.warn(
    "Redis client is running in disabled mode (REDIS_URL missing or REDIS_DISABLED=true).",
  );
} else {
  validateRedisUrl(redisUrl);
}

const baseRedisClient: BaseRedisClient = createClient({
  ...(redisUrl ? { url: redisUrl } : {}),
  socket: {
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    keepAlive: true,
    keepAliveInitialDelay: REDIS_KEEP_ALIVE_MS,
    reconnectStrategy: (retries) => {
      if (retries >= REDIS_MAX_RETRIES) {
        logger.error(
          "Redis reconnect retries exhausted. Redis features remain in degraded mode.",
          undefined,
          { retries },
        );
        return false;
      }

      const nextDelay = Math.min(100 + retries * 100, REDIS_MAX_RETRY_DELAY_MS);
      return nextDelay;
    },
  },
});

baseRedisClient.on("error", (error) => {
  logger.error("Redis client error event", error);
});

baseRedisClient.on("ready", () => {
  logger.info("Redis client is ready");
});

baseRedisClient.on("end", () => {
  logger.warn("Redis connection ended");
});

baseRedisClient.on("reconnecting", () => {
  logger.warn("Redis reconnecting");
});

let connectPromise: Promise<BaseRedisClient> | null = null;

async function ensureRedisConnected(): Promise<BaseRedisClient | null> {
  if (redisDisabled) {
    return null;
  }

  if (baseRedisClient.isReady) {
    return baseRedisClient;
  }

  if (baseRedisClient.isOpen) {
    return baseRedisClient;
  }

  if (!connectPromise) {
    connectPromise = baseRedisClient
      .connect()
      .then((client) => {
        logger.info("Redis client connected");
        return client;
      })
      .catch((error) => {
        logger.error("Redis initial connect failed; continuing in degraded mode", error);
        throw error;
      })
      .finally(() => {
        connectPromise = null;
      });
  }

  try {
    return await connectPromise;
  } catch {
    return null;
  }
}

void ensureRedisConnected();

const redisClient = {
  async get(key: string) {
    const client = await ensureRedisConnected();
    if (!client) {
      return null;
    }
    return client.get(key);
  },

  async set(...args: Parameters<BaseRedisClient["set"]>) {
    const client = await ensureRedisConnected();
    if (!client) {
      return null;
    }
    return client.set(...args);
  },

  async setEx(...args: Parameters<BaseRedisClient["setEx"]>) {
    const client = await ensureRedisConnected();
    if (!client) {
      return null;
    }
    return client.setEx(...args);
  },

  async del(...args: Parameters<BaseRedisClient["del"]>) {
    const client = await ensureRedisConnected();
    if (!client) {
      return 0;
    }
    return client.del(...args);
  },

  async sendCommand(...args: Parameters<BaseRedisClient["sendCommand"]>) {
    const client = await ensureRedisConnected();
    if (!client) {
      throw new Error("Redis unavailable: sendCommand failed in degraded mode");
    }
    return client.sendCommand(...args);
  },

  async connect() {
    return ensureRedisConnected();
  },

  async disconnect() {
    if (!baseRedisClient.isOpen) {
      return;
    }

    await baseRedisClient.disconnect();
  },

  get isReady() {
    return baseRedisClient.isReady;
  },

  get isOpen() {
    return baseRedisClient.isOpen;
  },

  getStatus() {
    if (redisDisabled) {
      return "disabled" as const;
    }

    if (baseRedisClient.isReady) {
      return "ready" as const;
    }

    if (baseRedisClient.isOpen) {
      return "connecting" as const;
    }

    return "down" as const;
  },
};

export type RedisClientFacade = typeof redisClient;
export default redisClient;
