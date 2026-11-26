import { z } from "zod";

export const profileName = z.string().trim().min(1, "Informe seu nome.").max(100, "Use até 100 caracteres.");
export const signupSchema = z.object({
  name: profileName,
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
});