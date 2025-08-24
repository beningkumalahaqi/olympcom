import { prisma } from './db.js'

// Connection pool manager to prevent prepared statement conflicts
class ConnectionManager {
  constructor() {
    this.connectionPool = new Map()
    this.lastCleanup = Date.now()
    this.cleanupInterval = 30000 // 30 seconds
  }

  async getConnection(key = 'default') {
    // Clean up old connections periodically
    if (Date.now() - this.lastCleanup > this.cleanupInterval) {
      await this.cleanup()
    }

    // Return existing connection or create new one
    if (!this.connectionPool.has(key)) {
      this.connectionPool.set(key, {
        connection: prisma,
        lastUsed: Date.now(),
        useCount: 0
      })
    }

    const poolEntry = this.connectionPool.get(key)
    poolEntry.lastUsed = Date.now()
    poolEntry.useCount++

    return poolEntry.connection
  }

  async cleanup() {
    const now = Date.now()
    const staleTimeout = 60000 // 1 minute

    for (const [key, entry] of this.connectionPool.entries()) {
      // Remove stale connections
      if (now - entry.lastUsed > staleTimeout) {
        this.connectionPool.delete(key)
      }
    }

    this.lastCleanup = now
  }

  async disconnect() {
    this.connectionPool.clear()
    await prisma.$disconnect()
  }
}

export const connectionManager = new ConnectionManager()

// Enhanced database operation wrapper
export async function executeWithConnection(operation, connectionKey = 'default') {
  const connection = await connectionManager.getConnection(connectionKey)
  
  try {
    return await operation(connection)
  } catch (error) {
    // Handle specific Prisma errors
    if (error.message?.includes('prepared statement') || 
        error.code === 'P2024' || 
        error.code === 'P1001') {
      
      // Force reconnection for problematic connections
      await connection.$disconnect()
      
      // Retry with a fresh connection
      const newConnection = await connectionManager.getConnection(`${connectionKey}_retry_${Date.now()}`)
      return await operation(newConnection)
    }
    
    throw error
  }
}

// Rate limiting helper to prevent too many concurrent requests
const requestQueue = new Map()

export async function withRateLimit(key, operation, maxConcurrent = 5) {
  if (!requestQueue.has(key)) {
    requestQueue.set(key, { count: 0, queue: [] })
  }

  const queue = requestQueue.get(key)

  return new Promise((resolve, reject) => {
    const execute = async () => {
      if (queue.count >= maxConcurrent) {
        queue.queue.push({ resolve, reject, operation })
        return
      }

      queue.count++
      
      try {
        const result = await operation()
        resolve(result)
      } catch (error) {
        reject(error)
      } finally {
        queue.count--
        
        // Process next item in queue
        if (queue.queue.length > 0) {
          const next = queue.queue.shift()
          setTimeout(() => execute.call(next), 0)
        }
      }
    }

    execute()
  })
}
