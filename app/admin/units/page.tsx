import { AppSidebar } from "@/components/app-sidebar"
import { UnitsManagement } from "@/components/admin/units-management"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function UnitsPage() {
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
        <SiteHeader title="Units Management" />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-6xl">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Unit Kendaraan</h1>
                  <p className="text-muted-foreground">
                    Kelola unit kendaraan dan informasi terkait.
                  </p>
                </div>
                <UnitsManagement />
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
