import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { unitId } = body

    if (!unitId) {
      return NextResponse.json({ error: "Unit ID is required" }, { status: 400 })
    }

    const userId = session.user.id
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Check if today's workcheck already exists
    const existingWorkcheck = await prisma.workcheck.findFirst({
      where: {
        checker_id: userId,
        created_at: {
          gte: today,
          lt: tomorrow,
        },
        is_deleted: false,
      },
    })

    if (existingWorkcheck) {
      return NextResponse.json({ error: "Today's workcheck already exists" }, { status: 400 })
    }

    // Verify the unit exists and is not deleted
    const unit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        is_deleted: false,
      },
    })

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 })
    }

    // Get all active check items
    const checkItems = await prisma.checkItem.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        sort_order: 'asc',
      },
    })

    // Create the workcheck with selected unit
    const workcheck = await prisma.workcheck.create({
      data: {
        checker_id: userId,
        unit_id: unitId,
        created_at: new Date(),
        updated_at: new Date(),
        WorkcheckItems: {
          create: checkItems.map(item => ({
            item_id: item.id,
            actions: [],
            note: '',
          })),
        },
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

    // Transform the data for the frontend
    const transformedWorkcheck = {
      id: workcheck.id,
      unit_id: workcheck.unit_id,
      hours_meter: workcheck.hours_meter,
      created_at: workcheck.created_at,
      unit: {
        id: workcheck.Unit.id,
        name: workcheck.Unit.name || '',
        type: workcheck.Unit.type || '',
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

    return NextResponse.json(transformedWorkcheck, { status: 201 })
  } catch (error) {
    console.error("Error creating workcheck:", error)
    return NextResponse.json(
      { error: "Failed to create workcheck" },
      { status: 500 }
    )
  }
}
