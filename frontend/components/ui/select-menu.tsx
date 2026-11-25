"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

export type SelectMenuOption = {
  value: string
  label: string
}

type SelectMenuProps = {
  ariaLabel: string
  value: string
  options: SelectMenuOption[]
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export function SelectMenu({
  ariaLabel,
  value,
  options,
  onChange,
  className = "",
  disabled = false,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open])

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? ""

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`flex items-center justify-between gap-2 border border-[#e7ded6] bg-white text-[#30261f] outline-none hover:bg-[#fff9f3] hover:text-[#30261f] focus:border-[#c96a29] focus:ring-4 focus:ring-[#c96a29]/10 disabled:cursor-not-allowed disabled:bg-[#faf8f6] disabled:text-[#91867e] ${className}`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-[#756d67] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          aria-label={ariaLabel}
          className="absolute right-0 z-50 mt-1 min-w-full overflow-hidden rounded-lg border border-[#e7ded6] bg-white py-1 shadow-lg"
          role="listbox"
        >
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`block w-full px-3 py-2 text-left text-sm whitespace-nowrap ${
                option.value === value
                  ? "bg-[#fff2e8] text-[#8e4214]"
                  : "bg-white text-[#30261f] hover:bg-[#fff9f3] hover:text-[#30261f]"
              }`}
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
