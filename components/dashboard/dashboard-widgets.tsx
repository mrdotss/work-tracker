"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { StaffDashboardWidgets } from "./staff-dashboard-widgets";
import { AdminDashboardWidgets } from "./admin-dashboard-widgets";
import { Skeleton } from "@/components/ui/skeleton";

interface StaffDashboardData {
  todayFinished: boolean;
  vehicleStatus: Array<{
    unitName: string | null;
    isSubmitted: boolean;
    approvalStatus: boolean | null;
  }>;
  openTasks: Array<{
    id: string;
    unitName: string | null;
    isSubmitted: boolean;
    createdAt: Date | null;
    approvalStatus: boolean | null;
  }>;
  streak: number;
}

interface AdminDashboardData {
  checksCompletedToday: number;
  pendingApprovals: number;
  issueRate: number;
  topFailingItems: Array<{
    label: string;
    code: string;
    failureCount: number;
  }>;
  avgTimeToApprove: number;
  vehicleCoverageData: Array<{
    unitId: string;
    unitName: string | null;
    unitType: string | null;
    coverage: Array<{
      date: string;
      covered: boolean;
    }>;
  }>;
}

export function DashboardWidgets() {
  const { data: session, status } = useSession();
  const [staffData, setStaffData] = useState<StaffDashboardData | null>(null);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (status !== "authenticated" || !session?.user?.role) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const endpoint = session.user.role === "ADMIN" 
          ? "/api/dashboard/admin" 
          : "/api/dashboard/staff";

        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        const data = await response.json();

        if (session.user.role === "ADMIN") {
          setAdminData(data);
        } else {
          setStaffData(data);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session, status]);

  if (status === "loading" || loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading dashboard data</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Please log in to view dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {session.user.role === "ADMIN" 
            ? "Admin overview of system operations and metrics"
            : "Your daily work status and recent activity"
          }
        </p>
      </div>

      {session.user.role === "ADMIN" && adminData ? (
        <AdminDashboardWidgets data={adminData} />
      ) : session.user.role === "STAFF" && staffData ? (
        <StaffDashboardWidgets data={staffData} />
      ) : (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">No dashboard data available</p>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 p-6 border rounded-lg">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-6 w-20" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
