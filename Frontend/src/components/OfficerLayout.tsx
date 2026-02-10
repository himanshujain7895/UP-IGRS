/**
 * Officer Layout Component
 * Sidebar-based layout for officer pages with saffron theme
 */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationContext } from "@/contexts/NotificationContext";
import {
  FileText,
  Settings,
  LogOut,
  Menu,
  User,
  Home,
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface OfficerLayoutProps {
  children: React.ReactNode;
}

const OfficerLayout: React.FC<OfficerLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount: notificationUnreadCount } = useNotificationContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Mobile (< 768px): start with sidebar closed so content is full width; desktop: keep open
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) setSidebarOpen(false);
  }, []);

  // Mobile: close sidebar when user navigates (e.g. clicks a menu link)
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => {
    // Root "/officer" only active on exact match, so Settings/Notifications don't also highlight My Complaints
    if (path === "/officer") {
      return location.pathname === "/officer";
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const menuItems = [
    {
      path: "/officer",
      icon: FileText,
      label: "My Complaints",
    },
    {
      path: "/officer/notifications",
      icon: Bell,
      label: "Notifications",
    },
    {
      path: "/officer/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Backdrop: only on mobile when sidebar is open (overlay mode) */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 md:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      {/* Sidebar spacer: on mobile always 0 width (sidebar overlays); on desktop reserves space */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out w-0",
          sidebarOpen && (sidebarCollapsed ? "md:w-16" : "md:w-64")
        )}
      />

      {/* Sidebar: fixed, slides in/out; on mobile overlays content when open */}
      <Sidebar
        className={cn(
          "transition-transform duration-300 ease-in-out",
          "w-64 md:w-64",
          sidebarCollapsed && "md:w-16",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarHeader>
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 flex-1">
                <Home className="w-5 h-5 text-sidebar-foreground" />
                <h1 className="text-xl font-semibold text-sidebar-foreground">
                  Officer Panel
                </h1>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-full flex items-center justify-center">
                <Home className="w-5 h-5 text-sidebar-foreground" />
              </div>
            )}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8 hover:bg-sidebar-accent"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </SidebarHeader>

          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = isActive(item.path);
                const isNotifications = item.path === "/officer/notifications";
                const showBadge =
                  isNotifications && notificationUnreadCount > 0;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      active={isItemActive}
                      icon={
                        <span className="relative inline-flex">
                          {sidebarCollapsed ? (
                            <Icon
                              className={cn(
                                "w-5 h-5 transition-colors",
                                isItemActive
                                  ? "text-primary"
                                  : "text-sidebar-foreground"
                              )}
                            />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                          {showBadge && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-blue-900 text-white text-xs font-medium">
                              {notificationUnreadCount > 99
                                ? "99+"
                                : notificationUnreadCount}
                            </span>
                          )}
                        </span>
                      }
                      onClick={() => navigate(item.path)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        sidebarCollapsed &&
                          "justify-center px-2 bg-transparent hover:bg-transparent"
                      )}
                    >
                      {!sidebarCollapsed && (
                        <>
                          {item.label}
                          {/* {showBadge && (
                            <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-medium">
                              {notificationUnreadCount > 99
                                ? "99+"
                                : notificationUnreadCount}
                            </span>
                          )} */}
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter>
            <div className="space-y-2">
              {!sidebarCollapsed ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md">
                    <User className="w-5 h-5 text-sidebar-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {user?.name || "Officer"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center py-2">
                    <User className="w-5 h-5 text-sidebar-foreground" />
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={handleLogout}
                      title="Logout"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-background border-b border-border shadow-sm h-16 flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn("mr-2", sidebarOpen && "md:hidden")}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex mr-2"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </Button>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              {location.pathname === "/officer" && "My Complaints"}
              {location.pathname.startsWith("/officer/settings") && "Settings"}
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default OfficerLayout;
