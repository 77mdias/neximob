# ADR-0007: E-mail com o Resend (login e lembretes)

- **Status:** Aceita
- **Data:** 09/11/2026
- **Requisitos:** RF-16, RF-35, RF-40, RF-45, RN-13, RNF-07, RNF-09, RNF-14

## Contexto

- O e-mail é o primeiro canal de cobrança (F3). O WhatsApp vem depois (F4).
- O app envia dois tipos de e-mail:
  - **de login**, disparados pelo Supabase Auth: confirmação da conta, recuperação de acesso e link mágico (RF-40, RF-45);
  - **lembretes de cobrança**, disparados pela etapa de envio da rotina diária (ADR-0005).
- O e-mail embutido do Supabase serve só para testes e permite poucos envios por hora. Em produção, o Supabase Auth precisa de um provedor configurado por SMTP.
- Os e-mails precisam sair de um domínio autenticado (RNF-14), a rotina não pode enviar duas vezes (RN-13) e o contador precisa saber quando um e-mail volta (RF-35).

## Decisão

**O Resend é o provedor de e-mail transacional, para os dois tipos de e-mail.**

| Ponto | Decisão |
|---|---|
| E-mails de login | O Supabase Auth usa o **SMTP do Resend**. **(proposto)** Modelos de e-mail em português, configurados no Supabase |
| Lembretes de cobrança | A Edge Function de envio (ADR-0005) chama a **API do Resend**, com o id do envio no cabeçalho `Idempotency-Key`. O Resend guarda essa chave por 24 horas; depois disso, quem garante que não há duplicata é a chave única da tabela `envios` |
| Domínio de envio | **(proposto)** Um subdomínio próprio só para envio (por exemplo, `mail.` + o domínio do produto), autenticado com SPF, DKIM e DMARC (RNF-14). O DMARC começa em modo de monitoramento e passa a bloquear depois que os envios estiverem estáveis |
| Remetente e resposta | O e-mail sai do domínio da plataforma, com o **nome do contador** no remetente, e a **resposta (Reply-To) vai para o e-mail do contador**. Usar o e-mail do próprio contador como remetente faria a mensagem falhar na autenticação (DMARC) e cair no spam |
| Avisos do Resend | **(proposto)** Recebidos por uma Edge Function do Supabase, que confere a assinatura de cada aviso, ignora avisos repetidos e atualiza o envio: entregue → `entregue`; devolvido → `falhou`; marcado como spam → `falhou` |
| E-mail com problema | **(proposto)** Devolução definitiva ou marcação como spam deixa o e-mail do cliente marcado. Ele para de receber lembretes automáticos até o contador corrigir o endereço (RN-24) |
| Rastreamento | **(proposto)** Rastreamento de abertura e de clique desligado: não é necessário para a régua e reduz a coleta de dados (LGPD) |
| Chaves | Chaves do Resend com permissão só de envio e restritas ao domínio. **(proposto)** Uma chave para o SMTP do Supabase Auth e outra para a Edge Function, para poderem ser trocadas separadamente. Ficam nos segredos do Supabase, nunca no código nem na Cloudflare |

Os registros técnicos (logs) não trazem o texto dos e-mails, só ids e situações (ADR-0003, ADR-0005).

## Por que o Resend

| # | Motivo |
|---|---|
| 1 | **Um provedor só para os dois usos:** SMTP para o Supabase Auth e API para os lembretes |
| 2 | **Integração pronta com o Supabase**, documentada pelos dois lados |
| 3 | **Chave de idempotência por mensagem**, que reforça a regra de não enviar duas vezes |
| 4 | **Avisos de entrega, devolução e spam**, que alimentam o status dos envios e protegem a reputação do domínio |
| 5 | **Configuração simples**, adequada a um projeto pequeno em validação |

## Alternativas consideradas

| Alternativa | Por que não, por enquanto |
|---|---|
| Amazon SES | Mais barato por e-mail em volume alto, mas pede mais configuração e uma conta AWS para manter. Faz sentido revisitar se o volume crescer muito |
| E-mail embutido do Supabase | Só para testes, com poucos envios por hora |
| SMTP de uma caixa de e-mail comum (por exemplo, Google Workspace) | Não é feito para envio automático em volume; limites baixos e risco à reputação da caixa |

## Consequências

**Positivas**
- E-mails de login e lembretes configurados num lugar só, com o mesmo domínio autenticado.
- Status real de entrega para o contador, e não só "enviado".
- Clientes com e-mail problemático param de receber, o que protege a reputação do domínio para todos os contadores.

**Negativas e cuidados**
- **O domínio depende do nome final do produto**, que ainda está em aberto (PRD, seção 12.2). O domínio precisa estar definido e autenticado antes da F3.
- O plano gratuito do Resend tem limite mensal de envios. Para dimensionar o plano pago, a conta é simples: cada cliente recebe até 4 lembretes por mês. Por exemplo, 100 contadores com 50 clientes dão até 20 mil lembretes por mês, mais os e-mails de login. Conferir os preços na hora de contratar.
- Domínio novo começa sem reputação. **(proposto)** Começar com poucos contadores na validação ajuda a aquecer o domínio.
- Dependência de mais um fornecedor. A chamada ao Resend fica isolada na Edge Function de envio, o que facilita uma troca futura (por exemplo, para o Amazon SES).
