import { jsonb, serial } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";

export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).unique(),
    channel: varchar('channel', { length: 30 }).notNull(),
    status: varchar('status', { length: 30 }).notNull().default('QUEUED'), // QUEUE | SENT | FAILED | DEAD_LETTER
    failedReason: text('failed_reason'), // stores error
    providerMessageId: varchar('provider_message_id', { length: 255 }), // store provider email_id
    payload: jsonb('payload').notNull(),
    priority: varchar('priority', { length: 30 }).default('NORMAL').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull()
})

export const templates = pgTable('templates', {
    id: serial('id').primaryKey(),
    templateId: varchar('template_id', { length: 100 }).unique().notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    channel: varchar('channel', { length: 32 }).notNull(),
    subject: text('subject'),
    body: text('body').notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull()
})

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;