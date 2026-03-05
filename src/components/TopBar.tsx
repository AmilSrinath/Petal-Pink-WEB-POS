import React, { useEffect, useState } from 'react';
interface TopBarProps {
  title: string;
  userName: string;
}
export function TopBar({ title, userName }: TopBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0];
  };
  return (
    <header className="flex h-16 items-center justify-between bg-gradient-to-r from-teal-700 to-teal-600 px-6 shadow-md">
      <div className="flex items-center">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>

      <div className="flex items-center space-x-8 text-sm font-medium text-teal-50">
        <div className="flex items-center space-x-4">
          <span>Date: {formatDate(currentTime)}</span>
          <span>Time: {formatTime(currentTime)}</span>
        </div>
        <div className="flex items-center space-x-2 rounded-full bg-teal-800/50 px-4 py-1.5 border border-teal-500/30">
          <div className="h-6 w-6 rounded-full bg-yellow-500 flex items-center justify-center text-teal-900 font-bold text-xs">
            {userName.charAt(0)}
          </div>
          <span className="text-white">{userName}</span>
        </div>
      </div>
    </header>);

}