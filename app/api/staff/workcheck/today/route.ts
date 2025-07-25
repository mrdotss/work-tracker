import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Check if today's workcheck already exists
    const workcheck = await prisma.workcheck.findFirst({
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
        WorkcheckItems: {
          include: {
            CheckItem: true,
            Images: true,
          },
          orderBy: {
            CheckItem: {
              sort_order: 'asc',
            },
          },
        },
        Approval: true,
      },
    })

    // If workcheck exists, return it with vehicle info
    if (workcheck) {
      const transformedWorkcheck = {
        id: workcheck.id,
        unit_id: workcheck.unit_id,
        hours_meter: workcheck.hours_meter,
        created_at: workcheck.created_at,
        unit: {
          id: workcheck.Unit.id,
          name: workcheck.Unit.name,
          type: workcheck.Unit.type,
          number_plate: workcheck.Unit.number_plate,
        },
        WorkcheckItems: workcheck.WorkcheckItems.map(item => ({
          id: item.id,
          item_id: item.item_id,
          actions: item.actions || [],
          note: item.note || '',
          images: item.Images.map(img => img.file_name),
          checkItem: {
            id: item.CheckItem?.id || '',
            code: item.CheckItem?.code || '',
            label: item.CheckItem?.label || '',
            sort_order: item.CheckItem?.sort_order || 0,
            is_active: item.CheckItem?.is_active || false,
          },
        })),
        isSubmitted: !!workcheck.Approval,
        hasVehicleSelected: true,
      }

      return NextResponse.json(transformedWorkcheck, { status: 200 })
    }

    // If no workcheck exists, return available vehicles for selection
    // Exclude vehicles that already have a workcheck today from any user
    const unitsWithWorkcheckToday = await prisma.workcheck.findMany({
      where: {
        created_at: {
          gte: today,
          lt: tomorrow,
        },
        is_deleted: false,
      },
      select: {
        unit_id: true,
      },
    })

    const excludedUnitIds = unitsWithWorkcheckToday.map(wc => wc.unit_id)

    const availableUnits = await prisma.unit.findMany({
      where: {
        is_deleted: false,
        id: {
          notIn: excludedUnitIds,
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      hasVehicleSelected: false,
      availableUnits: availableUnits,
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching today's workcheck:", error)
    return NextResponse.json(
      { error: "Failed to fetch workcheck" },
      { status: 500 }
    )
  }
}
