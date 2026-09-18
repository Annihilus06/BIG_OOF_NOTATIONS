import React from 'react';

export function Card({ children, className = '', elevated = false, ...props }) {
  return (
    <div
      className={`${elevated ? 'bg-[#1F2937]' : 'bg-[#111827]'} border border-[#374151] rounded-[10px] shadow-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-4 border-b border-[#374151] ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}