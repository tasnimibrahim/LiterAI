import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  passwordHash: text("passwordHash").notNull(),
  name: text("name"),
  institution: text("institution"),
  fieldOfStudy: text("fieldOfStudy"),
  bio: text("bio"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  themePreference: text("themePreference", { enum: ["light", "dark", "system"] }).default("system").notNull(),
  defaultModel: text("defaultModel").default("gemini-2.5-flash"),
  defaultSources: text("defaultSources").default('["arxiv","pubmed"]'), // JSON string array
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Chats ───────────────────────────────────────────────────────────────────
export const chats = sqliteTable("chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  title: text("title"),
  projectId: integer("projectId").references(() => projects.id),
  selectedModel: text("selectedModel").default("gemini-2.5-flash"),
  selectedSources: text("selectedSources").default('["arxiv","pubmed"]'),
  pinned: integer("pinned", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Chat = typeof chats.$inferSelect;
export type InsertChat = typeof chats.$inferInsert;

// ─── Messages ────────────────────────────────────────────────────────────────
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: integer("chatId").notNull().references(() => chats.id),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").default("[]"), // JSON
  modelUsed: text("modelUsed"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Projects ────────────────────────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#6366f1"),
  icon: text("icon").default("folder"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── User Settings ───────────────────────────────────────────────────────────
export const userSettings = sqliteTable("userSettings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().unique().references(() => users.id),
  notificationsEnabled: integer("notificationsEnabled", { mode: "boolean" }).default(true),
  emailNotifications: integer("emailNotifications", { mode: "boolean" }).default(false),
  autoSaveChats: integer("autoSaveChats", { mode: "boolean" }).default(true),
  responseLength: text("responseLength", { enum: ["concise", "balanced", "detailed"] }).default("balanced"),
  language: text("language").default("en"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

// ─── Feedback ────────────────────────────────────────────────────────────────
export const feedback = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  chatId: integer("chatId").references(() => chats.id),
  rating: integer("rating"),
  comment: text("comment"),
  feedbackType: text("feedbackType", { enum: ["bug", "feature", "general", "praise"] }).default("general"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = typeof feedback.$inferInsert;

// ─── Papers ──────────────────────────────────────────────────────────────────
export const papers = sqliteTable("papers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  chatId: integer("chatId").references(() => chats.id),
  title: text("title").notNull(),
  authors: text("authors"),
  abstract: text("abstract"),
  url: text("url"),
  pdfPath: text("pdfPath"),
  source: text("source"), // arxiv, pubmed, semantic_scholar, uploaded
  externalId: text("externalId"),
  year: integer("year"),
  citationCount: integer("citationCount"),
  selected: integer("selected", { mode: "boolean" }).default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Paper = typeof papers.$inferSelect;
export type InsertPaper = typeof papers.$inferInsert;

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  chatId: integer("chatId").references(() => chats.id),
  title: text("title").notNull(),
  filePath: text("filePath"),
  paperIds: text("paperIds").default("[]"), // JSON array
  summary: text("summary"),
  content: text("content"), // Full markdown content
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

// ─── Search History ──────────────────────────────────────────────────────────
export const searchHistory = sqliteTable("searchHistory", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull().references(() => users.id),
  query: text("query").notNull(),
  sources: text("sources").default("[]"),
  resultsCount: integer("resultsCount"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = typeof searchHistory.$inferInsert;

// ─── Model Evaluations ──────────────────────────────────────────────────────
export const modelEvaluations = sqliteTable("modelEvaluations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: integer("chatId").notNull().references(() => chats.id),
  messageId: integer("messageId").notNull().references(() => messages.id),
  model: text("model").notNull(),
  relevanceScore: real("relevanceScore"),
  accuracyScore: real("accuracyScore"),
  completenessScore: real("completenessScore"),
  clarityScore: real("clarityScore"),
  overallScore: real("overallScore"),
  responseTimeMs: integer("responseTimeMs"),
  tokenCount: integer("tokenCount"),
  qualityMetrics: text("qualityMetrics").default("{}"), // JSON
  evaluationDetails: text("evaluationDetails"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type ModelEvaluation = typeof modelEvaluations.$inferSelect;
export type InsertModelEvaluation = typeof modelEvaluations.$inferInsert;

// ─── Relations ───────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  projects: many(projects),
  feedback: many(feedback),
  papers: many(papers),
  reports: many(reports),
  searchHistory: many(searchHistory),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  project: one(projects, { fields: [chats.projectId], references: [projects.id] }),
  messages: many(messages),
  papers: many(papers),
  evaluations: many(modelEvaluations),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  chats: many(chats),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, { fields: [feedback.userId], references: [users.id] }),
  chat: one(chats, { fields: [feedback.chatId], references: [chats.id] }),
}));

export const papersRelations = relations(papers, ({ one }) => ({
  user: one(users, { fields: [papers.userId], references: [users.id] }),
  chat: one(chats, { fields: [papers.chatId], references: [chats.id] }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  chat: one(chats, { fields: [reports.chatId], references: [chats.id] }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, { fields: [searchHistory.userId], references: [users.id] }),
}));

export const modelEvaluationsRelations = relations(modelEvaluations, ({ one }) => ({
  chat: one(chats, { fields: [modelEvaluations.chatId], references: [chats.id] }),
  message: one(messages, { fields: [modelEvaluations.messageId], references: [messages.id] }),
}));