import React from 'react';
import { HardHat } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute w-24 h-24 border-t-2 border-cyan-400 border-solid rounded-full animate-spin"></div>
        <div
          className="absolute w-20 h-20 border-r-2 border-blue-500 border-solid rounded-full animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        ></div>
        <HardHat className="h-10 w-10 text-cyan-400" />
      </div>
      <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse tracking-widest">
        LOADING DASHBOARD...
      </h2>
      <p className="text-slate-400 text-sm mt-2">Fetching your workspace data</p>
    </div>
  );
}
