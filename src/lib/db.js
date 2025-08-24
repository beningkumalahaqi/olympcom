import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

// Enhanced Prisma configuration with better connection pooling
const createPrismaClient = () => {
  return new PrismaClient({
    // Configure connection pooling for better performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add query logging in development
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    // Connection pool configuration
    __internal: {
      engine: {
        // Configure connection timeout
        connectTimeout: 30000, // 30 seconds
        // Configure query timeout
        queryTimeout: 30000, // 30 seconds
        // Connection pool size
        connectionLimit: 10,
      },
    },
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Add graceful shutdown handling
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })

  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

// Helper function to handle database operations with retry logic
export async function withDatabaseRetry(operation, maxRetries = 3) {
  let lastError
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Check if it's a connection-related error
      if (
        error.code === 'P2024' || // Timed out fetching a new connection
        error.code === 'P1001' || // Can't reach database server
        error.code === 'P2034' || // Transaction failed due to connection
        error.message?.includes('prepared statement') ||
        error.message?.includes('connection')
      ) {
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error.message)
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
      }
      
      // If it's not a retryable error, throw immediately
      throw error
    }
  }
  
  throw lastError
}
