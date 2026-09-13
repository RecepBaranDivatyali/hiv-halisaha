import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Maximize2, Minimize2, Smartphone } from 'lucide-react';

export function DeviceFrame({ children, isSimulatorMode, onToggleSimulator }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isSimulatorMode) {
    // Standart Tam Ekran Responsive Web Modu
    return <div className="h-screen w-screen overflow-hidden bg-[#070A10] text-white">{children}</div>;
  }

  // 📱 Cihaz Simülatörü Modu
  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#040609] p-2 sm:p-4 selection:bg-[#8eff71] selection:text-[#064200]">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8eff71]/[0.03] blur-[150px]" />
      </div>

      {/* Floating Simulator Controls Bar */}
      <div className="absolute top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-[#12141C]/90 px-4 py-2 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs font-bold text-white/70">
          <Smartphone className="h-4 w-4 text-[#8eff71]" />
          <span>iPhone 16 Pro Simülatörü</span>
        </div>
        <div className="h-3 w-px bg-white/10" />
        <button
          onClick={onToggleSimulator}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white hover:bg-[#8eff71] hover:text-[#064200] transition"
        >
          <Maximize2 className="h-3 w-3" />
          <span>Tam Ekrana Geç</span>
        </button>
      </div>

      {/* Phone Hardware Case */}
      <div className="relative flex h-[92vh] max-h-[880px] w-[410px] flex-col overflow-hidden rounded-[52px] border-[10px] border-[#1e2330] bg-[#070A10] shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(142,255,113,0.1)] ring-1 ring-white/10">
        {/* Dynamic Island / Top Notch */}
        <div className="absolute top-3 left-1/2 z-50 flex h-7 w-28 -translate-x-1/2 items-center justify-between rounded-full bg-black px-2 shadow-md">
          <div className="h-2.5 w-2.5 rounded-full bg-[#0d131f]/80 ring-1 ring-white/5" />
          <div className="h-2 w-2 rounded-full bg-[#8eff71]/40 animate-pulse" />
        </div>

        {/* Mobile Status Bar */}
        <div className="relative z-40 flex h-11 shrink-0 items-center justify-between px-7 pt-1 text-[11px] font-bold text-white">
          <span>{time || '21:00'}</span>
          <div className="flex items-center gap-1.5 text-white/80">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <Battery className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Phone Screen Viewport */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-[#070A10]">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="relative z-40 flex h-5 shrink-0 items-center justify-center bg-[#070A10]">
          <div className="h-1 w-32 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}
