import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { z } from 'zod'

config({ path: ['.env.local', '.env'] })

const databaseUrl = z
  .string()
  .url()
  .parse(
    process.env.DATABASE_URL ??
      'postgresql://stm:postgres@localhost:5432/stm',
  )

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
})
