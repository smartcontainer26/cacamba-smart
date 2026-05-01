"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | {
      error: string;
    }
  | undefined;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");

  if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
    return { error: "Email e senha são obrigatórios." };
  }

  const email = emailRaw.trim();
  const password = passwordRaw;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { error: "Email inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou senha incorretos." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
