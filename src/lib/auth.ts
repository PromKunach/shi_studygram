import { supabase } from "@/lib/supabaseClient";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthMode = "sign-in" | "sign-up";

export async function signInWithEmail({ email, password }: AuthCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpWithEmail({ email, password }: AuthCredentials) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function getAuthSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
