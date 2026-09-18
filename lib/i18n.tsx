"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "cy";

const translations: Record<Language, Record<string, string>> = {
  en: {
    "Back to Account": "Back to Account",
    "Loading profile extras...": "Loading profile extras...",
    "Sign in to edit your public profile extras.": "Sign in to edit your public profile extras.",
    "Saving...": "Saving...",
    "Save profile extras": "Save profile extras",
    "Profile extras": "Profile extras",
    "Add optional public profile details. Recently played games are not tracked.": "Add optional public profile details. Recently played games are not tracked.",
    "Something went wrong.": "Something went wrong.",
    "Internal Server Error": "Internal Server Error",
    "We're sorry, something went wrong while loading this profile. Please try again later.": "We're sorry, something went wrong while loading this profile. Please try again later.",
    "Retry": "Retry",
    "Account Settings": "Account Settings",
    "Profile": "Profile",
    "Choose what appears on your public profile.": "Choose what appears on your public profile.",
    "Manage account": "Manage account",
    "Update your email, password, or linked sign-in methods.": "Update your email, password, or linked sign-in methods.",
    "Save profile": "Save profile",
    "View public profile": "View public profile",
    "Back to Games": "Back to Games",
    "Back to All Games": "Back to All Games",
    "Log out": "Log out",
    "Loading account...": "Loading account...",
    "Language": "Language",
    "English": "English",
    "Welsh": "Welsh",
    "Display name": "Display name",
    "username": "username",
    "Bio": "Bio",
    "Accent colour": "Accent colour",
    "Public profile": "Public profile",
    "Avatar URL": "Avatar URL",
    "Loading game...": "Loading game...",
    "Game not found": "Game not found",
    "This game may have been removed or hidden.": "This game may have been removed or hidden.",
    "Loading favourites...": "Loading favourites...",
    "Sign in to view favourites": "Sign in to view favourites",
    "Login": "Login",
    "Sign Up": "Sign Up",
    "Create Account": "Create Account",
    "You are signed in": "You are signed in",
    "Continue": "Continue",
    "Please wait...": "Please wait...",
    "Search games...": "Search games...",
    "All": "All",
    "Favourites": "Favourites",
    "Featured": "Featured",
    "New Games": "New Games",
    "Add to favourites": "Add to favourites",
    "Removed from favourites": "Removed from favourites",
    "Link copied": "Link copied",
    "Share": "Share",
    "Game Portal": "Game Portal",
    "© 2026 Game Portal": "© 2026 Game Portal",
    "NEW": "NEW",
    "Desktop Only": "Desktop Only",
    "This game is not supported on mobile devices. Please use a desktop or laptop.": "This game is not supported on mobile devices. Please use a desktop or laptop.",
    "Play": "Play",
    "Details →": "Details →",
    "Categories": "Categories",
    "Show All": "Show All",
    "game": "game",
    "games": "games",
    "found": "found",
    "available": "available",
    "in": "in",
    "Featured Games": "Featured Games",
    "All Games": "All Games",
    "No games found": "No games found",
    "Try a different search term or category.": "Try a different search term or category.",
    "We'll be back soon": "We'll be back soon",
    "The games portal is currently under maintenance. Please check back later.": "The games portal is currently under maintenance. Please check back later.",
    "Request a Game": "Request a Game",
    "Contact": "Contact",
    "Privacy Policy": "Privacy Policy",
    "Terms of Use": "Terms of Use",
    "Back to Top": "Back to Top",
    "Admin": "Admin",
  },
  cy: {
    "Back to Account": "Yn ôl i'r Cyfrif",
    "Loading profile extras...": "Wrthi'n llwytho ychwanegion proffil...",
    "Sign in to edit your public profile extras.": "Mewngofnodwch i olygu ychwanegion eich proffil cyhoeddus.",
    "Saving...": "Wrthi'n cadw...",
    "Save profile extras": "Cadw manylion ychwanegol y proffil",
    "Profile extras": "Ychwanegiadau Proffil",
    "Add optional public profile details. Recently played games are not tracked.": "Ychwanegwch fanylion proffil cyhoeddus dewisol. Ni chaiff gemau a chwaraewyd yn ddiweddar eu holrhain.",
    "Something went wrong.": "Aeth rhywbeth o'i le.",
    "Internal Server Error": "Gwall Gweinydd Mewnol",
    "We're sorry, something went wrong while loading this profile. Please try again later.": "Mae'n ddrwg gennym, aeth rhywbeth o'i le wrth lwytho'r proffil hwn. Rhowch gynnig arall arni yn nes ymlaen.",
    "Retry": "Ceisiwch Eto",
    "Account Settings": "Gosodiadau Cyfrif",
    "Profile": "Proffil",
    "Choose what appears on your public profile.": "Dewiswch beth sy'n ymddangos ar eich proffil cyhoeddus.",
    "Manage account": "Rheoli cyfrif",
    "Update your email, password, or linked sign-in methods.": "Diweddarwch eich e-bost, cyfrinair, neu ddulliau mewngofnodi cysylltiedig.",
    "Save profile": "Cadw proffil",
    "View public profile": "Gweld proffil cyhoeddus",
    "Back to Games": "Nôl i'r gemau",
    "Back to All Games": "Nôl i bob gêm",
    "Log out": "Allgofnodi",
    "Loading account...": "Wrthi'n llwytho'r cyfrif...",
    "Language": "Iaith",
    "English": "Saesneg",
    "Welsh": "Cymraeg",
    "Display name": "Enw i'w arddangos",
    "username": "Enw defnyddiwr",
    "Bio": "Bywgraffiad",
    "Accent colour": "Lliw acen",
    "Public profile": "Proffil cyhoeddus",
    "Avatar URL": "URL avatar",
    "Loading game...": "Wrthi'n llwytho'r gêm...",
    "Game not found": "Heb ddod o hyd i'r gêm",
    "This game may have been removed or hidden.": "Efallai bod y gêm hon wedi'i thynnu neu ei chuddio.",
    "Loading favourites...": "Wrthi'n llwytho ffefrynnau...",
    "Sign in to view favourites": "Mewngofnodwch i weld ffefrynnau",
    "Login": "Mewngofnodi",
    "Sign Up": "Cofrestru",
    "Create Account": "Creu cyfrif",
    "You are signed in": "Rydych wedi mewngofnodi",
    "Continue": "Parhau",
    "Please wait...": "Arhoswch...",
    "Search games...": "Chwilio gemau...",
    "All": "Popeth",
    "Favourites": "Ffefrynnau",
    "Featured": "Arweiniol",
    "New Games": "Gemau newydd",
    "Add to favourites": "Ychwanegu at y ffefrynnau",
    "Removed from favourites": "Wedi tynnu o'r ffefrynnau",
    "Link copied": "Dolen wedi'i chopïo",
    "Share": "Rhannu",
    "Game Portal": "Porth y Gemau",
    "© 2026 Game Portal": "© 2026 Porth y Gemau",
    "NEW": "NEW",
    "Desktop Only": "Cyfrifiadur yn unig",
    "This game is not supported on mobile devices. Please use a desktop or laptop.": "Nid yw'r gêm hon yn cefnogi dyfeisiau symudol. Defnyddiwch gyfrifiadur pen desg neu liniadur.",
    "Play": "Chwarae",
    "Details →": "Manylion →",
    "Categories": "Categorïau",
    "Show All": "Dangos popeth",
    "game": "gêm",
    "games": "gemau",
    "found": "wedi'u canfod",
    "available": "ar gael",
    "in": "yn",
    "Featured Games": "Gemau dan sylw",
    "All Games": "Pob gêm",
    "No games found": "Heb ddod o hyd i unrhyw gemau",
    "Try a different search term or category.": "Rhowch gynnig ar derm chwilio neu gategori gwahanol.",
    "We'll be back soon": "Byddwn yn ôl yn fuan",
    "The games portal is currently under maintenance. Please check back later.": "Mae porth y gemau dan waith cynnal a chadw ar hyn o bryd. Dewch yn ôl yn nes ymlaen.",
    "Request a Game": "Gofyn am gêm",
    "Contact": "Cysylltu",
    "Privacy Policy": "Polisi preifatrwydd",
    "Terms of Use": "Telerau defnyddio",
    "Back to Top": "Nôl i'r brig",
    "Admin": "Gweinyddwr",
  },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => undefined,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("site-language");
    if (saved === "cy" || saved === "en") {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem("site-language", next);
    document.documentElement.lang = next;
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function t(key: string) {
  const lang =
    typeof window !== "undefined"
      ? (window.localStorage.getItem("site-language") || "en")
      : "en";

  return translations[lang as Language]?.[key] ?? key;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
