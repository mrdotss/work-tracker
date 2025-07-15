import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { PrismaClient } from "@prisma/client"
import { del } from "@vercel/blob"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get("imageId")
    const imageUrl = searchParams.get("imageUrl")

    if (!imageId && !imageUrl) {
      return NextResponse.json({ error: "Missing image ID or URL" }, { status: 400 })
    }

    // Find the image by ID or URL and verify ownership
    const image = await prisma.workcheckItemImage.findFirst({
      where: imageId ? {
        id: imageId,
        WorkcheckItem: {
          Workcheck: {
            checker_id: session.user.id,
          },
        },
      } : {
        file_name: imageUrl,
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
        id: image.id,
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
