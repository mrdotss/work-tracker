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
    const { workcheckId, hours_meter } = body

    if (!workcheckId || hours_meter === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the workcheck belongs to the current user
    const workcheck = await prisma.workcheck.findFirst({
      where: {
        id: workcheckId,
        checker_id: session.user.id,
      },
    })

    if (!workcheck) {
      return NextResponse.json({ error: "Workcheck not found" }, { status: 404 })
    }

    // Update the hours meter
    const updatedWorkcheck = await prisma.workcheck.update({
      where: { id: workcheckId },
      data: {
        hours_meter: hours_meter,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      workcheck: updatedWorkcheck
    }, { status: 200 })
  } catch (error) {
    console.error("Error updating hours meter:", error)
    return NextResponse.json(
      { error: "Failed to update hours meter" },
      { status: 500 }
    )
  }
}
