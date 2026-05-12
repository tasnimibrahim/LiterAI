import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getUserFromToken, type AuthUser } from "../auth-local";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: AuthUser | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: AuthUser | null = null;

  try {
    // Try Bearer token first
    const authHeader = opts.req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      user = await getUserFromToken(authHeader.slice(7));
    }
    // Then try cookie
    if (!user) {
      const cookieHeader = opts.req.headers.cookie || "";
      const match = cookieHeader.match(/literai_token=([^;]+)/);
      if (match) {
        user = await getUserFromToken(match[1]);
      }
    }
  } catch (error) {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
