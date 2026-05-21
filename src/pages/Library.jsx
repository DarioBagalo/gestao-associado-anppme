import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, FileText, Video, Link2, Search, Download, ExternalLink, AlertCircle } from 'lucide-react';

const TYPE_ICONS = { documento: FileText, artigo: BookOpen, video: Video, link: Link2, outro: FileText };
const TYPE_COLORS = { documento: 'bg-blue-100 text-blue-700', artigo: 'bg-violet-100 text-violet-700', video: 'bg-red-100 text-red-700', link: 'bg-emerald-100 text-emerald-700', outro: 'bg-gray-100 text-gray-700' };
const TYPE_LABELS = { documento: 'Documento', artigo: 'Artigo', video: 'Vídeo', link: 'Link', outro: 'Outro' };

export default function Library() {
  const [member, setMember] = useState(null);
  const [contents, setContents] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      const members = await base44.entities.Member.filter({ email: u.email });
      const m = members[0] || null;
      setMember(m);
      if (m && m.status === 'active') {
        const all = await base44.entities.Content.filter({ is_published: true }, 'order_index', 200);
        // Filter by member type
        const filtered = all.filter(c => !c.member_types_allowed?.length || c.member_types_allowed.includes(m.member_type));
        setContents(filtered);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!member || member.status !== 'active') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Biblioteca</h1>
        <Card className="border-0 shadow-sm"><CardContent className="p-10 text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-semibold">Acesso Restrito</h3>
          <p className="text-sm text-muted-foreground mt-1">O acesso à biblioteca é exclusivo para associados ativos.</p>
        </CardContent></Card>
      </div>
    );
  }

  const types = ['all', ...new Set(contents.map(c => c.content_type))];
  const filtered = contents.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.category?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.content_type === typeFilter;
    return matchSearch && matchType;
  });

  const categories = [...new Set(filtered.map(c => c.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Biblioteca</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Conteúdo exclusivo para associados</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar conteúdo..." className="pl-9 w-52" />
        </div>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${typeFilter === t ? 'bg-primary text-white border-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}>
            {t === 'all' ? `Todos (${contents.length})` : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-10 text-center text-muted-foreground text-sm">Nenhum conteúdo encontrado.</CardContent></Card>
      ) : (
        <div>
          {categories.length > 0 ? (
            categories.map(cat => {
              const items = filtered.filter(c => c.category === cat);
              return (
                <div key={cat} className="mb-8">
                  <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">{cat}</h2>
                  <ContentGrid items={items} />
                </div>
              );
            })
          ) : <ContentGrid items={filtered} />}
        </div>
      )}
    </div>
  );
}

function ContentGrid({ items }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map(c => {
        const Icon = TYPE_ICONS[c.content_type] || FileText;
        return (
          <a key={c.id} href={c.file_url} target="_blank" rel="noreferrer"
            className="block group">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all h-full">
              <CardContent className="p-4 flex gap-3 items-start">
                {c.thumbnail_url
                  ? <img src={c.thumbnail_url} alt={c.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  : <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[c.content_type]}`}><Icon className="w-5 h-5" /></div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors">{c.title}</h3>
                    {c.file_url && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                  <Badge className={`mt-2 text-[10px] border-0 ${TYPE_COLORS[c.content_type]}`}>{TYPE_LABELS[c.content_type]}</Badge>
                </div>
              </CardContent>
            </Card>
          </a>
        );
      })}
    </div>
  );
}