"use client";

import { BreadcrumbPage } from "../ui/breadcrumb";
import { usePathname } from "next/navigation";

export default function BreadcrumbPageClient() {
  const path = usePathname();

  return (
    <BreadcrumbPage>
      {path === "/" && "主页"}
      {path === "/create" && "创作"}
    </BreadcrumbPage>
  );
}
