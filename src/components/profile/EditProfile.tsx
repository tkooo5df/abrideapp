import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { Camera, Save, X, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { wilayas } from '@/data/wilayas';

interface EditProfileData {
  fullName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  age: string;
  wilaya: string;
  commune: string;
  ksar: string;
  address: string;
  profilePhoto?: string;
  bio?: string;
  // Driver specific fields
  vehicleType?: string;
  vehicleNumber?: string;
  // licenseNumber field removed as per user request
}

const EditProfile = ({ onBack }: { onBack: () => void }) => {
  const { user: supabaseUser, profile: authProfile, updateProfile } = useAuth();
  const { user: localUser, updateProfile: updateLocalProfile } = useLocalAuth();
  const { getDatabaseService, isLocal } = useDatabase();
  
  const user = isLocal ? localUser : supabaseUser;
  const profile = isLocal ? localUser : authProfile;
  
  const [profileData, setProfileData] = useState<EditProfileData>({
    fullName: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    age: '',
    wilaya: '',
    commune: '',
    ksar: '',
    address: '',
    profilePhoto: '',
    bio: '',
    vehicleType: '',
    vehicleNumber: ''
    // licenseNumber field removed as per user request
  });

  // القصور الـ7 لواد مزاب
  const ksour = [
    { value: "قصر بريان", label: "قصر بريان" },
    { value: "قصر القرارة", label: "قصر القرارة" },
    { value: "قصر بني يزقن", label: "قصر بني يزقن" },
    { value: "قصر العطف", label: "قصر العطف" },
    { value: "قصر غرداية", label: "قصر غرداية" },
    { value: "قصر بنورة", label: "قصر بنورة" },
    { value: "قصر مليكة", label: "قصر مليكة" },
  ];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const db = getDatabaseService();
        
        // Get user profile
        const profile = await db.getProfile(user.id);
        
        if (profile) {
          // Handle age: convert number to string, or empty string if null/undefined
          const ageValue = profile.age !== null && profile.age !== undefined 
            ? String(profile.age) 
            : '';
          
          // Handle ksar: ensure it's a string or empty string
          const ksarValue = profile.ksar && String(profile.ksar).trim() !== '' 
            ? String(profile.ksar).trim() 
            : '';
          
          setProfileData({
            fullName: profile.fullName || '',
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            phoneNumber: profile.phone || '',
            age: ageValue,
            wilaya: profile.wilaya || '',
            commune: profile.commune || '',
            ksar: ksarValue,
            address: profile.address || '',
            profilePhoto: profile.avatarUrl || '',
            bio: '', // This would come from a separate bio field or description
            vehicleType: '', // This would come from vehicle data in a real implementation
            vehicleNumber: '' // This would come from vehicle data in a real implementation
            // licenseNumber field removed as per user request
          });
          setPreviewImage(profile.avatarUrl || null);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };
    
    loadProfileData();
  }, [user, isLocal]);
  
  const validateProfileData = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate mandatory fields for all users
    if (!profileData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب';
    }
    
    if (!profileData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'رقم الهاتف مطلوب';
    }
    
    if (!profileData.age || profileData.age.trim() === "") {
      newErrors.age = 'السن مطلوب';
    } else {
      const ageNum = parseInt(profileData.age.trim(), 10);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        newErrors.age = 'السن يجب أن يكون بين 18 و 100 سنة';
      }
    }
    
    if (!profileData.wilaya || profileData.wilaya.trim() === "") {
      newErrors.wilaya = 'الولاية مطلوبة';
    }
    
    // Check ksar only if wilaya is 47 (Ghardaïa)
    if (profileData.wilaya === '47' && (!profileData.ksar || profileData.ksar.trim() === "")) {
      newErrors.ksar = 'القصر مطلوب';
    }
    
    // Note: License number validation removed as field is now hidden
    // Driver license number is no longer a mandatory field
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const resizeImage = (file: File, maxWidth: number, maxHeight: number, maxSizeKB: number = 100): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Ensure dimensions are at least 1
        if (width < 1) width = 1;
        if (height < 1) height = 1;
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Improve drawing quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw resized image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Function to compress image with quality adjustment
        const compressImage = (quality: number): Promise<Blob> => {
          return new Promise((resolveCompress, rejectCompress) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                rejectCompress(new Error('Could not resize image'));
                return;
              }

              const sizeKB = blob.size / 1024;

              // If size is acceptable or quality is too low, return result
              if (sizeKB <= maxSizeKB || quality <= 0.1) {
                resolveCompress(blob);
              } else {
                // Reduce quality and try again
                compressImage(quality - 0.1).then(resolveCompress).catch(rejectCompress);
              }
            }, 'image/jpeg', quality);
          });
        };

        // Start with 0.8 quality then reduce if needed
        compressImage(0.8)
          .then((blob) => {
            const originalSizeKB = file.size / 1024;
            const compressedSizeKB = blob.size / 1024;
            const reduction = ((1 - blob.size / file.size) * 100).toFixed(1);
            resolve(blob);
          })
          .catch(reject);
      };
      
      img.onerror = () => {
        reject(new Error('Could not load image'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    try {
      // Resize image to reduce file size (max 200x200 pixels for avatar icons, max 100 KB)
      const resizedBlob = await resizeImage(file, 200, 200, 100); // max 100 KB for avatars
      const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
      const fileExt = 'jpg'; // Since we're converting to JPEG
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
      
      // Delete old avatar if it exists
      if (profileData.profilePhoto) {
        try {
          // Extract the file path from the existing avatar URL
          const url = new URL(profileData.profilePhoto);
          const oldFileName = url.pathname.split('/').pop();
          if (oldFileName) {
            const oldFilePath = `${userId}/${oldFileName}`;
            await supabase.storage
              .from('avatars')
              .remove([oldFilePath]);
          }
        } catch (error) {
        }
      }
      
      // Note: You need to create an 'avatars' bucket in Supabase Storage first
      // Go to Supabase Dashboard > Storage > New bucket > Name: avatars > Set to Public
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        // Check if the error is related to the bucket not existing
        if (uploadError.message && (uploadError.message.includes('not found') || uploadError.message.includes('bucket'))) {
          toast({
            title: 'خطأ في رفع الصورة',
            description: 'لم يتم العثور على حاوية التخزين. يرجى إنشاء حاوية باسم "avatars" في لوحة تحكم Supabase.',
            variant: 'destructive'
          });
        } 
        // Check if the error is related to RLS (Row Level Security)
        else if (uploadError.message && (uploadError.message.includes('row-level security') || uploadError.message.includes('permission') || uploadError.message.includes('400') || uploadError.message.includes('Unauthorized'))) {
          toast({
            title: 'خطأ في رفع الصورة',
            description: 'لا توجد صلاحيات كافية لرفع الصورة. يرجى التحقق من إعدادات الأمان في لوحة تحكم Supabase.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'خطأ في رفع الصورة',
            description: 'حدث خطأ أثناء رفع الصورة الشخصية: ' + uploadError.message,
            variant: 'destructive'
          });
        }
        throw uploadError;
      }
      
      // Note: You need to create an 'avatars' bucket in Supabase Storage first
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      // Only show generic error if we haven't shown a specific one above
      if (!(error as any).message || !((error as any).message.includes('not found') || (error as any).message.includes('bucket') || (error as any).message.includes('row-level security') || (error as any).message.includes('permission') || (error as any).message.includes('400') || (error as any).message.includes('Unauthorized'))) {
        toast({
          title: 'خطأ في رفع الصورة',
          description: 'حدث خطأ أثناء رفع الصورة الشخصية',
          variant: 'destructive'
        });
      }
      return null;
    }
  };
  
  const handleSave = async () => {
    if (!user) return;
    
    // Validate profile data before saving
    if (!validateProfileData()) {
      toast({
        title: 'بيانات غير مكتملة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setSaving(true);
      
      // Handle avatar upload if a new image was selected
      let avatarUrl = profileData.profilePhoto;
      if (imageFile) {
        const uploadedUrl = await uploadAvatar(imageFile, user.id);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }
      
      // Prepare updates for the profile
      // Handle age: convert string to number, ensuring it's a valid integer
      const ageValue = profileData.age && profileData.age.trim() !== '' 
        ? (() => {
            const parsed = parseInt(profileData.age.trim(), 10);
            return isNaN(parsed) ? null : parsed;
          })()
        : null;
      const updates: any = {
        fullName: profileData.fullName,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phoneNumber,
        age: ageValue,
        wilaya: profileData.wilaya,
        commune: profileData.commune,
        ksar: profileData.ksar,
        address: profileData.address,
        avatarUrl: avatarUrl
      };
      
      // Update profile based on database type
      if (isLocal) {
        await updateLocalProfile(updates);
      } else {
        await updateProfile({
          full_name: profileData.fullName,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phoneNumber,
          age: ageValue,
          wilaya: profileData.wilaya,
          commune: profileData.commune,
          ksar: profileData.ksar,
          address: profileData.address,
          avatar_url: avatarUrl
        });
      }
      
      toast({
        title: 'نجاح',
        description: 'تم تحديث الملف الشخصي بنجاح'
      });
      
      onBack();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الملف الشخصي',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const isDriver = profile?.role === 'driver';
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>تعديل الملف الشخصي</CardTitle>
            <CardDescription>قم بتحديث معلوماتك الشخصية</CardDescription>
          </div>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 ml-2" />
            إلغاء
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-primary">
                <AvatarImage src={previewImage || '/placeholder.svg'} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {profileData.fullName.charAt(0) || 'ع'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary rounded-full p-2 cursor-pointer">
                <Camera className="h-4 w-4 text-white" />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <p className="text-sm text-muted-foreground">انقر لتغيير الصورة</p>
          </div>
          
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">المعلومات الشخصية</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  placeholder="أدخل اسمك الأول"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">اسم العائلة</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  placeholder="أدخل اسم عائلتك"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل <span className="text-red-500">*</span></Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                placeholder="أدخل اسمك الكامل"
                className={errors.fullName ? 'border-red-500' : ''}
              />
              {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">رقم الهاتف <span className="text-red-500">*</span></Label>
              <Input
                id="phoneNumber"
                value={profileData.phoneNumber}
                onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                placeholder="أدخل رقم هاتفك"
                type="tel"
                className={errors.phoneNumber ? 'border-red-500' : ''}
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">السن <span className="text-red-500">*</span></Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="100"
                  value={profileData.age}
                  onChange={(e) => setProfileData({...profileData, age: e.target.value})}
                  placeholder="أدخل السن"
                  className={errors.age ? 'border-red-500' : ''}
                />
                {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wilaya">الولاية <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select 
                    value={profileData.wilaya} 
                    onValueChange={(value) => {
                      setProfileData({
                        ...profileData, 
                        wilaya: value,
                        // Clear ksar if wilaya is not 47
                        ksar: value === '47' ? profileData.ksar : ''
                      });
                    }}
                  >
                    <SelectTrigger className={errors.wilaya ? 'border-red-500 pl-10' : 'pl-10'}>
                      <SelectValue placeholder="اختر الولاية" />
                    </SelectTrigger>
                    <SelectContent>
                      {wilayas.map((wilaya) => (
                        <SelectItem key={wilaya.code} value={wilaya.code}>
                          {wilaya.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.wilaya && <p className="text-red-500 text-sm">{errors.wilaya}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commune">البلدية</Label>
                <Input
                  id="commune"
                  value={profileData.commune}
                  onChange={(e) => setProfileData({...profileData, commune: e.target.value})}
                  placeholder="أدخل البلدية"
                />
              </div>
              
              {profileData.wilaya === '47' && (
                <div className="space-y-2">
                  <Label htmlFor="ksar">القصر <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Select value={profileData.ksar} onValueChange={(value) => setProfileData({...profileData, ksar: value})}>
                      <SelectTrigger className={errors.ksar ? 'border-red-500 pl-10' : 'pl-10'}>
                        <SelectValue placeholder="اختر القصر" />
                      </SelectTrigger>
                      <SelectContent>
                        {ksour.map((ksr) => (
                          <SelectItem key={ksr.value} value={ksr.value}>
                            {ksr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.ksar && <p className="text-red-500 text-sm">{errors.ksar}</p>}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                placeholder="أدخل عنوانك الكامل"
                className="min-h-[80px]"
              />
            </div>
          </div>
          
          {/* Driver Specific Information */}
          {isDriver && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">معلومات المركبة</h3>
              
              <div className="space-y-2">
                <Label htmlFor="vehicleType">نوع المركبة</Label>
                <Input
                  id="vehicleType"
                  value={profileData.vehicleType}
                  onChange={(e) => setProfileData({...profileData, vehicleType: e.target.value})}
                  placeholder="مثال: Toyota Corolla"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">رقم المركبة</Label>
                <Input
                  id="vehicleNumber"
                  value={profileData.vehicleNumber}
                  onChange={(e) => setProfileData({...profileData, vehicleNumber: e.target.value})}
                  placeholder="مثال: 123-ABC-16"
                />
              </div>
              
              {/* Hidden license number field - removed as per user request */}
            </div>
          )}
          
          {/* Bio/Description */}
          <div className="space-y-2">
            <Label htmlFor="bio">الوصف</Label>
            <Textarea
              id="bio"
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              placeholder="أخبرنا المزيد عن نفسك..."
              className="min-h-[120px]"
            />
          </div>
          
          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onBack}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditProfile;