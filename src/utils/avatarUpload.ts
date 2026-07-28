import { supabase } from '@/integrations/supabase/client';

/**
 * Upload avatar using Edge Function (works even without active session)
 * This bypasses RLS policies by using service role on the server side
 */
const uploadAvatarViaEdgeFunction = async (file: File, userId: string): Promise<string | null> => {
  try {
    
    // Resize image first
    const resizedBlob = await resizeImage(file, 200, 200, 100);
    const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
    
    // Convert to base64 for Edge Function
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resizedFile);
    });
    
    // Remove data URL prefix (data:image/jpeg;base64,)
    const base64Content = base64Data.split(',')[1];
    
    // Call Edge Function to upload avatar
    const { data, error } = await supabase.functions.invoke('upload-avatar', {
      body: {
        userId,
        imageData: base64Content,
        fileName: `${userId}/avatar-${Date.now()}.jpg`,
        contentType: 'image/jpeg'
      }
    });
    
    if (error) {
      return null;
    }
    
    if (data && data.avatarUrl) {
      return data.avatarUrl;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Resize image to reduce file size
 */
export const resizeImage = (file: File, maxWidth: number, maxHeight: number, maxSizeKB: number = 100): Promise<Blob> => {
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

/**
 * Upload avatar to Supabase Storage
 * This function tries direct upload first, then falls back to Edge Function if session is not available
 */
export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
  // Resize image first
  let resizedFile: File;
  try {
    const resizedBlob = await resizeImage(file, 200, 200, 100); // max 100 KB for avatars
    resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
  } catch (resizeError) {
    return null;
  }
  
  const fileExt = 'jpg';
  const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
  
  // Try direct upload first (if session is available)
  try {
    // Check if we have a session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (currentSession && currentSession.user?.id === userId) {
      
      // Attempt direct upload
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (!uploadError) {
        // Success! Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        return publicUrl;
      } else {
      }
    } else {
    }
  } catch (directUploadError) {
  }
  
  // Fallback: Use Edge Function (works without session)
  return await uploadAvatarViaEdgeFunction(resizedFile, userId);
};

/**
 * Upload pending avatar from localStorage after user logs in
 */
export const uploadPendingAvatar = async (userId: string): Promise<void> => {
  const pendingAvatarKey = `pending_avatar_${userId}`;
  const pendingAvatarData = localStorage.getItem(pendingAvatarKey);
  
  if (!pendingAvatarData) {
    return;
  }
  
  try {
    const avatarData = JSON.parse(pendingAvatarData);
    
    // Convert base64 back to File
    const response = await fetch(avatarData.data);
    const blob = await response.blob();
    const file = new File([blob], avatarData.fileName, { type: avatarData.fileType });
    
    // Upload avatar
    const avatarUrl = await uploadAvatar(file, userId);
    
    if (avatarUrl) {
      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId);
      
      if (!updateError) {
        localStorage.removeItem(pendingAvatarKey);
      } else {
      }
    } else {
    }
  } catch (error) {
    // Don't throw - user can upload avatar later from profile page
  }
};

