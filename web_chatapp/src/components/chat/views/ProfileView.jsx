import { useEffect, useState, useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Edit, Save, X, Loader2, Trash2, AlertCircle, Camera } from "lucide-react"
import {
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useDeleteTagsMutation,
  useGetAvailableTagsQuery,
  useUpdateMoodMutation,
} from "../../../services/userService"
import { useAuth } from "@/contexts/AuthContext"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { MOOD_OPTIONS, getMoodEmoji, getFormattedMoodSentence, isMoodFresh } from "@/lib/mood"

export function ProfileView({ isOpen, onClose }) {
  const { t } = useTranslation()
  const { updateUser } = useAuth()
  const { data: profileData, isLoading: profileLoading, error: profileError, refetch: refetchProfile } =
    useGetUserProfileQuery(undefined, {
      // Refetch on mount but skip if we have cached data to prevent flickering
      refetchOnMountOrArgChange: false,
    })
  console.log("Profile data:", profileData)
  console.log("Selected tags from profile:", profileData?.selected_tags)
  console.log("Profile loading:", profileLoading)
  console.log("Profile error:", profileError)
  const { data: tagsData, isLoading: tagsLoading, refetch: refetchTags } =
    useGetAvailableTagsQuery()
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation()
  const [updateMood, { isLoading: updatingMood }] = useUpdateMoodMutation()
  const [deleteTags, { isLoading: deletingTags }] = useDeleteTagsMutation()

  const profile = profileData?.profile
  const selectedTags = profileData?.selected_tags || []

  const moodKey = profile?.mood
  const moodUpdatedAt = profile?.mood_updated_at
  const visibleMoodKey = moodKey && isMoodFresh(moodUpdatedAt) ? moodKey : null
  const visibleMoodSentence = visibleMoodKey ? getFormattedMoodSentence(visibleMoodKey, t) : null
  const visibleMoodEmoji = visibleMoodKey ? getMoodEmoji(visibleMoodKey) : null

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    user_name: "",
    phone: "",
    bio: "",
    profile_picture_url: "",
  })
  console.log("Form data:", formData)
  const [selectedInterests, setSelectedInterests] = useState([])
  const [profileImage, setProfileImage] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [lastUpdatedPictureUrl, setLastUpdatedPictureUrl] = useState(null)
  const [uploadingPicture, setUploadingPicture] = useState(false)
  const [imageVersion, setImageVersion] = useState(0)
  const fileInputRef = useRef(null)
  const objectUrlRef = useRef(null)

  // Initialize form and selected tags
  useEffect(() => {
    if (profile) {
      setFormData(prev => {
        const newProfilePictureUrl = profile.profile_picture_url || "";
        const currentUrl = prev.profile_picture_url || "";

        // CRITICAL: If we have a lastUpdatedPictureUrl (meaning we just uploaded), 
        // NEVER overwrite it with profile data - always keep the updated URL
        if (lastUpdatedPictureUrl) {
          console.log("Preserving lastUpdatedPictureUrl:", lastUpdatedPictureUrl, "over profile URL:", newProfilePictureUrl);
          return {
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            user_name: profile.user_name || "",
            phone: profile.phone || "",
            bio: profile.bio || "",
            profile_picture_url: lastUpdatedPictureUrl, // NEVER overwrite recently updated URL
          };
        }

        // No lastUpdatedPictureUrl, normal update logic
        // Only update if URL actually changed
        if (newProfilePictureUrl && newProfilePictureUrl !== currentUrl) {
          return {
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            user_name: profile.user_name || "",
            phone: profile.phone || "",
            bio: profile.bio || "",
            profile_picture_url: newProfilePictureUrl,
          };
        }

        // URL hasn't changed or is empty, just update other fields but keep existing URL
        return {
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          user_name: profile.user_name || "",
          phone: profile.phone || "",
          bio: profile.bio || "",
          profile_picture_url: currentUrl || newProfilePictureUrl, // Keep existing URL if it exists
        };
      });

      setSelectedInterests(
        selectedTags
          .map((tag) => tag.id)
          .filter((id) => id !== undefined && id !== null)
      )
    }
  }, [profile, selectedTags])

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("")
        setSuccess("")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Cleanup ObjectURL when profileImage changes or component unmounts
  useEffect(() => {
    // Revoke previous URL if it exists
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    // Create new URL if profileImage exists
    if (profileImage) {
      objectUrlRef.current = URL.createObjectURL(profileImage)
    }

    return () => {
      // Cleanup on unmount or when profileImage changes
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
    }
  }, [profileImage])

  const organizedTags = useMemo(() => {
    // tagsData is now always an array thanks to transformResponse in userService
    if (!Array.isArray(tagsData) || tagsData.length === 0) return []

    const userTagIds = selectedInterests
    const userTags = []
    const otherTags = []

    tagsData.forEach((tag) => {
      if (userTagIds.includes(tag.id)) userTags.push(tag)
      else otherTags.push(tag)
    })

    return [...userTags, ...otherTags]
  }, [tagsData, selectedInterests])

  const handleSave = async () => {
    try {
      setError("");
      setSuccess("");

      // Validate profile image if present
      if (profileImage) {
        // Validate file type
        if (!profileImage.type.startsWith('image/')) {
          setError("Please select a valid image file");
          return;
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (profileImage.size > maxSize) {
          setError("Image size must be less than 5MB");
          return;
        }
      }

      const payload = new FormData();
      Object.entries({ ...formData, tags: selectedInterests }).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach((val) => payload.append(`${k}[]`, val));
        else if (v !== undefined && v !== null) payload.append(k, v);
      });
      // NOTE: Profile picture is handled automatically by the file input onChange
      // So we don't need to append it here. Only send text fields.

      const result = await updateProfile(payload).unwrap();

      console.log("Profile update result:", result);
      console.log("Profile picture URL from result:", result.profile_picture_url);

      // Update global auth state with new user data
      if (result.user || result.profile) {
        updateUser(result.user || result.profile);
      }

      // Update formData with the new profile picture URL immediately from the response
      const newProfilePictureUrl = result.profile_picture_url || result.profile?.profile_picture_url || result.user?.profile_picture_url;
      if (newProfilePictureUrl && profileImage) {
        setFormData(prev => ({
          ...prev,
          profile_picture_url: newProfilePictureUrl
        }));
        // Store the updated URL to prevent useEffect from overwriting it
        setLastUpdatedPictureUrl(newProfilePictureUrl);
        // Increment image version to force re-render
        setImageVersion(prev => prev + 1);

        // Preload the server image before clearing preview
        const img = new Image();
        img.onload = async () => {
          // Wait for cache invalidation to complete and refresh
          const refetchResult = await refetchProfile();

          // Update formData again with refetched data to ensure consistency
          const refetchedUrl = refetchResult?.data?.profile?.profile_picture_url || newProfilePictureUrl;
          if (refetchedUrl) {
            setFormData(prev => ({
              ...prev,
              profile_picture_url: refetchedUrl
            }));
            setLastUpdatedPictureUrl(refetchedUrl);
            setImageVersion(prev => prev + 1);
          }

          // Now safe to clear preview
          setProfileImage(null);
          setIsEditing(false);
          setSuccess("Profile updated successfully!");
        };
        img.onerror = async () => {
          // Even if image fails, proceed with refetch
          const refetchResult = await refetchProfile();
          const refetchedUrl = refetchResult?.data?.profile?.profile_picture_url || newProfilePictureUrl;
          if (refetchedUrl) {
            setFormData(prev => ({
              ...prev,
              profile_picture_url: refetchedUrl
            }));
            setLastUpdatedPictureUrl(refetchedUrl);
            setImageVersion(prev => prev + 1);
          }
          setTimeout(() => {
            setProfileImage(null);
          }, 2000);
          setIsEditing(false);
          setSuccess("Profile updated successfully!");
        };
        img.src = newProfilePictureUrl;
      } else {
        // No profile image or no URL
        const refetchResult = await refetchProfile();
        if (refetchResult?.data?.profile?.profile_picture_url) {
          const refetchedUrl = refetchResult.data.profile.profile_picture_url;
          setFormData(prev => ({
            ...prev,
            profile_picture_url: refetchedUrl
          }));
          setLastUpdatedPictureUrl(refetchedUrl);
          setImageVersion(prev => prev + 1);
        }
        setIsEditing(false);
        setSuccess("Profile updated successfully!");
        if (profileImage) {
          setTimeout(() => {
            setProfileImage(null);
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Update failed:", err);
      let errorMessage = "Failed to update profile";

      // Handle different error types
      if (err?.data?.message) {
        errorMessage = err.data.message;
      } else if (err?.data?.errors) {
        // Laravel validation errors
        const firstError = Object.values(err.data.errors).flat()[0];
        errorMessage = firstError || errorMessage;
      } else if (err?.status === 422) {
        errorMessage = "Validation failed. Please check your input";
      } else if (err?.status === 413) {
        errorMessage = "Image file is too large. Maximum size is 5MB";
      }

      setError(errorMessage);
    }
  };

  const handleSetMood = async (mood) => {
    try {
      setError("")
      setSuccess("")
      await updateMood({ mood }).unwrap()
      await refetchProfile()
      setSuccess("Mood updated!")
    } catch (err) {
      const msg =
        err?.data?.message ||
        (err?.data?.errors?.mood && Array.isArray(err.data.errors.mood) ? err.data.errors.mood[0] : null) ||
        "Failed to update mood"
      setError(msg)
    }
  }



  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        user_name: profile.user_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        profile_picture_url: profile.profile_picture_url || "",
      })
      setSelectedInterests(selectedTags.map((tag) => tag.id))
      setProfileImage(null)
    }
    setIsEditing(false)
    setError("")
    setSuccess("")
  }

  const handleDeleteAllTags = async () => {
    try {
      setError("")
      setSuccess("")
      await deleteTags({ delete_all: true }).unwrap()
      setSelectedInterests([])
      await refetchProfile()
      setSuccess("All tags removed successfully!")
    } catch (err) {
      console.error("Delete tags failed:", err)
      setError(err?.data?.message || "Failed to delete tags")
    }
  }

  if (profileLoading)
    return (
      <div className="p-4 text-center flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-6 w-6 text-indigo-600 dark:text-muted-foreground" />
      </div>
    )
  if (profileError)
    return (
      <div className="p-4 text-red-500 dark:text-red-400 text-center flex items-center justify-center h-full">
        Failed to load profile
      </div>
    )
  if (!profile) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background dark:bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-indigo-900 dark:text-foreground">{t('profile.settings')}</DialogTitle>
          <DialogDescription className="dark:text-muted-foreground">
            {t('profile.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="border-indigo-200 dark:border-white/30 dark:border-opacity-100 dark:bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between text-indigo-900 dark:text-foreground">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="gap-2 bg-primary hover:bg-primary/90">
                    <Edit className="h-4 w-4" /> {t('common.edit')}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={updating} className="gap-2 bg-primary hover:bg-primary/90">
                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {t('common.save')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={updating}
                      className="gap-2 border-indigo-300 dark:border-white/30 dark:border-opacity-100 text-indigo-700 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent"
                    >
                      <X className="h-4 w-4" /> {t('common.cancel')}
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture Section */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-indigo-200 dark:border-white/30 dark:border-opacity-100">
                  <Label className="text-base font-semibold text-indigo-900 dark:text-foreground">{t('profile.profilePicture')}</Label>
                  <p className="text-xs text-indigo-600 dark:text-muted-foreground mt-1">
                    {t('profile.profilePictureDesc')}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-2 border-indigo-100 dark:border-white/30 dark:border-opacity-100">
                      <AvatarImage
                        src={(() => {
                          // 1. Preview (newly selected file)
                          if (profileImage && objectUrlRef.current) {
                            return objectUrlRef.current;
                          }
                          // 2. Server URL (if exists)
                          const url = formData.profile_picture_url || profile?.profile_picture_url;
                          if (url) {
                            return `${url}${url.includes('?') ? '&' : '?'}t=${profileData?.timestamp || 'initial'}`;
                          }
                          return null;
                        })()}
                        alt={profile?.first_name || "Profile"}
                        onError={(e) => {
                          console.log("Image load error:", e.target.src);
                          e.target.style.display = 'none'; // Hide to show fallback
                        }}
                        onLoad={(e) => {
                          e.target.style.display = 'block'; // Ensure visible
                          console.log("Image loaded:", e.target.src);
                        }}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl bg-indigo-100 dark:bg-card text-indigo-700 dark:text-foreground">
                        {profile?.first_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    {visibleMoodEmoji && (
                      <div
                        className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-card border border-indigo-200 dark:border-white/30 flex items-center justify-center text-base shadow-sm"
                        title={visibleMoodSentence || undefined}
                      >
                        {visibleMoodEmoji}
                      </div>
                    )}
                    {/* Camera Icon Button - Always visible */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPicture}
                      className="absolute bottom-0 right-0 w-7 h-7 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center border-2 border-white dark:border-card shadow-md cursor-pointer transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Change profile picture"
                    >
                      {uploadingPicture ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 text-white" />
                      )}
                    </button>
                    {/* Hidden File Input */}
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setError("");
                            setSuccess("");

                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              setError("Please select a valid image file");
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                              return;
                            }

                            // Validate file size (5MB max)
                            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                            if (file.size > maxSize) {
                              setError("Image size must be less than 5MB");
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                              return;
                            }

                            setUploadingPicture(true);

                            // Show preview immediately - DO NOT clear until server image is confirmed visible
                            setProfileImage(file);

                            // Automatically save the profile picture
                            const payload = new FormData();
                            payload.append('profile_picture', file);

                            const result = await updateProfile(payload).unwrap();

                            console.log("Profile update result:", result);

                            // Update global auth state
                            if (result.user || result.profile) {
                              updateUser(result.user || result.profile);
                            }

                            // Update formData with the new URL immediately from response
                            const newProfilePictureUrl = result.profile_picture_url || result.user?.profile_picture_url || result.profile?.profile_picture_url;
                            console.log("Extracted profile picture URL:", newProfilePictureUrl);

                            if (!newProfilePictureUrl) {
                              // If no URL, wait and refetch
                              await new Promise(resolve => setTimeout(resolve, 1000));
                              const refetchResult = await refetchProfile();
                              const refetchedUrl = refetchResult?.data?.profile?.profile_picture_url;
                              if (refetchedUrl) {
                                setFormData(prev => ({
                                  ...prev,
                                  profile_picture_url: refetchedUrl
                                }));
                                setLastUpdatedPictureUrl(refetchedUrl);
                                setImageVersion(prev => prev + 1);
                                setSuccess("Profile picture updated successfully!");
                                setUploadingPicture(false);
                                // Keep preview visible for 3 seconds to ensure server image loads
                                setTimeout(() => {
                                  setProfileImage(null);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }, 3000);
                              }
                              return;
                            }

                            // Set the URL immediately and mark it as updated
                            setFormData(prev => ({
                              ...prev,
                              profile_picture_url: newProfilePictureUrl
                            }));
                            setLastUpdatedPictureUrl(newProfilePictureUrl);
                            setImageVersion(prev => prev + 1);

                            // Wait for database to be fully updated
                            await new Promise(resolve => setTimeout(resolve, 500));

                            // Refetch profile to get the updated data from database
                            const refetchResult = await refetchProfile();
                            console.log("Refetched profile:", refetchResult?.data);

                            // Update formData with refetched data
                            const refetchedUrl = refetchResult?.data?.profile?.profile_picture_url || newProfilePictureUrl;
                            if (refetchedUrl) {
                              console.log("Refetched URL:", refetchedUrl);
                              setFormData(prev => ({
                                ...prev,
                                profile_picture_url: refetchedUrl
                              }));
                              setLastUpdatedPictureUrl(refetchedUrl);
                              setImageVersion(prev => prev + 1);
                            }

                            // Preload the server image - ONLY clear preview after it's confirmed loaded AND visible
                            const finalUrl = refetchedUrl || newProfilePictureUrl;
                            const img = new Image();
                            let imageLoaded = false;
                            let imageVisible = false;

                            console.log("Starting server image preload:", finalUrl);

                            img.onload = () => {
                              console.log("Server image preloaded successfully:", finalUrl);
                              imageLoaded = true;

                              // Wait a moment to ensure image is fully rendered in DOM
                              setTimeout(() => {
                                // Check if image is actually visible in the Avatar
                                const avatarImg = document.querySelector(`[alt="${profile?.first_name || profile?.name}"]`);
                                if (avatarImg && avatarImg.complete && avatarImg.naturalHeight !== 0) {
                                  imageVisible = true;
                                  console.log("Server image confirmed visible in Avatar");
                                }

                                setSuccess("Profile picture updated successfully!");
                                setUploadingPicture(false);

                                // Only clear preview after confirming server image is visible
                                // Wait extra time to ensure smooth transition
                                setTimeout(() => {
                                  if (imageVisible || imageLoaded) {
                                    console.log("Clearing preview - server image is ready");
                                    setProfileImage(null);
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = '';
                                    }
                                  } else {
                                    // If not visible yet, keep preview longer
                                    console.log("Server image not visible yet, keeping preview");
                                    setTimeout(() => {
                                      setProfileImage(null);
                                      if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                      }
                                    }, 2000);
                                  }
                                }, 1500);
                              }, 800);
                            };

                            img.onerror = () => {
                              console.error("Server image failed to preload:", finalUrl);
                              setSuccess("Profile picture updated successfully!");
                              setUploadingPicture(false);
                              // Keep preview visible much longer if server image fails
                              setTimeout(() => {
                                console.log("Clearing preview after error timeout");
                                setProfileImage(null);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }, 5000);
                            };

                            // Start loading the server image
                            img.src = finalUrl;

                            // Fallback timeout - if image takes too long, still show success but keep preview
                            setTimeout(() => {
                              if (!imageLoaded) {
                                console.log("Server image load timeout (10s), but keeping preview visible");
                                setSuccess("Profile picture updated successfully!");
                                setUploadingPicture(false);
                                // Keep preview visible longer since image is slow
                                setTimeout(() => {
                                  setProfileImage(null);
                                  if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                  }
                                }, 5000);
                              }
                            }, 10000);
                          } catch (err) {
                            console.error("Failed to update profile picture:", err);
                            let errorMessage = "Failed to update profile picture";

                            // Handle different error types
                            if (err?.data?.message) {
                              errorMessage = err.data.message;
                            } else if (err?.data?.errors?.profile_picture) {
                              // Laravel validation errors
                              const validationErrors = err.data.errors.profile_picture;
                              errorMessage = Array.isArray(validationErrors) ? validationErrors[0] : validationErrors;
                            } else if (err?.status === 422) {
                              errorMessage = "Invalid image format or file too large. Please use JPG, PNG, GIF, WebP, BMP, SVG, or ICO (max 5MB)";
                            } else if (err?.status === 413) {
                              errorMessage = "Image file is too large. Maximum size is 5MB";
                            }

                            setError(errorMessage);
                            setProfileImage(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          } finally {
                            setUploadingPicture(false);
                          }
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                  {isEditing && profileImage && (
                    <div className="flex-1">
                      <p className="text-sm text-indigo-600 dark:text-muted-foreground">
                        Updating picture...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="bg-indigo-200 dark:bg-white/30 dark:opacity-100" />

              {/* Mood Section */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-indigo-200 dark:border-white/30 dark:border-opacity-100">
                  <Label className="text-base font-semibold text-indigo-900 dark:text-foreground">{t('mood.title')}</Label>
                  <p className="text-xs text-indigo-600 dark:text-muted-foreground mt-1">
                    {visibleMoodSentence || t('mood.noMood')}
                  </p>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {MOOD_OPTIONS.map((opt) => {
                    const active = opt.key === visibleMoodKey
                    return (
                      <Button
                        key={opt.key}
                        type="button"
                        variant={active ? "default" : "outline"}
                        disabled={updatingMood}
                        onClick={() => handleSetMood(opt.key)}
                        className={
                          active
                            ? "bg-primary hover:bg-primary/90 text-white h-auto py-3 flex flex-col gap-1"
                            : "border-indigo-200 dark:border-white/30 text-indigo-800 dark:text-foreground hover:bg-indigo-50 dark:hover:bg-accent h-auto py-3 flex flex-col gap-1"
                        }
                      >
                        <span className="text-2xl leading-none">{opt.emoji}</span>
                        <span className="text-xs capitalize leading-none">{t(opt.labelKey)}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <Separator className="bg-indigo-200 dark:bg-white/30 dark:opacity-100" />

              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-indigo-200 dark:border-white/30 dark:border-opacity-100">
                  <Label className="text-base font-semibold text-indigo-900 dark:text-foreground">{t('profile.personalInfo')}</Label>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: "first_name", labelKey: "profile.firstName" },
                    { key: "last_name", labelKey: "profile.lastName" },
                    { key: "user_name", labelKey: "profile.username" },
                    { key: "phone", labelKey: "profile.phone" }
                  ].map(({ key, labelKey }) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-indigo-900 dark:text-foreground">{t(labelKey)}</Label>
                      {isEditing ? (
                        <Input
                          id={key}
                          value={formData[key]}
                          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                          placeholder={t(labelKey)}
                          className="border-indigo-300 dark:border-white/30 dark:border-opacity-100 dark:bg-card dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500"
                        />
                      ) : (
                        <p className="text-sm text-indigo-600 dark:text-muted-foreground py-2 px-3 bg-indigo-50 dark:bg-card rounded-md border border-indigo-200 dark:border-white/30 dark:border-opacity-100">{formData[key] || t('common.notProvided')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-indigo-200 dark:bg-white/30 dark:opacity-100" />

              {/* Bio Section */}
              <div className="space-y-4">
                <div className="pb-2 border-b border-indigo-200 dark:border-white/30 dark:border-opacity-100">
                  <Label className="text-base font-semibold text-indigo-900 dark:text-foreground">{t('profile.bio')}</Label>
                </div>
                <div className="space-y-2">
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      placeholder={t('profile.bioPlaceholder')}
                      className="border-indigo-300 dark:border-white/30 dark:border-opacity-100 dark:bg-card dark:text-foreground focus:border-indigo-500 dark:focus:border-primary focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="text-sm text-indigo-600 dark:text-muted-foreground py-2 px-3 bg-indigo-50 dark:bg-card rounded-md min-h-[60px] border border-indigo-200 dark:border-white/30 dark:border-opacity-100">{formData.bio || t('profile.noBio')}</p>
                  )}
                </div>
              </div>

              <Separator className="bg-indigo-200 dark:bg-white/30 dark:opacity-100" />

              {/* Tags Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-200 dark:border-white/30/80">
                  <Label className="text-base font-semibold text-indigo-900 dark:text-foreground">{t('profile.interests')}</Label>
                  {isEditing && selectedInterests.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteAllTags}
                      disabled={deletingTags}
                      className="gap-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 border-red-300 dark:border-red-800"
                    >
                      {deletingTags ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {t('profile.removeAll')}
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2 border border-indigo-200 dark:border-white/30 dark:border-opacity-100 rounded-md p-4 bg-indigo-50/50 dark:bg-card/50">
                    {organizedTags.map((tag) => (
                      <div key={tag.id} className="flex items-center py-2 px-3 rounded hover:bg-indigo-100 dark:hover:bg-accent transition-colors border-b border-indigo-200/50 dark:border-white/30 dark:border-opacity-100 last:border-b-0">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedInterests.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedInterests((prev) => [...prev, tag.id])
                            else setSelectedInterests((prev) => prev.filter((i) => i !== tag.id))
                          }}
                          className="text-indigo-600 border-indigo-300 dark:border-white/30/80 data-[state=checked]:bg-primary"
                        />
                        <Label htmlFor={`tag-${tag.id}`} className="text-sm font-normal cursor-pointer flex-1 text-indigo-900 dark:text-foreground ml-2">{t(`tags.${tag.name.toLowerCase()}`, tag.name)}</Label>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 p-2 border border-indigo-200 dark:border-white/30 dark:border-opacity-100 rounded-md bg-indigo-50/50 dark:bg-card/50 min-h-[60px] items-start">
                    {selectedTags.length > 0
                      ? selectedTags.map((tag) => (
                        <p key={tag.id} className="px-3 py-1 bg-indigo-100 dark:bg-card dark:text-foreground text-indigo-700 dark:border dark:border-white/30 dark:border-opacity-100 rounded-full text-sm">
                          {t(`tags.${tag.name.toLowerCase()}`, tag.name)}
                        </p>
                      ))
                      : <span className="text-indigo-600 dark:text-muted-foreground py-2 px-3">{t('profile.noInterests')}</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
