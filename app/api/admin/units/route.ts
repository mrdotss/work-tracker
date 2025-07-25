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

    const units = await prisma.unit.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(units, { status: 200 })
  } catch (error) {
    console.error("Error fetching units:", error)
    return NextResponse.json(
      { error: "Failed to fetch units" },
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
    const { name, type, number_plate } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      )
    }

    const unit = await prisma.unit.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        number_plate: number_plate ? number_plate.trim() : null,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error("Error creating unit:", error)
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 }
    )
  }
}
