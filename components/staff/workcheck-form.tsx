"use client"

import { toast } from "sonner"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Check, Clock, AlertCircle, Camera, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Unit, Workcheck, CheckItem } from "@/types/types"
import Image from "next/image";

interface WorkcheckFormProps {
  editWorkcheckId?: string | null;
  onWorkcheckSubmitted?: () => void;
}

export function WorkcheckForm({ editWorkcheckId, onWorkcheckSubmitted }: WorkcheckFormProps) {
  const { data: session } = useSession()
  const [workcheck, setWorkcheck] = useState<Workcheck | null>(null)
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState<string>("")
  const [isCreatingWorkcheck, setIsCreatingWorkcheck] = useState(false)
  const [hasVehicleSelected, setHasVehicleSelected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())
  const [showCamera, setShowCamera] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [updateTimeouts, setUpdateTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map())
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hoursTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Ref to hold the latest workcheck state for debounced updates
  const workcheckRef = useRef(workcheck);

  // Keep the ref updated with the latest state
  useEffect(() => {
    workcheckRef.current = workcheck;
  }, [workcheck]);


  useEffect(() => {
    if (session?.user) {
      if (editWorkcheckId) {
        fetchSpecificWorkcheck(editWorkcheckId)
      } else {
        fetchTodaysWorkcheck()
      }
    }
  }, [session, editWorkcheckId])

  // Cleanup camera stream when the component unmounts or camera closes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      // Cleanup any pending timeouts when the component unmounts
      updateTimeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [stream, updateTimeouts])

  const fetchSpecificWorkcheck = async (workcheckId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/staff/workcheck/${workcheckId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch workcheck')
      }

      const data = await response.json()

      // Transform the data to match the expected format
      const transformedData = {
        ...data,
        unit: data.Unit, // Map Unit to unit (lowercase)
        WorkcheckItems: data.WorkcheckItems.map((item: {
          id: string;
          item_id: string;
          actions: string[];
          note: string | null;
          Images: { file_name: string | null }[];
          CheckItem: CheckItem;
        }) => ({
          id: item.id,
          item_id: item.item_id,
          actions: item.actions || [], // Changed from action to actions (array)
          note: item.note || '',
          images: item.Images.map((img: { file_name: string | null }) => img.file_name),
          checkItem: item.CheckItem
        })),
        isSubmitted: false, // Allow editing when loading for edit
        approvalStatus: data.Approval?.is_approved !== null && data.Approval?.is_approved !== undefined
            ? (data.Approval.is_approved ? 'approved' : 'rejected')
            : 'pending',
        rejectionComment: data.Approval?.is_approved === false
            ? data.Approval?.comments
            : null
      }

      setWorkcheck(transformedData)
      setHasVehicleSelected(true)
      toast.success('Workcheck loaded for editing')
    } catch (error) {
      console.error('Error fetching workcheck:', error)
      toast.error('Failed to load workcheck details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTodaysWorkcheck = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/staff/workcheck/today')

      if (!response.ok) {
        throw new Error('Failed to fetch workcheck')
      }

      const data = await response.json()

      if (data.hasVehicleSelected === false) {
        // No workcheck exists, show vehicle selection
        setAvailableUnits(data.availableUnits)
        setHasVehicleSelected(false)
        setWorkcheck(null)
      } else {
        // Workcheck exists, show workcheck form
        setWorkcheck(data)
        setHasVehicleSelected(true)
      }
    } catch (error) {
      console.error('Error fetching workcheck:', error)
      toast.error('Failed to load today\'s workcheck')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkcheck = async () => {
    if (!selectedUnitId) {
      toast.error('Please select a vehicle')
      return
    }

    setIsCreatingWorkcheck(true)
    try {
      const response = await fetch('/api/staff/workcheck/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitId: selectedUnitId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create workcheck')
      }

      const newWorkcheck = await response.json()
      console.log('Created workcheck response:', newWorkcheck) // Debug log
      console.log('WorkcheckItems count:', newWorkcheck.WorkcheckItems?.length) // Debug log
      setWorkcheck(newWorkcheck)
      setHasVehicleSelected(true)
      toast.success('Workcheck created successfully!')
    } catch (error) {
      console.error('Error creating workcheck:', error)
      toast.error('Failed to create workcheck')
    } finally {
      setIsCreatingWorkcheck(false)
    }
  }

  const debouncedHoursMeterUpdate = (value: number) => {
    // Clear any pending update
    if (hoursTimeoutRef.current) {
      clearTimeout(hoursTimeoutRef.current)
    }

    // Update local state immediately
    setWorkcheck(prev =>
        prev ? { ...prev, hours_meter: value } : prev
    )

    // Schedule API call in 1s
    hoursTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/staff/workcheck/update-hours', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workcheckId: workcheck?.id,
            hours_meter: value,
          }),
        })
        if (!response.ok) throw new Error('Failed to update hours meter')
      } catch (error) {
        console.error(error)
        toast.error('Failed to update hours meter')
      } finally {
        hoursTimeoutRef.current = null
      }
    }, 1000)
  }

  // Debounced update function
  const debouncedItemUpdate = (itemId: string, field: 'note' | 'actions') => {
    const timeoutKey = `${itemId}-${field}`;
    const existingTimeout = updateTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const newTimeout = setTimeout(async () => {
      // Read the latest state from the ref when the timeout executes
      const currentWorkcheck = workcheckRef.current;
      const itemToUpdate = currentWorkcheck?.WorkcheckItems.find(item => item.id === itemId);

      if (!itemToUpdate) {
        console.error("Could not find item to update in ref");
        return;
      }

      // Get the latest value from the item
      let value: string | string[];
      if (field === 'actions') {
        value = JSON.stringify(itemToUpdate.actions);
      } else {
        value = itemToUpdate.note;
      }

      try {
        const response = await fetch('/api/staff/workcheck/update-item', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId,
            field,
            value,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update item');
        }

        setUpdateTimeouts(prev => {
          const newMap = new Map(prev);
          newMap.delete(timeoutKey);
          return newMap;
        });

      } catch (error) {
        console.error('Error updating item:', error);
        toast.error(`Failed to update ${field}`);
      }
    }, 1000); // 1 second delay

    setUpdateTimeouts(prev => new Map(prev).set(timeoutKey, newTimeout));
  };

  const handleNoteChange = (itemId: string, value: string) => {
    setWorkcheck(prev => {
      if (!prev) return prev;
      const newWorkcheck = {
        ...prev,
        WorkcheckItems: prev.WorkcheckItems.map(item =>
            item.id === itemId ? { ...item, note: value } : item
        ),
      };
      debouncedItemUpdate(itemId, 'note');
      return newWorkcheck;
    });
  };

  const handleSubmit = async () => {
    if (!workcheck) return

    // Check if all items are complete
    const incompleteItems = workcheck.WorkcheckItems.filter(item =>
        !item.actions || item.actions.length === 0 || item.images.length === 0
    )

    if (incompleteItems.length > 0) {
      toast.error(`Please complete all ${incompleteItems.length} remaining items before submitting`)
      return
    }

    if (!workcheck.hours_meter) {
      toast.error('Please enter the hours meter reading')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/staff/workcheck/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workcheckId: workcheck.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit workcheck')
      }

      setWorkcheck(prev => prev ? { ...prev, isSubmitted: true } : prev)
      toast.success('Workcheck submitted successfully! Awaiting approval.')

      // Call the callback if provided
      if (onWorkcheckSubmitted) {
        onWorkcheckSubmitted()
      }
    } catch (error) {
      console.error('Error submitting workcheck:', error)
      toast.error('Failed to submit workcheck')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startCamera = async (itemId: string) => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser/context')
        toast.error('Camera access is not supported in this browser')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Use back camera on mobile devices
        }
      })

      setStream(mediaStream)
      setShowCamera(itemId)

      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    setStream(null)
    setShowCamera(null)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !showCamera) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        toast.error('Failed to capture photo')
        return
      }

      // Create file from blob
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })

      // Upload the captured photo
      setUploadingImages(prev => new Set(prev).add(showCamera))

      try {
        const formData = new FormData()
        formData.append('image', file) // Changed from 'images' to 'image'
        formData.append('itemId', showCamera)

        const response = await fetch('/api/staff/workcheck/upload-images', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to upload photo')
        }

        const data = await response.json()

        // Update workcheck with new image (single image, not array)
        setWorkcheck(prev => {
          if (!prev) return prev

          return {
            ...prev,
            WorkcheckItems: prev.WorkcheckItems.map(item =>
                item.id === showCamera
                    ? { ...item, images: [data.imageUrl] } // Single image, not array
                    : item
            )
          }
        })

        toast.success('Photo captured and uploaded successfully')
        stopCamera()
      } catch (error) {
        console.error('Error uploading photo:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to upload photo')
      } finally {
        setUploadingImages(prev => {
          const newSet = new Set(prev)
          newSet.delete(showCamera)
          return newSet
        })
      }
    }, 'image/jpeg', 0.8)
  }

  // Add delete image function
  const deleteImage = async (itemId: string, imageUrl: string) => {
    try {
      // Find the image ID from the database
      const workcheckItem = workcheck?.WorkcheckItems.find(item => item.id === itemId)
      if (!workcheckItem) return

      // For now, we'll use the image URL to identify the image
      // In a real implementation, you'd store the image ID
      const response = await fetch(`/api/staff/workcheck/delete-image?imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete image')
      }

      // Update workcheck to remove the image
      setWorkcheck(prev => {
        if (!prev) return prev

        return {
          ...prev,
          WorkcheckItems: prev.WorkcheckItems.map(item =>
              item.id === itemId
                  ? { ...item, images: item.images.filter(img => img !== imageUrl) }
                  : item
          )
        }
      })

      toast.success('Image deleted successfully')
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete image')
    }
  }

  // Update actions instead of single action/result
  const handleActionChange = (itemId: string, action: string, checked: boolean) => {
    setWorkcheck(prev => {
      if (!prev) return prev;

      const newWorkcheck = {
        ...prev,
        WorkcheckItems: prev.WorkcheckItems.map(item => {
          if (item.id === itemId) {
            const currentActions = item.actions || [];
            const newActions = checked
                ? [...currentActions, action]
                : currentActions.filter(a => a !== action);
            return { ...item, actions: newActions };
          }
          return item;
        }),
      };

      // Trigger the debounced update
      debouncedItemUpdate(itemId, 'actions');

      return newWorkcheck;
    });
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  if (!workcheck && availableUnits.length === 0) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>No Workcheck Found</CardTitle>
            <CardDescription>
              No workcheck has been assigned for today. Please contact your supervisor.
            </CardDescription>
          </CardHeader>
        </Card>
    )
  }

  if (!hasVehicleSelected) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>Select a Vehicle</CardTitle>
            <CardDescription>
              Please select a vehicle to proceed with the workcheck.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {availableUnits.map(unit => (
                  <Button
                      key={unit.id}
                      onClick={() => setSelectedUnitId(unit.id)}
                      variant={selectedUnitId === unit.id ? "default" : "outline"}
                      className="w-full justify-start"
                  >
                    {unit.name} - {unit.type}
                  </Button>
              ))}
            </div>
          </CardContent>
          <div className="flex justify-end p-4">
            <Button
                onClick={handleCreateWorkcheck}
                disabled={!selectedUnitId || isCreatingWorkcheck}
                className="min-w-[120px]"
            >
              {isCreatingWorkcheck ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
              ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Workcheck
                  </>
              )}
            </Button>
          </div>
        </Card>
    )
  }

  if (!workcheck) {
    return (
        <Card>
          <CardHeader>
            <CardTitle>No Workcheck Found</CardTitle>
            <CardDescription>
              No workcheck available. Please try again.
            </CardDescription>
          </CardHeader>
        </Card>
    )
  }

  // Update completion criteria to check for actions array and images
  const isItemComplete = (item: {
    actions: string[];
    images: string[];
  }) => {
    return item.actions && item.actions.length > 0 && item.images.length > 0
  }

  const completedItems = workcheck.WorkcheckItems?.filter(item => isItemComplete(item)).length || 0

  const totalItems = workcheck.WorkcheckItems?.length || 0
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
      <div className="space-y-6">
        {/* Rejection Status Alert */}
        {workcheck.approvalStatus === 'rejected' && workcheck.rejectionComment && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-1">Workcheck Rejected</h4>
                    <p className="text-red-700 text-sm">
                      Your workcheck was rejected with the following comment:
                    </p>
                    <div className="mt-2 p-3 bg-red-100 rounded-md">
                      <p className="text-red-800 text-sm italic">&ldquo;{workcheck.rejectionComment}&rdquo;</p>
                    </div>
                    <p className="text-red-600 text-sm mt-2">
                      Please address the issues mentioned above and resubmit your workcheck.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
        )}

        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {workcheck.unit.name} - {workcheck.unit.type}
                  {workcheck.isSubmitted && (
                      <Badge variant="default">
                        <Check className="h-3 w-3 mr-1" />
                        Submitted
                      </Badge>
                  )}
                  {workcheck.approvalStatus === 'rejected' && (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" />
                        Rejected
                      </Badge>
                  )}
                  {workcheck.approvalStatus === 'pending' && editWorkcheckId && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending Review
                      </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {editWorkcheckId ? (
                      <>
                        Editing workcheck from {new Date(workcheck.created_at).toLocaleDateString()}
                        {workcheck.approvalStatus === 'rejected' && (
                            <span className="text-red-600 font-medium"> - Please fix and resubmit</span>
                        )}
                      </>
                  ) : (
                      `Daily inspection for ${new Date(workcheck.created_at).toLocaleDateString()}`
                  )}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{progress}%</div>
                <div className="text-sm text-muted-foreground">
                  {completedItems} of {totalItems} completed
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hours-meter">Hours Meter Reading</Label>
                <Input
                    id="hours-meter"
                    type="number"
                    value={workcheck.hours_meter || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      debouncedHoursMeterUpdate(value)
                    }}
                    placeholder="Enter current hours meter reading"
                    disabled={workcheck.isSubmitted}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
          />
        </div>

        {/* Checklist Items */}
        <div className="space-y-4">
          {(workcheck.WorkcheckItems || []).map((item) => (
              <Card key={item.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {item.checkItem.code} - {item.checkItem.label}
                      {item.actions && item.actions.length > 0 && item.images.length > 0 && (
                          <Badge variant="default">
                            <Check className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                      )}
                    </CardTitle>
                    {uploadingImages.has(item.id) && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`action-${item.id}`}>Action Taken</Label>
                      <div className="flex flex-wrap gap-4 mt-2">
                        {['P', 'B', 'L', 'T'].map(action => (
                            <div key={action} className="flex items-center space-x-2">
                              <Checkbox
                                  id={`action-${item.id}-${action}`}
                                  checked={item.actions?.includes(action)}
                                  onCheckedChange={(checked) => handleActionChange(item.id, action, !!checked)}
                                  disabled={workcheck.isSubmitted}
                              />
                              <Label
                                  htmlFor={`action-${item.id}-${action}`}
                                  className="text-sm font-medium cursor-pointer"
                              >
                                {action === 'P' && 'Periksa'}
                                {action === 'B' && 'Bersihkan'}
                                {action === 'L' && 'Luminasi'}
                                {action === 'T' && 'Tambah'}
                              </Label>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`note-${item.id}`}>Notes</Label>
                    <Textarea
                        id={`note-${item.id}`}
                        value={item.note}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        placeholder="Add any additional notes..."
                        disabled={workcheck.isSubmitted}
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label>Proof Images</Label>
                    <div className="mt-2 space-y-2">
                      {!workcheck.isSubmitted && (
                          <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => startCamera(item.id)}
                                disabled={uploadingImages.has(item.id) || item.images.length > 0}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              {item.images.length > 0 ? "Uploaded" : "Capture Photo"}
                            </Button>
                          </div>
                      )}

                      {item.images.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.images.map((imageUrl, index) => (
                                <div key={index} className="relative">
                                  <Image
                                      src={imageUrl}
                                      alt={`Proof ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setSelectedImage(imageUrl)}
                                      width={250}
                                      height={250}
                                  />
                                  {!workcheck.isSubmitted && (
                                      <Button
                                          variant="destructive"
                                          size="icon"
                                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm"
                                          onClick={() => deleteImage(item.id, imageUrl)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                  )}
                                </div>
                            ))}
                          </div>
                      )}

                      {showCamera === item.id && (
                          <div className="flex flex-col gap-2">
                            <video
                                ref={videoRef}
                                className="w-full h-auto rounded-md border"
                                autoPlay
                                playsInline
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="flex gap-2">
                              <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={capturePhoto}
                              >
                                <Camera className="h-4 w-4 mr-2" />
                                Capture
                              </Button>
                              <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={stopCamera}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Close Camera
                              </Button>
                            </div>
                          </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>

        {/* Submit Button */}
        {!workcheck.isSubmitted && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {completedItems === totalItems && totalItems > 0 ? (
                        <span className="text-green-600 font-medium">All items completed! Ready to submit.</span>
                    ) : (
                        <span>Complete all {totalItems} items to submit your workcheck.</span>
                    )}
                  </div>
                  <Button
                      onClick={handleSubmit}
                      disabled={completedItems < totalItems || isSubmitting || !workcheck.hours_meter || totalItems === 0}
                      className="min-w-[120px]"
                  >
                    {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                    ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Submit Workcheck
                        </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
        )}

        {/* Image Modal */}
        {selectedImage && (
            <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedImage(null)}
            >
              <div className="relative max-w-4xl max-h-full">
                <Image
                    src={selectedImage}
                    alt="Full size preview"
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                    width={750}
                    height={750}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
        )}
      </div>
  )
}