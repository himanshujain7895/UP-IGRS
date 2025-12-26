/**
 * Officer Layout Component
 * Sidebar-based layout for officer pages with saffron theme
 */

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  Settings,
  LogOut,
  Menu,
  User,
  Home,
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => {
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
      path: "/officer/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out relative",
          sidebarOpen ? (sidebarCollapsed ? "w-16" : "w-64") : "w-0"
        )}
      >
        <Sidebar
          className={cn(!sidebarOpen && "hidden", sidebarCollapsed && "w-16")}
        >
          <SidebarHeader>
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-bold gradient-orange-text">
                    Officer Panel
                  </h1>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="w-full flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-sidebar-accent"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  title={
                    sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                >
                  {sidebarCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8"
                  onClick={() => setSidebarOpen(false)}
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
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      active={isItemActive}
                      icon={
                        sidebarCollapsed ? (
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                              isItemActive
                                ? "bg-primary text-primary-foreground"
                                : "bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                        ) : (
                          <Icon className="w-5 h-5" />
                        )
                      }
                      onClick={() => navigate(item.path)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        sidebarCollapsed &&
                          "justify-center px-2 bg-transparent hover:bg-transparent"
                      )}
                    >
                      {!sidebarCollapsed && item.label}
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
                  <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-sidebar-accent">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
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
                    className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center py-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={handleLogout}
                      title="Logout"
                      className="w-8 h-8 rounded-lg flex items-center justify-center bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-orange-200 shadow-sm h-16 flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
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

