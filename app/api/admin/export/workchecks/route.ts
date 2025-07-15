import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const prisma = new PrismaClient();

// Type for the where clause
interface WhereClause {
  is_deleted: boolean;
  is_submitted: boolean;
  Checker?: {
    OR: Array<{
      first_name?: { contains: string; mode: 'insensitive' };
      last_name?: { contains: string; mode: 'insensitive' };
      username?: { contains: string; mode: 'insensitive' };
    }>;
  };
  created_at?: {
    gte: Date;
    lt: Date;
  };
}

// GET - Export workchecks data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const date = searchParams.get('date') || '';
    const exportType = searchParams.get('export') || 'csv';

    // Build where clause for filtering
    const whereClause: WhereClause = {
      is_deleted: false,
      is_submitted: true,
    };

    // Add a search filter (staff name)
    if (search) {
      whereClause.Checker = {
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ]
      };
    }

    // Add a date filter
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      whereClause.created_at = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Fetch all workchecks with related data (no pagination for export)
    let workchecks = await prisma.workcheck.findMany({
      where: whereClause,
      include: {
        Checker: {
          select: {
            first_name: true,
            last_name: true,
            username: true,
          }
        },
        Unit: {
          select: {
            name: true,
            type: true,
          }
        },
        Approval: {
          include: {
            Approver: {
              select: {
                first_name: true,
                last_name: true,
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
    });

    // Filter by approval status if specified
    if (status !== 'all') {
      workchecks = workchecks.filter(workcheck => {
        // Handle a null Approval case
        if (!workcheck.Approval) {
          return status === 'pending';
        }

        // Check if approved based on the approved_at field
        const isApproved = workcheck.Approval.approved_at !== null;
        return status === 'approved' ? isApproved : !isApproved;
      });
    }

    // Transform data for export
    const exportData = workchecks.map(workcheck => ({
      Date: workcheck.created_at ? new Date(workcheck.created_at).toLocaleDateString() : 'N/A',
      'Staff Name': `${workcheck.Checker.first_name} ${workcheck.Checker.last_name}`,
      Username: workcheck.Checker.username,
      Unit: workcheck.Unit.name || 'N/A',
      'Unit Type': workcheck.Unit.type || 'N/A',
      'Hours Meter': workcheck.hours_meter || 'N/A',
      Status: workcheck.Approval?.approved_at ? 'Approved' : 'Pending',
      'Approved By': workcheck.Approval?.approved_at && workcheck.Approval?.Approver
          ? `${workcheck.Approval.Approver.first_name} ${workcheck.Approval.Approver.last_name}`
          : 'Not approved',
      'Approved Date': workcheck.Approval?.approved_at
          ? new Date(workcheck.Approval.approved_at).toLocaleDateString()
          : 'N/A'
    }));

    // Generate export based on type
    switch (exportType) {
      case 'csv':
        return generateCSV(exportData);
      case 'excel':
        return generateExcel(exportData);
      case 'pdf':
        return generatePDF(exportData);
      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
        { error: "Failed to export data" },
        { status: 500 }
    );
  }
}

// Generate CSV
function generateCSV(data: any[]) {
  if (data.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 400 });
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
    )
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="workcheck-records-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

// Generate Excel (simplified - using CSV format with .xlsx extension)
async function generateExcel(data: any[]) {
  if (data.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 400 });
  }

  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Work Check Records');

  // Get headers from the first data row
  const headers = Object.keys(data[0]);

  // Add headers to the worksheet
  worksheet.addRow(headers);

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => row[header]);
    worksheet.addRow(values);
  });

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = 15;
  });

  // Generate Excel file buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="workcheck-records-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  });
}

// Generate PDF using jsPDF
function generatePDF(data: any[]) {
  if (data.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 400 });
  }

  // Generate PDF document
  const doc = new jsPDF('landscape');

  // Add title
  doc.setFontSize(18);
  doc.text('Work Check Records', 14, 22);

  // Auto-table for data
  autoTable(doc,{
    head: [Object.keys(data[0])],
    body: data.map(row => Object.values(row)),
    theme: 'grid',
    styles: {
      cellPadding: 5,
      fontSize: 10,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [224, 224, 224],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Save the PDF
  const pdfBuffer = doc.output('arraybuffer');

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="workcheck-records-${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  });
}
