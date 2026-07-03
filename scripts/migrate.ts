import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

/**
 * Run database migrations in production
 * This script is executed before the application starts in Docker
 * Bun automatically loads .env files, so no need for dotenv package
 */

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

async function runMigrations() {
  console.log('🔄 Running database migrations...')
  console.log('📍 Database URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'))

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  })

  const db = drizzle(pool)

  try {
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('✅ Database migrations completed successfully')
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    await pool.end()
    process.exit(1)
  }
}

runMigrations()
