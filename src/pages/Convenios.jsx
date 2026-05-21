import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Search, MapPin, Phone, Globe, ArrowRight, Star, Building2 } from 'lucide-react';

export default function Convenios() {
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [member, setMember] = useState(null);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      const members = await base44.entities.Member.filter({ email: u.email });
      if (members.length > 0) setMember(members[0]);
      const all = await base44.entities.Convenio.list('order_index', 100);
      setConvenios(all.filter(c => c.is_visible !== false));
      setLoading(false);
    }
    load();
  }, []);

  // Check if member type has access (participante has no access)
  const hasAccess = member?.status === 'active' && member?.member_type !== 'participante';

  const filtered = convenios.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  const featured = filtered.filter(c => c.is_featured);
  const regular = filtered.filter(c => !c.is_featured);

  if (!hasAccess && member) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Convênios</h1>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <h3 className="font-semibold text-lg">Acesso Exclusivo para Sócios Contribuintes e Beneméritos</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Os convênios são um benefício exclusivo para sócios contribuintes e beneméritos. Entre em contato com a ANPPME para mais informações.
            </p>
            <a href="https://wa.me/5569999124124" target="_blank" rel="noopener noreferrer">
              <Button className="mt-4 gap-2">Fale Conosco</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Convênios</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Benefícios e parcerias exclusivas para associados da ANPPME</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, categoria ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Em Destaque</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map(c => <ConvenioCard key={c.id} convenio={c} featured />)}
          </div>
        </div>
      )}

      {/* All */}
      {regular.length > 0 && (
        <div>
          {featured.length > 0 && <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Todos os Convênios</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regular.map(c => <ConvenioCard key={c.id} convenio={c} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-10 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">Nenhum convênio encontrado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConvenioCard({ convenio, featured }) {
  return (
    <Link to={`/convenios/${convenio.id}`}>
      <Card className={`border-0 shadow-sm hover:shadow-md transition-all h-full group cursor-pointer ${featured ? 'ring-1 ring-amber-300' : ''}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {convenio.logo_url ? (
              <img src={convenio.logo_url} alt={convenio.name} className="w-14 h-14 object-contain rounded-lg border bg-white p-1 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{convenio.name}</h3>
                {featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
              </div>
              {convenio.category && <Badge variant="outline" className="text-[10px] mt-1">{convenio.category}</Badge>}
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{convenio.description}</p>
              {convenio.discount_info && (
                <p className="text-xs font-medium text-emerald-700 mt-1.5 bg-emerald-50 px-2 py-0.5 rounded w-fit">{convenio.discount_info}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                {convenio.city && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{convenio.city}/{convenio.state}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end mt-3">
            <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
              Ver detalhes <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}