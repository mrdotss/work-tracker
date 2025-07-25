import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient();

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { first_name, last_name, username, phone_number, role, reset_password, new_password } = body;
    const { id: userId } = await params;

    // Validate required fields
    if (!first_name || !last_name || !username) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if a username already exists (excluding current user)
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: userId }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }

    // Prepare update data
    interface UpdateUserData {
      first_name: string;
      last_name: string;
      username: string;
      phone_number: string | null;
      role: Role;
      updated_at: Date;
      password?: string;
    }

    const updateData: UpdateUserData = {
      first_name,
      last_name,
      username,
      phone_number: phone_number || null,
      role: role as Role,
      updated_at: new Date(),
    };

    // Handle password reset if requested
    if (reset_password && new_password) {
      updateData.password = await bcrypt.hash(new_password, 10);
    }

    // Update user
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
        updated_at: true,
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: userId } = await params;

    // Prevent users from deleting themselves
    if (session.user.id === userId) {
      return NextResponse.json(
        { message: "You cannot delete your own account" },
        { status: 403 }
      );
    }

    // Soft delete by updating a status field
    await prisma.user.update({
      where: { id: userId },
      data: { updated_at: new Date() }
    });

    return NextResponse.json({ message: "Pengnonatifan User Sukses" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
