import { useLanguage } from "../context/LanguageContext";
import { Button } from "./ui/button";
import { Globe } from "lucide-react";

const LanguageSwitcher = ({ variant = "icon" }) => {
  const { language, toggleLanguage } = useLanguage();

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLanguage}
        className="text-slate-500 hover:text-slate-900"
        title={language === "fi" ? "Switch to English" : "Vaihda suomeksi"}
      >
        <Globe className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={toggleLanguage}
      className="rounded-full"
    >
      <Globe className="w-4 h-4 mr-2" />
      {language === "fi" ? "English" : "Suomi"}
    </Button>
  );
};

export default LanguageSwitcher;
