import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Paperclip, MessageCircle, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminChat({ adminUser }) {
  const [conversations, setConversations] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedMember) loadMessages(selectedMember.member_id);
  }, [selectedMember]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    const all = await base44.entities.ChatMessage.list('-created_date', 500);
    // Group by member_id, last message
    const map = {};
    for (const msg of all) {
      if (!map[msg.member_id]) {
        map[msg.member_id] = { ...msg, unread: 0 };
      }
      if (!msg.read_by_admin && msg.sender_role === 'member') {
        map[msg.member_id].unread = (map[msg.member_id].unread || 0) + 1;
      }
    }
    setConversations(Object.values(map).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  };

  const loadMessages = async (memberId) => {
    const msgs = await base44.entities.ChatMessage.filter({ member_id: memberId }, 'created_date', 200);
    setMessages(msgs);
    // Mark as read by admin
    const unread = msgs.filter(m => !m.read_by_admin && m.sender_role === 'member');
    for (const m of unread) {
      await base44.entities.ChatMessage.update(m.id, { read_by_admin: true });
    }
    // refresh conversations
    loadConversations();
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedMember) return;
    setSending(true);
    await base44.entities.ChatMessage.create({
      member_id: selectedMember.member_id,
      member_name: selectedMember.member_name,
      member_email: selectedMember.member_email,
      sender_role: 'admin',
      sender_name: adminUser?.full_name || 'ANPPME',
      message: trimmed,
      read_by_admin: true,
      read_by_member: false,
    });
    // Create notification for member
    await base44.entities.Notification.create({
      member_id: selectedMember.member_id,
      user_email: selectedMember.member_email,
      type: 'general',
      title: 'Nova mensagem da ANPPME',
      message: trimmed.length > 80 ? trimmed.slice(0, 80) + '...' : trimmed,
      read: false,
    });
    setText('');
    await loadMessages(selectedMember.member_id);
    setSending(false);
  };

  const handleAttach = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedMember) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ChatMessage.create({
      member_id: selectedMember.member_id,
      member_name: selectedMember.member_name,
      member_email: selectedMember.member_email,
      sender_role: 'admin',
      sender_name: adminUser?.full_name || 'ANPPME',
      message: `📎 Documento enviado: ${file.name}`,
      attachment_url: file_url,
      attachment_name: file.name,
      read_by_admin: true,
      read_by_member: false,
    });
    await loadMessages(selectedMember.member_id);
    e.target.value = '';
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex h-[620px] border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Sidebar */}
      <div className="w-72 border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <p className="font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Conversas</p>
          <p className="text-xs text-muted-foreground mt-0.5">{conversations.length} associado(s)</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Nenhuma conversa ainda.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.member_id}
                onClick={() => setSelectedMember(conv)}
                className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${selectedMember?.member_id === conv.member_id ? 'bg-primary/5 border-r-2 border-primary' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {conv.member_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{conv.member_name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{conv.message}</p>
                  </div>
                  {conv.unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 h-4 shrink-0">{conv.unread}</Badge>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      {selectedMember ? (
        <div className="flex flex-col flex-1">
          <div className="px-5 py-3 border-b bg-muted/20 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {selectedMember.member_name?.[0]}
            </div>
            <div>
              <p className="text-sm font-semibold">{selectedMember.member_name}</p>
              <p className="text-xs text-muted-foreground">{selectedMember.member_email}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
            {messages.map(msg => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isAdmin ? 'bg-primary text-primary-foreground' : 'bg-white border shadow-sm'}`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    {msg.attachment_url && (
                      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"
                        className={`mt-1 text-xs flex items-center gap-1 underline ${isAdmin ? 'text-primary-foreground/80' : 'text-primary'}`}>
                        <Paperclip className="w-3 h-3" />{msg.attachment_name || 'Ver anexo'}
                      </a>
                    )}
                    <p className={`text-[10px] mt-1 ${isAdmin ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {msg.created_date && format(new Date(msg.created_date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
          <div className="border-t p-3 flex items-center gap-2 bg-white">
            <input type="file" ref={fileRef} className="hidden" onChange={handleAttach} />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => fileRef.current?.click()}>
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Responder..."
              className="flex-1 text-sm h-9"
            />
            <Button size="sm" className="h-9 px-3" onClick={handleSend} disabled={sending || !text.trim()}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Selecione uma conversa</p>
          </div>
        </div>
      )}
    </div>
  );
}