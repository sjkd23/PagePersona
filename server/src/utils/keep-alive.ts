/**
 * Keep-Alive Service
 *
 * Prevents Render's free tier from spinning down the server after 15 minutes
 * of inactivity by sending periodic health check requests.
 */

import { logger } from './logger';

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (before the 15-minute timeout)

/**
 * Starts the keep-alive service for production environments
 * Only runs when RENDER_EXTERNAL_URL is set and in production mode
 */
export function startKeepAlive(): void {
  // Only run in production with Render URL configured
  if (!RENDER_URL || process.env.NODE_ENV !== 'production') {
    logger.info('Keep-alive service disabled (not in production or RENDER_EXTERNAL_URL not set)');
    return;
  }

  logger.info(`Keep-alive service started - pinging ${RENDER_URL}/api/health every 14 minutes`);

  setInterval(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${RENDER_URL}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'PagePersonAI-KeepAlive/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        logger.info('Keep-alive ping successful', {
          status: response.status,
          url: `${RENDER_URL}/api/health`,
        });
      } else {
        logger.warn('Keep-alive ping returned non-OK status', {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      clearTimeout(timeout);
      logger.warn('Keep-alive ping failed', {
        error: error instanceof Error ? error.message : 'unknown_error',
        url: `${RENDER_URL}/api/health`,
      });
    }
  }, PING_INTERVAL);
}
