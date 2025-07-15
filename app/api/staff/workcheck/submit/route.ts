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
    const { workcheckId } = body

    if (!workcheckId) {
      return NextResponse.json({ error: "Missing workcheck ID" }, { status: 400 })
    }

    // Verify the workcheck belongs to the current user and get all items
    const workcheck = await prisma.workcheck.findFirst({
      where: {
        id: workcheckId,
        checker_id: session.user.id,
      },
      include: {
        WorkcheckItems: {
          include: {
            Images: true, // Corrected from images to Images
          },
        },
        Unit: true,
        Checker: true,
      },
    })

    if (!workcheck) {
      return NextResponse.json({ error: "Workcheck not found" }, { status: 404 })
    }

    // Check if workcheck is already submitted
    const existingApproval = await prisma.approval.findFirst({
      where: {
        workcheck_id: workcheckId,
      },
    })

    // If approval exists and is already approved, don't allow resubmission
    if (existingApproval && existingApproval.is_approved === true) {
      return NextResponse.json({ error: "Workcheck already approved" }, { status: 400 })
    }

    // Validate that all items are complete
    const incompleteItems = workcheck.WorkcheckItems.filter(item =>
      !item.actions || item.actions.length === 0 || item.Images.length === 0
    )

    if (incompleteItems.length > 0) {
      return NextResponse.json({
        error: `Please complete all ${incompleteItems.length} remaining items before submitting`
      }, { status: 400 })
    }

    if (!workcheck.hours_meter) {
      return NextResponse.json({ error: "Please enter hours meter reading" }, { status: 400 })
    }

    let approval;
    if (existingApproval) {
      // Reset existing approval to pending state (for resubmissions)
      approval = await prisma.approval.update({
        where: {
          id: existingApproval.id
        },
        data: {
          approver_id: null,
          is_approved: null,
          approved_at: null,
          comments: null,
        },
      })
    } else {
      // Create new approval record (for first-time submissions)
      approval = await prisma.approval.create({
        data: {
          workcheck_id: workcheckId,
          approver_id: null,
          is_approved: null,
          approved_at: null,
          comments: null,
        },
      })
    }

    // Update workcheck status and timestamp
    await prisma.workcheck.update({
      where: { id: workcheckId },
      data: {
        is_submitted: true,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Workcheck submitted successfully! Awaiting approval.",
      approval: approval
    }, { status: 200 })
  } catch (error) {
    console.error("Error submitting workcheck:", error)
    return NextResponse.json(
      { error: "Failed to submit workcheck" },
      { status: 500 }
    )
  }
}
