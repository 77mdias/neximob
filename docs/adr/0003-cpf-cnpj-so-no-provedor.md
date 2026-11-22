# ADR-0003: CPF e CNPJ dos clientes ficam só no provedor de Pix

- **Status:** Aceita
- **Data:** 07/11/2026
- **Requisitos:** RF-17, RNF-05, RNF-16, Q-12

## Contexto

- A baixa automática por Pix (RF-17, F4) depende de um provedor de cobrança, ainda não escolhido (Asaas ou similar).
- Provedores de cobrança costumam exigir o CPF ou o CNPJ do pagador para cadastrá-lo e emitir a cobrança.
- O modelo de dados do Briefing não tem CPF nem CNPJ, e a LGPD pede que só se guarde o necessário. CPF e CNPJ de terceiros num banco de dados aumentam o dano de um eventual vazamento.

## Decisão

**O app nunca grava CPF nem CNPJ.** Esses dados ficam só no provedor de Pix.

1. Quando o contador ativa o Pix de um cliente, o formulário pede o CPF ou o CNPJ.
2. O navegador envia o dado ao servidor do app, que o repassa na hora ao provedor para cadastrar ou atualizar o pagador.
3. O app guarda **só o identificador do pagador no provedor** (`clientes.provedor_cliente_id`).
4. O CPF ou CNPJ não aparece no banco, em logs, em relatórios de erro, em ferramentas de análise nem no armazenamento do navegador. O servidor também não devolve o dado à tela.
5. A tela mostra só a situação: "CPF/CNPJ cadastrado no provedor". Para corrigir, o contador digita de novo, e o app atualiza o provedor.
6. **(proposto)** Antes de enviar, o formulário confere o formato e os dígitos verificadores, para evitar erro no provedor.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Guardar CPF/CNPJ no banco, criptografado | Continua sendo dado sensível sob guarda do app, com chaves para proteger; não traz benefício ao produto |
| Pedir ao cliente do contador que informe o dado direto ao provedor | Depende da página do cliente (RF-60), que está em aberto, e acrescenta um passo para quem paga |

## Consequências

**Positivas**
- Um vazamento do banco do app não expõe documentos dos clientes.
- O app cumpre o princípio de necessidade da LGPD com menos esforço.

**Negativas e cuidados**
- Trocar de provedor exige recadastrar os documentos ou exportá-los do provedor antigo.
- O dado passa pela memória do servidor durante o envio. Isso ainda é tratamento de dados e precisa constar na política de privacidade (RF-43).
- Os logs e o monitoramento de erros precisam filtrar os campos do formulário do Pix. Isso deve ser coberto por teste.
- Cliente sem cadastro no provedor não tem Pix com baixa automática. **(proposto)** Nesse caso, a mensagem usa a chave Pix do contador e a baixa continua manual.
