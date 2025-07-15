import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { put, del } from '@vercel/blob';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({
        error: "Unauthorized",
        message: "You must be logged in to upload an image"
      }, { status: 401 })
    }

    const data = await request.formData()
    const file: File | null = data.get("image") as unknown as File
    const oldImageUrl = data.get("oldImageUrl") as string

    if (!file) {
      return NextResponse.json({
        error: "No file uploaded",
        message: "Please select an image to upload"
      }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({
        error: "Invalid file type",
        message: "File must be an image (JPG, PNG, GIF, etc.)"
      }, { status: 400 })
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({
        error: "File too large",
        message: "File size must be less than 2MB"
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "")
    const filename = `${session.user.id}-${timestamp}-${originalName}`

    // Upload to Vercel Blob storage
    const blob = await put(`profiles/${filename}`, file, {
      access: 'public',
    });

    // Delete the old image if it exists and is from Vercel Blob
    if (oldImageUrl && oldImageUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(oldImageUrl)
      } catch (error) {
        console.error("Failed to delete old image:", error)
      }
    }

    return NextResponse.json({
      filename: blob.url,
      message: "Image uploaded successfully"
    }, { status: 200 })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json({
      error: "Upload failed",
      message: "Failed to upload image. Please try again later."
    }, { status: 500 })
  }
}
