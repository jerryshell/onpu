import { Credits } from "./credits";
import SidebarMenuItems from "./sidebar-menu-items";
import Upgrade from "./upgrade";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { UserButton } from "@daveyplate/better-auth-ui";
import { User } from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary mt-4 mb-14 flex flex-col items-start justify-start px-2 text-3xl font-black tracking-widest uppercase">
            <p>Onpu</p>
            <p className="text-lg">AI 音乐生成</p>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItems />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="mb-2 flex w-full items-center justify-center gap-1 text-xs">
          <ThemeToggle />
          <Credits />
          <Upgrade />
        </div>
        <UserButton
          variant="outline"
          additionalLinks={[
            {
              label: "Customer Portal",
              href: "/customer-portal",
              icon: <User />,
            },
          ]}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
