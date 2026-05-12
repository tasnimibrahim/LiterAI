import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, desc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import * as schema from "../drizzle/schema";

// ─── Database Setup ──────────────────────────────────────────────────────────
const DB_DIR = path.resolve(import.meta.dirname, "..", "db");
const DB_PATH = path.join(DB_DIR, "literai.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// ─── Auto-create tables ─────────────────────────────────────────────────────
function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      passwordHash TEXT NOT NULL,
      name TEXT,
      institution TEXT,
      fieldOfStudy TEXT,
      bio TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      themePreference TEXT NOT NULL DEFAULT 'system',
      defaultModel TEXT DEFAULT 'gemini-2.5-flash',
      defaultSources TEXT DEFAULT '["arxiv","pubmed"]',
      createdAt INTEGER,
      updatedAt INTEGER,
      lastSignedIn INTEGER
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id),
      title TEXT,
      projectId INTEGER REFERENCES projects(id),
      selectedModel TEXT DEFAULT 'gemini-2.5-flash',
      selectedSources TEXT DEFAULT '["arxiv","pubmed"]',
      pinned INTEGER DEFAULT 0,
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId INTEGER NOT NULL REFERENCES chats(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      attachments TEXT DEFAULT '[]',
      modelUsed TEXT,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      icon TEXT DEFAULT 'folder',
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS userSettings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE REFERENCES users(id),
      notificationsEnabled INTEGER DEFAULT 1,
      emailNotifications INTEGER DEFAULT 0,
      autoSaveChats INTEGER DEFAULT 1,
      responseLength TEXT DEFAULT 'balanced',
      language TEXT DEFAULT 'en',
      createdAt INTEGER,
      updatedAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id),
      chatId INTEGER REFERENCES chats(id),
      rating INTEGER,
      comment TEXT,
      feedbackType TEXT DEFAULT 'general',
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id),
      chatId INTEGER REFERENCES chats(id),
      title TEXT NOT NULL,
      authors TEXT,
      abstract TEXT,
      url TEXT,
      pdfPath TEXT,
      source TEXT,
      externalId TEXT,
      year INTEGER,
      citationCount INTEGER,
      selected INTEGER DEFAULT 0,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id),
      chatId INTEGER REFERENCES chats(id),
      title TEXT NOT NULL,
      filePath TEXT,
      paperIds TEXT DEFAULT '[]',
      summary TEXT,
      content TEXT,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS searchHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL REFERENCES users(id),
      query TEXT NOT NULL,
      sources TEXT DEFAULT '[]',
      resultsCount INTEGER,
      createdAt INTEGER
    );

    CREATE TABLE IF NOT EXISTS modelEvaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId INTEGER NOT NULL REFERENCES chats(id),
      messageId INTEGER NOT NULL REFERENCES messages(id),
      model TEXT NOT NULL,
      relevanceScore REAL,
      accuracyScore REAL,
      completenessScore REAL,
      clarityScore REAL,
      overallScore REAL,
      responseTimeMs INTEGER,
      tokenCount INTEGER,
      qualityMetrics TEXT DEFAULT '{}',
      evaluationDetails TEXT,
      createdAt INTEGER
    );
  `);
  console.log("[Database] SQLite initialized at", DB_PATH);
}

initializeDatabase();

// ─── User Queries ────────────────────────────────────────────────────────────
export async function createUser(data: { username: string; email?: string; passwordHash: string; name?: string }) {
  const now = new Date();
  const result = db.insert(schema.users).values({
    username: data.username,
    email: data.email || null,
    passwordHash: data.passwordHash,
    name: data.name || data.username,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  }).returning().get();
  return result;
}

export async function getUserByUsername(username: string) {
  return db.select().from(schema.users).where(eq(schema.users.username, username)).get();
}

export async function getUserByEmail(email: string) {
  return db.select().from(schema.users).where(eq(schema.users.email, email)).get();
}

export async function getUserById(id: number) {
  return db.select().from(schema.users).where(eq(schema.users.id, id)).get();
}

export async function getUserByUsernameOrEmail(identifier: string) {
  const byUsername = await getUserByUsername(identifier);
  if (byUsername) return byUsername;
  return getUserByEmail(identifier);
}

export async function updateUser(id: number, data: Partial<schema.InsertUser>) {
  return db.update(schema.users).set({ ...data, updatedAt: new Date() }).where(eq(schema.users.id, id)).run();
}

export async function updateUserThemePreference(userId: number, theme: "light" | "dark" | "system") {
  return db.update(schema.users).set({ themePreference: theme, updatedAt: new Date() }).where(eq(schema.users.id, userId)).run();
}

// ─── Chat Queries ────────────────────────────────────────────────────────────
export async function createChat(userId: number, title?: string, projectId?: number, model?: string) {
  const now = new Date();
  return db.insert(schema.chats).values({
    userId,
    title: title || "New Conversation",
    projectId: projectId || null,
    selectedModel: model || "gemini-2.5-flash",
    createdAt: now,
    updatedAt: now,
  }).returning().get();
}

export async function getUserChats(userId: number) {
  return db.select().from(schema.chats).where(eq(schema.chats.userId, userId)).orderBy(desc(schema.chats.updatedAt)).all();
}

export async function getChatById(chatId: number) {
  return db.select().from(schema.chats).where(eq(schema.chats.id, chatId)).get();
}

export async function updateChat(chatId: number, data: Partial<schema.InsertChat>) {
  return db.update(schema.chats).set({ ...data, updatedAt: new Date() }).where(eq(schema.chats.id, chatId)).run();
}

export async function deleteChat(chatId: number) {
  db.delete(schema.messages).where(eq(schema.messages.chatId, chatId)).run();
  return db.delete(schema.chats).where(eq(schema.chats.id, chatId)).run();
}

export async function getProjectChats(projectId: number) {
  return db.select().from(schema.chats).where(eq(schema.chats.projectId, projectId)).orderBy(desc(schema.chats.updatedAt)).all();
}

// ─── Message Queries ─────────────────────────────────────────────────────────
export async function addMessage(chatId: number, role: "user" | "assistant" | "system", content: string, modelUsed?: string) {
  const msg = db.insert(schema.messages).values({
    chatId,
    role,
    content,
    modelUsed: modelUsed || null,
    createdAt: new Date(),
  }).returning().get();
  // Update chat's updatedAt
  db.update(schema.chats).set({ updatedAt: new Date() }).where(eq(schema.chats.id, chatId)).run();
  return msg;
}

export async function getChatMessages(chatId: number) {
  return db.select().from(schema.messages).where(eq(schema.messages.chatId, chatId)).orderBy(schema.messages.createdAt).all();
}

// ─── Project Queries ─────────────────────────────────────────────────────────
export async function createProject(userId: number, name: string, description?: string, color?: string) {
  const now = new Date();
  return db.insert(schema.projects).values({
    userId, name, description: description || null, color: color || "#6366f1",
    createdAt: now, updatedAt: now,
  }).returning().get();
}

export async function getUserProjects(userId: number) {
  return db.select().from(schema.projects).where(eq(schema.projects.userId, userId)).orderBy(desc(schema.projects.createdAt)).all();
}

export async function deleteProject(projectId: number) {
  // Unassign chats from project
  db.update(schema.chats).set({ projectId: null }).where(eq(schema.chats.projectId, projectId)).run();
  return db.delete(schema.projects).where(eq(schema.projects.id, projectId)).run();
}

// ─── Settings Queries ────────────────────────────────────────────────────────
export async function getUserSettings(userId: number) {
  return db.select().from(schema.userSettings).where(eq(schema.userSettings.userId, userId)).get();
}

export async function createOrUpdateUserSettings(userId: number, settings: Partial<schema.InsertUserSettings>) {
  const existing = await getUserSettings(userId);
  const now = new Date();
  if (existing) {
    return db.update(schema.userSettings).set({ ...settings, updatedAt: now }).where(eq(schema.userSettings.userId, userId)).run();
  } else {
    return db.insert(schema.userSettings).values({ userId, ...settings, createdAt: now, updatedAt: now }).returning().get();
  }
}

// ─── Feedback Queries ────────────────────────────────────────────────────────
export async function addFeedback(userId: number, rating?: number, comment?: string, feedbackType?: string, chatId?: number) {
  return db.insert(schema.feedback).values({
    userId, rating: rating || null, comment: comment || null,
    feedbackType: (feedbackType as any) || "general", chatId: chatId || null,
    createdAt: new Date(),
  }).returning().get();
}

export async function getUserFeedback(userId: number) {
  return db.select().from(schema.feedback).where(eq(schema.feedback.userId, userId)).orderBy(desc(schema.feedback.createdAt)).all();
}

export async function getAllFeedback() {
  return db.select().from(schema.feedback).orderBy(desc(schema.feedback.createdAt)).all();
}

// ─── Paper Queries ───────────────────────────────────────────────────────────
export async function addPaper(data: schema.InsertPaper) {
  return db.insert(schema.papers).values({ ...data, createdAt: new Date() }).returning().get();
}

export async function getUserPapers(userId: number) {
  return db.select().from(schema.papers).where(eq(schema.papers.userId, userId)).orderBy(desc(schema.papers.createdAt)).all();
}

export async function getChatPapers(chatId: number) {
  return db.select().from(schema.papers).where(eq(schema.papers.chatId, chatId)).all();
}

// ─── Report Queries ──────────────────────────────────────────────────────────
export async function createReport(data: schema.InsertReport) {
  return db.insert(schema.reports).values({ ...data, createdAt: new Date() }).returning().get();
}

export async function getUserReports(userId: number) {
  return db.select().from(schema.reports).where(eq(schema.reports.userId, userId)).orderBy(desc(schema.reports.createdAt)).all();
}

// ─── Search History ──────────────────────────────────────────────────────────
export async function addSearchHistory(userId: number, query: string, sources?: string[], resultsCount?: number) {
  return db.insert(schema.searchHistory).values({
    userId, query, sources: JSON.stringify(sources || []),
    resultsCount: resultsCount || 0, createdAt: new Date(),
  }).returning().get();
}

// ─── Evaluation Queries ──────────────────────────────────────────────────────
export async function addModelEvaluation(data: schema.InsertModelEvaluation) {
  return db.insert(schema.modelEvaluations).values({ ...data, createdAt: new Date() }).returning().get();
}

export async function getChatEvaluations(chatId: number) {
  return db.select().from(schema.modelEvaluations).where(eq(schema.modelEvaluations.chatId, chatId)).all();
}

export async function getAllEvaluations() {
  return db.select().from(schema.modelEvaluations).orderBy(desc(schema.modelEvaluations.createdAt)).all();
}
