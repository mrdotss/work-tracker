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
          <CardDescription>Throughput Harian</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {checksCompletedToday}
          </CardTitle>
          <CardAction>
            <Badge variant={checksCompletedToday > 0 ? "default" : "secondary"}>
              <IconCheck className="size-3" />
              {checksCompletedToday > 0 ? "Aktif" : "Tidak ada"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Pemeriksaan yang selesai hari ini <IconCheck className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Lacak volume inspeksi harian
          </div>
        </CardFooter>
      </Card>

      {/* Review Workload */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Perlu Di Review</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingApprovals}
          </CardTitle>
          <CardAction>
            <Badge variant={pendingApprovals > 10 ? "destructive" : pendingApprovals > 0 ? "secondary" : "default"}>
              <IconClock className="size-3" />
              {pendingApprovals > 10 ? "Tinggi" : pendingApprovals > 0 ? "Tertunda" : "Baik"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Persetujuan tertunda <IconClock className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {pendingApprovals > 0 ? "Perhatian dibutuhkan" : "Sudah semua"}
          </div>
        </CardFooter>
      </Card>

      {/* Issue Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tingkatan Laporan (30 hari)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {issueRate.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant={issueRate > 20 ? "destructive" : issueRate > 10 ? "secondary" : "default"}>
              {issueRate > 10 ? <IconTrendingUp className="size-3" /> : <IconTrendingDown className="size-3" />}
              {issueRate > 20 ? "Tinggi" : issueRate > 10 ? "Sedang" : "Rendah"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tindakan yang dilaporkan
            {issueRate > 10 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Persentase cek yang bermasalah
          </div>
        </CardFooter>
      </Card>

      {/* Top Failing Items */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Paling Banyak Gagal</CardDescription>
          <CardTitle className="text-lg font-semibold">
            Di mana harus bertindak
          </CardTitle>
          <CardAction>
            <Badge variant={topFailingItems.length > 0 ? "destructive" : "default"}>
              <IconAlertTriangle className="size-3" />
              {topFailingItems.length > 0 ? "Masalah Ditemukan" : "Semua Baik"}
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
            <div className="text-muted-foreground">Tidak ada item yang gagal ditemukan</div>
          )}
        </CardFooter>
      </Card>

      {/* Time to Approve */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Hambatan Proses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgTimeToApprove.toFixed(1)} jam
          </CardTitle>
          <CardAction>
            <Badge variant={avgTimeToApprove > 24 ? "destructive" : avgTimeToApprove > 8 ? "secondary" : "default"}>
              <IconClock className="size-3" />
              {avgTimeToApprove > 24 ? "Lambat" : avgTimeToApprove > 8 ? "Sedang" : "Cepat"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Rata-rata waktu persetujuan <IconClock className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Waktu dari pengajuan hingga persetujuan
          </div>
        </CardFooter>
      </Card>

      {/* Vehicle Coverage Heat-map */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Cakupan Unit (7 hari)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {coveragePercentage.toFixed(0)}%
          </CardTitle>
          <CardAction>
            <Badge variant={coveragePercentage < 80 ? "destructive" : coveragePercentage < 95 ? "secondary" : "default"}>
              {coveragePercentage < 80 ? <IconAlertTriangle className="size-3" /> : <IconCheck className="size-3" />}
              {coveragePercentage < 80 ? "Buruk" : coveragePercentage < 95 ? "Baik" : "Sangat Baik"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Pelacakan inspeksi yang terlewat
            {uncoveredVehicles > 0 ? <IconAlertTriangle className="size-4" /> : <IconCheck className="size-4" />}
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="text-muted-foreground">
              {uncoveredVehicles > 0 
                ? `${uncoveredVehicles} unit perlu perhatian`
                : "Semua unit tercover"
              }
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconEye className="size-3 mr-1" />
                  Lihat Heat-map
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Heat-map Cakupan Unit</DialogTitle>
                  <DialogDescription>
                    Cakupan inspeksi harian untuk semua unit selama 7 hari terakhir
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
