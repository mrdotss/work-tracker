import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// GET - Fetch all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        phone_number: true,
        role: true,
        user_image: true,
        last_login: true,
        created_at: true,
        updated_at: true,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { first_name, last_name, username, phone_number, role, temporary_password } = body;

    // Validate required fields
    if (!first_name || !last_name || !username || !temporary_password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if a username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(temporary_password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        username,
        phone_number: phone_number || null,
        role: role || "STAFF",
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        phone_number: true,
        role: true,
        created_at: true,
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
