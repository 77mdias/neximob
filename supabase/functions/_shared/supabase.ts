// Cliente do Supabase com a chave secreta (service_role).
// Só pode ser usado nas Edge Functions: ele ignora a RLS (ADR-0004).

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { variavel } from "./seguranca.ts";

export function clienteAdmin(): SupabaseClient {
  return createClient(variavel("SUPABASE_URL"), variavel("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
