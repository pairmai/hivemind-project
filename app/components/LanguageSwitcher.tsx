"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";

export default function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();

  const toggleLanguage = () => {
    const newLocale = locale === "en" ? "th" : "en";
    const newPathname = `/${newLocale}${window.location.pathname.replace(/^\/(en|th)/, "")}`;
    router.push(newPathname);
  };
  return (
    <button
      onClick={toggleLanguage}
      className="absolute top-4 left-4 flex items-center p-2 bg-white rounded-full shadow-md hover:bg-gray-200 text-sm"
    >
      <FontAwesomeIcon icon={faGlobe} className="mr-2" />
      <span>{locale === "en" ? "English" : "ไทย"}</span>
    </button>
  );
}