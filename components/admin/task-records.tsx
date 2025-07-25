'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Check,
  X,
  Eye,
  CalendarX,
} from 'lucide-react';
import { WorkcheckWithUser, WorkcheckDetails } from '@/types/types';
import { DatePicker } from '@/components/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import Image from "next/image";

// Types
interface TaskRecordsProps {
  workchecks: WorkcheckWithUser[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRefresh: (filters: {
    search: string;
    status: string;
    date: string;
  }) => void;
}

interface ApprovalDialogState {
  open: boolean;
  workcheckId: string;
  staffName: string;
  unitName: string;
  date: string;
  action: 'approve' | 'reject' | null;
}

interface ViewWorkcheckDialogState {
  open: boolean;
  workcheck: WorkcheckDetails | null;
  loading: boolean;
}

export function TaskRecords({
                              workchecks,
                              totalPages,
                              currentPage,
                              onPageChange,
                              onRefresh,
                            }: TaskRecordsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateFilter, setDateFilter] = useState('');
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogState>({
    open: false,
    workcheckId: '',
    staffName: '',
    unitName: '',
    date: '',
    action: null,
  });
  const [comments, setComments] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [viewWorkcheckDialog, setViewWorkcheckDialog] =
      useState<ViewWorkcheckDialogState>({
        open: false,
        workcheck: null,
        loading: false,
      });

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    const newDateFilter = date ? date.toISOString().split('T')[0] : '';
    setDateFilter(newDateFilter);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Immediate refresh for date changes (no debounce needed)
    onRefresh({ search: searchTerm, status: selectedStatus, date: newDateFilter });
  };

  // Export functions
  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: selectedStatus,
        date: dateFilter,
        export: 'csv',
      });

      const response = await fetch(`/api/admin/export/workchecks?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workcheck-records-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('CSV export completed');
      }
    } catch (error) {
      toast.error('Failed to export CSV');
      console.error('Error exporting CSV:', error);
    }
  };

  const exportToExcel = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: selectedStatus,
        date: dateFilter,
        export: 'excel',
      });

      const response = await fetch(`/api/admin/export/workchecks?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workcheck-records-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Excel export completed');
      }
    } catch (error) {
      toast.error('Failed to export Excel');
      console.error('Error exporting Excel:', error);
    }
  };

  const exportToPDF = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: selectedStatus,
        date: dateFilter,
        export: 'pdf',
      });

      const response = await fetch(`/api/admin/export/workchecks?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workcheck-records-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('PDF export completed');
      }
    } catch (error) {
      toast.error('Failed to export PDF');
      console.error('Error exporting PDF:', error);
    }
  };

  // Approval functions
  const handleApprovalAction = (
      workcheck: WorkcheckWithUser,
      action: 'approve' | 'reject',
  ) => {
    setApprovalDialog({
      open: true,
      workcheckId: workcheck.id,
      staffName: `${workcheck.Checker.first_name} ${workcheck.Checker.last_name}`,
      unitName: workcheck.Unit.name,
      date: formatDate(workcheck.created_at),
      action,
    });
    setComments('');
  };

  const handleApproval = async () => {
    try {
      const response = await fetch('/api/admin/workchecks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workcheckId: approvalDialog.workcheckId,
          isApproved: approvalDialog.action === 'approve',
          comments: comments.trim() || null,
        }),
      });

      if (response.ok) {
        toast.success(
            `Workcheck ${approvalDialog.action === 'approve' ? 'disetujui' : 'ditolak'} successfully`,
        );
        setApprovalDialog({
          open: false,
          workcheckId: '',
          staffName: '',
          unitName: '',
          date: '',
          action: null,
        });
        setComments('');
        onRefresh({
          search: searchTerm,
          status: selectedStatus,
          date: dateFilter,
        });
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('An error occurred while processing the approval');
    }
  };

  // Get approval status
  const getApprovalStatus = (workcheck: WorkcheckWithUser) => {
    if (!workcheck.Approval) return 'menunggu';
    if (workcheck.Approval.is_approved === null) return 'menunggu';
    return workcheck.Approval.is_approved ? 'disetujui' : 'ditolak';
  };

  // Check if workcheck can be approved
  const canApprove = (workcheck: WorkcheckWithUser) => {
    return !workcheck.Approval || workcheck.Approval.is_approved === null;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Wrap onRefresh in useCallback to prevent unnecessary re-renders
  const handleRefresh = useCallback(() => {
    onRefresh({ search: searchTerm, status: selectedStatus, date: dateFilter });
  }, [onRefresh, searchTerm, selectedStatus, dateFilter]);

  // Only refresh when user explicitly changes filters (not on component mount/re-render)
  const handleFilterChange = () => {
    handleRefresh();
  };

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout to debounce search
    searchTimeoutRef.current = setTimeout(() => {
      onRefresh({ search: value, status: selectedStatus, date: dateFilter });
    }, 500);
  };

  // Handle status change  
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    onRefresh({ search: searchTerm, status: value, date: dateFilter });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // View workcheck details
  const viewWorkcheckDetails = async (workcheckId: string) => {
    setViewWorkcheckDialog({ open: true, workcheck: null, loading: true });
    try {
      const response = await fetch(`/api/admin/workchecks/${workcheckId}`);
      if (response.ok) {
        const data = await response.json();
        setViewWorkcheckDialog({ open: true, workcheck: data, loading: false });
      } else {
        toast.error('Failed to fetch workcheck details');
        setViewWorkcheckDialog({
          open: false,
          workcheck: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error fetching workcheck details:', error);
      toast.error('An error occurred while fetching workcheck details');
      setViewWorkcheckDialog({ open: false, workcheck: null, loading: false });
    }
  };

  return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Input
                placeholder="Cari berdasarkan nama staff..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-64"
            />
            <div className="flex items-center gap-1">
              <DatePicker
                  date={selectedDate}
                  onDateChange={handleDateChange}
                  placeholder="Cari tanggal"
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
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              CSV
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catatan Pengecekan</CardTitle>
            <CardDescription>Melihat dan menyetujui entri tugas staf</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nama Staff</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Meteran Jam</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Review Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workchecks.map((workcheck) => (
                    <TableRow key={workcheck.id}>
                      <TableCell>{formatDate(workcheck.created_at)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {workcheck.Checker.first_name} {workcheck.Checker.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {workcheck.Checker.username}
                        </div>
                      </TableCell>
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
                      <TableCell>{workcheck.hours_meter || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                            variant={
                              getApprovalStatus(workcheck) === 'disetujui'
                                  ? 'default'
                                  : getApprovalStatus(workcheck) === 'ditolak'
                                      ? 'destructive'
                                      : 'secondary'
                            }
                        >
                          {getApprovalStatus(workcheck)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {workcheck.Approval?.approved_at ? (
                            <div>
                              <div className="font-medium">
                                {workcheck.Approval.Approver?.first_name}{' '}
                                {workcheck.Approval.Approver?.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(workcheck.Approval.approved_at)}
                              </div>
                              {workcheck.Approval.comments && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    &ldquo;{workcheck.Approval.comments}&rdquo;
                                  </div>
                              )}
                            </div>
                        ) : (
                            'Not reviewed'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewWorkcheckDetails(workcheck.id)}
                              className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canApprove(workcheck) && (
                              <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        handleApprovalAction(workcheck, 'approve')
                                    }
                                    className="text-green-600 hover:text-green-700"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        handleApprovalAction(workcheck, 'reject')
                                    }
                                    className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog
            open={approvalDialog.open}
            onOpenChange={(open) => {
              if (!open) {
                setApprovalDialog({
                  open: false,
                  workcheckId: '',
                  staffName: '',
                  unitName: '',
                  date: '',
                  action: null,
                });
                setComments('');
              }
            }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'}{' '}
                Workcheck
              </DialogTitle>
              <DialogDescription>
                {approvalDialog.action === 'approve'
                    ? 'Are you sure you want to approve this workcheck?'
                    : 'Are you sure you want to reject this workcheck?'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Staff:</strong> {approvalDialog.staffName}
                </div>
                <div>
                  <strong>Unit:</strong> {approvalDialog.unitName}
                </div>
                <div>
                  <strong>Date:</strong> {approvalDialog.date}
                </div>
              </div>
              <div>
                <label htmlFor="comments" className="text-sm font-medium">
                  Comments{' '}
                  {approvalDialog.action === 'reject' &&
                      '(Required for rejection)'}
                </label>
                <Textarea
                    id="comments"
                    placeholder="Enter your comments here..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="mt-2"
                    rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                  variant="outline"
                  onClick={() =>
                      setApprovalDialog({
                        open: false,
                        workcheckId: '',
                        staffName: '',
                        unitName: '',
                        date: '',
                        action: null,
                      })
                  }
              >
                Cancel
              </Button>
              <Button
                  onClick={handleApproval}
                  disabled={
                      approvalDialog.action === 'reject' && !comments.trim()
                  }
                  variant={
                    approvalDialog.action === 'approve' ? 'default' : 'destructive'
                  }
              >
                {approvalDialog.action === 'approve'
                    ? 'Approve'
                    : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Workcheck Details Dialog */}
        <Dialog
            open={viewWorkcheckDialog.open}
            onOpenChange={(open) => {
              if (!open) {
                setViewWorkcheckDialog({
                  open: false,
                  workcheck: null,
                  loading: false,
                });
              }
            }}
        >
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Pengecekan</DialogTitle>
            </DialogHeader>
            {viewWorkcheckDialog.loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : viewWorkcheckDialog.workcheck ? (
                <div className="space-y-4 pr-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Staff:</strong>{' '}
                      {viewWorkcheckDialog.workcheck.Checker.first_name}{' '}
                      {viewWorkcheckDialog.workcheck.Checker.last_name}
                    </div>
                    <div>
                      <strong>Unit:</strong>{' '}
                      {viewWorkcheckDialog.workcheck.Unit.name}
                    </div>
                    <div>
                      <strong>Tanggal:</strong>{' '}
                      {formatDate(viewWorkcheckDialog.workcheck.created_at)}
                    </div>
                    <div>
                      <strong>Meteran Jam:</strong>{' '}
                      {viewWorkcheckDialog.workcheck.hours_meter || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <strong>Checklist pengecekan:</strong>
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
                                <strong>Aksi:</strong> {item.actions?.join(", ") || 'N/A'}
                              </div>
                            </div>
                            {item.note && (
                                <div className="mt-2">
                                  <strong>Catatan:</strong>
                                  <p className="text-sm text-muted-foreground">
                                    {item.note}
                                  </p>
                                </div>
                            )}
                            {item.Images && item.Images.length > 0 && (
                                <div className="mt-2">
                                  <strong>Bukti Gambar:</strong>
                                  <div className="flex gap-2 mt-1 flex-wrap">
                                    {item.Images.map((image: { id: string; file_name: string | null; uploaded_at: string | null }, idx: number) => (
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
                                              width={250}
                                              height={250}
                                              className="object-cover w-full h-full"
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
                        <strong>Status Persetujuan:</strong>
                        <div className="mt-2 space-y-2">
                          <div className="p-3 border rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">
                                  {viewWorkcheckDialog.workcheck.Approval.Approver
                                      ? `${viewWorkcheckDialog.workcheck.Approval.Approver.first_name} ${viewWorkcheckDialog.workcheck.Approval.Approver.last_name}`
                                      : 'System'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(viewWorkcheckDialog.workcheck.Approval.approved_at)}
                                </div>
                              </div>
                              <Badge
                                  variant={
                                    viewWorkcheckDialog.workcheck.Approval.is_approved
                                        ? 'default'
                                        : viewWorkcheckDialog.workcheck.Approval.is_approved === false
                                            ? 'destructive'
                                            : 'secondary'
                                  }
                              >
                                {viewWorkcheckDialog.workcheck.Approval.is_approved
                                    ? 'Disetujui'
                                    : viewWorkcheckDialog.workcheck.Approval.is_approved === false
                                        ? 'Ditolak'
                                        : 'Menunggu Persetujuan'}
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
                  Detail pengecekan tidak ditemukan.
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Pagination */}
        <div className="flex justify-center gap-2">
          <Button
              variant="outline"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
          >
            Sebelumnya
          </Button>
          <span className="flex items-center px-4">
          Halaman {currentPage} dari {totalPages}
        </span>
          <Button
              variant="outline"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
          >
            Selanjutnya
          </Button>
        </div>
      </div>
  );
}
