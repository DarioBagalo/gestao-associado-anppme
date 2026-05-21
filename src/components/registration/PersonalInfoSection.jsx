import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Calendar, Phone, Mail, Globe } from 'lucide-react';
import { formatCPF, formatPhone } from '@/lib/formatters';
import { BRAZIL_STATES } from '@/lib/brazilStates';
import DateInput from '@/components/ui/DateInput';

export default function PersonalInfoSection({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Dados Pessoais</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input
            id="full_name"
            value={data.full_name || ''}
            onChange={(e) => handleChange('full_name', e.target.value.toUpperCase())}
            placeholder="Digite seu nome completo"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            value={data.cpf || ''}
            onChange={(e) => handleChange('cpf', formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="birth_date">Data de Nascimento *</Label>
          <DateInput
            value={data.birth_date || ''}
            onChange={(v) => handleChange('birth_date', v || '')}
            placeholder="DD/MM/AAAA"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', formatPhone(e.target.value))}
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            value={data.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nationality">Nacionalidade</Label>
          <Input
            id="nationality"
            value={data.nationality || ''}
            onChange={(e) => handleChange('nationality', e.target.value)}
            placeholder="Brasileira"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="birth_city">Cidade de Nascimento</Label>
          <Input
            id="birth_city"
            value={data.birth_city || ''}
            onChange={(e) => handleChange('birth_city', e.target.value)}
            placeholder="Cidade"
          />
        </div>

        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="birth_state">Estado de Nascimento</Label>
              <Select value={data.birth_state || ''} onValueChange={(v) => handleChange('birth_state', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZIL_STATES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="father_name">Nome do Pai</Label>
          <Input
            id="father_name"
            value={data.father_name || ''}
            onChange={(e) => handleChange('father_name', e.target.value.toUpperCase())}
            placeholder="Nome completo do pai"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mother_name">Nome da Mãe *</Label>
          <Input
            id="mother_name"
            value={data.mother_name || ''}
            onChange={(e) => handleChange('mother_name', e.target.value.toUpperCase())}
            placeholder="Nome completo da mãe"
          />
        </div>
      </div>
    </div>
  );
}