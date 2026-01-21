import { useLanguage } from "../context/LanguageContext";
import { Button } from "./ui/button";

const LanguageSwitcher = ({ variant = "icon" }) => {
  const { language, toggleLanguage } = useLanguage();

  // Flag emojis
  const flags = {
    fi: "🇫🇮",
    en: "🇬🇧"
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLanguage}
        className="text-lg hover:bg-slate-100"
        title={language === "fi" ? "Switch to English" : "Vaihda suomeksi"}
      >
        {flags[language]}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={toggleLanguage}
      className="rounded-full"
    >
      <span className="text-lg mr-2">{flags[language]}</span>
      {language === "fi" ? "English" : "Suomi"}
    </Button>
  );
};

export default LanguageSwitcher;
