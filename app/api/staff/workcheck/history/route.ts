import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient, Prisma } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || "all"
    const date = searchParams.get("date") || ""

    const offset = (page - 1) * limit

    // Build where clause
    const whereClause: {
      checker_id: string;
      is_deleted: boolean;
      created_at?: {
        gte: Date;
        lt: Date;
      };
    } = {
      checker_id: session.user.id,
      is_deleted: false
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)

      whereClause.created_at = {
        gte: startDate,
        lt: endDate
      }
    }

    // Get total count
    const totalCount = await prisma.workcheck.count({
      where: whereClause
    })

    // Define the type using Prisma's utility
    type WorkcheckWithRelations = Prisma.WorkcheckGetPayload<{
      include: {
        Unit: {
          select: {
            name: true
            type: true
          }
        }
        Approval: {
          include: {
            Approver: {
              select: {
                first_name: true
                last_name: true
              }
            }
          }
        }
      }
    }>

    // Get workchecks with pagination
    const workchecks:WorkcheckWithRelations[] = await prisma.workcheck.findMany({
      where: whereClause,
      include: {
        Unit: {
          select: {
            name: true,
            type: true
          }
        },
        Approval: {
          include: {
            Approver: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          },
        }
      },
      orderBy: {
        created_at: "desc"
      },
      skip: offset,
      take: limit
    })

    // Filter by status if specified
    let filteredWorkchecks = workchecks
    if (status !== "all") {
      filteredWorkchecks = workchecks.filter(workcheck => {
        if (!workcheck.Approval) return status === "pending"

        const approval = workcheck.Approval
        if (approval.is_approved === null) return status === "pending"
        return approval.is_approved ? status === "approved" : status === "rejected"
      })
    }

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      workchecks: filteredWorkchecks,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit
      }
    })

  } catch (error) {
    console.error("Error fetching staff history:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
