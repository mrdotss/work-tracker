import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { del } from '@vercel/blob'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 })
    }

    // Only delete it if it's a Vercel Blob URL
    if (imageUrl.includes('blob.vercel-storage.com')) {
      await del(imageUrl)
    }

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
