import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="flex flex-1">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <div className="min-w-0 flex-1 sm:pl-16 lg:pl-[72px]">{children}</div>
    </div>
  );
}
