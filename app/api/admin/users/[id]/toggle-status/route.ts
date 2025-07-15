import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient();

// POST - Toggle user status (activate/deactivate)
export async function POST(
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

    // Prevent users from deactivating themselves
    if (session.user.id === userId) {
      return NextResponse.json(
        { message: "You cannot deactivate your own account" },
        { status: 403 }
      );
    }

    // Get current user status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_active: true, first_name: true, last_name: true }
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Toggle the is_active status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        is_active: !user.is_active,
        updated_at: new Date()
      }
    });

    const action = updatedUser.is_active ? "activated" : "deactivated";
    return NextResponse.json({
      message: `User ${user.first_name} ${user.last_name} has been ${action} successfully`,
      is_active: updatedUser.is_active
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json(
      { error: "Failed to toggle user status" },
      { status: 500 }
    );
  }
}
