// Fake authentication layer, replacing Supabase Auth. Sessions are opaque
// tokens held in-memory server-side (mockDb.sessions) and mirrored to the
// browser's localStorage so the client can attach them to server-fn calls.
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { genId, mockDb } from "@/lib/mock-db";

export const SESSION_STORAGE_KEY = "sehaty_session_token";

function createSession(userId: string): string {
  const token = genId();
  mockDb.sessions.set(token, userId);
  return token;
}

// Client-side: attach the locally stored session token to every server-fn call.
export const attachMockAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem(SESSION_STORAGE_KEY) : null;
  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});

// Server-side: verify the bearer token against the in-memory session map.
export const requireMockAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    const authHeader = request?.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: No session token provided");
    }
    const token = authHeader.slice("Bearer ".length);
    const userId = mockDb.sessions.get(token);
    if (!userId) throw new Error("Unauthorized: Session expired or invalid");
    return next({ context: { userId } });
  },
);

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((input) => credentialsSchema.parse(input))
  .handler(async ({ data }) => {
    const user = mockDb.users.find(
      (u) => u.email.toLowerCase() === data.email.toLowerCase() && u.password === data.password,
    );
    if (!user) throw new Error("Invalid login credentials");
    return { token: createSession(user.id), userId: user.id };
  });

const signUpSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((input) => signUpSchema.parse(input))
  .handler(async ({ data }) => {
    if (mockDb.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }
    const id = genId();
    mockDb.users.push({ id, email: data.email, password: data.password });
    return { token: createSession(id), userId: id };
  });

export const logout = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    for (const [token, userId] of mockDb.sessions) {
      if (userId === context.userId) mockDb.sessions.delete(token);
    }
    return { ok: true };
  });
