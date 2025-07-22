import { IconAlertTriangle, IconCheck, IconClock, IconTrendingDown, IconTrendingUp, IconEye } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VehicleCoverageHeatMap } from "./vehicle-coverage-heatmap";

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

interface AdminDashboardWidgetsProps {
  data: AdminDashboardData;
}

export function AdminDashboardWidgets({ data }: AdminDashboardWidgetsProps) {
  const {
    checksCompletedToday,
    pendingApprovals,
    issueRate,
    topFailingItems,
    avgTimeToApprove,
    vehicleCoverageData,
  } = data;

  // Calculate vehicle coverage metrics
  const totalVehicles = vehicleCoverageData.length;
  const uncoveredVehicles = vehicleCoverageData.filter(vehicle => 
    vehicle.coverage.some(day => !day.covered)
  ).length;
  const coveragePercentage = totalVehicles > 0 
    ? ((totalVehicles - uncoveredVehicles) / totalVehicles) * 100 
    : 100;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {/* Daily Throughput */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Daily Throughput</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {checksCompletedToday}
          </CardTitle>
          <CardAction>
            <Badge variant={checksCompletedToday > 0 ? "default" : "secondary"}>
              <IconCheck className="size-3" />
              {checksCompletedToday > 0 ? "Active" : "None"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Checks completed today <IconCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Track daily inspection volume
          </div>
        </CardFooter>
      </Card>

      {/* Review Workload */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Review Workload</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingApprovals}
          </CardTitle>
          <CardAction>
            <Badge variant={pendingApprovals > 10 ? "destructive" : pendingApprovals > 0 ? "secondary" : "default"}>
              <IconClock className="size-3" />
              {pendingApprovals > 10 ? "High" : pendingApprovals > 0 ? "Pending" : "Clear"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Pending approvals <IconClock className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {pendingApprovals > 0 ? "Requires admin attention" : "All caught up"}
          </div>
        </CardFooter>
      </Card>

      {/* Issue Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Issue Rate (30 days)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {issueRate.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant={issueRate > 20 ? "destructive" : issueRate > 10 ? "secondary" : "default"}>
              {issueRate > 10 ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
              {issueRate > 20 ? "High" : issueRate > 10 ? "Medium" : "Low"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Action items reported
            {issueRate > 10 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Percentage of checks with issues
          </div>
        </CardFooter>
      </Card>

      {/* Top Failing Items */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Top Failing Items</CardDescription>
          <CardTitle className="text-lg font-semibold">
            Where to act
          </CardTitle>
          <CardAction>
            <Badge variant={topFailingItems.length > 0 ? "destructive" : "default"}>
              <IconAlertTriangle className="size-3" />
              {topFailingItems.length > 0 ? "Issues Found" : "All Good"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {topFailingItems.length > 0 ? (
            topFailingItems.slice(0, 3).map((item, index) => (
              <div key={item.code} className="flex justify-between w-full">
                <span className="text-muted-foreground truncate">
                  {index + 1}. {item.label}
                </span>
                <span className="font-medium">{item.failureCount}</span>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">No failing items found</div>
          )}
        </CardFooter>
      </Card>

      {/* Time to Approve */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Process Bottlenecks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgTimeToApprove.toFixed(1)}h
          </CardTitle>
          <CardAction>
            <Badge variant={avgTimeToApprove > 24 ? "destructive" : avgTimeToApprove > 8 ? "secondary" : "default"}>
              <IconClock className="size-3" />
              {avgTimeToApprove > 24 ? "Slow" : avgTimeToApprove > 8 ? "Medium" : "Fast"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Average time to approve <IconClock className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Time from submission to approval
          </div>
        </CardFooter>
      </Card>

      {/* Vehicle Coverage Heat-map */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Vehicle Coverage (7 days)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {coveragePercentage.toFixed(0)}%
          </CardTitle>
          <CardAction>
            <Badge variant={coveragePercentage < 80 ? "destructive" : coveragePercentage < 95 ? "secondary" : "default"}>
              {coveragePercentage < 80 ? <IconAlertTriangle className="size-3" /> : <IconCheck className="size-3" />}
              {coveragePercentage < 80 ? "Poor" : coveragePercentage < 95 ? "Good" : "Excellent"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Missed inspections tracking
            {uncoveredVehicles > 0 ? <IconAlertTriangle className="size-4" /> : <IconCheck className="size-4" />}
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="text-muted-foreground">
              {uncoveredVehicles > 0 
                ? `${uncoveredVehicles} vehicles need attention`
                : "All vehicles covered"
              }
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconEye className="size-3 mr-1" />
                  View Heat-map
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Vehicle Coverage Heat-map</DialogTitle>
                  <DialogDescription>
                    Daily inspection coverage for all vehicles over the last 7 days
                  </DialogDescription>
                </DialogHeader>
                <VehicleCoverageHeatMap vehicleCoverageData={vehicleCoverageData} />
              </DialogContent>
            </Dialog>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
