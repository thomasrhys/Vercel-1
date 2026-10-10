// app/api/translate/route.ts
import { NextRequest, NextResponse } from "next/server";

async function translateOne(text: string) {
  try {
    const res = await fetch("https://api.techiaith.cymru/translate/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        src: "en",
        tgt: "cy",
      }),
    });

    if (!res.ok) {
      console.error("techiaith status:", res.status, await res.text());
      return text;
    }

    const data = await res.json();
    console.log("RAW TECHIAITH RESPONSE FOR:", text, JSON.stringify(data));
    return data.text || text;
  } catch (err) {
    console.error("translateOne threw:", err); // <-- was a bare catch with nothing, now logs the real error
    return text;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { texts } = await request.json();

    if (!Array.isArray(texts)) {
      return NextResponse.json({ translations: [] });
    }

    const translations = await Promise.all(texts.map(translateOne));

    return NextResponse.json({ translations });
  } catch {
    return NextResponse.json({ translations: [] }, { status: 500 });
  }
}
