import { describe, expect, it } from "vitest";
import { profileName, signupSchema } from "@/lib/auth-validation";

describe("Cadastro individual", () => {
  it("exige o nome da pessoa", () => {
    expect(profileName.safeParse("   ").success).toBe(false);
    expect(profileName.parse("  Ana Silva  ")).toBe("Ana Silva");
  });
  it("exige um e-mail válido", () => {
    expect(signupSchema.safeParse({ name: "Ana", email: "ana", password: "segura123" }).success).toBe(false);
    expect(signupSchema.safeParse({ name: "Ana", email: "ana@example.com", password: "segura123" }).success).toBe(true);
  });
});