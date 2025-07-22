import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's vehicle checks and status
    const todayChecks = await prisma.workcheck.findMany({
      where: {
        checker_id: userId,
        created_at: {
          gte: today,
          lt: tomorrow,
        },
        is_deleted: false,
      },
      include: {
        Unit: true,
        Approval: true,
        WorkcheckItems: {
          include: {
            CheckItem: true,
          },
        },
      },
    });

    // Calculate if today's check is finished
    const todayFinished = todayChecks.length > 0 && todayChecks.every(check => check.is_submitted);
    const vehicleStatus = todayChecks.map(check => ({
      unitName: check.Unit.name,
      isSubmitted: check.is_submitted,
      approvalStatus: check.Approval?.is_approved,
    }));

    // Get open tasks (pending approvals or incomplete checks)
    const openTasks = await prisma.workcheck.findMany({
      where: {
        checker_id: userId,
        OR: [
          { is_submitted: false },
          {
            Approval: {
              is_approved: null,
            },
          },
        ],
        is_deleted: false,
      },
      include: {
        Unit: true,
        Approval: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 10,
    });

    // Calculate 7-day streak
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyChecks = await prisma.workcheck.findMany({
      where: {
        checker_id: userId,
        created_at: {
          gte: sevenDaysAgo,
          lt: tomorrow,
        },
        is_submitted: true,
        is_deleted: false,
      },
      select: {
        created_at: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // Calculate streak by checking consecutive days
    const streak = calculateStreak(weeklyChecks, today);

    return NextResponse.json({
      todayFinished,
      vehicleStatus,
      openTasks: openTasks.map(task => ({
        id: task.id,
        unitName: task.Unit.name,
        isSubmitted: task.is_submitted,
        createdAt: task.created_at,
        approvalStatus: task.Approval?.is_approved,
      })),
      streak,
    });
  } catch (error) {
    console.error("Error fetching staff dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateStreak(checks: { created_at: Date | null }[], today: Date): number {
  const checkDates = checks
    .map(check => check.created_at)
    .filter(date => date !== null)
    .map(date => {
      const d = new Date(date!);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

  const uniqueDates = [...new Set(checkDates)].sort((a, b) => b - a);

  let streak = 0;
  const todayTime = today.getTime();

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(todayTime - (i * 24 * 60 * 60 * 1000));
    checkDate.setHours(0, 0, 0, 0);

    if (uniqueDates.includes(checkDate.getTime())) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
