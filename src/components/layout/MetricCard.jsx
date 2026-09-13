import React from 'react';

export function MetricCard({ title, value, change, isPositive, icon: Icon, subtitle, color = 'primary' }) {
  const colorMap = {
    primary: 'border-[#8eff71]/20 bg-[#8eff71]/5 text-[#8eff71]',
    secondary: 'border-[#6e9bff]/20 bg-[#6e9bff]/5 text-[#6e9bff]',
    tertiary: 'border-[#88f6ff]/20 bg-[#88f6ff]/5 text-[#88f6ff]',
    warning: 'border-[#ffb703]/20 bg-[#ffb703]/5 text-[#ffb703]',
    error: 'border-[#ff7351]/20 bg-[#ff7351]/5 text-[#ff7351]',
  };

  const iconColor = colorMap[color] || colorMap.primary;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#12141C]/80 p-6 backdrop-blur-xl transition hover:border-white/10 hover:bg-[#151824]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-white/50">{title}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconColor}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
      </div>
      
      <div className="mt-4 flex items-baseline gap-3">
        <span className="font-montserrat text-3xl font-extrabold tracking-tight text-white">{value}</span>
        {change && (
          <span className={`text-xs font-bold ${isPositive ? 'text-[#8eff71]' : 'text-[#ff7351]'}`}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-white/40">{subtitle}</p>
      )}
    </div>
  );
}
