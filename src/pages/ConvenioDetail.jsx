import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, MapPin, Phone, Mail, Globe, MessageCircle, Star } from 'lucide-react';

export default function ConvenioDetail() {
  const { id } = useParams();
  const [convenio, setConvenio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Convenio.filter({ id }).then(res => {
      if (res.length > 0) setConvenio(res[0]);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!convenio) return <div className="text-center py-20 text-muted-foreground">Convênio não encontrado.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/convenios">
        <Button variant="ghost" size="sm" className="gap-2 pl-0 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Voltar aos Convênios
        </Button>
      </Link>

      <div className="flex items-start gap-5 flex-wrap">
        {convenio.logo_url ? (
          <img src={convenio.logo_url} alt={convenio.name} className="w-24 h-24 object-contain rounded-xl border bg-white p-2 shadow-sm" />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-12 h-12 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{convenio.name}</h1>
            {convenio.is_featured && <Star className="w-5 h-5 text-amber-500 fill-amber-500" />}
          </div>
          {convenio.category && <Badge variant="outline" className="mt-1">{convenio.category}</Badge>}
          {convenio.city && (
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />{convenio.city}{convenio.state ? `/${convenio.state}` : ''}
            </p>
          )}
          {convenio.discount_info && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
              {convenio.discount_info}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-2">Sobre o Convênio</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{convenio.description}</p>
        </CardContent>
      </Card>

      {/* Benefits */}
      {convenio.benefits && (
        <Card className="border-0 shadow-sm bg-emerald-50/50">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-2 text-emerald-800">Benefícios para Associados</h2>
            <p className="text-sm text-emerald-700 leading-relaxed whitespace-pre-line">{convenio.benefits}</p>
          </CardContent>
        </Card>
      )}

      {/* Address */}
      {convenio.address && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-2">Endereço</h2>
            <p className="text-sm text-muted-foreground">{convenio.address}</p>
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {convenio.contact_phone && (
              <a href={`tel:${convenio.contact_phone}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Phone className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium">{convenio.contact_phone}</p>
                </div>
              </a>
            )}
            {convenio.contact_email && (
              <a href={`mailto:${convenio.contact_email}`} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Mail className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">E-mail</p>
                  <p className="text-sm font-medium">{convenio.contact_email}</p>
                </div>
              </a>
            )}
            {convenio.website_url && (
              <a href={convenio.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Globe className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Site</p>
                  <p className="text-sm font-medium truncate">{convenio.website_url}</p>
                </div>
              </a>
            )}
            {convenio.social_media_url && (
              <a href={convenio.social_media_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Globe className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Rede Social</p>
                  <p className="text-sm font-medium truncate">{convenio.social_media_url}</p>
                </div>
              </a>
            )}
            {convenio.whatsapp_number && (
              <a href={`https://wa.me/55${convenio.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors md:col-span-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-[10px] text-green-700">WhatsApp</p>
                  <p className="text-sm font-medium text-green-800">{convenio.whatsapp_number}</p>
                </div>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}