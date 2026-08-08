import { supabase } from '@/integrations/supabase/client';
import { resizeImage } from './avatarUpload';

/**
 * Upload receipt image to Supabase Storage
 */
export const uploadReceipt = async (file: File | string, bookingId: string = 'temp'): Promise<string | null> => {
  try {
    let fileBlob: Blob | File;
    let contentType = 'image/jpeg';
    
    if (typeof file === 'string') {
      // It's a base64 string (from Data URL)
      if (!file.startsWith('data:image')) {
        console.error('Invalid image data');
        return null;
      }
      
      const parts = file.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      if (mimeMatch) contentType = mimeMatch[1];
      
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      fileBlob = new Blob([u8arr], { type: contentType });
    } else {
      // It's a File object, compress it
      fileBlob = await resizeImage(file, 800, 800, 500); // 500KB max for receipts
      contentType = file.type;
    }
    
    const fileExt = contentType.split('/')[1] || 'jpg';
    const fileName = `receipt-${bookingId}-${Date.now()}.${fileExt}`;
    
    // Upload to 'receipts' bucket
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(fileName, fileBlob, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Error uploading receipt:', error);
      return null;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload receipt:', error);
    return null;
  }
};

