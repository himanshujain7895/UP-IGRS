/**
 * App Layout Component
 * Simple header with logo and login button
 */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Home, FilePlus, Search, Calendar, LogIn, Globe, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock body scroll when mobile nav overlay is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navigationItems = [
    { type: "route", path: "/", icon: Home, label: "Home" },
    {
      type: "route",
      path: "/file-complaint",
      icon: FilePlus,
      label: "New Complaint",
    },
    { type: "route", path: "/track", icon: Search, label: "Track" },
    {
      type: "route",
      path: "/request-meeting",
      icon: Calendar,
      label: "Meeting",
    },
  ];

  const handleNavigation = (item: (typeof navigationItems)[0]) => {
    navigate(item.path);
  };

  const handleAdminAccess = () => {
    navigate("/admin");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const isHomePage = location.pathname === "/";

  // Same blue header and nav for all pages (Home, File Complaint, Privacy Policy, etc.)
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header - Blue/Dark Header (same on all pages) */}
      <header className="bg-[#1e3a5f] text-white shadow-lg shrink-0">
          {/* Top Header Bar */}
          <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16 min-h-[3.5rem]">
              {/* Logo and Title */}
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden flex-shrink-0">
                  <img
                    src="https://raw.githubusercontent.com/himanshujainsanghai/Images/refs/heads/main/bjp_logo.avif"
                    alt="BJP Logo"
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-white truncate">
                  {t("header.logo.title")}
                </h1>
              </div>

              {/* Right side: on mobile/tablet only hamburger; on desktop language + login */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Hamburger - visible only when nav is hidden (below lg) */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
                {/* Language Selector - hidden in header on mobile/tablet (moved to sidebar) */}
                <div className="hidden lg:block">
                  <Select
                    value={language}
                    onValueChange={(value: "hindi" | "english") =>
                      setLanguage(value)
                    }
                  >
                    <SelectTrigger className="h-9 w-[100px] sm:w-[130px] bg-white/10 hover:bg-white/20 border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:ring-offset-0 data-[state=open]:bg-white/20 flex-shrink-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        <SelectValue className="text-xs sm:text-sm font-medium truncate">
                          {t(`header.language.${language}`)}
                        </SelectValue>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg min-w-[140px] z-[110]">
                      <SelectItem
                        value="hindi"
                        className="cursor-pointer py-2.5 focus:bg-[#ff791a]/10 focus:text-[#ff791a] data-[highlighted]:bg-[#ff791a]/10"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">
                            {t("header.language.hindi")}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            Hindi
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="english"
                        className="cursor-pointer py-2.5 focus:bg-[#ff791a]/10 focus:text-[#ff791a] data-[highlighted]:bg-[#ff791a]/10"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium text-sm">
                            {t("header.language.english")}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            अंग्रेजी
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Login/Admin Button - hidden in header on mobile/tablet (moved to sidebar) */}
                <div className="hidden lg:block">
                  {!isAuthenticated && (
                    <Button
                      onClick={handleLogin}
                      className="flex items-center space-x-2 bg-[#ff791a] hover:bg-[#e66a15] text-white border-0"
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {t("header.login.officerLogin")}
                      </span>
                      <span className="sm:hidden">Login</span>
                    </Button>
                  )}
                  {isAuthenticated && (
                    <Button
                      onClick={handleAdminAccess}
                      variant="outline"
                      className="flex items-center space-x-2 border-white text-white bg-white/10 hover:bg-white/20 hover:text-blue-500"
                    >
                      <span>{t("header.login.adminPanel")}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar - hidden on mobile/tablet, shown on lg+ */}
          <nav className="hidden lg:block bg-[#2a4a6f] border-t border-[#3a5a7f]">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 md:gap-6 h-12 overflow-x-auto">
                <Link
                  to="/"
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors whitespace-nowrap"
                >
                  {t("header.navigation.home")}
                </Link>
                <Link
                  to="/about"
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors whitespace-nowrap"
                >
                  {t("header.navigation.about")}
                </Link>
                <Link
                  to="/contact"
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors whitespace-nowrap"
                >
                  {t("header.navigation.contact")}
                </Link>
                <Link
                  to="/feedback"
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors whitespace-nowrap"
                >
                  {t("header.navigation.feedback")}
                </Link>
                <Link
                  to="/privacy-policy"
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors whitespace-nowrap"
                >
                  {t("header.navigation.privacyPolicy")}
                </Link>
                <Link
                  to="/terms-and-conditions"
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors whitespace-nowrap"
                >
                  {t("header.navigation.termsAndConditions")}
                </Link>
                <Link
                  to="/user-rights"
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors whitespace-nowrap"
                >
                  {t("header.navigation.userRights")}
                </Link>
              </div>
            </div>
          </nav>
        </header>

        {/* Mobile/Tablet Nav Overlay - right-side drawer */}
        <div
          className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-300 ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={!mobileMenuOpen}
        >
          {/* Backdrop */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Close menu"
          />
          {/* Drawer panel from right */}
          <div
            className={`absolute top-0 right-0 h-full w-[min(320px,85vw)] max-w-full bg-[#2a4a6f] border-l border-[#3a5a7f] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
              mobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-[#3a5a7f] shrink-0">
              <span className="text-white font-semibold">{t("header.logo.title")}</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {/* Sidebar: Language + Admin/Login (only on mobile/tablet) */}
            <div className="px-4 py-3 border-b border-[#3a5a7f] space-y-3 shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-white/80 flex-shrink-0" />
                <Select
                  value={language}
                  onValueChange={(value: "hindi" | "english") =>
                    setLanguage(value)
                  }
                >
                  <SelectTrigger className="h-10 flex-1 bg-white/10 hover:bg-white/20 border-white/30 text-white focus:ring-2 focus:ring-white/50 focus:ring-offset-0 data-[state=open]:bg-white/20">
                    <SelectValue className="text-sm font-medium">
                      {t(`header.language.${language}`)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-lg min-w-[140px] z-[110]" position="popper">
                    <SelectItem
                      value="hindi"
                      className="cursor-pointer py-2.5 focus:bg-[#ff791a]/10 focus:text-[#ff791a] data-[highlighted]:bg-[#ff791a]/10"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">
                          {t("header.language.hindi")}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          Hindi
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="english"
                      className="cursor-pointer py-2.5 focus:bg-[#ff791a]/10 focus:text-[#ff791a] data-[highlighted]:bg-[#ff791a]/10"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm">
                          {t("header.language.english")}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          अंग्रेजी
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!isAuthenticated ? (
                <Button
                  onClick={() => {
                    handleLogin();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-[#ff791a] hover:bg-[#e66a15] text-white border-0 h-10"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t("header.login.officerLogin")}</span>
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    handleAdminAccess();
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="w-full border-white text-white bg-white/10 hover:bg-white/20 hover:text-white h-10"
                >
                  <span>{t("header.login.adminPanel")}</span>
                </Button>
              )}
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-4">
              <div className="flex flex-col gap-1">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors py-3 px-3 rounded-lg hover:bg-white/5"
                >
                  {t("header.navigation.home")}
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors py-3 px-3 rounded-lg hover:bg-white/5"
                >
                  {t("header.navigation.about")}
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors py-3 px-3 rounded-lg hover:bg-white/5"
                >
                  {t("header.navigation.contact")}
                </Link>
                <Link
                  to="/feedback"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors py-3 px-3 rounded-lg hover:bg-white/5"
                >
                  {t("header.navigation.feedback")}
                </Link>
                <Link
                  to="/privacy-policy"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors py-3 px-3 rounded-lg hover:bg-white/5"
                >
                  {t("header.navigation.privacyPolicy")}
                </Link>
                <Link
                  to="/terms-and-conditions"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors py-3 px-3 rounded-lg hover:bg-white/5"
                >
                  {t("header.navigation.termsAndConditions")}
                </Link>
                <Link
                  to="/user-rights"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-white hover:text-[#ff791a] transition-colors py-3 px-3 rounded-lg hover:bg-white/5"
                >
                  {t("header.navigation.userRights")}
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Main content: full-width for Home, container for other pages */}
        {isHomePage ? (
          <main className="flex-1">{children}</main>
        ) : (
          <>
            <main className="flex-1 pb-20 md:pb-0">
              <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 md:py-8">
                {children}
              </div>
            </main>
            {/* Mobile Bottom Navigation - quick access on non-home pages */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-orange-200 bg-white/95 backdrop-blur-lg shadow-lg">
              <div className="flex items-center justify-around px-2 py-2">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleNavigation(item)}
                      className={`flex flex-col items-center justify-center w-full py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <IconComponent className="w-6 h-6 mb-1 transition-colors duration-200" />
                      <span className="text-xs font-semibold tracking-tight">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

export default AppLayout;
