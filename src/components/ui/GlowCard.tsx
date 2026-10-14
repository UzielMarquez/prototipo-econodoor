import React from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'rgba(31, 78, 107, 0.12)' 
}) => {
  return (
    <div 
      className={`relative group rounded-2xl bg-slate-900/80 border border-slate-800/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-sky-500/50 hover:shadow-2xl overflow-hidden ${className}`}
      style={{
        boxShadow: `0 4px 20px -2px ${glowColor}`,
      }}
    >
      <div 
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none"
        style={{ background: glowColor }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
