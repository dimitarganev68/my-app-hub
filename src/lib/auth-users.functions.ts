import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { USERNAME_RE, usernameToEmail, emailToUsername } from "@/lib/auth";

export type AuthUser = {
  id: string;
  username: string;
  groupId: number | null;
  createdAt: string;
  lastSignIn: string;
};

type Ctx = { supabase: { rpc: (fn: "current_user_is_admin") => PromiseLike<{ data: unknown }> }; userId: string };

async function admin(context: Ctx) {
  const { data } = await context.supabase.rpc("current_user_is_admin");
  if (data !== true) throw new Error("FORBIDDEN");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const username = z.string().trim().min(1).max(100).regex(USERNAME_RE);
const password = z.string().min(6).max(72);
const groupId = z.number().int().positive();

function fail(e: { message: string }): never {
  if (/already|registered|exists/i.test(e.message)) throw new Error("DUPLICATE_USERNAME");
  throw new Error(e.message);
}

export const listAuthUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AuthUser[]> => {
    const sb = await admin(context as unknown as Ctx);
    const { data, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) fail(error);
    return data.users.map((u) => ({
      id: u.id,
      username: emailToUsername(u.email),
      groupId: u.app_metadata?.groupID != null ? Number(u.app_metadata.groupID) : null,
      createdAt: u.created_at?.slice(0, 10) ?? "",
      lastSignIn: u.last_sign_in_at?.slice(0, 10) ?? "",
    }));
  });

export const createAuthUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ username, password, groupId }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context as unknown as Ctx);
    const { data: created, error } = await sb.auth.admin.createUser({
      email: usernameToEmail(data.username), password: data.password, email_confirm: true,
    });
    if (error) fail(error);
    const { error: e2 } = await sb.auth.admin.updateUserById(created.user.id, { app_metadata: { groupID: data.groupId } });
    if (e2) fail(e2);
    return { ok: true };
  });

export const updateAuthUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), username, groupId }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context as unknown as Ctx);
    const { error } = await sb.auth.admin.updateUserById(data.id, {
      email: usernameToEmail(data.username), email_confirm: true, app_metadata: { groupID: data.groupId },
    });
    if (error) fail(error);
    return { ok: true };
  });

export const setAuthUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), password }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = await admin(context as unknown as Ctx);
    const { error } = await sb.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) fail(error);
    return { ok: true };
  });

export const deleteAuthUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.id === context.userId) throw new Error("SELF_DELETE");
    const sb = await admin(context as unknown as Ctx);
    const { error } = await sb.auth.admin.deleteUser(data.id);
    if (error) fail(error);
    return { ok: true };
  });
