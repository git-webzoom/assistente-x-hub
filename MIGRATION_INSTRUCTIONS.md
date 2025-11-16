# 🔧 Instruções de Migration - Appointments (COMPLETA)

## ⚠️ EXECUTE ESTE SCRIPT AGORA

Acesse o **SQL Editor** do seu projeto Supabase e execute o arquivo:
**`supabase_fix_appointments_complete.sql`**

Este script faz TUDO de uma vez:

### ✅ O que será corrigido:

1. **Função get_user_tenant**: Cria/atualiza a função segura para buscar tenant
2. **Coluna tenant_id**: Adiciona se não existir
3. **Índice**: Cria índice para performance
4. **Migração de dados**: Popula tenant_id nos registros existentes
5. **Constraint NOT NULL**: Torna tenant_id obrigatório
6. **Políticas RLS**: Remove políticas antigas e cria nova política simplificada
7. **Permissões**: Garante permissões corretas

### 📋 Como executar:

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie TODO o conteúdo de `supabase_fix_appointments_complete.sql`
5. Cole no editor
6. Clique em **Run** (ou pressione Ctrl+Enter)

### ✨ Após executar:

- Agendamentos funcionarão corretamente
- Novos agendamentos terão tenant_id automaticamente
- RLS estará configurado corretamente
- Sem mais erros de "violates row-level security policy"

### 🔍 Verificação (opcional):

Após executar o script principal, você pode executar esta query para verificar:

```sql
SELECT 
  'appointments' as table_name,
  COUNT(*) as total_rows,
  COUNT(tenant_id) as rows_with_tenant,
  COUNT(*) - COUNT(tenant_id) as rows_without_tenant
FROM public.appointments;
```

---

## 🚨 Se o erro persistir:

1. Verifique se você está logado como usuário com tenant associado
2. Execute no SQL Editor para ver seu tenant:
```sql
SELECT public.get_user_tenant(auth.uid());
```

3. Se retornar NULL, você precisa associar seu usuário a um tenant:
```sql
-- Primeiro, veja os tenants disponíveis
SELECT id, name FROM public.tenants;

-- Depois, associe seu usuário (substitua os UUIDs)
UPDATE public.users 
SET tenant_id = 'SEU_TENANT_ID_AQUI' 
WHERE id = auth.uid();
```
