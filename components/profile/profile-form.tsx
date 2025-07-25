"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Upload, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const profileSchema = z.object({
  first_name: z.string().min(1, "Nama depan wajib diisi"),
  last_name: z.string().min(1, "Nama belakang wajib diisi"),
  username: z.string().min(1, "Username wajib diisi"),
  phone_number: z.string().optional(),
  password: z.string().optional(),
  user_image: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileForm() {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [lastLoginInfo, setLastLoginInfo] = useState<{
    last_login: string | null;
    created_at: string | null;
    updated_at: string | null;
  } | null>(null)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      phone_number: "",
      password: "",
      user_image: "",
    },
  })

  const isStaff = session?.user?.role === "STAFF"

  useEffect(() => {
    if (session?.user) {
      form.reset({
        first_name: session.user.first_name || "",
        last_name: session.user.last_name || "",
        username: session.user.username || "",
        phone_number: session.user.phone_number || "",
        password: "",
        user_image: session.user.user_image || "",
      })
      setImagePreview(session.user.user_image || null)
    }
  }, [session, form])

  // Fetch last login information
  useEffect(() => {
    const fetchLastLoginInfo = async () => {
      try {
        const response = await fetch('/api/auth/check-last-login')
        if (response.ok) {
          const data = await response.json()
          setLastLoginInfo(data.user)
        }
      } catch (error) {
        console.error('Error fetching last login info:', error)
      }
    }

    if (session?.user) {
      fetchLastLoginInfo()
    }
  }, [session])

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Tidak tersedia'
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("image", file)

    // Pass the current image URL so the backend can delete it
    if (session?.user?.user_image) {
      formData.append("oldImageUrl", session.user.user_image)
    }

    const response = await fetch("/api/upload/profile-image", {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      // Show a specific error message from API
      toast.error(data.error || "Upload failed", {
        description: data.message || "Failed to upload image. Please try again."
      })
      throw new Error(data.message || "Failed to upload image")
    }

    // Show a success message
    toast.success("Image uploaded successfully", {
      description: "Your profile image has been updated."
    })

    return data.filename
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!session?.user) return

    setIsLoading(true)
    try {
      let imageFilename = data.user_image

      // Upload an image if a new one was selected
      if (imageFile) {
        try {
          imageFilename = await uploadImage(imageFile)
        } catch (error) {
          // Image upload failed, don't continue with profile update
          setIsLoading(false)
          console.error("Image upload error:", error)
          return
        }
      }

      const updateData = isStaff
          ? {
            first_name: data.first_name,
            last_name: data.last_name,
            phone_number: data.phone_number,
            user_image: imageFilename,
          }
          : {
            first_name: data.first_name,
            last_name: data.last_name,
            username: data.username,
            phone_number: data.phone_number,
            user_image: imageFilename,
            ...(data.password && { password: data.password }),
          }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(`**${errorData.error || "Update failed"}**`, {
          description: errorData.message || "Failed to update profile. Please try again."
        })
        throw new Error(errorData.message || "Failed to update profile")
      }

      const updatedUser = await response.json()

      await update({
        user: {
          ...session.user,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          username: updatedUser.username,
          phone_number: updatedUser.phone_number,
          user_image: updatedUser.user_image,
        },
      })

      if (imageFilename) {
        setImagePreview(imageFilename)
      }

      toast.success("Profile updated successfully!", {
        description: "Your profile information has been saved."
      })
      form.reset({ ...form.getValues(), password: "", user_image: imageFilename })
      setImageFile(null)
    } catch (error) {
      console.error("Profile update error:", error)
      if (error instanceof Error && !error.message.includes("upload")) {
        toast.error("Failed to update profile", {
          description: "Please try again later."
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user) {
    return <div>Loading...</div>
  }

  const userInitials = `${session.user.first_name?.[0] || ''}${session.user.last_name?.[0] || ''}`.toUpperCase() || 'U'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informasi Akun</CardTitle>
        <CardDescription>
          {isStaff
            ? "Ubah informasi personal anda. Hubungi admin anda untuk mengubah username atau password."
            : "Ubah informasi profil dan penganturan akun."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={imagePreview || session.user.user_image || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant={session.user.role === "ADMIN" ? "default" : "secondary"}>
                    {session.user.role}
                  </Badge>

                  {/* Last Login Information */}
                  {lastLoginInfo && (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Login terakhir: {formatDateTime(lastLoginInfo.last_login)}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="profile-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById("profile-image")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Ubah Foto Profil
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Depan</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Belakang</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isStaff} />
                  </FormControl>
                  {isStaff && (
                    <FormDescription>
                      Hubungi admin anda untuk mengubah username atau password.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor Telepon</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Masukkan nomor telepon anda" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder={isStaff ? "Hubungi admin untuk mengubah password" : "Masukkan password baru (biarkan kosong jika tidak ingin mengubah)"}
                      disabled={isStaff}
                    />
                  </FormControl>
                  {isStaff && (
                    <FormDescription>
                      Hubungi admin anda untuk mengubah username atau password.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} isLoading={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ubah Profile
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
