# Mapa de fluxo: Agenda Contábil

**Telas e caminhos do usuário**

| | |
|---|---|
| **Produto** | Agenda Contábil (nome de trabalho) |
| **Repositório** | `neximob` |
| **Versão** | 1.0, rascunho para validação |
| **Data** | 07/11/2026 |
| **Fontes** | *Agenda Contábil: Documentação do Produto* (seção 3, User Flow) e *Agenda Contábil: Briefing para desenvolvimento*, ambos de 03/11/2026 |
| **Documentos relacionados** | [PRD](./PRD.md) · [SRS](./SRS.md) |

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
    E --> F["Calendário fiscal padrão criado"]
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
    P4 -- "não" --> G["Fim da régua<br/>segue Atrasado há N dias"]
    PAGO -- "mês seguinte" --> B
```

| Passo | Quando | Padrão | Mensagem |
|---|---|---|---|
| 3 dias antes | Vencimento − 3 dias | Ligado | Lembrete com a chave Pix |
| No dia | Dia do vencimento | Ligado | Lembrete do vencimento |
| 3 dias depois | Vencimento + 3 dias | Ligado | Cobrança que pede o comprovante |
| 7 dias depois | Vencimento + 7 dias | Desligado | Última cobrança |

**Regras:** só dispara para quem não pagou (RN-09); passo desligado é pulado; cada passo sai no máximo uma vez por cobrança e canal (RN-13, proposto). Depois do último passo ligado, a cobrança continua atrasada até ser paga. Cobranças antigas não pagas: ver Q-02.

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
- O status nunca é digitado: ele é calculado pela RN-02 a partir da data de vencimento e da existência de pagamento. Uma cobrança criada depois do vencimento já nasce como "Vence hoje" ou "Atrasado" (ver Q-01).

---

## 6. Cadastrar, editar e excluir cliente

```mermaid
flowchart TD
    A["Botão + Novo cliente"] --> B["Preencher nome, tipo, honorário,<br/>dia de vencimento, telefone e e-mail"]
    B --> V{"Dados válidos?<br/>dia entre 1 e 28"}
    V -- "não" --> ERR["Mostra o erro no campo"]
    ERR --> B
    V -- "sim" --> S["Cliente salvo"]
    S --> COB["Cobrança do mês criada<br/>honorário + extra zerado"]
    S --> OBR["Obrigações do tipo no checklist"]
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

**Requisitos:** RF-01, RF-02, RF-04, RF-05, RF-06, RN-07, RN-10, RN-14, RN-16.

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
    P --> V["Prévia da mensagem"]
    V --> CP["Copiar"]
    CP --> EXT["Contador envia pelo<br/>WhatsApp ou e-mail dele"]
    EXT --> R["Registrar envio<br/>canal manual"]
```

**Requisitos:** RF-14, RF-32, RN-03, RN-05, RN-11. Passo desligado na régua: ver Q-03.

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

Uma vez por dia, o sistema confere os vencimentos e dispara o passo certo da régua, sem ação do contador.

```mermaid
sequenceDiagram
    autonumber
    participant AG as Agendador
    participant APP as Agenda Contábil
    participant DB as Banco de dados
    participant CAN as E-mail ou WhatsApp
    participant CLI as Cliente do contador

    AG->>APP: dispara a rotina do dia
    APP->>DB: busca cobranças não pagas de clientes ativos
    loop cada cobrança e cada passo ligado
        APP->>APP: data do passo = vencimento + dias do passo
        alt data do passo é hoje e o passo não foi enviado
            APP->>APP: monta a mensagem com os campos
            APP->>CAN: envia a mensagem
            CAN-->>CLI: lembrete com valor, vencimento e Pix
            CAN-->>APP: aceito ou falhou
            APP->>DB: registra o envio com passo, canal e status
        else qualquer outro caso
            APP->>APP: não envia
        end
    end
```

| Situação | Comportamento |
|---|---|
| Cliente pagou antes da rotina rodar | Não envia (RN-09) |
| Passo desligado | Não envia |
| Rotina roda duas vezes no mesmo dia | Não repete o envio (RN-13, proposto) |
| Cliente sem e-mail e sem telefone | Não envia; a cobrança mostra "sem contato" (RN-17, proposto) |
| Provedor recusa a mensagem | Registra o envio como "falhou"; o contador vê a falha na cobrança (RF-35) |
| Rotina deixou de rodar num dia | Ver Q-09 |

**Requisitos:** RF-16, RF-34, RF-35, RNF-09.

---

## 9. Pagamento por Pix com baixa automática (versão final)

O provedor de Pix ainda não foi escolhido (Asaas ou similar). O fluxo abaixo é **(proposto)** e independe do provedor.

```mermaid
sequenceDiagram
    autonumber
    participant APP as Agenda Contábil
    participant PSP as Provedor de Pix
    participant CLI as Cliente do contador
    participant DB as Banco de dados

    APP->>PSP: cria a cobrança Pix com o valor total do mês
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
| Provedor exige CPF ou CNPJ do pagador | Ver Q-12 |

**Requisitos:** RF-17, RNF-07, RN-09. Página do cliente para pagar: RF-60, em aberto.

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

| Obrigação | Tipo de cliente | Periodicidade | Período da marcação |
|---|---|---|---|
| DAS-MEI | MEI | Mensal (dia 20) | Mês |
| DAS do Simples | Simples | Mensal (dia 20) | Mês |
| DEFIS | Simples | Anual | Ano |
| DASN-SIMEI | MEI | Anual | Ano |
| IRPF | PF | Anual | Ano |

As datas do protótipo são de exemplo e precisam ser conferidas por um contador. Competência da guia: ver Q-07. Prazo em fim de semana ou feriado: ver Q-06.

**Requisitos:** RF-20, RF-21, RF-22, RF-24, RN-06, RN-10.

---

## 11. Configurar a régua de cobrança

```mermaid
flowchart TD
    A["Aba Régua de cobrança"] --> B["Informar a chave Pix"]
    A --> C["Escolher um dos 4 passos"]
    C --> D["Ligar ou desligar"]
    C --> E["Editar o texto<br/>com os campos nome, mês, valor, vencimento e Pix"]
    E --> F["Prévia com um cliente de exemplo"]
    D --> G["Salvar"]
    F --> G
    B --> G
    G --> H["Próximo lembrete de cada cobrança<br/>recalculado pela RN-04"]
```

No texto, os campos são escritos entre chaves: `{nome}`, `{mes}`, `{valor}`, `{venc}` e `{pix}`. No WhatsApp, só é possível enviar modelos aprovados pela Meta: ver Q-04.

**Requisitos:** RF-30, RF-31, RF-32, RF-33, RN-04, RN-05, RN-08.

---

## 12. Calendário fiscal editável (versão final)

```mermaid
flowchart TD
    A["Aba Obrigações"] --> B["Calendário fiscal"]
    B --> C{"Ação"}
    C -- "Nova" --> D["Nome, tipos de cliente,<br/>mensal ou anual, dia ou data"]
    C -- "Editar" --> D
    C -- "Desativar" --> X["Sai do checklist<br/>marcações antigas mantidas"]
    D --> E["Salvar"]
    E --> F["Checklist e card<br/>Guias a fazer recalculados"]
```

As regras fiscais mudam: as datas devem ser fáceis de atualizar e conferidas por um contador. Quem mantém o calendário padrão: ver Q-08.

**Requisitos:** RF-23, RNF-11.

---

## 13. Histórico dos meses anteriores (versão final)

```mermaid
flowchart LR
    A["Topo: mês de referência"] --> B["Escolher um mês anterior"]
    B --> C["Resumo, cobranças e<br/>obrigações daquele mês"]
    C --> D["Dar baixa em cobrança antiga<br/>(proposto)"]
    C --> E["Voltar ao mês corrente"]
```

**Requisitos:** RF-18. Cobranças antigas não pagas no mês corrente: ver Q-02.

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
| Cliente pagou, mas o contador ainda não marcou | O lembrete pode sair. Mitigação: baixa automática por Pix; **(proposto)** texto com "se já pagou, desconsidere" | RF-17, RN-09 |
| Aviso de pagamento Pix repetido | Uma baixa só | RF-17 (proposto) |
| Valor pago diferente do esperado | Cobrança marcada para revisão | Q-13 |
| Contador desfaz um pagamento | Status recalculado; a régua volta para os passos futuros | RF-12 |
| Todos os passos da régua desligados | "Sem próximos lembretes" na cobrança | RF-15 (proposto) |
| Campo desconhecido no texto da régua | Aviso antes de salvar | RF-32 (proposto) |
| Rotina diária não rodou | Alerta; recuperação segundo Q-09 | RNF-09 |
| Sessão expirada | Volta ao login, sem perder o que foi salvo | RF-40 |

---

## 16. Rastreabilidade: fluxos → requisitos

| Fluxo | Seção | Requisitos |
|---|---|---|
| Mapa de telas | 1 | RF-01, RF-03, RF-10 a RF-24, RF-30 a RF-33, RNF-01, RNF-02 |
| Primeiro acesso | 2 | RF-40, RF-42, RF-43, RF-20, RF-30, RF-01 |
| Rotina mensal do contador | 3 | RF-01, RF-12, RF-13, RF-21, RF-31, RF-33 |
| Ciclo mensal de cobrança | 4 | RF-30, RF-34, RN-08, RN-09, RN-13 |
| Estados da cobrança | 5 | RF-10, RF-12, RN-02 |
| Cadastro de cliente | 6 | RF-01, RF-02, RF-04 a RF-06, RN-07, RN-10, RN-14 |
| Cobranças | 7 | RF-10 a RF-15, RN-01, RN-03 |
| Rotina diária | 8 | RF-16, RF-34, RF-35, RNF-09 |
| Pix com baixa automática | 9 | RF-17, RNF-07 |
| Obrigações | 10 | RF-20 a RF-22, RF-24, RN-06, RN-10 |
| Régua de cobrança | 11 | RF-30 a RF-33, RN-04, RN-05 |
| Calendário fiscal | 12 | RF-23, RNF-11 |
| Histórico | 13 | RF-18 |
| Assinatura | 14 | RF-50 |

---

## 17. Histórico do documento

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 07/11/2026 | Primeira versão, a partir do User Flow da Documentação do Produto e do Briefing de 03/11/2026 |
