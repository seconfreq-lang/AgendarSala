# Portal de Agendamento de Salas

Sistema completo de agendamento para as salas **Machado**, **Franca** e **Santos** com interface intuitiva e validações robustas.

## 🚀 Funcionalidades

- ✅ **Agendamento de Salas**: Interface visual com grid de horários
- ✅ **Validação Completa**: Horário comercial, conflitos, datas passadas
- ✅ **Gestão de Reservas**: Editar, cancelar e visualizar agendamentos
- ✅ **Timezone Seguro**: America/Sao_Paulo em toda aplicação
- ✅ **Interface Responsiva**: Funciona em desktop e mobile
- ✅ **Feedback Visual**: Toasts de sucesso/erro

## 🛠️ Tecnologias

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Backend**: Next.js API Routes
- **Database**: SQLite + Prisma ORM
- **Validação**: Zod
- **Formulários**: React Hook Form
- **Datas**: date-fns + date-fns-tz

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn

## 🚦 Como Rodar

### 1. Clone e instale dependências

```bash
git clone <repository-url>
cd portal-agendamento
npm install
```

### 2. Configure banco de dados

```bash
# Gerar tabelas
npx prisma migrate dev

# Popular com dados de exemplo
npm run db:seed
```

### 3. Inicie o servidor

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/bookings/         # API routes (GET, POST, PATCH, DELETE)
│   ├── globals.css           # Estilos globais
│   ├── layout.tsx           # Layout da aplicação
│   └── page.tsx             # Página principal
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── booking-form.tsx     # Formulário de agendamento
│   ├── booking-list.tsx     # Lista de agendamentos
│   ├── booking-portal.tsx   # Componente principal
│   └── time-grid.tsx        # Grid de horários
├── lib/
│   ├── db.ts               # Configuração Prisma
│   ├── timezone.ts         # Utilitários de timezone
│   └── validation.ts       # Schemas de validação
prisma/
├── schema.prisma           # Schema do banco
└── seed.ts                 # Dados de exemplo
```

## ⚙️ Configurações

### Horário Comercial

Para alterar o horário de funcionamento, edite em `src/lib/timezone.ts`:

```typescript
export function isTimeInBusinessHours(timeStr: string): boolean {
  const { hours, minutes } = parseTimeString(timeStr)
  const totalMinutes = hours * 60 + minutes
  
  const businessStart = 8 * 60  // Mude aqui: 08:00
  const businessEnd = 22 * 60   // Mude aqui: 22:00
  
  return totalMinutes >= businessStart && totalMinutes <= businessEnd
}
```

### Intervalo dos Slots

Para mudar o intervalo de 30 minutos, edite:

```typescript
export function generateTimeSlots(): string[] {
  const slots = []
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) { // Mude aqui
      // ...
    }
  }
  return slots
}
```

### Variáveis de Ambiente

Crie `.env` se necessário:

```bash
# Database
DATABASE_URL="file:./dev.db"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📊 API Endpoints

### GET `/api/bookings`
Lista agendamentos por período
```bash
GET /api/bookings?from=2025-01-01&to=2025-01-31
```

### POST `/api/bookings`
Cria novo agendamento
```json
{
  "name": "João Silva",
  "room": "MACHADO",
  "date": "2025-01-15T00:00:00.000Z",
  "startTime": "14:00",
  "endTime": "15:30"
}
```

### PATCH `/api/bookings/[id]`
Edita agendamento existente

### DELETE `/api/bookings/[id]`
Remove agendamento

## 🎯 Regras de Negócio

### Validações Implementadas

1. **Nome**: Mínimo 2 caracteres
2. **Horário**: Entre 08:00 - 22:00
3. **Intervalo**: Início < Fim, mesmo dia
4. **Slots**: Apenas :00 e :30 minutos
5. **Conflitos**: Não permite sobreposição na mesma sala
6. **Datas**: Não permite agendamento no passado

### Fuso Horário

- Toda lógica usa **America/Sao_Paulo**
- Datas armazenadas em UTC no banco
- Interface sempre exibe horário local

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm start

# Database
npx prisma studio          # Interface visual do banco
npx prisma migrate dev     # Nova migration
npm run db:seed           # Popular dados exemplo

# Linting
npm run lint
```

## 📱 Interface

### Tela Principal
- **Abas por Sala**: Machado, Franca, Santos
- **Navegação de Data**: Setas ← → e botão "Hoje"
- **Grid de Horários**: 08:00-22:00 em slots de 30min
- **Slots Livres**: Hover mostra botão "+" para agendar
- **Slots Ocupados**: Card com nome e horário

### Formulário
- **Validação em Tempo Real**: Erro highlighted nos campos
- **Pré-preenchimento**: Quando clica em slot livre
- **Modo Edição**: Carrega dados existentes

### Lista de Agendamentos
- **Tabela Responsiva**: Nome, Sala, Data, Horário
- **Ações**: Editar ✏️ e Cancelar 🗑️
- **Confirmação**: Dialog antes de cancelar

## 🐛 Resolução de Problemas

### Erro de Database
```bash
npx prisma db push
npx prisma generate
```

### Erro de Timezone
Verifique se `date-fns-tz` está instalado:
```bash
npm install date-fns-tz
```

### Porta em Uso
```bash
# Use outra porta
npm run dev -- -p 3001
```

## 📄 Licença

MIT License - veja `LICENSE` para detalhes.

---

**Portal de Agendamento v1.0**  
*Desenvolvido com ❤️ usando Next.js + Prisma*
