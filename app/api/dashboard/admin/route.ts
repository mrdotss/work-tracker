import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Checks completed today
    const checksCompletedToday = await prisma.workcheck.count({
      where: {
        created_at: {
          gte: today,
          lt: tomorrow,
        },
        is_submitted: true,
        is_deleted: false,
      },
    });

    // 2. Pending approvals
    const pendingApprovals = await prisma.approval.count({
      where: {
        is_approved: null,
        Workcheck: {
          is_deleted: false,
        },
      },
    });

    // 3. Issue rate calculation
    const totalSubmittedChecks = await prisma.workcheck.count({
      where: {
        is_submitted: true,
        is_deleted: false,
        created_at: {
          gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          lt: tomorrow,
        },
      },
    });

    const checksWithIssues = await prisma.workcheck.count({
      where: {
        is_submitted: true,
        is_deleted: false,
        created_at: {
          gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: tomorrow,
        },
        WorkcheckItems: {
          some: {
            actions: {
              isEmpty: false,
            },
          },
        },
      },
    });

    const issueRate = totalSubmittedChecks > 0 ? (checksWithIssues / totalSubmittedChecks) * 100 : 0;

    // 4. Top 5 failing items
    const failingItems = await prisma.workcheckItem.groupBy({
      by: ['item_id'],
      where: {
        actions: {
          isEmpty: false,
        },
        Workcheck: {
          created_at: {
            gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
            lt: tomorrow,
          },
          is_deleted: false,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    const failingItemsWithDetails = await Promise.all(
      failingItems.map(async (item) => {
        const checkItem = await prisma.checkItem.findUnique({
          where: { id: item.item_id || undefined },
          select: { label: true, code: true },
        });
        return {
          label: checkItem?.label || 'Unknown Item',
          code: checkItem?.code || 'N/A',
          failureCount: item._count?.id || 0,
        };
      })
    );

    // 5. Time-to-approve distribution
    const approvedWorkChecks = await prisma.approval.findMany({
      where: {
        is_approved: { not: null },
        approved_at: { not: null },
        Workcheck: {
          is_deleted: false,
          created_at: {
            gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
            lt: tomorrow,
          },
        },
      },
      include: {
        Workcheck: {
          select: {
            created_at: true,
          },
        },
      },
    });

    const timeToApprove = approvedWorkChecks.map(approval => {
      if (approval.approved_at && approval.Workcheck.created_at) {
        const hours = Math.abs(
          (approval.approved_at.getTime() - approval.Workcheck.created_at.getTime()) / (1000 * 60 * 60)
        );
        return Math.round(hours);
      }
      return 0;
    });

    const avgTimeToApprove = timeToApprove.length > 0 
      ? timeToApprove.reduce((a, b) => a + b, 0) / timeToApprove.length 
      : 0;

    // 6. Vehicle coverage data
    const allUnits = await prisma.unit.findMany({
      where: {
        is_deleted: false,
      },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const vehicleCoverageData = await Promise.all(
      allUnits.map(async (unit) => {
        const coverage = await Promise.all(
          last7Days.map(async (date) => {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            
            const checkCount = await prisma.workcheck.count({
              where: {
                unit_id: unit.id,
                created_at: {
                  gte: date,
                  lt: nextDay,
                },
                is_submitted: true,
                is_deleted: false,
              },
            });
            
            return {
              date: date.toISOString().split('T')[0],
              covered: checkCount > 0,
            };
          })
        );
        
        return {
          unitId: unit.id,
          unitName: unit.name,
          unitType: unit.type,
          coverage,
        };
      })
    );

    return NextResponse.json({
      checksCompletedToday,
      pendingApprovals,
      issueRate: Math.round(issueRate * 100) / 100,
      topFailingItems: failingItemsWithDetails,
      avgTimeToApprove: Math.round(avgTimeToApprove * 100) / 100,
      vehicleCoverageData,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
