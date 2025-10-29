import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';

export type FilterType = 'select' | 'text' | 'boolean';

export interface FilterDefinition {
  id: string;
  label: string;
  type: FilterType;
  options?: Array<{ label: string; value: string }>; // for select
  placeholder?: string; // for text
}

export interface SavedView {
  name: string;
  filters: Record<string, any>;
}

interface FilterToolbarProps {
  filters: Record<string, any>;
  definitions: FilterDefinition[];
  onFiltersChange: (next: Record<string, any>) => void;
  savedViewsKey: string;
  onClearAll?: () => void;
  className?: string;
}

const loadViews = (key: string): SavedView[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as SavedView[];
    return [];
  } catch {
    return [];
  }
};

const saveViews = (key: string, views: SavedView[]) => {
  localStorage.setItem(key, JSON.stringify(views));
};

const FilterToolbar: React.FC<FilterToolbarProps> = ({ filters, definitions, onFiltersChange, savedViewsKey, onClearAll, className = '' }) => {
  const [views, setViews] = useState<SavedView[]>(() => loadViews(savedViewsKey));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [viewName, setViewName] = useState('');

  useEffect(() => {
    saveViews(savedViewsKey, views);
  }, [views, savedViewsKey]);

  const activeChips = useMemo(() => {
    return definitions
      .map(def => {
        const val = filters[def.id];
        if (def.type === 'select') {
          if (!val || val === 'all') return null;
          const label = def.options?.find(o => o.value === val)?.label || String(val);
          return { id: def.id, label: `${def.label}: ${label}` };
        } else if (def.type === 'text') {
          if (!val || String(val).trim() === '') return null;
          return { id: def.id, label: `${def.label}: ${val}` };
        } else if (def.type === 'boolean') {
          if (!val) return null;
          return { id: def.id, label: def.label };
        }
        return null;
      })
      .filter(Boolean) as { id: string; label: string }[];
  }, [definitions, filters]);

  const updateFilter = (id: string, value: any) => {
    onFiltersChange({ ...filters, [id]: value });
  };

  const clearChip = (id: string) => {
    const def = definitions.find(d => d.id === id);
    if (!def) return;
    if (def.type === 'select') updateFilter(id, 'all');
    else if (def.type === 'text') updateFilter(id, '');
    else if (def.type === 'boolean') updateFilter(id, false);
  };

  const clearAll = () => {
    const next: Record<string, any> = { ...filters };
    definitions.forEach(def => {
      if (def.type === 'select') next[def.id] = 'all';
      else if (def.type === 'text') next[def.id] = '';
      else if (def.type === 'boolean') next[def.id] = false;
    });
    onFiltersChange(next);
    onClearAll?.();
  };

  const handleSaveView = () => {
    const name = viewName.trim();
    if (!name) return;
    const exist = views.find(v => v.name.toLowerCase() === name.toLowerCase());
    const next = exist
      ? views.map(v => (v.name.toLowerCase() === name.toLowerCase() ? { name, filters } : v))
      : [...views, { name, filters }];
    setViews(next);
    setViewName('');
  };

  const applyView = (v: SavedView) => {
    onFiltersChange({ ...filters, ...v.filters });
    setIsMenuOpen(false);
  };

  const deleteView = (name: string) => {
    setViews(views.filter(v => v.name !== name));
  };

  return (
    <div className={`flex flex-col gap-4 rounded-[var(--radius-card)] bg-white dark:bg-gray-800 shadow-[var(--shadow-elev-1)] p-3 md:p-4 ${className}`}>
      <div className="flex gap-3 items-end flex-wrap">
        {definitions.map(def => {
          if (def.type === 'select') {
            return (
              <div key={def.id} className="min-w-[220px]">
                <Select
                  label={def.label}
                  value={filters[def.id] ?? 'all'}
                  onChange={e => updateFilter(def.id, e.target.value)}
                >
                  <option value="all">Tous</option>
                  {def.options?.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
            );
          }
          if (def.type === 'text') {
            return (
              <div key={def.id} className="min-w-[240px]">
                <Input
                  label={def.label}
                  placeholder={def.placeholder || ''}
                  value={filters[def.id] ?? ''}
                  onChange={e => updateFilter(def.id, e.target.value)}
                  iconLeft="search"
                />
              </div>
            );
          }
          // boolean
          return (
            <label key={def.id} className="flex items-center gap-2 select-none mb-1">
              <input
                type="checkbox"
                checked={!!filters[def.id]}
                onChange={e => updateFilter(def.id, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{def.label}</span>
            </label>
          );
        })}

        <div className="ml-auto flex items-end gap-2">
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setIsMenuOpen(p => !p)} icon="bookmark" iconPosition="left">
              Vues
            </Button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  key="saved-views"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } }}
                  exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } }}
                  className="absolute right-0 z-20 mt-2 w-80 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10 p-3"
                >
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Nom de la vue"
                      value={viewName}
                      onChange={e => setViewName(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSaveView} icon="save">Enregistrer</Button>
                  </div>
                  <div className="max-h-60 overflow-auto">
                    {views.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Aucune vue enregistrée.</p>
                    ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {views.map(v => (
                          <li key={v.name} className="py-2 flex items-center justify-between">
                            <motion.button
                              className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:underline"
                              onClick={() => applyView(v)}
                              whileTap={{ scale: 0.97 }}
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            >
                              {v.name}
                            </motion.button>
                            <motion.button
                              className="text-sm text-status-danger-600 hover:underline"
                              onClick={() => deleteView(v.name)}
                              whileTap={{ scale: 0.97 }}
                              whileHover={{ scale: 1.02 }}
                              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            >
                              Supprimer
                            </motion.button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button variant="secondary" size="sm" onClick={clearAll} icon="close">Tout effacer</Button>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 mr-1">Filtres:</span>
          {activeChips.map(chip => (
            <div key={chip.id} className="flex items-center gap-1.5 rounded-full bg-primary-100 dark:bg-primary-500/20 px-2.5 py-1 text-xs font-medium text-primary-900 dark:text-primary-300">
              <span className="material-symbols-outlined !text-sm">filter_alt</span>
              <span className="truncate max-w-[220px]">{chip.label}</span>
              <button className="ml-1 rounded-full hover:bg-primary-200/60 dark:hover:bg-primary-500/30" onClick={() => clearChip(chip.id)} aria-label="Supprimer le filtre">
                <span className="material-symbols-outlined !text-sm">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterToolbar;
