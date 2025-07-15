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
    const { name, type } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: {
        name: name.trim(),
        type: type.trim(),
      },
    })

    return NextResponse.json(unit, { status: 200 })
  } catch (error) {
    console.error("Error updating unit:", error)
    return NextResponse.json(
      { error: "Failed to update unit" },
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

    // Soft delete the unit
    const unit = await prisma.unit.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
      },
    })

    return NextResponse.json(unit, { status: 200 })
  } catch (error) {
    console.error("Error deleting unit:", error)
    return NextResponse.json(
      { error: "Failed to delete unit" },
      { status: 500 }
    )
  }
}
