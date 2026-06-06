import { Redis } from "@upstash/redis";
import { env } from "./env.js";

/** Counter store for daily rate limiting. Redis when configured, else in-memory. */
export interface CounterStore {
  incr(key: string, ttlSeconds: number): Promise<number>;
  get(key: string): Promise<number>;
}

class RedisStore implements CounterStore {
  private readonly redis: Redis;
  constructor() {
    this.redis = new Redis({
      url: env.upstashRedisUrl!,
      token: env.upstashRedisToken!,
    });
  }
  async incr(key: string, ttlSeconds: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, ttlSeconds);
    return count;
  }
  async get(key: string): Promise<number> {
    return (await this.redis.get<number>(key)) ?? 0;
  }
}

class MemoryStore implements CounterStore {
  private readonly map = new Map<string, { count: number; expires: number }>();

  private sweep(key: string): void {
    const entry = this.map.get(key);
    if (entry && entry.expires <= Date.now()) this.map.delete(key);
  }
  async incr(key: string, ttlSeconds: number): Promise<number> {
    this.sweep(key);
    const entry = this.map.get(key);
    if (!entry) {
      this.map.set(key, { count: 1, expires: Date.now() + ttlSeconds * 1000 });
      return 1;
    }
    entry.count += 1;
    return entry.count;
  }
  async get(key: string): Promise<number> {
    this.sweep(key);
    return this.map.get(key)?.count ?? 0;
  }
}

export const store: CounterStore = env.hasRedis
  ? new RedisStore()
  : new MemoryStore();

/** YYYY-MM-DD in UTC — the bucket key for daily rate limiting. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
