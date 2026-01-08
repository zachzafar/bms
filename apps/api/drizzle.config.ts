import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: '../../packages/api-contract/drizzle',
  schema: '../../packages/api-contract/src/database-schema/schema',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});