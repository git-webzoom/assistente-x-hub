# INSTRUÇÕES PARA ATIVAR A API

## Passo 1: Executar a Migration SQL

**IMPORTANTE**: Você precisa executar a migration SQL no Supabase para criar as tabelas necessárias.

### Como executar:

1. Acesse o **Supabase Dashboard**: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor** (no menu lateral esquerdo)
4. Clique em **New Query**
5. Copie TODO o conteúdo do arquivo `supabase_migration_api_system.sql`
6. Cole no editor SQL
7. Clique em **RUN** para executar

### O que será criado:

- ✅ Tabela `api_keys` - Para armazenar chaves de API
- ✅ Tabela `webhooks` - Para webhooks
- ✅ Tabela `webhook_logs` - Para logs de webhooks
- ✅ Tabela `api_logs` - Para logs de requisições da API
- ✅ Índices otimizados para performance
- ✅ RLS Policies para segurança
- ✅ Triggers e Functions auxiliares

## Passo 2: Verificar Edge Functions

As edge functions foram criadas automaticamente em:
- `supabase/functions/api-v1/index.ts` - API principal
- `supabase/functions/generate-api-key/index.ts` - Gerador de chaves
- `supabase/functions/verify-api-key/index.ts` - Verificador de chaves

Elas serão deployadas automaticamente quando você fizer o deploy do projeto.

## Passo 3: Testar

Após executar a migration:
1. Acesse **Configurações > Chaves API**
2. Clique em **Nova Chave**
3. Preencha o nome e clique em **Criar Chave**
4. A chave será gerada e você poderá copiá-la

## Problemas Comuns

### Erro: "Table api_keys not found"
→ Execute a migration SQL conforme Passo 1

### Erro: "generate-api-key function not found"
→ As edge functions são deployadas automaticamente. Aguarde alguns minutos após o deploy.

### Erro ao gerar chave
→ Verifique se a tabela `tenants` existe e se seu usuário tem um `tenant_id` válido

## Estrutura da API

Após configurar, você terá acesso a:

- **GET /v1/contacts** - Listar contatos
- **GET /v1/products** - Listar produtos  
- **GET /v1/appointments** - Listar compromissos
- **GET /v1/tasks** - Listar tarefas
- **GET /v1/cards** - Listar cards
- **GET /v1/pipelines** - Listar pipelines

Todos os endpoints suportam:
- Paginação com cursor
- Filtros por campos (incluindo custom_fields)
- Sorting
- Includes (relacionamentos)

## Documentação Completa

Acesse a documentação completa da API em:
- **No dashboard**: Menu > Documentação da API
- **Rota**: `/dashboard/api-docs`
