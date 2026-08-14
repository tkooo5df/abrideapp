import { supabase } from '../supabase/client';

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  target_user_id: string;
  target_type: 'driver' | 'passenger';
  rating: number;
  comment: string | null;
  created_at: string;
}

export class ReviewsService {
  // Add a new review
  static async addReview(reviewData: Omit<Review, 'id' | 'created_at'>) {
    try {
      // Check if review already exists for this booking
      const existingReview = await this.getReviewByBookingAndReviewer(
        reviewData.booking_id,
        reviewData.reviewer_id
      );
      
      if (existingReview) {
        throw new Error('Review already exists for this booking');
      }
      
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: reviewData.booking_id,
          reviewer_id: reviewData.reviewer_id,
          target_user_id: reviewData.target_user_id,
          target_type: reviewData.target_type,
          rating: reviewData.rating,
          comment: reviewData.comment
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
      
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  }
  
  // Get review for a specific booking and reviewer
  static async getReviewByBookingAndReviewer(bookingId: string, reviewerId: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('reviewer_id', reviewerId)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching review:', error);
      return null;
    }
  }
  
  // Get all reviews for a user
  static async getReviewsForUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_reviewer_id_fkey(
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }
  
  // Get user's average rating
  static async getUserAverageRating(userId: string) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('target_user_id', userId);
        
      if (error) throw error;
      
      if (!data || data.length === 0) return 0;
      
      const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
      return Number((totalRating / data.length).toFixed(1));
    } catch (error) {
      console.error('Error calculating average rating:', error);
      return 0;
    }
  }
}
