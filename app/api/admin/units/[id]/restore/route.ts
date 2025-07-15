import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Restore the unit
    const unit = await prisma.unit.update({
      where: { id },
      data: {
        is_deleted: false,
        deleted_at: null,
      },
    })

    return NextResponse.json(unit, { status: 200 })
  } catch (error) {
    console.error("Error restoring unit:", error)
    return NextResponse.json(
      { error: "Failed to restore unit" },
      { status: 500 }
    )
  }
}
