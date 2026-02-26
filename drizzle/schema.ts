import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Articles table for centralized news article storage.
 * Stores articles fetched from BBC, VOA, and other sources.
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique identifier for the article (e.g., bbc-article-123) */
  articleId: varchar("articleId", { length: 255 }).notNull().unique(),
  /** Article title */
  title: text("title").notNull(),
  /** Article content (first 1-2 paragraphs) */
  content: text("content").notNull(),
  /** Japanese translation of the content */
  translation: text("translation"),
  /** Article category (e.g., Business & Politics, Science & Technology) */
  category: varchar("category", { length: 100 }),
  /** Difficulty level (1-10) */
  level: int("level"),
  /** Original publication date */
  publishedDate: varchar("publishedDate", { length: 20 }),
  /** Source of the article (bbc, voa, engoo) */
  source: mysqlEnum("source", ["bbc", "voa", "engoo"]).notNull(),
  /** Original article URL */
  sourceUrl: text("sourceUrl"),
  /** Source attribution text */
  sourceAttribution: varchar("sourceAttribution", { length: 255 }),
  /** When the article was fetched and stored */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;
