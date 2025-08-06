import Redis from 'ioredis';

let redis: Redis;

export async function initRedis() {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redis = new Redis(redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    // Test connection
    await redis.ping();
    return redis;
  } catch (error) {
    console.error('❌ Redis initialization failed:', error);
    // Don't throw error - app should work without Redis
    console.warn('⚠️ Continuing without Redis cache');
  }
}

export { redis };