import React from 'react';

interface LiquidProgressProps {
  percent: number;
  label: string;
  sublabel?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function LiquidProgress({ percent, label, sublabel, color = 'primary', size = 'md' }: LiquidProgressProps) {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const heights = { sm: 'h-24 w-24', md: 'h-32 w-32', lg: 'h-40 w-40' };
  const textSizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${heights[size]} relative rounded-full overflow-hidden border-2 border-${color}/30 bg-muted/30`}>
        {/* Liquid fill */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
          style={{
            height: `${clampedPercent}%`,
            background: `linear-gradient(180deg, hsl(var(--${color}) / 0.6), hsl(var(--${color}) / 0.9))`,
          }}
        >
          {/* Wave effect */}
          <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden">
            <svg viewBox="0 0 120 10" className="w-[200%] animate-[wave_3s_ease-in-out_infinite]">
              <path
                d="M0 5 Q15 0 30 5 T60 5 T90 5 T120 5 V10 H0 Z"
                fill={`hsl(var(--${color}) / 0.4)`}
              />
            </svg>
          </div>
        </div>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <span className={`${textSizes[size]} font-heading font-bold text-foreground`}>
            {Math.round(clampedPercent)}%
          </span>
        </div>
      </div>
      <p className="text-sm font-medium text-foreground text-center">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground text-center">{sublabel}</p>}
    </div>
  );
}
