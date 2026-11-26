import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { profileName } from "@/lib/auth-validation";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("profiles").select("id, name").eq("id", context.userId).single();
    if (error) throw new Error("Não foi possível carregar seu perfil.");
    return { ...data, email: typeof context.claims['email'] === 'string' ? context.claims['email'] : '' };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { name: string }) => ({ name: profileName.parse(data.name) }))
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase.from("profiles").update({ name: data.name }).eq("id", context.userId).select("id, name").single();
    if (error) throw new Error("Não foi possível salvar seu nome.");
    return profile;
  });