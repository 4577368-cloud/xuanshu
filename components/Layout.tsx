import React from 'react';
import { AppTab } from '../types';
import { Compass, FileText, Home, Sparkles } from 'lucide-react';

interface BottomNavProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: AppTab.HOME, label: '首页', icon: Home },
    { id: AppTab.CHART, label: '命盘', icon: Compass },
    { id: AppTab.TIPS, label: '知识', icon: Sparkles },
    { id: AppTab.ARCHIVE, label: '档案', icon: FileText },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-stone-50 border-t border-stone-200 pb-safe pt-2 px-6 shadow-lg z-50">
      <div className="flex justify-between items-center max-w-md mx-auto h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-16 transition-colors duration-200 ${
                isActive ? 'text-amber-800' : 'text-stone-400'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const Header: React.FC<{ title: string; subtitle?: string; rightAction?: React.ReactNode }> = ({ title, subtitle, rightAction }) => (
  <div className="sticky top-0 z-40 bg-stone-50/90 backdrop-blur-md border-b border-stone-200 px-4 h-14 flex items-center justify-between shadow-sm">
    <div>
      <h1 className="text-lg font-serif font-bold text-stone-900 tracking-wide">{title}</h1>
      {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
    </div>
    {rightAction && <div>{rightAction}</div>}
  </div>
);