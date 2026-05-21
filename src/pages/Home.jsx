import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CreditCard, Shield, ArrowRight, CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';
import { format, parseISO, isBefore } from 'date-fns';
import { getStatusLabel, getStatusColor, getMemberTypeLabel, getMemberTypeColor } from '@/lib/formatters';

export default function Home() {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
      const members = await base44.entities.Member.filter({ email: u.email });
      if (members.length > 0) setMember(members[0]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusIcon = {
    pending: <Clock className="w-5 h-5" />,
    approved: <CheckCircle2 className="w-5 h-5" />,
    documents_pending: <Clock className="w-5 h-5" />,
    active: <CheckCircle2 className="w-5 h-5" />,
    rejected: <AlertCircle className="w-5 h-5" />,
    suspended: <AlertCircle className="w-5 h-5" />,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Bem-vindo{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Portal do Associado — ANPPME
        </p>
      </div>

      {/* Status Card */}
      {member ? (
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Status do Cadastro</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getStatusColor(member.status) + " border font-medium"}>
                    {statusIcon[member.status]}
                    <span className="ml-1.5">{getStatusLabel(member.status)}</span>
                  </Badge>
                </div>
                {member.member_type && (
                  <Badge className={getMemberTypeColor(member.member_type) + " border text-xs mt-2"}>
                    {getMemberTypeLabel(member.member_type)}
                  </Badge>
                )}
                {member.registration_number && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Registro Nº <span className="font-mono font-semibold">{member.registration_number}</span>
                  </p>
                )}
                {member.active_until && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Anuidade válida até: <span className={`font-semibold ${isBefore(parseISO(member.active_until), new Date()) ? 'text-red-600' : 'text-foreground'}`}>{format(parseISO(member.active_until), 'dd/MM/yyyy')}</span>
                      {isBefore(parseISO(member.active_until), new Date()) && <span className="text-red-500 ml-1">(vencida)</span>}
                    </p>
                  </div>
                )}
              </div>
              <Link to="/meu-cadastro">
                <Button variant="outline" size="sm">
                  Ver Cadastro <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Cadastre-se como Associado</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Preencha o formulário de associação para se tornar membro da ANPPME.
            </p>
            <Link to="/meu-cadastro">
              <Button className="mt-4">
                Iniciar Cadastro <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/meu-cadastro" className="group">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-medium text-sm">Meu Cadastro</h3>
              <p className="text-xs text-muted-foreground mt-1">Gerencie seus dados e documentos</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/minha-carteira" className="group">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-medium text-sm">Carteira de Associado</h3>
              <p className="text-xs text-muted-foreground mt-1">Visualize e baixe sua carteira</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/certidao" className="group">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all h-full">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-3 group-hover:bg-violet-100 transition-colors">
                <Shield className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-medium text-sm">Certidão de Regularidade</h3>
              <p className="text-xs text-muted-foreground mt-1">Emita sua certidão (válida por 30 dias)</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}