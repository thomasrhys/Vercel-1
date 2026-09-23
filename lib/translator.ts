// @/lib/translator.ts
import { createServerSupabase } from "@/lib/supabase-server"; // Exact import path to your helper

export type Language = "en" | "cy";

/**
 * Fetches Welsh translations by querying with root privileges via the Service Role client.
 */
export async function getTranslationsForPage(englishKeys: string[], lang: Language = "en") {
  // If language is English, bypass the server database entirely!
  if (lang === "en") {
    return (text: string) => text;
  }

  try {
    // Correctly instantiate your custom server supabase client
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("dictionary")
      .select("key, value")
      .in("key", englishKeys)
      .eq("language", "cy");

    if (error || !data) throw error;

    // Create an instant text replacement lookup map
    const lookupMap = data.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {} as Record<string, string>);

    // If an entry is missing in the Welsh registry table, fallback safely to English
    return (text: string) => lookupMap[text] || text;
  } catch (err) {
    console.error("Administrative database lookup failed:", err);
    return (text: string) => text;
  }
}
