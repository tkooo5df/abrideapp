import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating?: number;
  max?: number;
  className?: string;
  iconClassName?: string;
}

const RatingStars = ({
  rating = 0,
  max = 5,
  className = "",
  iconClassName = "h-4 w-4",
}: RatingStarsProps) => {
  const sanitizedRating = Math.max(0, Math.min(rating ?? 0, max));
  const roundedRating = Math.floor(sanitizedRating * 2) / 2;
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating - fullStars >= 0.5;
  const emptyStars = Math.max(max - fullStars - (hasHalfStar ? 1 : 0), 0);

  const stars = [] as JSX.Element[];

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Star
        key={`full-${i}`}
        className={cn("fill-yellow-400 text-yellow-400", iconClassName)}
      />
    );
  }

  if (hasHalfStar) {
    stars.push(
      <StarHalf
        key="half"
        className={cn("fill-yellow-400 text-yellow-400", iconClassName)}
      />
    );
  }

  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Star
        key={`empty-${i}`}
        className={cn("text-yellow-300", iconClassName)}
      />
    );
  }

  return <div className={cn("flex items-center", className)}>{stars}</div>;
};

export default RatingStars;
