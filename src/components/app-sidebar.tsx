"use client";

import { Home } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLACEHOLDER_PAGES } from "@/lib/placeholder-pages";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar className="border-border bg-sidebar text-foreground">
      <SidebarHeader className="px-3 py-4">
        <span className="text-sm font-medium text-muted">
          shi_studygram
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive
                  className="text-[14px] leading-[1.4] hover:bg-hover data-[active=true]:bg-hover data-[active=true]:text-accent"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted">
            Pages
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PLACEHOLDER_PAGES.map((page) => (
                <SidebarMenuItem key={page.title}>
                  <SidebarMenuButton
                    className="text-[14px] leading-[1.4] hover:bg-hover"
                    onClick={(e) => e.preventDefault()}
                  >
                    <span className="text-base">{page.icon}</span>
                    <span>{page.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="flex items-center justify-end px-2 py-2">
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
