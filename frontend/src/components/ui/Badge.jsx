import React from 'react';

export function Badge({ children, variant = 'neutral', className = '' }) {
  const variants = {
    primary: "bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/30",
    success: "bg-[#16A34A]/15 text-[#4ADE80] border-[#16A34A]/30",
    warning: "bg-[#D97706]/15 text-[#FBBF24] border-[#D97706]/30",
    danger: "bg-[#DC2626]/15 text-[#F87171] border-[#DC2626]/30",
    neutral: "bg-[#1F2937] text-[#CBD5E1] border-[#374151]"
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border font-mono ${variants[variant] || variants.neutral} ${className}`}
    >
      {children}
    </span>
  );
}