import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Staff can only view their own workchecks
    const workcheck = await prisma.workcheck.findFirst({
      where: {
        id,
        checker_id: session.user.id,
        is_deleted: false
      },
      include: {
        Checker: {
          select: {
            first_name: true,
            last_name: true,
            username: true
          }
        },
        Unit: {
          select: {
            name: true,
            type: true
          }
        },
        WorkcheckItems: {
          include: {
            CheckItem: {
              select: {
                code: true,
                label: true,
                sort_order: true
              }
            },
            Images: {
              select: {
                file_name: true
              }
            }
          },
          orderBy: {
            CheckItem: {
              sort_order: "asc"
            }
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
          }
        }
      }
    })

    if (!workcheck) {
      return NextResponse.json(
        { error: "Workcheck not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(workcheck)

  } catch (error) {
    console.error("Error fetching workcheck details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
