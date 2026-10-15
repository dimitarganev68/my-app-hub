import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Group = { id: number; name: string; comment: string };

const groupInput = z.object({
  name: z.string().trim().min(1).max(100),
  comment: z.string().trim().max(500),
});

export const listGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Group[]> => {
    const { data, error } = await context.supabase.from("groups").select("id,name,comment").order("id");
    if (error) throw new Error(error.message);
    return data;
  });

export const saveGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => groupInput.extend({ id: z.number().int().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const row = { name: data.name, comment: data.comment };
    const { error } = data.id
      ? await context.supabase.from("groups").update(row).eq("id", data.id)
      : await context.supabase.from("groups").insert(row);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.number().int() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("groups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
