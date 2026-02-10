/**
 * Admin Layout Component
 * Sidebar-based layout for admin pages with saffron theme
 */

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationContext } from "@/contexts/NotificationContext";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  MapPin,
  User,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  Droplets,
  Zap,
  HeartPulse,
  BookOpenCheck,
  Building,
  Briefcase,
  Leaf,
  Truck,
  FileQuestion,
  Calendar,
  Package,
  FolderOpen,
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuGroup,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface VillageStats {
  geocoded: number;
  total: number;
  percentageComplete: number;
}

interface ComplaintsByStatus {
  pending?: number;
  in_progress?: number;
  resolved?: number;
  rejected?: number;
  [key: string]: number | undefined;
}

interface StatsProps {
  totalComplaints: number;
  complaintsByStatus: ComplaintsByStatus;
  villageStats?: VillageStats | null;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  stats?: StatsProps;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, stats }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isOfficer } = useAuth();
  const { unreadCount: notificationUnreadCount } = useNotificationContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Mobile (< 1150px): start with sidebar closed so content is full width; desktop: keep open
  useEffect(() => {
    const isMobile = window.innerWidth < 1150;
    if (isMobile) setSidebarOpen(false);
  }, []);

  // Mobile (< 1150px): close sidebar when user navigates (e.g. clicks a menu link)
  useEffect(() => {
    const isMobile = window.innerWidth < 1150;
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (path: string) => {
    // Special-case dashboard so it isn't 'active' for every /admin/* route
    if (path === "/admin") {
      return (
        location.pathname === "/admin" ||
        location.pathname === "/admin/dashboard"
      );
    }

    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const menuItems = [
    {
      type: "item",
      path: "/admin",
      icon: LayoutDashboard,
      label: "Dashboard",
      exact: true,
    },
    // {
    //   type: "item",
    //   path: "/admin/india-map",
    //   icon: MapPin,
    //   label: "India Map",
    // },
    {
      type: "group",
      label: "Complaints",
      icon: FileText,
      items: [
        {
          path: "/admin/complaints",
          label: "All Complaints",
          icon: FileText,
          exact: true,
        },
        // { path: "/admin/complaints/heatmap", label: "Heat Map", icon: MapPin },
        { path: "/admin/complaints/pending", label: "Pending", icon: Clock },
        {
          path: "/admin/complaints/in-progress",
          label: "In Progress",
          icon: AlertCircle,
        },
        {
          path: "/admin/complaints/resolved",
          label: "Resolved",
          icon: CheckCircle,
        },
        {
          path: "/admin/complaints/rejected",
          label: "Rejected",
          icon: XCircle,
        },
        {
          type: "subgroup",
          label: "By Category",
          items: [
            {
              path: "/admin/complaints/category/roads",
              label: "Roads & Infrastructure",
              icon: Wrench,
            },
            {
              path: "/admin/complaints/category/water",
              label: "Water Supply",
              icon: Droplets,
            },
            {
              path: "/admin/complaints/category/electricity",
              label: "Electricity",
              icon: Zap,
            },
            {
              path: "/admin/complaints/category/documents",
              label: "Documents & Certificates",
              icon: FileText,
            },
            {
              path: "/admin/complaints/category/health",
              label: "Health Services",
              icon: HeartPulse,
            },
            {
              path: "/admin/complaints/category/education",
              label: "Education",
              icon: BookOpenCheck,
            },
          ],
        },
      ],
    },
    {
      type: "group",
      label: "Meetings",
      icon: Calendar,
      items: [
        {
          path: "/admin/meetings",
          label: "All Meetings",
          icon: Calendar,
          exact: true,
        },
        {
          path: "/admin/meetings/pending",
          label: "Pending Requests",
          icon: Clock,
        },
        {
          path: "/admin/meetings/approved",
          label: "Approved",
          icon: CheckCircle,
        },
        {
          path: "/admin/meetings/completed",
          label: "Completed",
          icon: CheckCircle,
        },
      ],
    },
    {
      type: "group",
      label: "Inventory",
      icon: Package,
      items: [
        {
          path: "/admin/inventory",
          label: "All Items",
          icon: Package,
          exact: true,
        },
        { path: "/admin/inventory/add", label: "Add New Item", icon: Package },
        { path: "/admin/inventory/by-type", label: "By Type", icon: Package },
        {
          path: "/admin/inventory/by-location",
          label: "By Location",
          icon: Package,
        },
      ],
    },
    {
      type: "group",
      label: "Documents",
      icon: FolderOpen,
      items: [
        {
          path: "/admin/documents",
          label: "All Documents",
          icon: FolderOpen,
          exact: true,
        },
        {
          path: "/admin/documents/upload",
          label: "Upload Document",
          icon: FolderOpen,
        },
        {
          path: "/admin/documents/by-type",
          label: "By Type",
          icon: FolderOpen,
        },
      ],
    },
    {
      type: "group",
      label: "Reports",
      icon: BarChart3,
      items: [
        {
          path: "/admin/reports/complaints",
          label: "Complaint Reports",
          icon: BarChart3,
        },
        {
          path: "/admin/reports/status",
          label: "Status Summary",
          icon: BarChart3,
        },
        {
          path: "/admin/reports/inventory",
          label: "Inventory Reports",
          icon: BarChart3,
        },
        {
          path: "/admin/reports/financial",
          label: "Financial Summary",
          icon: BarChart3,
        },
      ],
    },
    {
      type: "item",
      path: "/admin/users",
      icon: Users,
      label: "User Management",
      adminOnly: true, // Only show to admins
    },
    {
      type: "item",
      path: "/admin/notifications",
      icon: Bell,
      label: "Notifications",
    },
    {
      type: "item",
      path: "/admin/complaints/my-complaints",
      icon: FileText,
      label: "My Complaints",
      officerOnly: true, // Only show to officers
    },
    {
      type: "item",
      path: "/admin/settings",
      icon: Settings,
      label: "Settings",
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.officerOnly && !isOfficer) return false;
    return true;
  });

  const renderMenuItem = (item: any, level = 0) => {
    if (item.type === "item") {
      const Icon = item.icon;
      const isItemActive = item.exact
        ? location.pathname === item.path
        : isActive(item.path);
      const isNotifications = item.path === "/admin/notifications";
      const showBadge = isNotifications && notificationUnreadCount > 0;
      return (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton
            active={isItemActive}
            icon={
              sidebarCollapsed ? (
                <div
                  className={cn(
                    "relative w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isItemActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-blue-900 text-white text-xs font-medium">
                      {notificationUnreadCount > 99
                        ? "99+"
                        : notificationUnreadCount}
                    </span>
                  )}
                </div>
              ) : (
                <span className="relative inline-flex">
                  <Icon className="w-5 h-5" />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-blue-900 text-white text-xs font-medium">
                      {notificationUnreadCount > 99
                        ? "99+"
                        : notificationUnreadCount}
                    </span>
                  )}
                </span>
              )
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
    }

    if (item.type === "group") {
      const isChildActive = (child: any) =>
        child.exact
          ? location.pathname === child.path
          : isActive(child.path);
      const hasActiveChild = item.items?.some((child: any) => {
        if (child.path) return isChildActive(child);
        if (child.items) {
          return child.items.some((subChild: any) => isActive(subChild.path));
        }
        return false;
      });

      // If collapsed, show only the group icon as a menu item
      if (sidebarCollapsed) {
        const GroupIcon = item.icon;
        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              active={hasActiveChild}
              icon={
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    hasActiveChild
                      ? "bg-primary text-primary-foreground"
                      : "bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <GroupIcon className="w-5 h-5" />
                </div>
              }
              onClick={() => setSidebarCollapsed(false)}
              title={item.label}
              className="justify-center px-2 bg-transparent hover:bg-transparent"
            >
              <span className="sr-only">{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      }

      return (
        <SidebarMenuGroup
          key={item.label}
          label={item.label}
          defaultOpen={hasActiveChild}
        >
          {item.items?.map((child: any) => {
            if (child.type === "subgroup") {
              return (
                <SidebarMenuGroup
                  key={child.label}
                  label={child.label}
                  defaultOpen={child.items?.some((subChild: any) =>
                    isActive(subChild.path)
                  )}
                >
                  {child.items?.map((subChild: any) => {
                    const SubIcon = subChild.icon;
                    return (
                      <SidebarMenuItem key={subChild.path}>
                        <SidebarMenuButton
                          active={isActive(subChild.path)}
                          icon={<SubIcon className="w-4 h-4" />}
                          onClick={() => navigate(subChild.path)}
                          className="pl-8"
                        >
                          {subChild.label}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenuGroup>
              );
            }

            const ChildIcon = child.icon;
            return (
              <SidebarMenuItem key={child.path}>
                <SidebarMenuButton
                  active={isChildActive(child)}
                  icon={<ChildIcon className="w-4 h-4" />}
                  onClick={() => navigate(child.path)}
                >
                  {child.label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenuGroup>
      );
    }

    return null;
  };

  const handleSidebarToggle = () => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 1150;
    if (isMobile) {
      setSidebarOpen((prev) => {
        if (!prev) setSidebarCollapsed(false);
        return !prev;
      });
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-orange-50 to-white overflow-hidden">
      {/* Backdrop: only on mobile (< 1150px) when sidebar is open (overlay mode) */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 min-[1150px]:hidden",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      {/* Sidebar wrapper: on mobile always 0 width (sidebar overlays); on desktop (>= 1150px) reserves space */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300 ease-in-out w-0",
          sidebarOpen && (sidebarCollapsed ? "min-[1150px]:w-16" : "min-[1150px]:w-64")
        )}
      />
      {/* Sidebar: fixed, slides in/out; on mobile full width when open, on desktop (>= 1150px) collapsed/expanded */}
      <Sidebar
        className={cn(
          "transition-transform duration-300 ease-in-out",
          "w-64 min-[1150px]:w-64",
          sidebarCollapsed && "min-[1150px]:w-16",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarHeader>
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-bold gradient-orange-text truncate">
                  Admin Panel
                </h1>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-full flex items-center justify-center">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Home className="w-5 h-5 " />
                </div>
              </div>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="min-[1150px]:hidden h-8 w-8"
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
              {filteredMenuItems.map((item) => renderMenuItem(item))}
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
                        {user?.name || "Admin"}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-orange-200 shadow-sm h-16 flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className={cn("mr-2", sidebarOpen && "min-[1150px]:hidden")}
            onClick={handleSidebarToggle}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden min-[1150px]:flex mr-2"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 hover:bg-orange-600 hover:text-white rounded-full" />
              ) : (
                <ChevronLeft className="w-5 h-5 hover:bg-orange-600 hover:text-white rounded-full" />
              )}
            </Button>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              {location.pathname === "/admin" && "Dashboard"}
              {location.pathname === "/admin/dashboard" &&
                "Mission 2027 Uttar Pradesh HeatMap"}
              {location.pathname === "/admin/india-map" && "India Map"}
              {location.pathname === "/admin/complaints/heatmap" &&
                "Complaints Heat Map"}
              {location.pathname.startsWith("/admin/complaints") &&
                location.pathname !== "/admin/complaints/heatmap" &&
                "Complaints Management"}
              {location.pathname.startsWith("/admin/meetings") && "Meetings"}
              {location.pathname.startsWith("/admin/inventory") && "Inventory"}
              {location.pathname.startsWith("/admin/documents") && "Documents"}
              {location.pathname.startsWith("/admin/reports") && "Reports"}
              {location.pathname.startsWith("/admin/settings") && "Settings"}
            </h2>
          </div>
        </header>

        {/* Page Content: min-w-0 so flex child doesn't overflow and clip right-side content */}
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {location.pathname === "/admin/dashboard" && stats && (
            <div className="mb-6">
              {/* Statistics Cards - KPI Tabs */}
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1">
                {/* Total Complaints */}
                <Card className="border-gray-300 min-w-[180px]">
                  <CardContent className="pt-3 pb-3 px-4">
                    <p className="text-xs text-gray-600 font-medium">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalComplaints}
                    </p>
                  </CardContent>
                </Card>

                {/* Pending */}
                <Card className="border-orange-300 bg-orange-50 min-w-[180px]">
                  <CardContent className="pt-3 pb-3 px-4">
                    <p className="text-xs text-orange-700 font-medium">
                      Pending
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.complaintsByStatus.pending || 0}
                    </p>
                  </CardContent>
                </Card>

                {/* In Progress */}
                <Card className="border-blue-300 bg-blue-50 min-w-[180px]">
                  <CardContent className="pt-3 pb-3 px-4">
                    <p className="text-xs text-blue-700 font-medium">
                      In Progress
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.complaintsByStatus.in_progress || 0}
                    </p>
                  </CardContent>
                </Card>

                {/* Resolved */}
                <Card className="border-green-300 bg-green-50 min-w-[180px]">
                  <CardContent className="pt-3 pb-3 px-4">
                    <p className="text-xs text-green-700 font-medium">
                      Resolved
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.complaintsByStatus.resolved || 0}
                    </p>
                  </CardContent>
                </Card>

                {/* Rejected */}
                <Card className="border-red-300 bg-red-50 min-w-[180px]">
                  <CardContent className="pt-3 pb-3 px-4">
                    <p className="text-xs text-red-700 font-medium">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.complaintsByStatus.rejected || 0}
                    </p>
                  </CardContent>
                </Card>

                {/* Villages Card */}
                {stats.villageStats && (
                  <Card className="border-blue-300 min-w-[180px]">
                    <CardContent className="pt-3 pb-3 px-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-xs text-gray-600 font-medium">
                            Villages
                          </p>
                          <p className="text-xl font-bold">
                            {stats.villageStats.geocoded}/
                            {stats.villageStats.total}
                          </p>
                          <p className="text-xs text-gray-500">
                            {stats.villageStats.percentageComplete.toFixed(1)}%
                            geocoded
                          </p>
                        </div>
                        <MapPin className="w-6 h-6 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
