"use client";

import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { Home, Music } from "lucide-react";
import { usePathname } from "next/navigation";

export default function SidebarMenuItems() {
  const path = usePathname();

  let items = [
    {
      title: "主页",
      url: "/",
      icon: Home,
      active: false,
    },
    {
      title: "创作",
      url: "/create",
      icon: Music,
      active: false,
    },
  ];

  items = items.map((item) => ({
    ...item,
    active: path === item.url,
  }));

  return (
    <>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.active}>
            <a href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
}
