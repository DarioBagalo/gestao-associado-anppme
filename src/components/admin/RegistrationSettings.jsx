import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings, Save, Loader2, Hash, Bell } from 'lucide-react';

export default function RegistrationSettings() {
  const [settings, setSettings] = useState(null);
  const [startNumber, setStartNumber] = useState('1');
  const [reminderDays, setReminderDays] = useState('30');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const list = await base44.entities.AppSettings.filter({ key: 'registration_config' });
    if (list.length > 0) {
      const s = list[0];
      setSettings(s);
      setStartNumber(String(s.registration_start_number || 1));
      setReminderDays(String(s.renewal_reminder_days || 30));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      key: 'registration_config',
      registration_start_number: parseInt(startNumber) || 1,
      renewal_reminder_days: parseInt(reminderDays) || 30,
    };
    if (settings) {
      await base44.entities.AppSettings.update(settings.id, data);
    } else {
      const created = await base44.entities.AppSettings.create(data);
      setSettings(created);
    }
    toast.success('Configurações salvas!');
    setSaving(false);
  };

  const previewNumber = () => {
    const year = new Date().getFullYear();
    const num = String(parseInt(startNumber) || 1).padStart(4, '0');
    return `${num}/${year}`;
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" />
            Numeração de Registro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Define o número inicial para novos registros. A numeração será sequencial e automática no formato <strong>0000/AAAA</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Número inicial de registro</Label>
              <Input
                type="number"
                min="1"
                value={startNumber}
                onChange={e => setStartNumber(e.target.value)}
                placeholder="1"
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Próximo registro: <strong className="text-primary font-mono">{previewNumber()}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Aviso de Vencimento de Anuidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Quantos dias antes do vencimento o associado deve receber o aviso de renovação?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Dias de antecedência</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={reminderDays}
                onChange={e => setReminderDays(e.target.value)}
                placeholder="30"
              />
              <p className="text-[11px] text-muted-foreground">
                O sistema enviará notificações <strong>{reminderDays} dias</strong> antes do vencimento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}