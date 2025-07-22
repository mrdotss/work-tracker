import { AppSidebar } from "@/components/app-sidebar"
import { ProfileForm } from "@/components/profile/profile-form"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function ProfilePage() {
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
        <SiteHeader title="Profile" />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-2xl">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Pengaturan Akun</h1>
                  <p className="text-muted-foreground">
                    Atur informasi dan pengaturan akun anda di sini.
                  </p>
                </div>
                <ProfileForm />
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
