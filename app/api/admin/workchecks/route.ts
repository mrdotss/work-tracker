import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

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

// GET - Fetch workchecks with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const date = searchParams.get('date') || '';

    const limit = 10;
    const offset = (page - 1) * limit;

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

    // Get total count for pagination
    const totalCount = await prisma.workcheck.count({
      where: whereClause,
    });

    // Fetch workchecks with related data
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
            number_plate: true,
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
      skip: offset,
      take: limit,
    });

    // Filter by approval status if specified
    if (status !== 'all') {
      workchecks = workchecks.filter(workcheck => {
        // Handle null Approval case
        if (!workcheck.Approval) {
          return status === 'pending';
        }

        // Check if approved based on approved_at field
        const isApproved = workcheck.Approval.approved_at !== null;
        return status === 'approved' ? isApproved : !isApproved;
      });
    }

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      workchecks,
      totalPages,
      currentPage: page,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching workchecks:", error);
    return NextResponse.json(
      { error: "Failed to fetch workchecks" },
      { status: 500 }
    );
  }
}

// POST - Handle approval actions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workcheckId, isApproved, comments } = body;

    if (!workcheckId || typeof isApproved !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if workcheck exists
    const workcheck = await prisma.workcheck.findUnique({
      where: { id: workcheckId }
    });

    if (!workcheck) {
      return NextResponse.json(
        { error: "Workcheck not found" },
        { status: 404 }
      );
    }

    // Check if already approved/rejected
    const existingApproval = await prisma.approval.findFirst({
      where: {
        workcheck_id: workcheckId
      }
    });

    if (existingApproval && existingApproval.is_approved !== null) {
      return NextResponse.json(
        { error: "This workcheck has already been reviewed" },
        { status: 400 }
      );
    }

    // Create or update approval
    let approval;
    if (existingApproval) {
      // Update existing approval
      approval = await prisma.approval.update({
        where: {
          id: existingApproval.id
        },
        data: {
          approver_id: session.user.id,
          is_approved: isApproved,
          comments: comments || null,
          approved_at: new Date()
        }
      });

      // Note: Don't modify is_submitted when rejecting - the workcheck remains submitted but is rejected

    } else {
      // Create new approval
      approval = await prisma.approval.create({
        data: {
          workcheck_id: workcheckId,
          approver_id: session.user.id,
          is_approved: isApproved,
          comments: comments || null,
          approved_at: new Date()
        }
      });
    }

    return NextResponse.json({
      message: `Workcheck ${isApproved ? 'approved' : 'rejected'} successfully`,
      approval
    });

  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
