"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePicker } from "@/components/date-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {Eye, RefreshCw, Edit, CalendarX} from "lucide-react";
import Image from "next/image";

// Types
interface WorkcheckHistory {
  id: string;
  unit_id: string;
  hours_meter: number | null;
  created_at: string | null;
  Unit: {
    name: string;
    type: string;
    number_plate: string | null;
  };
  Approval: {
    is_approved: boolean | null;
    comments: string | null;
    approved_at: string | null;
    Approver: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

interface WorkcheckDetails {
  id: string;
  unit_id: string;
  hours_meter: number | null;
  created_at: string | null;
  Unit: {
    name: string;
    type: string;
    number_plate: string | null;
  };
  WorkcheckItems: {
    id: string;
    actions: string[];
    note: string | null;
    CheckItem: {
      code: string;
      label: string | null;
      sort_order: number | null;
    } | null;
    Images: {
      file_name: string | null;
    }[];
  }[];
  Approval: {
    is_approved: boolean | null;
    comments: string | null;
    approved_at: string | null;
    Approver: {
      first_name: string;
      last_name: string;
    } | null;
  } | null;
}

interface StaffHistoryProps {
  onEditWorkcheck: (workcheckId: string) => void;
}

export function StaffHistory({ onEditWorkcheck }: StaffHistoryProps) {
  const [workchecks, setWorkchecks] = useState<WorkcheckHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewWorkcheckDialog, setViewWorkcheckDialog] = useState({
    open: false,
    workcheck: null as WorkcheckDetails | null,
    loading: false
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        status: selectedStatus,
      });

      if (selectedDate) {
        params.append('date', selectedDate.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/staff/workcheck/history?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setWorkchecks(data.workchecks);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, selectedDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const getApprovalStatus = (workcheck: WorkcheckHistory) => {
    if (!workcheck.Approval) return "pending";  // ✅ Check if Approval exists
    if (workcheck.Approval.is_approved === null) return "pending";
    return workcheck.Approval.is_approved ? "approved" : "rejected";
  };

  const canEdit = (workcheck: WorkcheckHistory) => {
    const status = getApprovalStatus(workcheck);
    return status === "pending" || status === "rejected";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewWorkcheck = async (workcheckId: string) => {
    setViewWorkcheckDialog({ open: true, workcheck: null, loading: true });
    try {
      const response = await fetch(`/api/staff/workcheck/${workcheckId}`);
      if (response.ok) {
        const data: WorkcheckDetails = await response.json();
        setViewWorkcheckDialog({ open: true, workcheck: data, loading: false });
      } else {
        toast.error("Failed to load workcheck details");
        setViewWorkcheckDialog({ open: false, workcheck: null, loading: false });
      }
    } catch (error) {
      console.error('Error fetching workcheck details:', error);
      toast.error("Failed to load workcheck details");
      setViewWorkcheckDialog({ open: false, workcheck: null, loading: false });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <DatePicker
                date={selectedDate}
                onDateChange={handleDateChange}
                placeholder="Filter tanggal"
                className="w-48"
            />
            {selectedDate && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateChange(undefined)}
                    className="h-10 w-10 p-0"
                    title="Clear date filter"
                >
                  <CalendarX className="h-4 w-4" />
                </Button>
            )}
          </div>
          <Select value={selectedStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Muat Ulang
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History Pengecekan Saya</CardTitle>
          <CardDescription>
            Daftar semua pengecekan yang telah anda lakukan, termasuk status persetujuan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Kilometer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Komentar</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workchecks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada pengecekan yang ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  workchecks.map((workcheck) => (
                    <TableRow key={workcheck.id}>
                      <TableCell>{formatDate(workcheck.created_at)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{workcheck.Unit.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {workcheck.Unit.type}
                        </div>
                        {workcheck.Unit.number_plate && (
                          <div className="text-sm text-muted-foreground">
                            {workcheck.Unit.number_plate}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{workcheck.hours_meter || "N/A"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getApprovalStatus(workcheck) === "approved"
                              ? "default"
                              : getApprovalStatus(workcheck) === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {getApprovalStatus(workcheck)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {workcheck.Approval?.comments ? (
                          <div className="text-sm">
                            &ldquo;{workcheck.Approval.comments}&rdquo;
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Tidak ada komentar</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewWorkcheck(workcheck.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEdit(workcheck) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEditWorkcheck(workcheck.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Workcheck Details Dialog */}
      <Dialog open={viewWorkcheckDialog.open} onOpenChange={(open) => {
        if (!open) {
          setViewWorkcheckDialog({ open: false, workcheck: null, loading: false });
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengecekan</DialogTitle>
          </DialogHeader>
          {viewWorkcheckDialog.loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : viewWorkcheckDialog.workcheck ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Unit:</strong> {viewWorkcheckDialog.workcheck.Unit.name}
                </div>
                <div>
                  <strong>Tipe:</strong> {viewWorkcheckDialog.workcheck.Unit.type}
                </div>
                {viewWorkcheckDialog.workcheck.Unit.number_plate && (
                  <div>
                    <strong>Plat Nomor:</strong> {viewWorkcheckDialog.workcheck.Unit.number_plate}
                  </div>
                )}
                <div>
                  <strong>Tanggal:</strong> {formatDate(viewWorkcheckDialog.workcheck.created_at)}
                </div>
                <div>
                  <strong>Kilometer:</strong> {viewWorkcheckDialog.workcheck.hours_meter || "N/A"}
                </div>
              </div>

              <div>
                <strong>Checlist pengecekan:</strong>
                <div className="space-y-3 mt-2">
                  {viewWorkcheckDialog.workcheck.WorkcheckItems.map((item) => (
                    <div key={item.id} className="p-4 border rounded-md">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">
                          {item.CheckItem?.label || `Item ${item.CheckItem?.sort_order || 'N/A'}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.CheckItem?.code}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Aksi:</strong> {item.actions.join(", ") || "N/A"}
                        </div>
                      </div>
                      {item.note && (
                        <div className="mt-2">
                          <strong>Catatan:</strong>
                          <p className="text-sm text-muted-foreground">{item.note}</p>
                        </div>
                      )}
                      {item.Images.length > 0 && (
                        <div className="mt-2">
                          <strong>Images:</strong>
                          <div className="flex gap-2 mt-1">
                            {item.Images.map((image: { file_name: string | null }, idx: number) => (
                                <a
                                    key={idx}
                                    href={image.file_name || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-20 h-20 rounded-md overflow-hidden bg-muted hover:opacity-80 transition-opacity"
                                >
                                  <Image
                                      src={image.file_name || '/placeholder.png'}
                                      alt="Proof"
                                      className="object-cover w-full h-full"
                                      width={250}
                                      height={250}
                                  />
                                </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {viewWorkcheckDialog.workcheck.Approval && (
                <div>
                  <strong>Hasil Review:</strong>
                  <div className="mt-2 space-y-2">
                      <div className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {viewWorkcheckDialog.workcheck.Approval.Approver ?
                                  `${viewWorkcheckDialog.workcheck.Approval.Approver.first_name} ${viewWorkcheckDialog.workcheck.Approval.Approver.last_name}` :
                                  "System"
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(viewWorkcheckDialog.workcheck.Approval.approved_at)}
                            </div>
                          </div>
                          <Badge
                              variant={
                                viewWorkcheckDialog.workcheck.Approval.is_approved ? "default" :
                                    viewWorkcheckDialog.workcheck.Approval.is_approved === false ? "destructive" :
                                        "secondary"
                              }
                          >
                            {viewWorkcheckDialog.workcheck.Approval.is_approved ? "Approved" :
                                viewWorkcheckDialog.workcheck.Approval.is_approved === false ? "Rejected" :
                                    "Pending"}
                          </Badge>
                        </div>
                        {viewWorkcheckDialog.workcheck.Approval.comments && (
                            <div className="mt-2 text-sm">
                              <strong>Komentar:</strong> {viewWorkcheckDialog.workcheck.Approval.comments}
                            </div>
                        )}
                      </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              Workcheck details not found.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Sebelumnnya
        </Button>
        <span className="flex items-center px-4">
          Halaman {currentPage} dari {totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          Selanjutnya
        </Button>
      </div>
    </div>
  );
}
