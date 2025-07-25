"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { WorkcheckForm } from "@/components/staff/workcheck-form"
import { StaffHistory } from "@/components/staff/staff-history"
import { SiteHeader } from "@/components/site-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useState } from "react"

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState("workcheck")
  const [editWorkcheckId, setEditWorkcheckId] = useState<string | null>(null)

  const handleEditWorkcheck = (workcheckId: string) => {
    setEditWorkcheckId(workcheckId)
    setActiveTab("workcheck")
  }

  const handleWorkcheckSubmitted = () => {
    setEditWorkcheckId(null)
    setActiveTab("history")
  }

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
        <SiteHeader title="Staff Portal" />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-6xl">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">Portal Staff</h1>
                  <p className="text-muted-foreground">
                    Kelola inspeksi unit harian dan lihat riwayat inpeksi anda
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="workcheck">Pemeriksaan Harian</TabsTrigger>
                    <TabsTrigger value="history">Riwayat Saya</TabsTrigger>
                  </TabsList>

                  <TabsContent value="workcheck" className="mt-6">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-semibold">Inspeksi Unit Harian</h2>
                        <p className="text-muted-foreground">
                          Selesaikan pemeriksaan unit harian anda dengan foto bukti yang diperlukan.
                        </p>
                      </div>
                      <WorkcheckForm
                        editWorkcheckId={editWorkcheckId}
                        onWorkcheckSubmitted={handleWorkcheckSubmitted}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="mt-6">
                    <StaffHistory onEditWorkcheck={handleEditWorkcheck} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
