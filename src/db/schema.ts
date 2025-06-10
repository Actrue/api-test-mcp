import { sqliteTable, text, integer,  real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
// TestTable模型
export const testTable = sqliteTable('test_table', {
  uuid: text('uuid').primaryKey().default(sql`(uuid())`),
  name: text('name').notNull(),
  status: integer('status', { mode: 'boolean' }).default(true),
  isFinish: integer('is_finish', { mode: 'boolean' }).default(false),
  createTime: integer('create_time', { mode: 'timestamp' }).default(sql`(current_timestamp)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(current_timestamp)`),
});

// TestTask模型
export const testTask = sqliteTable('test_task', {
  uuid: text('uuid').primaryKey().default(sql`(uuid())`),
  testTableUuid: text('test_table_uuid').notNull(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  method: text('method').notNull(),
  query: text('query', { mode: 'json' }),
  headers: text('headers', { mode: 'json' }),
  body: text('body', { mode: 'json' }),
  hopeRes: text('hope_res').notNull(),
  res: text('res'),
  review: text('review'),
  suggest: text('suggest'),
  isFinish: integer('is_finish', { mode: 'boolean' }).default(false),
  status: integer('status', { mode: 'boolean' }).default(true),
  createTime: integer('create_time', { mode: 'timestamp' }).default(sql`(current_timestamp)`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(current_timestamp)`),
});

// 定义关系

export const testTableRelations = relations(testTable, ({ many }) => ({
  testTasks: many(testTask),
}));

export const testTaskRelations = relations(testTask, ({ one }) => ({
  testTable: one(testTable, {
    fields: [testTask.testTableUuid],
    references: [testTable.uuid],
  }),
}));


export type TestTable = typeof testTable.$inferSelect;
export type NewTestTable = typeof testTable.$inferInsert;

export type TestTask = typeof testTask.$inferSelect;
export type NewTestTask = typeof testTask.$inferInsert;