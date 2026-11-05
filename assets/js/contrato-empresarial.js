/* Lev Soul · Termo de Adesão EMPRESARIAL (texto PROVISÓRIO v1.0 — a versão do advogado substitui este arquivo).
   Usado pelo colaborador de empresa parceira ao ativar pelo site. */
window.LEV_CONTRATO_EMP = (function () {
  function clausulas(c) {
    var S = c.sessao, P = c.particular;
    return [
      ['1 · O que você está ativando',
       'Sua empresa firmou uma parceria com a Lev Soul (' + c.razao_social + ', CNPJ ' + c.cnpj + ', responsável técnica ' + c.rt_nome + ', CRP ' + c.rt_crp + ') e ativou, para você e para as pessoas da sua casa, o acesso a serviços de psicologia em condições de membro. Não há mensalidade para você nem para a sua família enquanto a parceria estiver vigente e você constar na lista da empresa.', false],
      ['2 · Valores',
       'Cada sessão é contratada e paga separadamente, apenas quando acontece: R$ ' + S + ' por atendimento (valor de membro), pagos diretamente na recepção ou pelo meio indicado pela equipe. Quem não constar na lista ativa da empresa paga o valor particular avulso (R$ ' + P + ').', true],
      ['3 · Não é plano de saúde',
       c.aviso, true],
      ['4 · De onde veio o seu contato',
       'Seu nome e WhatsApp foram informados pela sua empresa, dentro do termo de parceria, com a finalidade única de ativar e operar este benefício. A Lev Soul nunca informa à empresa quem usa o serviço: os relatórios enviados a ela são agregados e anônimos. Você pode pedir a exclusão dos seus dados a qualquer momento pelo canal ' + c.email + '.', true],
      ['5 · Família',
       'Você pode incluir pessoas da sua casa, sem limite, informando nome e parentesco. Dependentes adultos têm sigilo próprio. A inclusão ou retirada é feita aqui, pela área do cliente ou pela equipe de acolhimento.', false],
      ['6 · Fim da parceria ou desligamento',
       'Se você deixar a empresa, ou se a parceria terminar, a condição de membro fica mantida por 30 dias; depois disso, você pode continuar com o Lev Soul Família, com mensalidade própria, se quiser. Nada é cobrado sem o seu novo aceite.', false],
      ['7 · Sigilo, dados e mensagens',
       'Tudo o que é dito em sessão é sigilo profissional e nunca é usado para comunicação ou relatório. Tratamos nome, CPF, WhatsApp, nome e parentesco dos dependentes e os registros de agendamento, com os operadores SM Click (WhatsApp), Supabase (banco de dados) e o sistema de agenda da clínica. Mensagens de serviço (código, confirmação e lembrete de sessão) fazem parte deste termo; conteúdos e novidades só com o seu consentimento separado — e, em qualquer mensagem, responder SAIR encerra o envio de relacionamento na hora.', false],
      ['8 · Assinatura eletrônica',
       'O aceite é confirmado pelo código enviado ao seu WhatsApp e registrado com a versão deste documento, o resumo criptográfico do texto, a data, a hora, o endereço IP e o aparelho utilizados (MP 2.200-2/2001).', false],
      ['9 · Foro',
       'Fica eleito o foro da comarca de Anápolis, GO, sem prejuízo do foro do seu domicílio quando a lei assim garantir.', false]
    ];
  }
  function versaoHumana(c) { return String(c.contrato_versao || '1.0').replace('provisorio-', ''); }
  function html(c) { return clausulas(c).map(function (k) { var b = '<h4>' + k[0] + '</h4><p>' + k[1] + '</p>'; return k[2] ? '<div class="clausula">' + b + '</div>' : b; }).join('') + '<p style="margin-top:10px;color:#8B87A8">Versão ' + versaoHumana(c) + ' (empresarial).</p>'; }
  function texto(c) { return 'TERMO DE ADESÃO EMPRESARIAL · LEV SOUL · versão ' + (c.contrato_versao || '1.0') + '\n\n' + clausulas(c).map(function (k) { return k[0] + '\n' + k[1]; }).join('\n\n'); }
  async function hash(c) { try { var h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto(c))); return Array.prototype.map.call(new Uint8Array(h), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); } catch (e) { return 'sem-hash'; } }
  return { clausulas: clausulas, html: html, texto: texto, hash: hash, versaoHumana: versaoHumana };
})();
