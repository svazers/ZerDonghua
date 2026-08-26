import React from 'react';
import { DonghuaGenre } from '../types';
import { Sparkles, Layers } from 'lucide-react';

interface GenreBarProps {
  genres: DonghuaGenre[];
  selectedGenre: string | null;
  onSelectGenre: (genreSlug: string | null) => void;
}

export const GenreBar: React.FC<GenreBarProps> = ({
  genres,
  selectedGenre,
  onSelectGenre
}) => {
  return (
    <div className="w-full py-3">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => onSelectGenre(null)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
            selectedGenre === null
              ? 'bg-accent text-white shadow-sm border border-line-strong'
              : 'bg-line hover:bg-line-strong text-sub hover:text-ink border border-line'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Semua Genre</span>
        </button>

        {genres.map((g) => {
          const isSelected = selectedGenre === g.slug;
          return (
            <button
              key={g.slug || g.name}
              onClick={() => onSelectGenre(isSelected ? null : g.slug)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-accent text-white shadow-sm border border-line-strong'
                  : 'bg-line hover:bg-line-strong text-sub hover:text-ink border border-line'
              }`}
            >
              {g.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
