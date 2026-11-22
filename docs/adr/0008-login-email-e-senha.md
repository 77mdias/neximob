# ADR-0008: Login por e-mail e senha, com confirmação e recuperação

- **Status:** Aceita
- **Data:** 11/11/2026
- **Requisitos:** RF-40, RF-43, RF-45, RNF-05

## Contexto

- O SRS deixou em aberto o método de login (RF-40): senha ou link mágico por e-mail.
- O contador usa o app no celular e no computador, várias vezes por mês.
- O login é feito pelo Supabase Auth (ADR-0001), e os e-mails de autenticação saem pelo SMTP do Resend (ADR-0007).
- A LGPD pede login seguro, porque o app guarda dados de terceiros (RNF-05).

## Decisão

1. **Cadastro e login com e-mail e senha**, no Supabase Auth.
2. **Confirmação obrigatória do e-mail** antes do primeiro acesso (`enable_confirmations = true`).
3. **Recuperação de acesso por e-mail:** "Esqueci minha senha" envia um link, e o link abre uma tela para criar uma senha nova.
4. **Troca de senha exige login recente** (`secure_password_change = true`).
5. **Senha com no mínimo 8 caracteres** (`minimum_password_length = 8`), sem regras obrigatórias de composição (maiúsculas, símbolos). Tamanho protege mais do que regras de composição, e regras demais levam a senhas previsíveis.
6. **E-mails de autenticação em português**, com os modelos configurados no Supabase.
7. **(proposto)** Proteção contra senhas vazadas do Supabase, quando disponível no plano contratado.
8. **(proposto)** CAPTCHA da Cloudflare (Turnstile), que o Supabase Auth suporta, no cadastro, no login e na recuperação. Ele evita cadastros automáticos, que gastariam e-mails e prejudicariam a reputação do domínio.
9. **(proposto)** Mensagens que não revelam quais e-mails têm conta: "e-mail ou senha incorretos" no login e "se o e-mail estiver cadastrado, enviaremos um link" na recuperação.
10. A sessão fica em cookies, pela biblioteca `@supabase/ssr`, como descrito na [Arquitetura](../Arquitetura.md), seção 3.1.

## Alternativas consideradas

| Alternativa | Por que não, por enquanto |
|---|---|
| Link mágico por e-mail (sem senha) | Todo login depende de o e-mail chegar na hora, e o link precisa ser aberto no mesmo aparelho. Incômodo para quem alterna entre celular e computador. Pode ser oferecido depois, como opção |
| Código por e-mail | Mesma dependência do e-mail a cada login |
| Login com Google | Nem todo contador usa uma conta Google como e-mail principal, e exige configurar o provedor. Pode vir depois, se a validação pedir |

## Consequências

**Positivas**
- Fluxo conhecido pelos contadores, que funciona igual no celular e no computador.
- Depois do cadastro, entrar não depende de o e-mail chegar.

**Negativas e cuidados**
- Senha pode ser alvo de tentativa e erro. Mitigação: limites de tentativa do Supabase Auth e, **(proposto)**, CAPTCHA.
- A confirmação e a recuperação dependem do e-mail. O domínio de envio precisa estar autenticado antes de abrir o cadastro ao público (ADR-0007).
- A tela de nova senha e as URLs de retorno precisam estar cadastradas no Supabase Auth, em cada ambiente (local, testes e produção).
