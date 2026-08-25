import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index'

const connectionString = process.env.POSTGRESQL || ''

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
export * from './schema/index'