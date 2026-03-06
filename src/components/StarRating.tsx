import { useState } from "react";

interface StarRatingProps {
  rating?: number;              // si se pasa, es controlado
  onRatingChange?: (val: number) => void;
  readOnly?: boolean;
  max?: number;
}

export function StarRating({
  rating,
  onRatingChange,
  readOnly = false,
  max = 5,
}: StarRatingProps) {
  const [internalRating, setInternalRating] = useState(0);
  const currentRating = rating ?? internalRating;

  return (
    <div className="flex gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          onClick={() => {
            if (!readOnly) {
              if (rating === undefined) setInternalRating(star); // modo no controlado
              onRatingChange?.(star); // notifica al padre
            }
          }}
          disabled={readOnly}
          className={star <= currentRating ? "text-yellow-500" : "text-slate-400"}
        >
          ★
        </button>
      ))}
    </div>
  );
}