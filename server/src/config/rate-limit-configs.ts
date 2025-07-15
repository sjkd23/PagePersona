export const rateLimitConfigs = {
  free: { windowMs: 15 * 60 * 1000, max: 100 },
  premium: { windowMs: 60 * 60 * 1000, max: 1000 },
  admin: { windowMs: 60 * 60 * 1000, max: 10000 },
};
