import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type AppUser = {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  username: string;
  address: string;
  birthDate: string;
};

type Row = Database["public"]["Tables"]["app_users"]["Row"];
const toUser = (r: Row): AppUser => ({
  id: r.id, firstName: r.first_name, middleName: r.middle_name, lastName: r.last_name,
  username: r.username, address: r.address, birthDate: r.birth_date ?? "",
});

const str = (max = 100) => z.string().trim().max(max);
export const USERNAME_PATTERN = /^[A-Za-z0-9.-]+$/;
const userInput = z.object({
  firstName: str().min(1),
  middleName: str(),
  lastName: str().min(1),
  username: str().min(1).regex(USERNAME_PATTERN),
  address: str(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
});
const toRow = (u: z.infer<typeof userInput>) => ({
  first_name: u.firstName, middle_name: u.middleName, last_name: u.lastName,
  username: u.username, address: u.address, birth_date: u.birthDate || null,
});

function fail(error: { code?: string; message: string }): never {
  if (error.code === "23505") throw new Error("DUPLICATE_USERNAME");
  throw new Error(error.message);
}

export const listUsers = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("app_users").select("*").order("id");
  if (error) fail(error);
  return data.map(toUser);
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => userInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("app_users").insert(toRow(data));
    if (error) fail(error);
    return { ok: true };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => userInput.extend({ id: z.number().int() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("app_users").update(toRow(data)).eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("app_users").delete().eq("id", data.id);
    if (error) fail(error);
    return { ok: true };
  });
