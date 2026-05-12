import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import * as dbQueries from "./db";
import type { User } from "../drizzle/schema";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "literai-dev-secret-key-change-in-production");
const SALT_ROUNDS = 10;

export type AuthUser = Pick<User, "id" | "username" | "email" | "name" | "role" | "themePreference" | "defaultModel" | "institution" | "fieldOfStudy" | "bio">;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createJWT(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as number };
  } catch {
    return null;
  }
}

export async function register(username: string, password: string, email?: string, name?: string): Promise<{ user: AuthUser; token: string }> {
  // Validate
  if (!username || username.length < 3) throw new Error("Username must be at least 3 characters");
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters");

  // Check existing
  const existingUsername = await dbQueries.getUserByUsername(username);
  if (existingUsername) throw new Error("Username already taken");

  if (email) {
    const existingEmail = await dbQueries.getUserByEmail(email);
    if (existingEmail) throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(password);
  const user = await dbQueries.createUser({ username, email, passwordHash, name });
  const token = await createJWT(user.id);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      themePreference: user.themePreference,
      defaultModel: user.defaultModel,
      institution: user.institution,
      fieldOfStudy: user.fieldOfStudy,
      bio: user.bio,
    },
    token,
  };
}

export async function login(identifier: string, password: string): Promise<{ user: AuthUser; token: string }> {
  if (!identifier || !password) throw new Error("Username/email and password are required");

  const user = await dbQueries.getUserByUsernameOrEmail(identifier);
  if (!user) throw new Error("Invalid credentials");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  // Update last signed in
  await dbQueries.updateUser(user.id, { lastSignedIn: new Date() } as any);

  const token = await createJWT(user.id);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      themePreference: user.themePreference,
      defaultModel: user.defaultModel,
      institution: user.institution,
      fieldOfStudy: user.fieldOfStudy,
      bio: user.bio,
    },
    token,
  };
}

export async function getUserFromToken(token: string | undefined | null): Promise<AuthUser | null> {
  if (!token) return null;
  const payload = await verifyJWT(token);
  if (!payload) return null;
  const user = await dbQueries.getUserById(payload.userId);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    role: user.role,
    themePreference: user.themePreference,
    defaultModel: user.defaultModel,
    institution: user.institution,
    fieldOfStudy: user.fieldOfStudy,
    bio: user.bio,
  };
}
