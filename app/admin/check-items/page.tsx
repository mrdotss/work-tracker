import { AppSidebar } from "@/components/app-sidebar"
import { CheckItemsManagement } from "@/components/admin/check-items-management"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function CheckItemsPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Manajemen Checlist Pengecekan" />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-6xl">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Checklist Pengecekan</h1>
                  <p className="text-muted-foreground">
                    Kelola item checklist inspeksi harian.
                  </p>
                </div>
                <CheckItemsManagement />
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
