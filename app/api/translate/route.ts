import { NextRequest, NextResponse } from "next/server";

async function translateText(englishText: string): Promise<string> {
  try {
    const res = await fetch("https://api.techiaith.cymru/translate/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: englishText, src: "en", tgt: "cy" }),
      next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!res.ok) throw new Error("Techiaith API failed");
    const data = await res.json();
    return data.text || englishText;
  } catch (error) {
    console.error("Techiaith translation error:", error);
    return englishText; // Fallback to English
  }
}

export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json();

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ translations: [] });
    }

    // Translate all texts via Techiaith
    const translations = await Promise.all(texts.map(translateText));

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("Translation API error:", error);
    return NextResponse.json({ translations: [] }, { status: 500 });
  }
}
