import { IconCheck, IconClock, IconTrendingUp, IconX } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

interface StaffDashboardWidgetsProps {
  data: StaffDashboardData;
}

export function StaffDashboardWidgets({ data }: StaffDashboardWidgetsProps) {
  const { todayFinished, vehicleStatus, openTasks, streak } = data;

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {/* Today's Vehicle Status */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Unit Hari Ini</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {vehicleStatus.length} {vehicleStatus.length === 1 ? 'Vehicle' : 'Vehicles'}
          </CardTitle>
          <CardAction>
            <Badge variant={todayFinished ? "default" : "destructive"}>
              {todayFinished ? <IconCheck className="size-3" /> : <IconClock className="size-3" />}
              {todayFinished ? "Selesai" : "Menunggu"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {todayFinished ? "Pemeriksaan harian selesai" : "Apakah saya sudah menyelesaikan pemeriksaan hari ini?"}
            {todayFinished ? <IconCheck className="size-4" /> : <IconClock className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {vehicleStatus.length > 0 
              ? `${vehicleStatus.filter(v => v.isSubmitted).length}/${vehicleStatus.length} submitted`
              : "Tidak ada kendaraan yang akan dicek"
            }
          </div>
        </CardFooter>
      </Card>

      {/* Open Tasks */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Open Tasks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {openTasks.length}
          </CardTitle>
          <CardAction>
            <Badge variant={openTasks.length > 0 ? "secondary" : "default"}>
              <IconClock className="size-3" />
              {openTasks.length > 0 ? "Menunggu" : "Selesai"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Unit tambahan yang mereka liput hari ini
            <IconClock className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {openTasks.length > 0 
              ? `${openTasks.filter(t => !t.isSubmitted).length} belum selesai, ${openTasks.filter(t => t.isSubmitted && t.approvalStatus === null).length} menunggu persetujuan`
              : "Tidak ada tugas yang tertunda"
            }
          </div>
        </CardFooter>
      </Card>

      {/* 7-Day Streak */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Consistency Streak</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {streak} {streak === 1 ? 'Day' : 'Days'}
          </CardTitle>
          <CardAction>
            <Badge variant={streak >= 5 ? "default" : streak >= 3 ? "secondary" : "destructive"}>
              <IconTrendingUp className="size-3" />
              {streak >= 5 ? "Sangat Baik" : streak >= 3 ? "Baik" : "Butuh Perbaikan"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Konsistensi Streak (7 hari terakhir)
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {streak === 7 
              ? "Minggu yang sempurna! Teruskan!"
              : streak >= 5
              ? "Konsistensi yang hebat minggu ini"
              : streak >= 3
              ? "Momentum yang baik sedang dibangun"
              : "Fokus pada penyelesaian harian"
            }
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
