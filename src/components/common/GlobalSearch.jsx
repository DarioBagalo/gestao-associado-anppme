import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, X, FileText, Calendar, BookOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  member: { icon: Users, label: 'Associado', color: 'text-primary', path: '/admin' },
  event: { icon: Calendar, label: 'Evento', color: 'text-blue-600', path: '/eventos' },
  content: { icon: BookOpen, label: 'Biblioteca', color: 'text-emerald-600', path: '/biblioteca' },
};

export default function GlobalSearch({ isAdmin }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const search = async (q) => {
    setLoading(true);
    const lower = q.toLowerCase();
    const all = [];

    try {
      const events = await base44.entities.Event.filter({ is_published: true });
      events.forEach(e => {
        if (e.title?.toLowerCase().includes(lower) || e.description?.toLowerCase().includes(lower) || e.city?.toLowerCase().includes(lower)) {
          all.push({ id: e.id, type: 'event', title: e.title, subtitle: e.city || e.event_type, path: '/eventos' });
        }
      });
    } catch {}

    try {
      const contents = await base44.entities.Content.filter({ is_published: true });
      contents.forEach(c => {
        if (c.title?.toLowerCase().includes(lower) || c.description?.toLowerCase().includes(lower) || c.category?.toLowerCase().includes(lower)) {
          all.push({ id: c.id, type: 'content', title: c.title, subtitle: c.category || c.content_type, path: '/biblioteca' });
        }
      });
    } catch {}

    if (isAdmin) {
      try {
        const members = await base44.entities.Member.list('-created_date', 200);
        members.forEach(m => {
          if (m.full_name?.toLowerCase().includes(lower) || m.cpf?.includes(q) || m.email?.toLowerCase().includes(lower)) {
            all.push({ id: m.id, type: 'member', title: m.full_name, subtitle: m.email, path: '/admin' });
          }
        });
      } catch {}
    }

    setResults(all.slice(0, 8));
    setOpen(true);
    setLoading(false);
  };

  const handleSelect = (item) => {
    navigate(item.path);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/40" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Buscar..."
          className="w-full h-8 pl-8 pr-8 text-xs rounded-lg bg-sidebar-accent/40 border border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:outline-none focus:ring-1 focus:ring-sidebar-primary"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-sidebar-foreground/40" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground">Nenhum resultado encontrado.</div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y">
              {results.map(item => {
                const cfg = TYPE_CONFIG[item.type];
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-muted/40 transition-colors flex items-center gap-3"
                  >
                    <cfg.icon className={cn('w-4 h-4 shrink-0', cfg.color)} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate text-foreground">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{cfg.label} · {item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}