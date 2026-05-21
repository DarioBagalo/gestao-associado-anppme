import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Paperclip, MessageCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function MemberChat({ member, user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [member?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!member?.id) return;
    const msgs = await base44.entities.ChatMessage.filter({ member_id: member.id }, 'created_date', 200);
    setMessages(msgs);
    // mark unread messages as read by member
    const unread = msgs.filter(m => !m.read_by_member && m.sender_role === 'admin');
    for (const m of unread) {
      await base44.entities.ChatMessage.update(m.id, { read_by_member: true });
    }
    setLoading(false);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    await base44.entities.ChatMessage.create({
      member_id: member.id,
      member_name: member.full_name,
      member_email: member.email,
      sender_role: 'member',
      sender_name: user?.full_name || member.full_name,
      message: trimmed,
      read_by_admin: false,
      read_by_member: true,
    });
    setText('');
    await loadMessages();
    setSending(false);
  };

  const handleAttach = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ChatMessage.create({
      member_id: member.id,
      member_name: member.full_name,
      member_email: member.email,
      sender_role: 'member',
      sender_name: user?.full_name || member.full_name,
      message: `📎 Documento anexado: ${file.name}`,
      attachment_url: file_url,
      attachment_name: file.name,
      read_by_admin: false,
      read_by_member: true,
    });
    await loadMessages();
    setUploading(false);
    e.target.value = '';
  };

  if (!member) return null;

  return (
    <div className="flex flex-col h-[520px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20 rounded-t-lg">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs mt-1">Envie uma mensagem para a equipe ANPPME.</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_role === 'member';
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-white border shadow-sm'}`}>
                  {!isMe && (
                    <p className="text-[10px] font-semibold text-primary mb-1">{msg.sender_name || 'ANPPME'}</p>
                  )}
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  {msg.attachment_url && (
                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                      className={`mt-1 text-xs flex items-center gap-1 underline ${isMe ? 'text-primary-foreground/80' : 'text-primary'}`}>
                      <Paperclip className="w-3 h-3" />{msg.attachment_name || 'Ver anexo'}
                    </a>
                  )}
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {msg.created_date && format(new Date(msg.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex items-center gap-2 bg-white rounded-b-lg">
        <input type="file" ref={fileRef} className="hidden" onChange={handleAttach} />
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4 text-muted-foreground" />}
        </Button>
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Escreva sua mensagem..."
          className="flex-1 text-sm h-9"
        />
        <Button size="sm" className="h-9 px-3" onClick={handleSend} disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}