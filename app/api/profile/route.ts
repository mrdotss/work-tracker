import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient()

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, username, phone_number, password, user_image } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const userRole = session.user.role

    // Prepare update data based on user role
    const updateData: {
      first_name: string;
      last_name: string;
      phone_number: string | null;
      user_image: string | null;
      updated_at: Date;
      username?: string;
      password?: string;
    } = {
      first_name,
      last_name,
      phone_number: phone_number || null,
      user_image: user_image || null,
      updated_at: new Date(),
    }

    // Only admins can update username and password
    if (userRole === "ADMIN") {
      if (username) updateData.username = username
      if (password) {
        updateData.password = await bcrypt.hash(password, 10)
      }
    }

    // If staff is trying to update username/password, ignore those fields
    if (userRole === "STAFF" && (username || password)) {
      // Remove username and password from update data for staff users
      delete updateData.username
      delete updateData.password
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        phone_number: true,
        role: true,
        user_image: true,
      },
    })

    return NextResponse.json(updatedUser, { status: 200 })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        phone_number: true,
        role: true,
        user_image: true,
        is_active: true,
        last_login: true,
        created_at: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
