import { jsonb } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";
import { pgTable, uuid } from "drizzle-orm/pg-core";

export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    channel: varchar('channel', { length: 30 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('QUEUED'),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull()
})

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;