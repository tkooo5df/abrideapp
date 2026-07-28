import { BrowserDatabaseService } from './browserServices';

interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  target_user_id: string;
  target_type: 'driver' | 'passenger';
  rating: number;
  comment: string;
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
      
      const review: Review = {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...reviewData,
        created_at: new Date().toISOString()
      };
      
      // Save to localStorage
      const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
      reviews.push(review);
      localStorage.setItem('reviews', JSON.stringify(reviews));
      
      return review;
    } catch (error) {
      throw error;
    }
  }
  
  // Get review by booking ID and reviewer ID
  static async getReviewByBookingAndReviewer(bookingId: string, reviewerId: string) {
    try {
      // Get from localStorage
      const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
      return reviews.find((review: Review) => 
        review.booking_id === bookingId && review.reviewer_id === reviewerId
      ) || null;
    } catch (error) {
      return null;
    }
  }
  
  // Get all reviews for a user
  static async getReviewsForUser(userId: string) {
    try {
      // Get from localStorage
      const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
      return reviews.filter((review: Review) => review.target_user_id === userId);
    } catch (error) {
      return [];
    }
  }
  
  // Get user's average rating
  static async getUserAverageRating(userId: string) {
    try {
      const reviews = await this.getReviewsForUser(userId);
      if (reviews.length === 0) return 0;
      
      const totalRating = reviews.reduce((sum: number, review: Review) => sum + review.rating, 0);
      return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      return 0;
    }
  }
  
  // Get all reviews (for admin)
  static async getAllReviews() {
    try {
      // Get from localStorage
      return JSON.parse(localStorage.getItem('reviews') || '[]');
    } catch (error) {
      return [];
    }
  }
}
