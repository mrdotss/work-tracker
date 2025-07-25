'use client';

import {
  User as UserType,
  WorkcheckWithUser,
  WorkcheckFilters,
} from '@/types/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { StaffManagement } from '@/components/admin/staff-management';
import { TaskRecords } from '@/components/admin/task-records';
import { SiteHeader } from '@/components/site-header';
import { AppSidebar } from '@/components/app-sidebar';
import { User, Activity } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

function AdminPanelContent() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [workchecks, setWorkchecks] = useState<WorkcheckWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  // Fetch workchecks with filters
  const fetchWorkchecks = useCallback(async (
      filters: WorkcheckFilters = { search: '', status: 'all', date: '' },
  ) => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: filters.search,
        status: filters.status,
        date: filters.date,
      });

      const response = await fetch(`/api/admin/workchecks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setWorkchecks(data.workchecks);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch workchecks:', error);
    }
  }, [currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle task records refresh
  const handleTaskRecordsRefresh = (filters: WorkcheckFilters) => {
    fetchWorkchecks(filters);
  };

  useEffect(() => {
    fetchUsers();
    setLoading(false);
  }, []);

  // Fetch workchecks when page changes
  useEffect(() => {
    fetchWorkchecks();
  }, [currentPage, fetchWorkchecks]);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
          Loading...
        </div>
    );
  }

  return (
      <div className="px-4 lg:px-6 py-6 space-y-6">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Manajemen Staf
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Riwayat Pengecekan
            </TabsTrigger>
          </TabsList>

          {/* Staff Management Tab */}
          <TabsContent value="users">
            <StaffManagement users={users} onRefresh={fetchUsers} />
          </TabsContent>

          {/* Task Records Tab */}
          <TabsContent value="tasks">
            <TaskRecords
                workchecks={workchecks}
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onRefresh={handleTaskRecordsRefresh}
            />
          </TabsContent>
        </Tabs>
      </div>
  );
}

export default function AdminPanel() {
  return (
      <SidebarProvider
          style={
            {
              '--sidebar-width': 'calc(var(--spacing) * 72)',
              '--header-height': 'calc(var(--spacing) * 12)',
            } as React.CSSProperties
          }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title={'Admin Panel'} />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <AdminPanelContent />
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}