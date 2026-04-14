//export function StarRating({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  //return (
    //<div className="flex gap-1">
      //{[1, 2, 3, 4, 5].map((star) => (
       // <button
       //   key={star}
       //   onClick={() => onChange(star)}
        //  className={star <= value ? "text-yellow-500" : "text-gray-300"}
       // >
       //   ★
       // </button>
     // ))}
    //</div>
  //);
//}

interface StarRatingProps {
  rating: number;
  onRatingChange?: (val: number) => void;
  readOnly?: boolean;
}

export function StarRating({ rating, onRatingChange, readOnly = false }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readOnly && onRatingChange?.(star)}
          disabled={readOnly}
          className={star <= rating ? "text-yellow-500" : "text-gray-300 dark:text-slate-600"}
        >
          ★
        </button>
      ))}
    </div>
  );
}