interface RateLimit {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimit> = new Map()
  
  constructor(
    private maxRequests: number = 15, // Free tier: 15 requests per minute
    private windowMs: number = 60000   // 1 minute window
  ) {}

  async checkLimit(key: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now()
    const limit = this.limits.get(key)

    if (!limit || now > limit.resetTime) {
      // Reset window
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      })
      return { allowed: true }
    }

    if (limit.count >= this.maxRequests) {
      const retryAfter = Math.ceil((limit.resetTime - now) / 1000)
      return { allowed: false, retryAfter }
    }

    limit.count++
    return { allowed: true }
  }

  getStatus(key: string): { remaining: number; resetTime: number } {
    const limit = this.limits.get(key)
    if (!limit || Date.now() > limit.resetTime) {
      return { remaining: this.maxRequests, resetTime: Date.now() + this.windowMs }
    }
    return { 
      remaining: Math.max(0, this.maxRequests - limit.count),
      resetTime: limit.resetTime
    }
  }
}

export const rateLimiter = new RateLimiter()