import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Users, FileText, CreditCard, Shield, Home, Menu, X, LogOut, ChevronRight, BarChart2, Receipt, Bell, Handshake, Calendar, BookOpen, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationBell from '@/components/notifications/NotificationBell';
import WhatsAppButton from '@/components/common/WhatsAppButton';
import GlobalSearch from '@/components/common/GlobalSearch';

const LOGO_SYMBOL = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/eb6f25876_LOGO_ANPPME_AZUL_SIMBOLO.png';
const LOGO_NAME   = 'https://media.base44.com/images/public/69bdad4b62555d6f0c050afb/236232730_ANPPME_LOGO_OFICIAL_NOME.png';

const NAV_ITEMS = [
  { path: '/',               label: 'Início',            icon: Home },
  { path: '/meu-cadastro',   label: 'Meu Cadastro',      icon: FileText },
  { path: '/minha-carteira', label: 'Carteira',           icon: CreditCard },
  { path: '/certidao',       label: 'Certidão',           icon: Shield },
  { path: '/eventos',            label: 'Eventos',            icon: Calendar },
  { path: '/meus-certificados', label: 'Meus Certificados',  icon: Award },
  { path: '/biblioteca',        label: 'Biblioteca',         icon: BookOpen },
  { path: '/financeiro',     label: 'Financeiro',         icon: Receipt },
  { path: '/notificacoes',   label: 'Notificações',       icon: Bell },
  { path: '/convenios',      label: 'Convênios',          icon: Handshake, memberTypes: ['contribuinte', 'benemerито'] },
];

const ADMIN_ITEMS = [
  { path: '/admin',               label: 'Painel Administrativo', icon: Users },
  { path: '/gestao',              label: 'Controle de Gestão',    icon: BarChart2 },
  { path: '/admin/convenios',     label: 'Gestão de Convênios',   icon: Handshake },
  { path: '/admin/eventos',       label: 'Gestão de Eventos',     icon: Calendar },
  { path: '/admin/biblioteca',    label: 'Gestão da Biblioteca',  icon: BookOpen },
];

export default function AppLayout() {
  const location = useLocation();
  const [user, setUser]           = useState(null);
  const [member, setMember]       = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const members = await base44.entities.Member.filter({ email: u.email });
      if (members.length > 0) setMember(members[0]);
    }).catch(() => {});
  }, []);

  const isAdmin  = user?.role === 'admin';
  const memberType = member?.member_type || 'participante';
  const visibleNavItems = isAdmin ? NAV_ITEMS : NAV_ITEMS.filter(item => {
    if (!item.memberTypes) return true;
    return item.memberTypes.includes(memberType);
  });
  const allItems = isAdmin ? [...visibleNavItems, ...ADMIN_ITEMS] : visibleNavItems;

  const Logo = ({ compact }) => (
    <div className={cn('flex items-center justify-center', compact ? 'gap-2' : 'flex-col gap-1')}>
      <img
        src={LOGO_SYMBOL}
        alt="ANPPME"
        style={{ filter: 'brightness(0) invert(1)', height: compact ? 28 : 44, objectFit: 'contain' }}
      />
      <img
        src={LOGO_NAME}
        alt="ANPPME"
        style={{ filter: 'brightness(0) invert(1)', height: compact ? 20 : 18, objectFit: 'contain', maxWidth: compact ? 110 : 130 }}
      />
    </div>
  );

  const NavLinks = ({ onClick }) => (
    <>
      {allItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          onClick={onClick}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
            location.pathname === item.path
              ? 'bg-sidebar-accent text-sidebar-primary font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
          )}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          {item.label}
          {location.pathname === item.path && <ChevronRight className="w-3 h-3 ml-auto" />}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border fixed inset-y-0">
        {/* Logo */}
        <div className="py-5 px-4 border-b border-sidebar-border flex flex-col items-center">
          <Logo compact={false} />
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1">
          <GlobalSearch isAdmin={isAdmin} />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t border-sidebar-border">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-primary shrink-0">
                {user.full_name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{user.full_name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</p>
              </div>
              <NotificationBell userEmail={user.email} memberId={member?.id} />
            </div>
          )}
          <Button
            variant="ghost" size="sm"
            className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground text-xs"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 h-14">
          <Logo compact={true} />
          <div className="flex items-center gap-2">
            {user && <NotificationBell userEmail={user.email} memberId={member?.id} />}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="text-sidebar-foreground">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="px-3 pb-3 space-y-1">
            <NavLinks onClick={() => setMobileOpen(false)} />
            <Button
              variant="ghost" size="sm"
              className="w-full justify-start text-sidebar-foreground/60 text-xs mt-2"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="w-3.5 h-3.5 mr-2" /> Sair
            </Button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>

      <WhatsAppButton />
    </div>
  );
}