import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { getStatusLabel, getStatusColor } from '@/lib/formatters';
import { format } from 'date-fns';

export default function MemberAdminRow({ member, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
          {member.full_name?.[0] || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{member.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {member.cpf} · {member.email}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge className={getStatusColor(member.status) + " border text-[10px]"}>
          {getStatusLabel(member.status)}
        </Badge>
        <span className="text-[10px] text-muted-foreground hidden md:block">
          {member.created_date && format(new Date(member.created_date), 'dd/MM/yyyy')}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
}