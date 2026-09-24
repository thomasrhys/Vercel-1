// app/api/translate-policy/route.ts
import { NextResponse } from "next/server";

async function translateText(englishText: string): Promise<string> {
  try {
    const res = await fetch("https://api.techiaith.cymru/translate/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: englishText, src: "en", tgt: "cy" }),
      next: { revalidate: 86400 }, // Cache on Vercel globally for 24 hours
    });
    if (!res.ok) throw new Error("Techiaith API issue");
    const data = await res.json();
    return data.text || englishText;
  } catch (error) {
    console.error("Techiaith engine error:", error);
    return englishText;
  }
}

export async function POST() {
  const headings = {
    title: "Polisi Preifatrwydd",
    info: "Gwybodaeth Rydym yn ei Chasglu",
    use: "Sut Rydym yn Defnyddio Gwybodaeth",
    login: "Mewngofnodi i Gyfrif",
    games: "Gemau Trydydd Parti",
    email: "Hysbysiadau E-bost",
    children: "Preifatrwydd Plant",
    retention: "Cadw Data",
    thirdParty: "Gwasanaethau Trydydd Parti",
    contact: "Cyswllt",
    btnBack: "Yn ôl i'r Gemau",
    thService: "Gwasanaeth",
    thPurpose: "Pwrpas",
    thPolicy: "Polisi Preifatrwydd",
    linkText: "Gweld y polisi",
    contactText: "Ar gyfer cwestiynau preifatrwydd, ymholiadau cyffredinol, neu awgrymiadau, cysylltwch â ni yn",
    copyrightText: "Ar gyfer pryderon hawlfraint, DMCA, nod masnach, neu dynnu cynnwys i lawr, cysylltwch â",
    effectiveDate: "Dyddiad Effeithiol: 1 Gorffennaf 2026",
    lastUpdated: "Diweddarwyd Diwethaf: 1 Gorffennaf 2026",
  };

  const paragraphs = {
    intro: "Mae'r Polisi Preifatrwydd hwn yn berthnasol i'r Porth Gemau ac yn egluro sut mae gwybodaeth yn cael ei thrin pan fyddwch chi'n defnyddio'r wefan hon.",
    infoText: "Gall chwaraewyr bori a chwarae gemau heb greu cyfrif. Os ydych chi'n defnyddio'r ffurflen Gofyn am Gêm, rydym yn casglu'r enw gêm rydych chi'n ei chyflwyno, unrhyw ddolen ddewisol, ac unrhyw sylwadau dewisol rydych chi'n eu darparu.",
    useText: "Defnyddir gwybodaeth am geisiadau gêm i adolygu gemau posibl i'w hychwanegu i'r porth, cyfrif sawl gwaith y mae gêm wedi' wedi'i cheisio, ac anfon e-bost hysbysu at weinyddwr y safle.",
    loginText: "Darperir mewngofnodi cyfrif, cofrestru, a dilysu gan ddefnyddio Supabase. Gallwch fewngofnodi gan ddefnyddio e-bost a chyfrinair, rhif ffôn, cyfrif Google, cyfrif GitHub, neu unrhyw ddulliau dilysu eraill y gall y Porth Gemau eu cynnig yn y dyfodol.",
    gamesText: "Gellir ymgorffori rhai gemau o wefannau trydydd parti. Gall fod gan y gwefannau hynny eu polisïau preifatrwydd, cwcis, dadansoddeg neu olrhain eu hunain. Nid ydym yn rheoli darparwyr gemau trydydd parti.",
    emailText: "Gall ceisiadau gêm anfon hysbysiad e-bost at berchennog y safle gan ddefnyddio Resend. Gellir cynnwys cynnwys y cais yn yr hysbysiad hwnnw.",
    childrenText: "Nid yw'r Porth Gemau wedi'i gyfeirio'n benodol at blant. Nid ydym yn casglu gwybodaeth bersonol yn ymwybodol oddi wrth blant. Ni ddylid defnyddio'r ffurflen Gofyn am Gêm i gyflwyno gwybodaeth bersonol. Os byddwn yn dod yn ymwybodol bod gwybodaeth bersonol wedi'i chyflwyno gan blentyn, byddwn yn cymryd camau rhesymol i'w thynnu.",
    retentionText: "Gellir storio ceisiadau gêm nes eu bod yn cael eu hadolygu, eu cwblhau, neu eu tynnu gan weinyddwr.",
    thirdPartyText: "Mae'r wefan hon yn dibynnu ar wasanaethau trydydd parti dibynadwy i weithredu. Mae'r gwasanaethau hyn yn gweithredu'n annibynnol ac yn prosesu gwybodaeth yn ôl eu polisïau preifatrwydd eu hunain.",
    githubPurpose: "Hosting cod ffynhonnell a rheoli fersiynau",
    vercelPurpose: "Hosting gwefan, defnyddiau, a storfa Blob",
    supabasePurpose: "Cronfa ddata, mewngofnodi, cofrestru, dilysu, a gwasanaethau cefn",
    cloudflarePurpose: "DNS a danfon e-bost",
  };

  return NextResponse.json({ headings, paragraphs });
}
