-- Neximob: texto de pendência (Q-02, RN-18, RN-19, RF-31)
--
-- Usado quando a cobrança do mês já foi paga e só restam cobranças de meses
-- anteriores em aberto: o cliente recebe uma mensagem por mês, no dia do
-- vencimento. Neste texto valem os campos {nome} e {pix}; os meses em aberto e
-- o total são acrescentados pelo sistema logo abaixo, num bloco padrão.
-- Vale para o e-mail. No WhatsApp, vale o modelo fixo de pendência (ADR-0002).

alter table public.contadores
  add column texto_pendencia text not null
    default 'Olá, {nome}! Passando para lembrar que há honorários em aberto, listados logo abaixo. Para pagar por Pix, use a chave {pix}. Se já pagou, pode me enviar o comprovante?'
    check (char_length(texto_pendencia) between 1 and 2000);

grant update (texto_pendencia) on public.contadores to authenticated;
