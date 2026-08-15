import { supabase } from '../supabase/client';

export interface PlatformReview {
  id: string;
  user_id?: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export class PlatformReviewsService {
  /**
   * Fetch approved platform reviews
   */
  static async getApprovedReviews(limit = 10): Promise<PlatformReview[]> {
    const { data, error } = await supabase
      .from('platform_reviews')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching platform reviews:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Submit a new platform review
   */
  static async submitReview(reviewData: {
    reviewer_name: string;
    rating: number;
    comment?: string;
    user_id?: string;
  }): Promise<{ success: boolean; error?: any }> {
    try {
      // If we don't have a specific status, let the DB default to 'approved' or 'pending'
      // based on the migration (currently set to default 'approved').
      const { error } = await supabase
        .from('platform_reviews')
        .insert([{
          reviewer_name: reviewData.reviewer_name,
          rating: reviewData.rating,
          comment: reviewData.comment || '',
          user_id: reviewData.user_id || null,
        }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error submitting platform review:', error);
      return { success: false, error };
    }
  }
}
