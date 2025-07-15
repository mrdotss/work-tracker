import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, field, value } = body

    if (!itemId || !field) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the workcheck item belongs to the current user
    const workcheckItem = await prisma.workcheckItem.findFirst({
      where: {
        id: itemId,
        Workcheck: {
          checker_id: session.user.id,
        },
      },
    })

    if (!workcheckItem) {
      return NextResponse.json({ error: "Workcheck item not found" }, { status: 404 })
    }

    // Validate field and value
    const allowedFields = ['actions', 'note']
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 })
    }

    // Update the workcheck item
    const updateData: {
      actions?: string[];
      note?: string;
    } = {}

    if (field === 'actions') {
      // Parse JSON string back to array for actions field
      try {
        updateData.actions = JSON.parse(value)
      } catch (error) {
        console.error('Error parsing actions JSON:', error)
        updateData.actions = []
      }
    } else if (field === 'note') {
      updateData.note = value
    }

    const updatedItem = await prisma.workcheckItem.update({
      where: { id: itemId },
      data: updateData,
    })

    return NextResponse.json({
      message: "Item updated successfully",
      item: updatedItem
    })
  } catch (error) {
    console.error("Error updating workcheck item:", error)
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    )
  }
}
