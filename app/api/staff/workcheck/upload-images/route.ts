import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { put, del } from "@vercel/blob"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get("image") as File
    const itemId = formData.get("itemId") as string

    if (!image || !itemId) {
      return NextResponse.json({ error: "Missing image or item ID" }, { status: 400 })
    }

    // Verify the workcheck item belongs to the current user
    const workcheckItem = await prisma.workcheckItem.findFirst({
      where: {
        id: itemId,
        Workcheck: {
          checker_id: session.user.id,
        },
      },
      include: {
        Images: true,
      },
    })

    if (!workcheckItem) {
      return NextResponse.json({ error: "Workcheck item not found" }, { status: 404 })
    }

    // Check if this item already has an image (1 image per item limit)
    if (workcheckItem.Images.length > 0) {
      return NextResponse.json({ error: "This item already has an image. Please delete the existing image first." }, { status: 400 })
    }

    // Validate file type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Please upload an image." }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 })
    }

    // Generate date-based folder name (DD-MM-YYYY)
    const today = new Date()
    const dateFolder = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2)
    const originalName = image.name.replace(/[^a-zA-Z0-9.-]/g, "")
    const filename = `${session.user.id}-${itemId}-${timestamp}-${randomString}-${originalName}`

    // Upload to Vercel Blob with folder structure
    const blobPath = `workcheck/${dateFolder}/${filename}`
    const blob = await put(blobPath, image, {
      access: 'public',
    })

    // Store image record in database
    await prisma.workcheckItemImage.create({
      data: {
        item_id: itemId,
        file_name: blob.url,
        uploaded_at: new Date(),
      },
    })

    return NextResponse.json({
      imageUrl: blob.url,
      message: "Image uploaded successfully"
    }, { status: 200 })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}

// New DELETE endpoint to delete images
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get("imageId")

    if (!imageId) {
      return NextResponse.json({ error: "Missing image ID" }, { status: 400 })
    }

    // Find the image and verify ownership
    const image = await prisma.workcheckItemImage.findFirst({
      where: {
        id: imageId,
        WorkcheckItem: {
          Workcheck: {
            checker_id: session.user.id,
          },
        },
      },
    })

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Delete from Vercel Blob
    try {
      await del(image.file_name!)
    } catch (blobError) {
      console.error("Error deleting from blob:", blobError)
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await prisma.workcheckItemImage.delete({
      where: {
        id: imageId,
      },
    })

    return NextResponse.json({
      message: "Image deleted successfully"
    }, { status: 200 })
  } catch (error) {
    console.error("Image deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    )
  }
}
