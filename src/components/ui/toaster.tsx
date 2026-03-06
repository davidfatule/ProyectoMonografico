import { useState } from "react";

export function Toaster() {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <>
      {message && (
        <div className="fixed bottom-4 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow z-50">
          {message}
        </div>
      )}
    </>
  );
}