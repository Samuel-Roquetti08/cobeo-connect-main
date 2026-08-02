# Guia de Diagnóstico — Banco de Dados do COBEO Connect

Referência pra quando o Fabiano (ou qualquer um) reportar um problema e você
precisar descobrir sozinho o que aconteceu, sem depender de mim. Todas as
consultas aqui são **`select` — só leitura, não alteram nada**. Pode rodar
qualquer uma delas sem medo.

## Onde rodar

Painel do Supabase → **SQL Editor** → cola a consulta → `Run` (ou `Ctrl+Enter`).
Sempre confirme que está no projeto certo (canto superior esquerdo:
`cobeo-connect-main` / `PRODUCTION`).

## Regra de ouro

- **`select` é sempre seguro.** Pode rodar à vontade pra investigar.
- **`update`/`delete` só depois de ver o resultado do `select` equivalente
  primeiro**, e só se você tiver certeza do `where`. Um `update`/`delete`
  sem `where` (ou com `where` errado) mexe na tabela inteira.
- Na dúvida, cola a consulta e o resultado aqui no chat que eu leio junto
  com você antes de decidir o próximo passo.

---

## 1. Mapa do banco — o que cada tabela guarda

Tudo gira em torno de **`pedidos`** — é o "pedido" de compra (inscrição
e/ou trabalho). Praticamente toda tabela tem uma coluna `pedido_id` que
aponta pra ela.

| Tabela | O que guarda | Como se liga |
|---|---|---|
| **`pedidos`** | 1 linha por compra: dados do comprador, valores, status do pagamento, referência do Mercado Pago | é o centro — tudo referencia `pedidos.id` |
| **`inscritos`** | Dados da inscrição no evento (código `COBEO-XXXX`, presença geral) | `pedido_id` → 1 por pedido com inscrição |
| **`pedido_cursos`** | Quais cursos foram comprados em cada pedido | `pedido_id` → N por pedido |
| **`presencas`** | Check-in por curso individual | `inscrito_id` → N por inscrito |
| **`trabalhos`** | Submissão de trabalho acadêmico | `pedido_id` → 1 por pedido com trabalho |
| **`trabalho_arquivos`** | Arquivos anexados ao trabalho (pode ter mais de 1) | `trabalho_id` → N por trabalho |
| **`coautores`** | Coautores do trabalho | `trabalho_id` → N por trabalho |
| **`cupons`** | Cupons de desconto | `pedido_id` fica preenchido só quando o cupom é usado |
| **`webhook_logs`** | Toda notificação que o Mercado Pago mandou pro nosso webhook (payload bruto) | `reference_id` = `pedidos.mp_reference_id` (não é FK de verdade, é texto — comparar manualmente) |
| **`admin_logs`** | Ações que um admin fez no painel (deletar cupom, bloquear inscrição, etc.) | `entidade_id` = id do que foi afetado |
| **`configuracoes_evento`** | 1 linha só — liga/desliga inscrições e jantar | sem FK, é global |
| **`admins`** | Quem tem login no painel | ligado ao login (Supabase Auth) |

**Colunas importantes de `pedidos` pra diagnóstico:**
- `status`: `pendente` / `pago` / `cancelado` / `reembolsado` / `expirado`
- `mp_reference_id`: o "protocolo" que a gente gerou (formato `COBEO-EVT-XXXXXXXX`, `COBEO-TRB-...` ou `COBEO-CMB-...`) — é o que liga o pedido ao Mercado Pago e ao `webhook_logs`
- `mp_payment_id`: o ID do pagamento **no lado do Mercado Pago** (só preenche quando aprova)
- `valor_total`: calculado automaticamente pelo banco, não dá pra estar errado por bug de código

---

## 2. Cenários comuns — cole, troque o e-mail/dado e rode

### "Fulano diz que pagou mas o pedido está pendente"

```sql
select
  p.id as pedido_id, p.nome, p.email, p.status, p.mp_reference_id,
  p.valor_total, p.created_at as pedido_criado_em,
  wl.payload->>'status' as mp_status,
  wl.payload->>'status_detail' as mp_status_detail,
  wl.created_at as webhook_recebido_em
from pedidos p
left join webhook_logs wl on wl.reference_id = p.mp_reference_id
where p.email = 'TROQUE_PELO_EMAIL@exemplo.com'
order by p.created_at desc, wl.created_at desc;
```

**Como ler:**
- `mp_status`/`webhook_recebido_em` vazios (NULL) → o Mercado Pago nunca
  notificou esse pedido. Normalmente é porque a pessoa foi barrada ainda na
  tela do MP (cartão inválido) e nunca virou um pagamento de verdade, ou
  desistiu no meio do checkout. Não é bug do site.
- `mp_status = 'approved'` mas `p.status` continua `pendente` → **isso sim é
  bug real**, o Mercado Pago aprovou e a gente não processou. Me chama com
  esse resultado antes de fazer qualquer coisa.
- `mp_status` = `rejected`/`cancelled` → cartão recusado de verdade pelo
  banco emissor, `status_detail` traz o motivo específico.

### "Todos os pendentes dos últimos dias" (visão geral, sem e-mail específico)

```sql
select nome, email, status, mp_reference_id, valor_total, created_at
from pedidos
where status = 'pendente'
order by created_at desc
limit 50;
```

### "Cupom X não está funcionando / diz que já foi usado"

```sql
select codigo, titular, categoria, tipo, valor, status, usado_em, pedido_id, created_at
from cupons
where codigo = 'TROQUE_PELO_CODIGO';
```

`status = 'utilizado'` com `pedido_id` preenchido → já foi consumido por
esse pedido específico (dá pra cruzar com a consulta de pedidos acima pra
ver quem usou).

### "Check-in não registrou presença pro Fulano"

```sql
select
  i.codigo_inscricao, i.presenca, i.primeiro_checkin_em,
  pc.curso_ref, pc.curso_titulo,
  pr.confirmado_em, pr.confirmado_por
from inscritos i
join pedidos p on p.id = i.pedido_id
left join pedido_cursos pc on pc.pedido_id = p.id
left join presencas pr on pr.inscrito_id = i.id and pr.curso_ref = pc.curso_ref
where p.email = 'TROQUE_PELO_EMAIL@exemplo.com';
```

Cada curso comprado (`pedido_cursos`) que não tem uma linha correspondente
em `presencas` significa que o check-in daquele curso específico não foi
feito.

### "O trabalho do Fulano não aparece / arquivo sumiu"

```sql
select
  t.titulo, t.categoria, t.modalidade, t.formato, t.created_at,
  ta.arquivo_nome, ta.arquivo_path
from trabalhos t
join pedidos p on p.id = t.pedido_id
left join trabalho_arquivos ta on ta.trabalho_id = t.id
where p.email = 'TROQUE_PELO_EMAIL@exemplo.com';
```

Se `arquivo_path` aparecer mas o admin não conseguir baixar, o arquivo em
si está no **Storage** (aba separada do SQL Editor no Supabase, bucket
`trabalhos-pdfs`), não no banco — o banco só guarda o caminho, não o
arquivo. Confira lá se o arquivo realmente existe nesse caminho.

### "O que um admin fez recentemente" (quem mudou o quê)

```sql
select admin_email, acao, entidade, entidade_id, detalhes, criado_em
from admin_logs
order by criado_em desc
limit 30;
```

### "As inscrições/jantar estão bloqueados? Algum curso individual está bloqueado?"

```sql
select * from configuracoes_evento;
```

(Só 1 linha sempre. `cursos_bloqueados` é uma lista dos `curso_ref`
bloqueados individualmente.)

---

## 3. O que NÃO está no banco (não adianta procurar aqui)

- **Erro de tela / botão que não funciona / página em branco**: isso é
  código rodando no navegador da pessoa, não fica registrado em lugar
  nenhum do banco. Peça um print da tela e, se possível, que a pessoa abra
  o Console do navegador (F12 → aba Console) e mande o que aparecer em
  vermelho.
- **E-mail não chegou**: o banco só mostra se a gente *tentou* processar o
  pagamento (`webhook_logs`), não se o Resend conseguiu entregar de fato.
  Pra isso, o painel do Resend (resend.com → Emails) mostra o status real
  de entrega de cada envio.
- **Site fora do ar / build quebrado**: isso é infraestrutura (Cloudflare
  Workers), não banco de dados — os logs ficam no painel do Cloudflare.

---

## 4. Truques úteis de SQL pra guardar

- `where email = 'x'` → busca exata. Se não souber o e-mail certinho, use
  `where email ilike '%parte-do-nome%'` (`ilike` ignora maiúscula/minúscula
  e o `%` é "qualquer coisa antes/depois").
- `order by created_at desc` → mais recente primeiro (quase sempre o que
  você quer).
- `limit 50` → nunca esqueça em consultas sem filtro específico, senão
  pode trazer milhares de linhas.
- `payload->>'campo'` → é assim que se lê um campo de dentro do JSON bruto
  guardado em `webhook_logs.payload` (a resposta completa que o Mercado
  Pago manda tem dezenas de campos; `status` e `status_detail` são os mais
  úteis pra diagnóstico).
