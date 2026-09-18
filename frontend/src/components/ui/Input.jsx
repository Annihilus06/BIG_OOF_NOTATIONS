import React from 'react';

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-[#0B1220] border border-[#374151] rounded-[10px] px-3 py-2 text-[14px] text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function TextArea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full bg-[#0B1220] border border-[#374151] rounded-[10px] px-3 py-2 text-[14px] text-[#F9FAFB] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-colors disabled:opacity-50 resize-none ${className}`}
      {...props}
    />
  );
}