import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

let client: SupabaseClient<Database> | null = null

export function createClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,      // מונע ממך להתנתק כשאתה סוגר את הטאב/הדפדפן
        autoRefreshToken: true,    // מחדש את הטוקן אוטומטית ברקע כדי שלא תצטרך לעשות Sign In שוב
        detectSessionInUrl: true,  // עוזר ל-Google Auth לקלוט את החיבור מיד כשהוא חוזר לאתר
      },
    }
  ) as unknown as SupabaseClient<Database>

  return client
}