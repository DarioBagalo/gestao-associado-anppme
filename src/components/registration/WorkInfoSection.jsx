import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase } from 'lucide-react';
import { formatPhone } from '@/lib/formatters';

export default function WorkInfoSection({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-secondary-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">Dados Profissionais</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="workplace_name">Nome do Local de Trabalho *</Label>
          <Input
            id="workplace_name"
            value={data.workplace_name || ''}
            onChange={(e) => handleChange('workplace_name', e.target.value)}
            placeholder="Nome do órgão ou empresa"
          />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="workplace_address">Endereço do Local de Trabalho</Label>
          <Textarea
            id="workplace_address"
            value={data.workplace_address || ''}
            onChange={(e) => handleChange('workplace_address', e.target.value)}
            placeholder="Endereço completo (rua, número, bairro, cidade, estado, CEP)"
            className="h-20 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="workplace_phone">Telefone para Contato</Label>
          <Input
            id="workplace_phone"
            value={data.workplace_phone || ''}
            onChange={(e) => handleChange('workplace_phone', formatPhone(e.target.value))}
            placeholder="(00) 0000-0000"
            maxLength={15}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="workplace_email">E-mail Profissional</Label>
          <Input
            id="workplace_email"
            type="email"
            value={data.workplace_email || ''}
            onChange={(e) => handleChange('workplace_email', e.target.value)}
            placeholder="email@orgao.gov.br"
          />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="workplace_function">Função / Cargo *</Label>
          <Input
            id="workplace_function"
            value={data.workplace_function || ''}
            onChange={(e) => handleChange('workplace_function', e.target.value)}
            placeholder="Ex: Pregoeiro, Agente de Contratação"
          />
        </div>
      </div>
    </div>
  );
}