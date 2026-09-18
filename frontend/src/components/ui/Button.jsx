import React from 'react';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '', 
  ...props 
}) {
  const base = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 focus:ring-offset-[#0B1220] rounded-[10px] disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  
  const variants = {
    primary: "bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-transparent shadow-xs",
    secondary: "bg-transparent hover:bg-[#1F2937] text-[#F9FAFB] border border-[#374151]",
    outline: "bg-[#111827] hover:bg-[#1F2937] text-[#CBD5E1] border border-[#374151]",
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-transparent",
    ghost: "bg-transparent hover:bg-[#1F2937] text-[#CBD5E1] border border-transparent"
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-[12px] gap-1.5",
    md: "px-3.5 py-2 text-[14px] gap-2",
    lg: "px-4 py-2.5 text-[14px] font-semibold gap-2"
  };

  return (
    <button
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}