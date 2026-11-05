/* Lev Soul · Termo de Adesão (texto PROVISÓRIO v1.0 — a v1.1, revisada pelo advogado, substitui este arquivo inteiro).
   O hash deste texto (sha-256) é gravado no aceite; qualquer mudança aqui muda o hash = nova versão. */
window.LEV_CONTRATO = (function () {
  function clausulas(c) {
    var M = c.mensalidade, S = c.sessao, P = c.particular;
    return [
      ['1 · O que você está ativando',
       'A Assinatura Lev Soul é um programa de assinatura de acesso a serviços de psicologia em condições de membro, prestados por ' + c.razao_social + ' (CNPJ ' + c.cnpj + '), sob responsabilidade técnica de ' + c.rt_nome + ' (CRP ' + c.rt_crp + '). A mensalidade ativa o acesso e a condição de membro de todas as pessoas da sua casa indicadas neste termo. Cada sessão é contratada e paga separadamente, apenas quando acontece. É um serviço de meio, prestado com ética e método — sem promessa de resultado clínico.', false],
      ['2 · Valores',
       'Mensalidade: R$ ' + M + ' por mês, cobrada a partir do aceite e, depois, a cada 30 dias no mesmo dia do mês. Sessão de membro: R$ ' + S + ' por atendimento, paga diretamente na recepção ou pelo meio indicado pela equipe, no dia da sessão. Os valores podem ser atualizados com aviso prévio de 30 dias pelo WhatsApp cadastrado.', true],
      ['3 · Não é plano de saúde',
       c.aviso + ' A Lev Soul não assume risco assistencial, não garante disponibilidade de horários específicos e não custeia atendimentos.', true],
      ['4 · Mensalidade em atraso',
       'Se a mensalidade não for paga até o vencimento, a assinatura fica em atraso a partir do dia seguinte. Enquanto durar o atraso, as sessões realizadas por qualquer pessoa da casa são cobradas pelo valor particular avulso (R$ ' + P + ' por sessão), e a condição de membro volta assim que o pagamento for confirmado. A vaga e o histórico ficam preservados.', true],
      ['5 · Cancelamento, pausa e arrependimento',
       'Você pode encerrar a assinatura quando quiser, sem multa, pela área do cliente ou pelo WhatsApp da equipe; o encerramento vale a partir do próximo vencimento, sem cobrança nova. A assinatura pode ser pausada uma vez, por 30 dias, sem cobrança e com a vaga guardada. Contratou à distância? Você tem 7 dias corridos, contados do aceite, para desistir com devolução integral da mensalidade paga (art. 49 do Código de Defesa do Consumidor), desde que nenhuma sessão tenha sido realizada no período.', true],
      ['6 · Sessões, faltas e troca de psicólogo',
       'Sessões são marcadas com a equipe de acolhimento pelo WhatsApp e pagas no dia em que acontecem. Precisou desmarcar? Avise a equipe com a maior antecedência possível, para o horário ser aproveitado por outra pessoa. Se não houver vínculo com o psicólogo, a troca é feita sem custo.', false],
      ['7 · Família',
       'O titular pode incluir pessoas da casa, sem limite, informando nome e parentesco. Dependentes adultos têm sigilo próprio: os agendamentos deles não aparecem para o titular. A inclusão ou retirada de dependentes é feita pela área do cliente ou pela equipe.', false],
      ['8 · Sigilo e dados pessoais (LGPD)',
       'Tudo o que é dito em sessão é protegido por sigilo profissional e nunca é usado para comunicação ou marketing. Para executar este contrato tratamos: nome, CPF, WhatsApp, e-mail, data de nascimento dos dependentes, dados de pagamento (tratados pela plataforma de pagamento, nunca guardados por nós) e os registros de agendamento. Operadores: SM Click (mensagens de WhatsApp), Supabase (banco de dados), a plataforma de pagamento contratada e o sistema de agenda da clínica. Mensagens de serviço (código, contrato, cobrança, lembrete de sessão) fazem parte deste contrato; mensagens de conteúdo e novidades só com o seu consentimento separado, que pode ser retirado a qualquer momento respondendo SAIR. Canal do titular e encarregado de dados: ' + c.email + '.', false],
      ['9 · Assinatura eletrônica',
       'O aceite é confirmado pelo código enviado ao seu WhatsApp e registrado com a versão deste documento, o resumo criptográfico do texto, a data, a hora, o endereço IP e o aparelho utilizados (MP 2.200-2/2001). Esse registro vale como assinatura.', false],
      ['10 · Foro',
       'Fica eleito o foro da comarca de Anápolis, GO, para qualquer questão sobre este termo, sem prejuízo do foro do seu domicílio quando a lei assim garantir.', false]
    ];
  }
  function versaoHumana(c) { return String(c.contrato_versao || '1.0').replace('provisorio-', ''); }
  function html(c) {
    return clausulas(c).map(function (k) {
      var b = '<h4>' + k[0] + '</h4><p>' + k[1] + '</p>';
      return k[2] ? '<div class="clausula">' + b + '</div>' : b;
    }).join('') + '<p style="margin-top:10px;color:#8B87A8">Versão ' + versaoHumana(c) + ' · o texto integral fica disponível na sua área do cliente.</p>';
  }
  function texto(c) { return 'TERMO DE ADESÃO · ASSINATURA LEV SOUL · versão ' + (c.contrato_versao || '1.0') + '\n\n' + clausulas(c).map(function (k) { return k[0] + '\n' + k[1]; }).join('\n\n'); }
  async function hash(c) {
    try {
      var buf = new TextEncoder().encode(texto(c));
      var h = await crypto.subtle.digest('SHA-256', buf);
      return Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    } catch (e) { return 'sem-hash'; }
  }
  return { clausulas: clausulas, html: html, texto: texto, hash: hash, versaoHumana: versaoHumana };
})();
