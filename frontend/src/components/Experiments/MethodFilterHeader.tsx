import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import { FilterIcon } from "../UI/icons";
import { UNLEARNING_METHODS } from "../../constants/experiments";

const MOUSEDOWN = "mousedown";

export default function MethodFilterHeader({ column }: { column: any }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showDropdown && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownCoords({
        top: rect.bottom,
        left: rect.left,
      });
    }
  }, [showDropdown]);

  const handleSelect = (value: string) => {
    column.setFilterValue(value);
    setShowDropdown(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener(MOUSEDOWN, handleClickOutside);
    } else {
      document.removeEventListener(MOUSEDOWN, handleClickOutside);
    }
    return () => {
      document.removeEventListener(MOUSEDOWN, handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div ref={containerRef} className="flex items-center relative">
      <span>Method</span>
      <FilterIcon
        className="ml-1 cursor-pointer w-3.5"
        onClick={() => setShowDropdown(true)}
      />
      {showDropdown &&
        createPortal(
          <div
            ref={dropdownRef}
            className="absolute z-50 bg-white border rounded shadow text-sm"
            style={{
              top: dropdownCoords.top,
              left: dropdownCoords.left,
            }}
          >
            <div
              onClick={() => handleSelect("all")}
              className="px-2.5 py-1.5 hover:bg-gray-100 cursor-pointer"
            >
              All
            </div>
            {UNLEARNING_METHODS.map((method) => (
              <div
                key={method}
                onClick={() => handleSelect(method)}
                className="px-2.5 py-1.5 hover:bg-gray-100 cursor-pointer"
              >
                {method}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
