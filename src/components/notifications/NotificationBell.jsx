import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_ICON = {
  status_change:     '📋',
  document_pending:  '📎',
  renewal_reminder:  '⏰',
  payment:           '💳',
  general:           '🔔',
};

export default function NotificationBell({ userEmail, memberId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!userEmail) return;
    loadNotifications();
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_email === userEmail) loadNotifications();
    });
    return unsubscribe;
  }, [userEmail]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    if (!userEmail) return;
    const notifs = await base44.entities.Notification.filter({ user_email: userEmail }, '-created_date', 30);
    setNotifications(notifs);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { read: true });
    }
    loadNotifications();
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { read: true });
    loadNotifications();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-sm font-semibold">Notificações</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" /> Marcar todas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="ml-2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                Nenhuma notificação
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-semibold truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {n.created_date && format(new Date(n.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t text-center">
              <Link to="/notificacoes" onClick={() => setOpen(false)} className="text-[11px] text-primary hover:underline flex items-center justify-center gap-1">
                Ver todas <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}