import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Database } from "~/database.types";

const supabaseUrl = "https://xupaltsetlvnaxfjcamj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cGFsdHNldGx2bmF4ZmpjYW1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzYwMzAsImV4cCI6MjA2ODk1MjAzMH0.syRY10GXGVX2vNazUqOhesI913OINKp728Ht3iY1I0c";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
