# ADR-0002: WhatsApp com modelos fixos aprovados; texto livre só no e-mail

- **Status:** Aceita (decisão delegada à recomendação técnica em 07/11/2026; pode ser revista na F4)
- **Data:** 07/11/2026
- **Requisitos:** RF-16, RF-31, RF-32, RNF-04, Q-04

## Contexto

- No protótipo, o contador edita livremente o texto de cada passo da régua (RF-31), usando os campos `{nome}`, `{mes}`, `{valor}`, `{venc}` e `{pix}` (RF-32).
- O Briefing exige o WhatsApp só pela API oficial, com modelos de mensagem aprovados, porque o disparo automático por número comum pode bloquear o número (RNF-04).
- Na API oficial do WhatsApp:
  - uma mensagem que a empresa inicia, fora da janela de 24 horas depois da última mensagem do cliente, só pode ser enviada a partir de um **modelo aprovado pela Meta**. Um lembrete de cobrança é sempre esse caso;
  - cada modelo novo ou editado **passa por análise** da Meta antes de poder ser usado;
  - cada modelo tem uma **categoria** (utilidade, marketing, autenticação). Lembrete de pagamento é utilidade, que custa menos que marketing. Um texto com cara de promoção pode ser reclassificado como marketing;
  - o número tem uma **classificação de qualidade**. Bloqueios e denúncias de quem recebe derrubam a qualidade e podem limitar o envio.

## Decisão

1. **E-mail:** o texto de cada passo continua **livre e editável** pelo contador, como no protótipo.
2. **WhatsApp:** a plataforma escreve, submete e mantém **um modelo fixo por passo** (3 dias antes, no dia, 3 dias depois, 7 dias depois), mais **um modelo de pendência** para cobranças de meses anteriores (RN-18), todos na categoria utilidade.
3. Os campos da mensagem (RN-11) viram **as variáveis do modelo**. O contador continua ligando e desligando cada passo, mas não edita o texto do WhatsApp.
4. A aba Régua de cobrança mostra a **prévia do WhatsApp sem edição**, com uma frase curta explicando que o texto segue um modelo aprovado pelo WhatsApp.
5. **(proposto)** Se a validação mostrar que os contadores querem outro tom, a plataforma aprova duas variações por passo (por exemplo, formal e mais próxima), e o contador escolhe entre elas.

## Por que esta decisão

| # | Motivo |
|---|---|
| 1 | **É obrigatório.** Sem modelo aprovado, o lembrete do WhatsApp simplesmente não sai |
| 2 | **Texto livre viraria um modelo novo a cada edição.** Cada mudança do contador iria para análise da Meta, sem prazo garantido. O lembrete do dia poderia não sair, e um texto rejeitado deixaria o passo sem mensagem |
| 3 | **Protege o número contra bloqueio**, que é o risco citado no Briefing. Textos revisados uma vez pela plataforma, claros e sem tom de promoção, recebem menos denúncias do que textos escritos por cada contador sem revisão |
| 4 | **Custo menor e previsível.** Textos revisados ficam na categoria utilidade e não correm o risco de ser reclassificados como marketing |
| 5 | **Produto mais simples.** O contador não precisa entender as regras da Meta, o que combina com a proposta de app leve |
| 6 | **A personalização continua onde é barata.** O e-mail não tem essas restrições, então o texto livre fica lá |

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Texto livre também no WhatsApp, com cada edição submetida como modelo do contador | Atraso e risco de rejeição a cada edição; risco de reclassificação para marketing; mais denúncias e risco ao número; operação complexa (acompanhar a aprovação de cada contador) |
| Sem WhatsApp, só e-mail | Perde o canal que o cliente do contador mais usa, e o Briefing prevê o WhatsApp na F4 |
| Enviar por número comum, sem a API oficial | Proibido pelo Briefing (RNF-04): pode bloquear o número |

## Consequências

**Positivas**
- Lembretes de WhatsApp confiáveis desde o primeiro dia da F4.
- Menor risco de bloqueio e custo previsível.
- A régua continua configurável: ligar, desligar e editar o e-mail.

**Negativas e cuidados**
- Menos personalização no WhatsApp. Mitigação: variáveis com o nome do cliente e, se a validação pedir, variações de tom.
- O RF-31 (editar o texto) passa a valer só para o e-mail.
- Mudar um texto do WhatsApp exige uma nova versão do modelo, aprovada pela Meta. Isso vira um processo da plataforma, e não uma ação do contador.
- O bloco de pendências (RN-19) precisa caber numa variável do modelo, em uma linha, por exemplo: "Também está em aberto: outubro (R$ 300,00). Total: R$ 600,00".
- Ainda falta decidir de qual número as mensagens saem: o de cada contador ou um número único da plataforma (Q-16). Isso define quem é o dono dos modelos e é discutido junto com o provedor de WhatsApp, antes da F4.
