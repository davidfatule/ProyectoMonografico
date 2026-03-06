import { useState } from "react";

interface DropdownProps {
  label: string;
  items: string[];
}

export function DropdownMenu({ label, items }: DropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-primary text-white rounded-lg"
      >
        {label}
      </button>
      {open && (
        <ul className="absolute mt-2 bg-white border rounded-lg shadow-lg">
          {items.map((item, i) => (
            <li
              key={i}
              className="px-4 py-2 hover:bg-slate-100 cursor-pointer"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}