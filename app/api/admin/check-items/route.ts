import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const checkItems = await prisma.checkItem.findMany({
      orderBy: {
        sort_order: 'asc',
      },
    })

    return NextResponse.json(checkItems, { status: 200 })
  } catch (error) {
    console.error("Error fetching check items:", error)
    return NextResponse.json(
      { error: "Failed to fetch check items" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code, label, sort_order, is_active } = body

    if (!code || !label) {
      return NextResponse.json(
        { error: "Code and label are required" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingItem = await prisma.checkItem.findFirst({
      where: { code: code.trim().toUpperCase() }
    })

    if (existingItem) {
      return NextResponse.json(
        { error: "Check item code already exists" },
        { status: 400 }
      )
    }

    const checkItem = await prisma.checkItem.create({
      data: {
        code: code.trim().toUpperCase(),
        label: label.trim(),
        sort_order: sort_order || 1,
        is_active: is_active !== undefined ? is_active : true,
        created_at: new Date()
      },
    })

    return NextResponse.json(checkItem, { status: 201 })
  } catch (error) {
    console.error("Error creating check item:", error)
    return NextResponse.json(
      { error: "Failed to create check item" },
      { status: 500 }
    )
  }
}
