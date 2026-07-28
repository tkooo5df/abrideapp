// Utility functions for profile API interactions
// This is a mock implementation for demonstration purposes

interface ProfileData {
  id: string;
  fullName: string;
  phoneNumber: string;
  profilePhoto?: string;
  email: string;
  role: 'driver' | 'passenger' | 'admin';
  createdAt: string;
  updatedAt: string;
  // Driver specific fields
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  completedTrips?: number;
  averageRating?: number;
  status?: 'active' | 'pending' | 'suspended';
  isVerified?: boolean;
  // Passenger specific fields
  reviews?: any[];
}

// Mock database
const profiles: Record<string, ProfileData> = {};

// Mock documents storage
const documents: Record<string, any[]> = {};

export class ProfileApi {
  // GET /api/profile/{userId}
  static async getProfile(userId: string): Promise<ProfileData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real implementation, this would fetch from a backend API
    return profiles[userId] || null;
  }

  // PUT /api/profile/{userId}
  static async updateProfile(userId: string, data: Partial<ProfileData>): Promise<ProfileData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real implementation, this would update the backend API
    const existingProfile = profiles[userId] || {
      id: userId,
      fullName: '',
      phoneNumber: '',
      email: '',
      role: 'passenger',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedProfile = {
      ...existingProfile,
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    profiles[userId] = updatedProfile;
    return updatedProfile;
  }

  // Upload document endpoint
  static async uploadDocument(userId: string, documentType: string, file: File): Promise<{ url: string; id: string }> {
    // Simulate API delay and file upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would:
    // 1. Upload the file to a storage service (e.g., AWS S3, Firebase Storage)
    // 2. Save the file metadata to the database
    // 3. Return the file URL and ID
    
    // Mock implementation - just return a placeholder URL
    const fileId = `${userId}-${documentType}-${Date.now()}`;
    const fileUrl = `/uploads/drivers/${userId}/${fileId}`;
    
    // Store document metadata
    if (!documents[userId]) {
      documents[userId] = [];
    }
    
    documents[userId].push({
      id: fileId,
      type: documentType,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      url: fileUrl,
      status: 'pending' // pending, approved, rejected
    });
    
    return { url: fileUrl, id: fileId };
  }

  // Get user documents
  static async getUserDocuments(userId: string): Promise<any[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real implementation, this would fetch documents from the backend API
    return documents[userId] || [];
  }

  // Get user stats (completed trips, ratings, etc.)
  static async getUserStats(userId: string): Promise<{ completedTrips: number; averageRating: number; totalEarnings?: number }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real implementation, this would fetch stats from the backend API
    // Now we're using the real database service
    try {
      const { BrowserDatabaseService } = await import('@/integrations/database/browserServices');
      const stats = await BrowserDatabaseService.getDriverStats(userId);
      return stats;
    } catch (error) {
      // Fallback to mock implementation if real service fails
      return {
        completedTrips: 0,
        averageRating: 0,
        totalEarnings: 0
      };
    }
  }

  // Get user reviews
  static async getUserReviews(userId: string, limit: number = 10): Promise<any[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In a real implementation, this would fetch reviews from the backend API
    // For now, return empty array to avoid showing fake data
    return [];
  }
}

export default ProfileApi;
