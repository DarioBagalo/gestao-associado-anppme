import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCheck, UserX, Loader2, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function PendingUsersSummaryCard({ onNavigateToPending }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [actioning, setActioning] = useState(null);

  const loadPendingUsers = async () => {
    setLoading(true);
    const users = await base44.entities.User.filter({ status: 'pending' }, '-created_date', 50);
    setPendingUsers(users);
    setLoading(false);
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const handleApprove = async (e, userId) => {
    e.stopPropagation();
    setActioning(userId + '_approve');
    await base44.entities.User.update(userId, { status: 'active' });
    toast.success('Usuário aprovado com sucesso!');
    await loadPendingUsers();
    setActioning(null);
  };

  const handleReject = async (e, userId) => {
    e.stopPropagation();
    setActioning(userId + '_reject');
    await base44.entities.User.update(userId, { status: 'rejected' });
    toast.success('Usuário rejeitado.');
    await loadPendingUsers();
    setActioning(null);
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Verificando solicitações...</span>
        </CardContent>
      </Card>
    );
  }

  if (pendingUsers.length === 0) return null;

  return (
    <Card className="border-0 shadow-sm border-l-4 border-l-amber-500 bg-amber-50/40">
      <CardContent className="p-4">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Solicitações de Acesso Pendentes</p>
              <p className="text-xs text-amber-700">
                {pendingUsers.length} solicitação{pendingUsers.length > 1 ? 'ões' : ''} aguardando aprovação
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className="bg-amber-500 text-white border-0">
              {pendingUsers.length}
            </Badge>
            <ChevronRight className={`w-4 h-4 text-amber-600 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {/* Expanded list */}
        {expanded && (
          <div className="mt-4 space-y-2 border-t border-amber-200 pt-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white border border-amber-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {(user.city || user.state) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[user.city, user.state].filter(Boolean).join(' – ')}
                      </span>
                    )}
                    {user.created_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(user.created_date), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                  {user.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic truncate">"{user.notes}"</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={(e) => handleApprove(e, user.id)}
                    disabled={actioning === user.id + '_approve'}
                  >
                    {actioning === user.id + '_approve'
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <UserCheck className="w-3 h-3 mr-1" />
                    }
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs border-red-200 text-red-600 hover:bg-red-50"
                    onClick={(e) => handleReject(e, user.id)}
                    disabled={actioning === user.id + '_reject'}
                  >
                    {actioning === user.id + '_reject'
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <UserX className="w-3 h-3 mr-1" />
                    }
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}