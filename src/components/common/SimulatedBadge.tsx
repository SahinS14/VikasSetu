import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface Props {
  text?: string;
  className?: string;
}

export const SimulatedBadge: React.FC<Props> = ({ 
  text = 'SIMULATED VERIFICATION — DEMO MODE', 
  className = '' 
}) => {
  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 shadow-sm ${className}`}
      title="This component runs in simulated demo mode without requiring real external government credentials"
    >
      <Info className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
      <span>{text}</span>
    </span>
  );
};
