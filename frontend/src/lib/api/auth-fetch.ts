"use client";

import { createClient } from "@/lib/supabase/client";

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) {
    throw new Error("Unauthorized: missing session token");
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  try {
    return await fetch(input, {
      ...init,
      headers,
    });
  } catch (err) {
    const target = typeof input === "string" ? input : input.toString();
    throw new Error(`Network request failed: ${target} (${(err as Error).message})`);
  }
}
