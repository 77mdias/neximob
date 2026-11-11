# Mapa de fluxo: Agenda Contábil

**Telas e caminhos do usuário**

| | |
|---|---|
| **Produto** | Agenda Contábil (nome de trabalho) |
| **Repositório** | `neximob` |
| **Versão** | 1.5, rascunho para validação |
| **Data** | 11/11/2026 |
| **Fontes** | *Agenda Contábil: Documentação do Produto* (seção 3, User Flow) e *Agenda Contábil: Briefing para desenvolvimento*, ambos de 03/11/2026 |
| **Documentos relacionados** | [PRD](./PRD.md) · [SRS](./SRS.md) · [Arquitetura](./Arquitetura.md) · [Decisões de arquitetura (ADR)](./adr/README.md) |

**Legenda**

| Marcação | Significado |
|---|---|
| **Atual** | Já existe no protótipo |
| **Versão final** | Previsto nas fontes, ainda a construir |
| **(proposto)** | Acrescentado por este documento; precisa ser validado |

Os códigos `RF`, `RN`, `RNF` e `Q` se referem ao [SRS](./SRS.md).

---

## 1. Mapa de telas

O app é **uma tela só**: o resumo do mês no topo e três abas. As ações secundárias abrem janelas sobre essa tela.

```mermaid
flowchart TD
    LOGIN["Login e criação de conta<br/>versão final"] --> TOPO

    subgraph TELA["Tela única"]
        TOPO["Topo<br/>mês de referência e + Novo cliente"]
        RESUMO["Resumo do mês<br/>Recebido, A receber, Clientes em atraso, Guias a fazer"]
        COB["Aba Cobranças"]
        OBR["Aba Obrigações"]
        REG["Aba Régua de cobrança"]
        TOPO --> RESUMO
        RESUMO --> COB
        RESUMO --> OBR
        RESUMO --> REG
    end

    TOPO -.-> NOVO["Novo cliente"]
    TOPO -.-> CONTA["Conta e assinatura<br/>versão final"]
    COB -.-> COBRAR["Cobrar<br/>mensagem pronta"]
    COB -.-> AJUSTE["Ajustar valor do mês"]
    COB -.-> EDITAR["Editar ou excluir cliente<br/>versão final"]
    COB -.-> ENVIOS["Envios da cobrança<br/>versão final"]
    OBR -.-> CAL["Calendário fiscal<br/>versão final"]
```

| Parte da tela | O que tem | Situação | Requisitos |
|---|---|---|---|
| Topo | Mês de referência e botão **+ Novo cliente** | Atual. Na versão final, o mês de referência permite ver meses anteriores | RF-01, RF-18 |
| Resumo do mês | Recebido (com barra de %), a receber, clientes em atraso, guias a fazer | Atual | RF-03 |
| Aba Cobranças | Lista de clientes, filtros, cobrar, marcar pago, ajustar valor | Atual, com envio simulado | RF-10 a RF-18 |
| Aba Obrigações | Checklist do mês e próximos prazos do ano | Atual, com datas de exemplo | RF-20 a RF-24 |
| Aba Régua de cobrança | Chave Pix, 4 lembretes editáveis e prévia | Atual, sem disparo real | RF-30 a RF-33 |
| Login e conta | Criar conta, entrar, perfil, termos, assinatura | Versão final | RF-40 a RF-45, RF-50 |
| Calendário fiscal | Cadastrar e corrigir obrigações e datas | Versão final | RF-23 |

No celular, as listas viram cartões (RNF-01). A tela tem tema claro e escuro (RNF-02).

---

## 2. Primeiro acesso (versão final)

A ordem das etapas é **(proposto)**. As fontes pedem que, na primeira vez, o contador cadastre os clientes e ajuste a régua e a chave Pix.

```mermaid
flowchart TD
    A["Criar conta com e-mail"] --> B["Confirmar e-mail"]
    B --> C["Aceitar termos de uso<br/>e política de privacidade"]
    C --> D["Informar nome e chave Pix"]
    D --> E["Régua padrão criada<br/>3 dias antes, no dia e 3 dias depois ligados<br/>7 dias depois desligado"]
    E --> F["Calendário fiscal padrão<br/>copiado da plataforma"]
    F --> G["Cadastrar os primeiros clientes"]
    G --> H["Tela única com o resumo do mês"]
    E -. "opcional" .-> R["Revisar os textos da régua"]
    R -.-> G
```

**Requisitos:** RF-40, RF-42, RF-43, RF-30, RF-20, RF-01.

---

## 3. Rotina mensal do contador

Este é o uso esperado ao longo do mês, segundo a Documentação do Produto:

1. Cadastrar os clientes uma vez, com honorário e dia de vencimento.
2. Ajustar a régua e a chave Pix na primeira vez.
3. Ao longo do mês, abrir **Cobranças** e marcar quem pagou.
4. Lançar os serviços extras do mês em **Ajustar valor do mês**.
5. Em **Obrigações**, marcar cada guia feita, por cliente, até o dia 20.

```mermaid
flowchart LR
    S1["1. Cadastrar clientes<br/>uma vez"] --> S2["2. Ajustar régua e Pix<br/>primeira vez"]
    S2 --> S3["3. Cobranças<br/>marcar quem pagou"]
    S3 --> S4["4. Ajustar valor do mês<br/>serviços extras"]
    S4 --> S5["5. Obrigações<br/>marcar guias até o dia 20"]
    S5 -. "mês seguinte" .-> S3
```

Na versão final, o passo 3 fica menor: os lembretes saem sozinhos (RF-34) e o Pix dá a baixa (RF-17). O contador só marca à mão quem pagou por outro meio.

---

## 4. Ciclo mensal de cobrança

A régua cobra até o cliente pagar e recomeça no mês seguinte. Depois de cada lembrete, o app confere de novo se o cliente pagou. No protótipo, o envio e a baixa são manuais; na versão final, os lembretes saem sozinhos e o Pix dá a baixa.

```mermaid
flowchart TD
    A["Cadastrar cliente<br/>honorário e vencimento"] --> B["Cobrança do mês<br/>honorário + extra do mês"]
    B --> C["Lembrete 3 dias antes<br/>mensagem com a chave Pix"]
    C --> P1{"Pagou?"}
    P1 -- "sim" --> PAGO["Marcado como pago<br/>à mão hoje, Pix no futuro"]
    P1 -- "não" --> D["Lembrete no dia"]
    D --> P2{"Pagou?"}
    P2 -- "sim" --> PAGO
    P2 -- "não" --> E["3 dias depois<br/>pede o comprovante"]
    E --> P3{"Pagou?"}
    P3 -- "sim" --> PAGO
    P3 -- "não" --> F["7 dias depois<br/>desligado por padrão"]
    F --> P4{"Pagou?"}
    P4 -- "sim" --> PAGO
    P4 -- "não" --> G["Pendência<br/>segue Atrasado há N dias"]
    G -- "entra nos lembretes do mês seguinte" --> B
    PAGO -- "mês seguinte" --> B
```

| Passo | Quando | Padrão | Mensagem |
|---|---|---|---|
| 3 dias antes | Vencimento − 3 dias | Ligado | Lembrete com a chave Pix |
| No dia | Dia do vencimento | Ligado | Lembrete do vencimento |
| 3 dias depois | Vencimento + 3 dias | Ligado | Cobrança que pede o comprovante |
| 7 dias depois | Vencimento + 7 dias | Desligado | Última cobrança |

**Regras:** só dispara para quem não pagou (RN-09); passo desligado é pulado; cada passo sai no máximo uma vez por cliente, mês e canal (RN-13, proposto). A cobrança que não é paga no mês vira **pendência**: continua atrasada e entra nos lembretes dos meses seguintes até ser paga (RN-18, decisão da Q-02).

### 4.1 Pendências de meses anteriores

Decidido (Q-02): cobranças não pagas de meses anteriores aparecem no mês corrente e continuam recebendo lembretes. O mecanismo abaixo é **(proposto)** e aguarda confirmação: o cliente recebe uma mensagem só, com o mês e as pendências, para que o número de mensagens não cresça a cada mês em aberto (RN-19).

```mermaid
flowchart TD
    A["Dia de um passo ligado da régua<br/>no mês corrente"] --> B{"Cobrança do mês<br/>está paga?"}
    B -- "não" --> C{"Tem pendências?"}
    C -- "não" --> D["Mensagem do passo"]
    C -- "sim" --> E["Mensagem do passo<br/>+ pendências e total em aberto"]
    B -- "sim" --> F{"Tem pendências?"}
    F -- "não" --> G["Não envia"]
    F -- "sim" --> H{"É o passo No dia?"}
    H -- "sim" --> I["Mensagem de pendência<br/>uma vez por mês"]
    H -- "não" --> G
```

**Exemplo de mensagem por e-mail (proposto):**

> Olá, Maria! Seu honorário de novembro, de R$ 300,00, vence em 10/11. Chave Pix: [chave Pix do contador].
> Também está em aberto: outubro (R$ 300,00). Total em aberto: R$ 600,00.

---

## 5. Estados de uma cobrança

```mermaid
stateDiagram-v2
    direction LR
    state "Vence dia X" as AVencer
    state "Vence hoje" as Hoje
    state "Atrasado há N dias" as Atrasado
    state "Pago" as Pago

    [*] --> AVencer: cobrança criada
    AVencer --> Hoje: dia do vencimento
    Hoje --> Atrasado: dia seguinte
    AVencer --> Pago: pagamento
    Hoje --> Pago: pagamento
    Atrasado --> Pago: pagamento
```

- **Pagamento** é a baixa manual (RF-12) ou a confirmação do Pix (RF-17).
- **Desfazer** apaga o pagamento, e a cobrança volta ao estado que a data indica: "Vence dia X", "Vence hoje" ou "Atrasado há N dias".
- O status nunca é digitado: ele é calculado pela RN-02 a partir da data de vencimento e da existência de pagamento. Se, no cadastro, o contador escolher cobrar ainda no mês corrente depois do vencimento, a cobrança já nasce como "Atrasado" (RN-21).

---

## 6. Cadastrar, editar e excluir cliente

```mermaid
flowchart TD
    A["Botão + Novo cliente"] --> B["Preencher nome, tipo, honorário,<br/>dia de vencimento, telefone, e-mail e canais"]
    B --> V{"Dados válidos?<br/>dia entre 1 e 28"}
    V -- "não" --> ERR["Mostra o erro no campo"]
    ERR --> B
    V -- "sim" --> Q{"O vencimento deste mês<br/>já passou?"}
    Q -- "não" --> S1["Cliente salvo<br/>cobra a partir deste mês"]
    Q -- "sim" --> I{"Cobrar a partir de"}
    I -- "próximo mês (padrão)" --> S2["Cliente salvo<br/>cobra a partir do próximo mês"]
    I -- "este mês" --> S3["Cliente salvo<br/>cobrança deste mês já atrasada"]
    S1 --> OBR["Obrigações do tipo no checklist<br/>desde este mês"]
    S2 --> OBR
    S3 --> OBR
    OBR --> T{"Tipo do cliente"}
    T -- "MEI" --> MEI["DAS-MEI e DASN-SIMEI"]
    T -- "Simples" --> SN["DAS e DEFIS"]
    T -- "PF" --> PF["IRPF"]
```

**Editar e excluir (versão final)**

```mermaid
flowchart TD
    L["Aba Cobranças"] --> C["Abrir o cliente"]
    C --> AC{"Ação"}
    AC -- "Editar" --> ED["Alterar dados"]
    ED --> HV{"Mudou o honorário?"}
    HV -- "sim" --> HN["Vale para cobranças não pagas<br/>do mês corrente em diante<br/>(proposto, RN-14)"]
    HV -- "não" --> SV["Salvar"]
    HN --> SV
    AC -- "Inativar (proposto)" --> IN["Sai das cobranças, da régua e do checklist<br/>histórico mantido"]
    AC -- "Excluir" --> CF{"Confirmar exclusão?"}
    CF -- "não" --> C
    CF -- "sim" --> EX["Cliente e dados apagados"]
```

**CPF/CNPJ (F4).** Quando o provedor de Pix exigir, o cadastro do cliente pede o CPF ou o CNPJ. O dado vai direto para o provedor e não é guardado no app (ADR-0003). Ver a seção 9.

**Requisitos:** RF-01, RF-02, RF-04, RF-05, RF-06, RN-07, RN-10, RN-14, RN-16, RN-20, RN-21.

---

## 7. Cobranças: acompanhar, cobrar e dar baixa

### 7.1 Visão geral da aba

```mermaid
flowchart TD
    A["Aba Cobranças"] --> F["Escolher filtro<br/>Todos, Em atraso, A vencer, Pagos"]
    F --> L["Lista ordenada<br/>atrasados, vence hoje, a vencer, pagos"]
    L --> C["Cliente na lista<br/>status, valor do mês, próximo lembrete"]
    C --> A1["Cobrar"]
    C --> A2["Marcar como pago"]
    C --> A3["Desfazer pagamento"]
    C --> A4["Ajustar valor do mês"]
    C --> A5["Ver envios<br/>versão final"]
```

**Requisitos:** RF-10, RF-11, RF-15.

### 7.2 Cobrar à mão (atual)

O botão **Cobrar** monta a mensagem do passo certo para o status do cliente (RN-03). No protótipo, o envio é simulado: o contador copia a mensagem e cola no WhatsApp ou no e-mail.

```mermaid
flowchart TD
    A["Botão Cobrar"] --> S{"Status da cobrança"}
    S -- "Atrasado" --> T3["Texto do passo<br/>3 dias depois"]
    S -- "Vence hoje" --> T0["Texto do passo<br/>No dia"]
    S -- "A vencer" --> TM["Texto do passo<br/>3 dias antes"]
    T3 --> P["Preenche os campos<br/>nome, mês, valor, vencimento, Pix"]
    T0 --> P
    TM --> P
    P --> PD["Acrescenta as pendências, se houver<br/>(proposto)"]
    PD --> V["Prévia da mensagem"]
    V --> CP["Copiar"]
    CP --> EXT["Contador envia pelo<br/>WhatsApp ou e-mail dele"]
    EXT --> R["Registrar envio<br/>canal manual"]
```

**Requisitos:** RF-14, RF-32, RN-03, RN-05, RN-11. O texto é usado mesmo que o passo esteja desligado na régua (Q-03).

### 7.3 Marcar como pago e desfazer

```mermaid
flowchart TD
    A["Marcar como pago"] --> B["Informar data e forma<br/>padrão: hoje (proposto)"]
    B --> C["Status vira Pago"]
    C --> D["Régua para para esta cobrança"]
    C --> E["Resumo do mês atualizado"]
    C --> U["Desfazer"]
    U --> F["Apaga data e forma"]
    F --> G["Status recalculado pela RN-02"]
    G --> H["Régua volta a valer<br/>para os passos futuros"]
```

**Requisitos:** RF-12, RF-03, RN-02, RN-09.

### 7.4 Ajustar o valor do mês

```mermaid
flowchart TD
    A["Ajustar valor do mês"] --> B["Informar valor do serviço extra e motivo"]
    B --> C["Valor do mês = honorário + extra"]
    C --> D["Mensagens e resumo usam o novo valor"]
    C --> E["Honorário fixo do cadastro não muda"]
    D --> F["No mês seguinte<br/>a cobrança volta ao honorário fixo"]
```

**Requisitos:** RF-13, RN-01, RN-15.

---

## 8. Rotina diária automática (versão final)

Uma vez por dia, às 9h no fuso de Brasília, o sistema confere os vencimentos e dispara o passo certo da régua, sem ação do contador. A rotina tem duas etapas (ADR-0005): **planejar**, numa função do banco, e **enviar**, numa Edge Function que processa a fila em lotes.

```mermaid
sequenceDiagram
    autonumber
    participant CRON as Supabase Cron
    participant PLAN as Planejar (banco)
    participant DB as Banco de dados
    participant ENV as Enviar (Edge Function)
    participant CAN as E-mail ou WhatsApp
    participant CLI as Cliente do contador

    CRON->>PLAN: 9h de Brasília: planejar o dia
    PLAN->>DB: cria as cobranças que faltam
    PLAN->>DB: calcula os passos de hoje e dos dias perdidos
    PLAN->>DB: grava os envios pendentes, sem duplicar
    loop a cada poucos minutos, enquanto houver pendentes
        CRON->>ENV: processar a fila
        ENV->>DB: separa um lote de envios pendentes
        ENV->>DB: confere se cada cobrança continua em aberto
        alt continua em aberto
            ENV->>CAN: envia a mensagem com o mês e as pendências
            CAN-->>CLI: lembrete com valor, vencimento, Pix e total em aberto
            CAN-->>ENV: aceito ou falhou
            ENV->>DB: marca enviado, ou agenda nova tentativa
        else foi paga depois do planejamento
            ENV->>DB: marca cancelado
        end
    end
```

| Situação | Comportamento |
|---|---|
| Cliente pagou o mês e não tem pendências | Não envia (RN-09) |
| Cliente com o mês e pendências em aberto | Uma mensagem só, com o total em aberto (RN-19, proposto) |
| Cliente pagou o mês, mas tem pendências | Envia só no passo "No dia", com o texto de pendência (RN-18, RN-19, proposto) |
| Passo desligado | Não envia |
| Rotina roda duas vezes no mesmo dia | Não repete o envio: o banco aceita um só registro por cliente, mês, passo e canal (RN-13, ADR-0005) |
| Cliente pagou entre o planejamento e o envio | Envio cancelado (RN-09, ADR-0005) |
| Cliente sem e-mail e sem telefone | Não envia; a cobrança mostra "sem contato" (RN-17, proposto) |
| Provedor fora do ar ou com limite de envio | Nova tentativa mais tarde, até 3 vezes (proposto, ADR-0005) |
| Provedor recusa a mensagem (endereço inválido, número inexistente) | Registra o envio como "falhou", sem nova tentativa; o contador vê a falha na cobrança (RF-35) |
| E-mail volta depois de aceito, ou o cliente marca como spam | O aviso do Resend muda o envio para "falhou"; o e-mail do cliente fica sinalizado e para de receber lembretes automáticos até o contador corrigir (RN-24, proposto) |
| Fila não terminou até as 20h | O restante sai no dia seguinte, a partir das 9h (proposto, ADR-0005) |
| Passo que cai em outro mês | O "3 dias antes" de quem vence no dia 2 sai no fim do mês anterior; o "7 dias depois" de quem vence no dia 28 sai no início do mês seguinte (SRS, seção 4.3) |
| Rotina deixou de rodar em algum dia | A execução seguinte envia só o passo mais recente de cada cliente; os anteriores ficam como "pulado" (RN-22) |

**Requisitos:** RF-16, RF-34, RF-35, RN-09, RN-18, RN-19, RN-22, RNF-09, ADR-0002, ADR-0005.

---

## 9. Pagamento por Pix com baixa automática (versão final)

O provedor de Pix ainda não foi escolhido (Asaas ou similar). O fluxo abaixo é **(proposto)** e independe do provedor. Uma regra já está decidida: o CPF ou o CNPJ do pagador fica só no provedor, e o app guarda apenas o identificador do pagador (ADR-0003).

```mermaid
sequenceDiagram
    autonumber
    participant CONT as Contador
    participant APP as Agenda Contábil
    participant PSP as Provedor de Pix
    participant CLI as Cliente do contador
    participant DB as Banco de dados

    CONT->>APP: informa o CPF ou o CNPJ do cliente
    APP->>PSP: cadastra o pagador com o documento
    PSP-->>APP: identificador do pagador
    APP->>DB: guarda só o identificador, nunca o documento
    APP->>PSP: cria a cobrança Pix com o valor total em aberto
    PSP-->>APP: Pix copia e cola ou link de pagamento
    APP->>CLI: lembrete da régua com o Pix
    CLI->>PSP: paga pelo app do banco
    PSP->>APP: aviso de pagamento confirmado
    APP->>APP: confere a autenticidade do aviso
    alt valor pago igual ao valor total
        APP->>DB: marca como pago com forma Pix e data do pagamento
        Note over APP,DB: a régua para e o resumo do mês se atualiza
    else valor diferente
        APP->>DB: marca a cobrança para revisão do contador
    end
```

| Situação | Comportamento **(proposto)** |
|---|---|
| Aviso de pagamento repetido | Não gera baixa duplicada |
| Contador dá baixa manual com o Pix em aberto | O sistema cancela a cobrança no provedor |
| Contador muda o valor do mês com o Pix em aberto | O sistema cancela o Pix antigo e gera outro com o novo valor |
| Cliente sem cadastro no provedor | Sem Pix com baixa automática: a mensagem usa a chave Pix do contador e a baixa é manual (ADR-0003) |
| Cliente com pendências | Um Pix pelo total em aberto, que dá baixa em todas as cobranças incluídas (Q-17) |
| Em que conta o dinheiro cai | Ver Q-18 |

**Requisitos:** RF-17, RNF-07, RNF-16, RN-09, RN-20. Página do cliente para pagar: RF-60, em aberto.

---

## 10. Obrigações: checklist do mês

```mermaid
flowchart TD
    A["Aba Obrigações"] --> B["Obrigações do mês<br/>e próximos prazos do ano"]
    B --> C["Cada obrigação mostra<br/>X de Y feitos, barra e aviso de prazo"]
    C --> AV{"Prazo"}
    AV -- "já passou" --> V1["Vencida"]
    AV -- "é hoje" --> V2["Vence hoje"]
    AV -- "está à frente" --> V3["Faltam N dias"]
    C --> D["Abrir a obrigação"]
    D --> E["Lista dos clientes do tipo"]
    E --> F["Marcar cliente como feito"]
    F --> G["X de Y feitos atualizado"]
    G --> H["Card Guias a fazer no mês diminui"]
```

| Obrigação | Tipo de cliente | Periodicidade | Período da marcação | Competência mostrada |
|---|---|---|---|---|
| DAS-MEI | MEI | Mensal (dia 20) | Mês | Mês anterior |
| DAS do Simples | Simples | Mensal (dia 20) | Mês | Mês anterior |
| DEFIS | Simples | Anual | Ano | Ano anterior |
| DASN-SIMEI | MEI | Anual | Ano | Ano anterior |
| IRPF | PF | Anual | Ano | Ano anterior |

Cada obrigação é rotulada pelo vencimento e mostra a competência, por exemplo: "DAS-MEI · vence 20/11 · competência outubro" (RN-23). O prazo mostrado é a data cadastrada: o app não ajusta sozinho fins de semana e feriados (Q-06). As datas do protótipo são de exemplo e precisam ser conferidas por um contador.

**Requisitos:** RF-20, RF-21, RF-22, RF-24, RN-06, RN-10, RN-23.

---

## 11. Configurar a régua de cobrança

```mermaid
flowchart TD
    A["Aba Régua de cobrança"] --> B["Informar a chave Pix"]
    A --> C["Escolher um dos 4 passos"]
    C --> D["Ligar ou desligar"]
    C --> E["Editar o texto do e-mail<br/>com os campos nome, mês, valor, vencimento e Pix"]
    C --> W["Prévia do WhatsApp<br/>modelo fixo, sem edição"]
    E --> F["Prévia com um cliente de exemplo"]
    D --> G["Salvar"]
    F --> G
    B --> G
    G --> H["Próximo lembrete de cada cobrança<br/>recalculado pela RN-04"]
```

No texto do e-mail, os campos são escritos entre chaves: `{nome}`, `{mes}`, `{valor}`, `{venc}` e `{pix}`. No WhatsApp, o texto é um modelo fixo aprovado na Meta: a aba mostra só a prévia, com os mesmos campos preenchidos (ADR-0002).

**Requisitos:** RF-30, RF-31, RF-32, RF-33, RN-04, RN-05, RN-08, ADR-0002.

---

## 12. Calendário fiscal editável (versão final)

```mermaid
flowchart TD
    P["Plataforma publica o<br/>calendário padrão do ano"] --> AT{"Obrigação do contador<br/>foi personalizada?"}
    AT -- "não" --> UP["Atualizada sozinha<br/>(proposto)"]
    AT -- "sim" --> AV["Aviso ao contador<br/>aplicar ou manter"]
    A["Aba Obrigações"] --> B["Calendário fiscal"]
    B --> C{"Ação"}
    C -- "Nova" --> D["Nome, tipos de cliente, mensal ou anual,<br/>dia ou data e competência"]
    C -- "Editar" --> D
    C -- "Desativar" --> X["Sai do checklist<br/>marcações antigas mantidas"]
    D --> E["Salvar<br/>a obrigação fica personalizada"]
    E --> F["Checklist e card<br/>Guias a fazer recalculados"]
    UP --> F
    AV --> F
```

A plataforma mantém o calendário padrão e publica a versão de cada ano, conferida por um contador. O contador ajusta o que quiser na própria conta (Q-08).

**Requisitos:** RF-23, RN-23, RNF-11.

---

## 13. Histórico dos meses anteriores (versão final)

```mermaid
flowchart LR
    A["Topo: mês de referência"] --> B["Escolher um mês anterior"]
    B --> C["Resumo, cobranças e<br/>obrigações daquele mês"]
    C --> D["Dar baixa em cobrança antiga<br/>(proposto)"]
    C --> E["Voltar ao mês corrente"]
```

**Requisitos:** RF-18, RN-18. Cobranças de meses anteriores não pagas também aparecem no mês corrente e continuam recebendo lembretes (seção 4.1).

---

## 14. Assinatura do app (versão final)

Preço, período de teste e regra de inadimplência ainda estão em aberto. O fluxo abaixo é **(proposto)**.

```mermaid
flowchart TD
    A["Conta e assinatura"] --> B["Escolher plano"]
    B --> C["Pagar a assinatura"]
    C --> D{"Pagamento confirmado?"}
    D -- "sim" --> E["Assinatura ativa"]
    D -- "não" --> F["Aviso ao contador"]
    E --> G["Renovação mensal"]
    G --> D
    F --> H["Regra de inadimplência<br/>em aberto"]
```

**Requisitos:** RF-50.

---

## 15. Exceções e mensagens de erro

| Situação | Comportamento esperado | Referência |
|---|---|---|
| Dia de vencimento fora de 1 a 28 | Não salva e mostra a faixa permitida | RN-07 |
| Campo obrigatório vazio no cadastro | Não salva e indica o campo | RF-01 |
| Cliente sem e-mail e sem telefone | Sem envio automático; aviso "sem contato"; a mensagem para copiar continua disponível | RN-17 (proposto) |
| Envio recusado pelo provedor | Envio registrado como "falhou" e destacado na cobrança | RF-35 |
| E-mail devolvido ou marcado como spam | E-mail do cliente sinalizado no cadastro; sem lembretes automáticos por e-mail até a correção | RN-24 (proposto), ADR-0007 |
| Cliente pagou, mas o contador ainda não marcou | O lembrete pode sair. Mitigação: baixa automática por Pix; **(proposto)** texto com "se já pagou, desconsidere" | RF-17, RN-09 |
| Aviso de pagamento Pix repetido | Uma baixa só | RF-17 (proposto) |
| Valor pago diferente do esperado | Cobrança marcada para revisão | Q-13 |
| Cliente sem CPF/CNPJ no provedor de Pix | Lembrete com a chave Pix do contador; baixa manual | ADR-0003 |
| Cliente com vários meses em aberto | Uma mensagem por dia e canal, com o total em aberto | RN-19 (proposto) |
| Contador desfaz um pagamento | Status recalculado; a régua volta para os passos futuros | RF-12 |
| Todos os passos da régua desligados | "Sem próximos lembretes" na cobrança | RF-15 (proposto) |
| Campo desconhecido no texto da régua | Aviso antes de salvar | RF-32 (proposto) |
| Rotina diária não rodou | Alerta; a execução seguinte envia só o passo mais recente de cada cliente | RNF-09, RN-22 |
| Sessão expirada | Volta ao login, sem perder o que foi salvo | RF-40 |

---

## 16. Rastreabilidade: fluxos → requisitos

| Fluxo | Seção | Requisitos |
|---|---|---|
| Mapa de telas | 1 | RF-01, RF-03, RF-10 a RF-24, RF-30 a RF-33, RNF-01, RNF-02 |
| Primeiro acesso | 2 | RF-40, RF-42, RF-43, RF-20, RF-30, RF-01 |
| Rotina mensal do contador | 3 | RF-01, RF-12, RF-13, RF-21, RF-31, RF-33 |
| Ciclo mensal de cobrança e pendências | 4 | RF-18, RF-30, RF-34, RN-08, RN-09, RN-13, RN-18, RN-19 |
| Estados da cobrança | 5 | RF-10, RF-12, RN-02 |
| Cadastro de cliente | 6 | RF-01, RF-02, RF-04 a RF-06, RN-07, RN-10, RN-14, RN-21 |
| Cobranças | 7 | RF-10 a RF-15, RN-01, RN-03 |
| Rotina diária | 8 | RF-16, RF-34, RF-35, RN-22, RNF-09 |
| Pix com baixa automática | 9 | RF-17, RNF-07, RNF-16, RN-20 |
| Obrigações | 10 | RF-20 a RF-22, RF-24, RN-06, RN-10, RN-23 |
| Régua de cobrança | 11 | RF-30 a RF-33, RN-04, RN-05 |
| Calendário fiscal | 12 | RF-23, RN-23, RNF-11 |
| Histórico | 13 | RF-18 |
| Assinatura | 14 | RF-50 |

---

## 17. Histórico do documento

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 07/11/2026 | Primeira versão, a partir do User Flow da Documentação do Produto e do Briefing de 03/11/2026 |
| 1.1 | 07/11/2026 | Pendências de meses anteriores (seção 4.1), rotina diária por cliente, Pix com CPF/CNPJ só no provedor e régua com WhatsApp fixo |
| 1.2 | 09/11/2026 | Início da cobrança no cadastro (RN-21), canais por cliente, rotina às 9h com passos que caem em outro mês e recuperação (RN-22), competência das obrigações (RN-23) e calendário padrão da plataforma |
| 1.3 | 09/11/2026 | Rotina diária em duas etapas, planejar e enviar (ADR-0005) |
| 1.4 | 09/11/2026 | E-mail devolvido ou marcado como spam (RN-24, ADR-0007) |
| 1.5 | 11/11/2026 | Link para a documentação técnica (Arquitetura) |
