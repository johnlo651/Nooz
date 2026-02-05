import React from 'react';
import { Zap } from 'lucide-react';
import * as PhosphorIcons from '@phosphor-icons/react';

const categoryIcons = {
  AI: PhosphorIcons.Brain,
  Apple: PhosphorIcons.AppleLogo,
  Tesla: PhosphorIcons.Lightning,
  Crypto: PhosphorIcons.CurrencyBtc,
  Climate: PhosphorIcons.Planet,
  Politics: PhosphorIcons.Bank,
  Finance: PhosphorIcons.ChartLine,
};

export const CategoryNav = ({ activeCategory, onCategoryChange }) => {
  const categories = ['All', 'AI', 'Apple', 'Tesla', 'Crypto', 'Climate', 'Politics', 'Finance'];
  
  return (
    <div className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-4 no-scrollbar">
          {categories.map(cat => {
            const Icon = cat === 'All' ? Zap : categoryIcons[cat];
            const isActive = activeCategory === (cat === 'All' ? null : cat);
            
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat === 'All' ? null : cat)}
                className={`flex items-center gap-2 px-4 py-2 border transition-colors duration-150 whitespace-nowrap ${
                  isActive 
                    ? 'border-primary bg-primary text-black' 
                    : 'border-border hover:border-primary hover:text-primary'
                }`}
                data-testid={`category-${cat.toLowerCase()}`}
              >
                {Icon && <Icon className="h-4 w-4" weight="bold" />}
                <span className="font-mono text-xs uppercase tracking-widest">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
