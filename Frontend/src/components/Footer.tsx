/**
 * Footer Component
 * Footer with links, contact information, and social media icons
 */

import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Twitter, Youtube, ArrowUp } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const Footer: React.FC = () => {
  const { t } = useI18n();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#1e3a5f] text-white w-full">
      <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Footer Links - responsive wrap and gap */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
          <Link
            to="/about"
            className="text-xs sm:text-sm hover:text-[#ff791a] transition-colors py-1"
          >
            {t("footer.links.aboutUs")}
          </Link>
          <Link
            to="/contact"
            className="text-xs sm:text-sm hover:text-[#ff791a] transition-colors py-1"
          >
            {t("footer.links.contactUs")}
          </Link>
          <Link
            to="/privacy-policy"
            className="text-xs sm:text-sm hover:text-[#ff791a] transition-colors py-1"
          >
            {t("footer.links.websitePolicies")}
          </Link>
          <Link
            to="/terms-and-conditions"
            className="text-xs sm:text-sm hover:text-[#ff791a] transition-colors py-1"
          >
            Terms & Conditions
          </Link>
          <Link
            to="/user-rights"
            className="text-xs sm:text-sm hover:text-[#ff791a] transition-colors py-1"
          >
            User Rights
          </Link>
          <Link
            to="/feedback"
            className="text-xs sm:text-sm hover:text-[#ff791a] transition-colors py-1"
          >
            {t("footer.links.faq")}
          </Link>
        </div>

        {/* Social Media Icons */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <a
            href="#"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-[#ff791a] flex items-center justify-center transition-colors flex-shrink-0"
            aria-label={t("footer.social.facebook")}
          >
            <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>
          <a
            href="#"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-[#ff791a] flex items-center justify-center transition-colors flex-shrink-0"
            aria-label={t("footer.social.twitter")}
          >
            <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>
          <a
            href="#"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-[#ff791a] flex items-center justify-center transition-colors flex-shrink-0"
            aria-label={t("footer.social.youtube")}
          >
            <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>
        </div>

        {/* Contact Information */}
        <div className="text-center text-xs sm:text-sm text-white/80 mb-3 sm:mb-4 px-1">
          <p className="mb-2">{t("footer.contact.queryText")}</p>
          <p className="mb-2">{t("footer.contact.contactPerson")}</p>
          <p className="mb-2">
            {t("footer.contact.emailLabel")}{" "}
            <a
              href="mailto:jansunwai-up@gov.in"
              className="text-[#ff791a] hover:underline"
            >
              jansunwai-up@gov.in
            </a>
          </p>
        </div>

        {/* Copyright and Last Updated */}
        <div className="text-center text-[10px] sm:text-xs text-white/60 border-t border-white/20 pt-3 sm:pt-4">
          <p className="mb-1">
            {t("footer.copyright.lastUpdated")}{" "}
            {new Date().toLocaleDateString()}
          </p>
          <p className="mb-1">{t("footer.copyright.vishnu")}</p>
          <p>{t("footer.copyright.content")}</p>
        </div>
      </div>

      {/* Scroll to Top Button - position above chatbot on mobile to avoid overlap */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 w-11 h-11 sm:w-12 sm:h-12 bg-[#ff791a] hover:bg-[#e66a15] rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </button>
    </footer>
  );
};

export default Footer;
