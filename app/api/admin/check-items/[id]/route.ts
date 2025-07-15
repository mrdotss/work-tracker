import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { code, label, sort_order, is_active } = body

    if (!code || !label) {
      return NextResponse.json(
        { error: "Code and label are required" },
        { status: 400 }
      )
    }

    // Check if code already exists (excluding current item)
    const existingItem = await prisma.checkItem.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        id: { not: id }
      }
    })

    if (existingItem) {
      return NextResponse.json(
        { error: "Check item code already exists" },
        { status: 400 }
      )
    }

    const checkItem = await prisma.checkItem.update({
      where: { id },
      data: {
        code: code.trim().toUpperCase(),
        label: label.trim(),
        sort_order: sort_order || 1,
        is_active: is_active !== undefined ? is_active : true,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(checkItem, { status: 200 })
  } catch (error) {
    console.error("Error updating check item:", error)
    return NextResponse.json(
      { error: "Failed to update check item" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if check item is being used in any workcheck items
    const usageCount = await prisma.workcheckItem.count({
      where: { item_id: id }
    })

    if (usageCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete check item. It is being used in ${usageCount} workcheck(s)` },
        { status: 400 }
      )
    }

    // Hard to delete since check items don't have soft delete
    await prisma.checkItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Check item deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting check item:", error)
    return NextResponse.json(
      { error: "Failed to delete check item" },
      { status: 500 }
    )
  }
}
