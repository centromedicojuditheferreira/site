/* Lev Soul · área do cliente (/minha-conta). Login oficial pelo Supabase Auth (WhatsApp + código; senha opcional), separado do Cortex. */
window.CONTA = (function () {
  var $ = LEV.$, qsa = LEV.qsa, sb = LEV.sb;
  var S = { whats: '', e164: '', conta: null, dados: null, cfg: null, finalidade: 'login', tent: 0, solTipo: 'outro', reenvio: null, motivo: null };

  function tela(id) { LEV.irPara(id); }
  function logado(sim) { $('app').classList.toggle('logado', !!sim); }
  function erroDe(e) { return LEV.erro(e).message; }

  async function init() {
    S.cfg = await LEV.config();
    LEV.mascara($('lWhats'), LEV.mWhats);
    ligarOtp();
    $('btnWhats').onclick = continuar;
    $('btnSenha').onclick = entrarSenha;
    $('btnCriar').onclick = criarSenha;
    $('nova').addEventListener('input', function () { medirForca(this.value); });
    $('avatar').onclick = sair;
    $('btnEnviarSol').onclick = enviarSolicitacao;
    $('chkOptin').onchange = function () { consentimento(this.checked); };
    LEV.linkWhats('Oi! Estou na minha conta do Lev Soul e preciso de uma ajuda 🤍').then(function (u) { var b = $('btnWaAjuda'); b.href = u; b.target = '_blank'; });
    var sess = sb ? (await sb.auth.getSession()).data.session : null;
    if (sess) { await entrar(); return; }
    LEV.evento('conta_abriu', '/minha-conta');
    $('lWhats').focus();
  }

  /* ───── C0 ───── */
  async function continuar() {
    LEV.esconderErro('erroWhats');
    if (!LEV.whatsValido($('lWhats').value)) return LEV.mostrarErro('erroWhats', 'Confere o WhatsApp com DDD.');
    S.whats = LEV.soDigitos($('lWhats').value); S.e164 = LEV.e164(S.whats);
    var b = $('btnWhats'); b.disabled = true;
    try {
      S.conta = await LEV.rpc('ls_site_conta', { p_whatsapp: S.whats });
      if (!S.conta.existe) { tela('t-semconta'); LEV.evento('conta_sem_conta', '/minha-conta'); return; }
      $('senhaMasc').textContent = S.conta.whatsapp_mascarado; $('otpMasc').textContent = S.conta.whatsapp_mascarado;
      if (S.conta.tem_senha) { tela('t-senha'); setTimeout(function () { $('lSenha').focus(); }, 380); }
      else await pedirCodigo('login');
    } catch (e) { LEV.mostrarErro('erroWhats', erroDe(e)); }
    finally { b.disabled = false; }
  }
  function voltarWhats() { tela('t-whats'); }
  async function entrarSenha() {
    LEV.esconderErro('erroSenha');
    var senha = $('lSenha').value; if (!senha) return;
    var b = $('btnSenha'); b.disabled = true;
    try {
      var r = await sb.auth.signInWithPassword({ phone: S.e164, password: senha });
      if (r.error) throw r.error;
      S.tent = 0; await entrar();
    } catch (e) {
      S.tent++;
      if (S.tent >= 5) { LEV.mostrarErro('erroSenha', 'Por segurança, vamos entrar por outro caminho: o código no WhatsApp.'); await pedirCodigo('recuperacao'); }
      else LEV.mostrarErro('erroSenha', 'A senha não conferiu. Tenta de novo, com calma (' + (5 - S.tent) + ' de 5).');
      $('lSenha').value = '';
    } finally { b.disabled = false; }
  }
  async function pedirCodigo(finalidade) {
    S.finalidade = finalidade || 'login';
    try {
      var r = await sb.auth.signInWithOtp({ phone: S.e164, options: { shouldCreateUser: true, channel: 'sms' } });
      if (r.error) throw r.error;
      tela('t-otp'); contagem(60);
      setTimeout(function () { var c = qsa('#otp input'); c.forEach(function (x) { x.value = ''; x.classList.remove('cheia'); }); c[0].focus(); }, 380);
    } catch (e) {
      var m = String((e && e.message) || '');
      var msg = /rate|too many|seconds/i.test(m) ? 'Calma — acabamos de mandar um código. Espera um minutinho e tenta de novo.' : 'Não conseguimos enviar o código agora. Tenta de novo em instantes ou fala com a gente.';
      if ($('t-senha').classList.contains('ativa')) LEV.mostrarErro('erroSenha', msg); else LEV.mostrarErro('erroWhats', msg);
      LEV.toast(msg); console.warn(e);
    }
  }
  async function reenviar() { await pedirCodigo(S.finalidade); LEV.toast('Código reenviado 🤍'); }
  function contagem(seg) {
    var link = $('reenviar'); clearInterval(S.reenvio); var faltam = seg;
    link.disabled = true; link.style.opacity = .5; link.textContent = 'Reenviar código em ' + faltam + ' s';
    S.reenvio = setInterval(function () { faltam--; if (faltam <= 0) { clearInterval(S.reenvio); link.disabled = false; link.style.opacity = 1; link.textContent = 'Não chegou? Reenviar código'; return; } link.textContent = 'Reenviar código em ' + faltam + ' s'; }, 1000);
  }
  function ligarOtp() {
    var caixas = qsa('#otp input');
    caixas.forEach(function (c, i) {
      c.addEventListener('input', function () {
        var v = LEV.soDigitos(c.value);
        if (v.length > 1) { v.split('').slice(0, caixas.length - i).forEach(function (d, k) { caixas[i + k].value = d; caixas[i + k].classList.add('cheia'); }); caixas[Math.min(i + v.length, caixas.length - 1)].focus(); }
        else { c.value = v; c.classList.toggle('cheia', !!v); if (v && i < caixas.length - 1) caixas[i + 1].focus(); }
        if (caixas.every(function (x) { return x.value; })) conferirOtp();
      });
      c.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !c.value && i > 0) caixas[i - 1].focus(); });
    });
  }
  async function conferirOtp() {
    LEV.esconderErro('erroOtp');
    var codigo = qsa('#otp input').map(function (x) { return x.value; }).join('');
    try {
      var r = await sb.auth.verifyOtp({ phone: S.e164, token: codigo, type: 'sms' });
      if (r.error) throw r.error;
      if (!S.conta.tem_senha || S.finalidade === 'recuperacao') { $('criarTitulo').textContent = (S.finalidade === 'recuperacao' ? 'Crie a sua nova senha' : 'Você já está dentro' + (S.conta.primeiro_nome ? ', ' + S.conta.primeiro_nome : '') + ' 🤍'); tela('t-criar'); return; }
      await entrar();
    } catch (e) {
      LEV.mostrarErro('erroOtp', 'O código não conferiu ou venceu. Tenta de novo, com calma — ou pede um novo ali embaixo.');
      qsa('#otp input').forEach(function (x) { x.value = ''; x.classList.remove('cheia'); }); qsa('#otp input')[0].focus();
    }
  }
  function medirForca(v) {
    var p = 0; if (v.length >= 8) p++; if (v.length >= 12) p++; if (/[a-zA-Z]/.test(v) && /\d/.test(v)) p++; if (/[^a-zA-Z0-9]/.test(v)) p++;
    $('forca').className = 'forca' + (v.length ? ' f' + Math.max(1, p) : '');
    $('forcaRot').textContent = v.length === 0 ? 'Mínimo de 8 caracteres' : v.length < 8 ? 'Faltam ' + (8 - v.length) + ' caracteres' : ['Fraquinha ainda', 'Dá pra melhorar', 'Boa', 'Forte 💪'][Math.max(0, p - 1)];
  }
  async function criarSenha() {
    LEV.esconderErro('erroCriar');
    var v = $('nova').value; if (v.length < 8) return LEV.mostrarErro('erroCriar', 'A senha precisa de pelo menos 8 caracteres.');
    var b = $('btnCriar'); b.disabled = true;
    try {
      var r = await sb.auth.updateUser({ password: v }); if (r.error) throw r.error;
      await LEV.rpc('ls_cli_senha_definida');
      LEV.toast('Senha criada 🤍'); await entrar();
    } catch (e) { LEV.mostrarErro('erroCriar', erroDe(e)); }
    finally { b.disabled = false; }
  }
  async function sair() { if (!confirm('Sair da sua conta?')) return; await sb.auth.signOut(); logado(false); S.dados = null; tela('t-whats'); }

  /* ───── área logada ───── */
  async function entrar() {
    try {
      S.dados = await LEV.rpc('ls_cli_inicio');
    } catch (e) {
      var er = LEV.erro(e);
      if (er.code === 'SEM_CONTA') { await sb.auth.signOut(); logado(false); tela('t-semconta'); return; }
      LEV.toast(er.message); console.warn(e); return;
    }
    logado(true);
    $('avatar').textContent = (S.dados.pessoa.nome || '··').split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
    desenharInicio(); irTab('inicio');
    LEV.evento('conta_entrou', '/minha-conta');
  }
  function irTab(tab) {
    tela('t-' + tab);
    qsa('nav.inferior button').forEach(function (b) { b.classList.remove('ativa'); });
    var alvo = $('nav-' + tab); if (alvo) alvo.classList.add('ativa');
    if (tab === 'pagamentos') desenharPag(); if (tab === 'meu') desenharMeu(); if (tab === 'ajuda') desenharAjuda(); if (tab === 'cx1') desenharMotivos();
  }
  function desenharInicio() {
    var d = S.dados, a = d.assinatura, p = d.pessoa;
    $('olaNome').textContent = 'Oi, ' + LEV.primeiroNome(p.nome) + ' 🤍';
    var cm = $('cardMensal'); cm.innerHTML = '';
    if (a) {
      var cls = a.situacao === 'em_dia' ? 'em-dia' : a.situacao === 'inadimplente' ? 'atraso' : 'pendente';
      var ic = a.situacao === 'em_dia' ? '✅' : a.situacao === 'inadimplente' ? '⚠️' : a.situacao === 'pausada' ? '⏸' : '⏳';
      var t, dsc, btn = '';
      if (a.situacao === 'em_dia') { t = 'Mensalidade em dia'; dsc = a.proximo_vencimento ? 'Próxima: ' + LEV.dataBR(a.proximo_vencimento) + ' — ' + LEV.brl(a.valor_aberto) + (a.meio_pagamento === 'cartao' ? ' no cartão, no automático.' : ' no Pix. A casa segue com tudo em dia.') : 'A casa segue com tudo em dia.'; }
      else if (a.situacao === 'inadimplente') { t = 'Mensalidade em atraso — ' + LEV.brl(a.valor_aberto); dsc = 'Venceu em ' + LEV.dataBR(a.proximo_vencimento) + '. Enquanto não regularizar, as sessões saem pelo valor particular. Pagando agora, a condição de membro volta na hora.'; btn = '<button class="btn btn-pri" style="margin-top:12px;padding:13px;font-size:.92rem;width:100%" onclick="CONTA.pagar()">Pagar agora</button>'; }
      else if (a.situacao === 'aguardando_pagamento') { t = 'Primeira mensalidade — ' + LEV.brl(a.valor_aberto); dsc = 'Falta só o pagamento para a casa inteira ficar ativa.'; btn = '<button class="btn btn-pri" style="margin-top:12px;padding:13px;font-size:.92rem;width:100%" onclick="CONTA.pagar()">Pagar agora</button>'; }
      else if (a.situacao === 'pausada') { t = 'Assinatura pausada'; dsc = 'Volta sozinha em ' + LEV.dataBR(a.pausada_ate) + ', sem cobrança até lá. Sua vaga e seu histórico estão guardados.'; }
      else { t = 'Assinatura ' + a.situacao; dsc = 'Quando quiser voltar, está tudo guardado aqui.'; btn = '<a class="btn btn-pri" style="margin-top:12px;padding:13px;font-size:.92rem" href="/assinar/">Ativar de novo</a>'; }
      cm.innerHTML = '<div class="card ' + cls + '"><div class="status-mensal"><div class="status-ic">' + ic + '</div><div><div class="status-t">' + t + '</div><div class="status-d">' + dsc + '</div></div></div>' + btn + '</div>';
    }
    var ce = $('cardEmpresa'); ce.innerHTML = '';
    if (d.colaborador) ce.innerHTML = '<div class="card lav"><div class="status-mensal"><div class="status-ic" style="background:#fff">🏢</div><div><div class="status-t" style="color:var(--indigo)">Ativado pela ' + d.colaborador.empresa + '</div><div class="status-d">Sem mensalidade para você e para a sua família. Cada sessão sai pelo valor de membro, paga no dia.</div></div></div></div>';
    var la = $('listaAg'); la.innerHTML = '';
    if (!d.agendamentos || !d.agendamentos.length) la.innerHTML = '<p class="sub">Nenhuma sessão marcada por enquanto. <a href="#" id="lnkMarcar">Quer marcar? Fala com a gente 🤍</a></p>';
    else d.agendamentos.forEach(function (g) {
      var dt = new Date(g.data + 'T12:00:00'); var dia = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][dt.getDay()];
      la.innerHTML += '<div class="ag"><div class="dia"><b>' + String(dt.getDate()).padStart(2, '0') + '</b><small>' + dia + '</small></div><div><div class="item-t">' + String(g.horario).slice(0, 5) + ' · ' + (g.profissional || 'psicólogo(a)') + '</div><div class="item-d">' + (g.quem ? g.quem + ' · ' : '') + (g.status || '') + '</div></div></div>';
    });
    var lk = $('lnkMarcar'); if (lk) LEV.linkWhats('Oi! Quero marcar uma sessão 🤍').then(function (u) { lk.href = u; lk.target = '_blank'; });
  }
  async function pagar() {
    var a = S.dados.assinatura; if (!a || !a.cobranca_aberta_id) return;
    if (a.pix_copia_cola) { try { await navigator.clipboard.writeText(a.pix_copia_cola); LEV.toast('Código Pix copiado — cola no app do banco 🤍'); } catch (e) { prompt('Copie o código Pix:', a.pix_copia_cola); } return; }
    if (a.checkout_url) { window.open(a.checkout_url, '_blank'); return; }
    var u = await LEV.linkWhats('Oi! Quero pagar a minha mensalidade do Lev Soul (cobrança ' + a.cobranca_aberta_id + ') 🤍'); window.open(u, '_blank');
  }
  async function desenharPag() {
    var alvo = $('listaPag'); alvo.innerHTML = '<p class="sub">Carregando…</p>';
    try {
      var lista = await LEV.rpc('ls_cli_pagamentos'); alvo.innerHTML = '';
      if (!lista.length) { alvo.innerHTML = '<p class="sub">Nenhuma cobrança por aqui ainda.</p>'; return; }
      lista.forEach(function (c) {
        var tag = c.situacao === 'paga' ? '<span class="chip ok">✓ Pago</span>' : c.situacao === 'atrasada' ? '<span class="chip erro">Em atraso</span>' : c.situacao === 'aberta' ? '<span class="chip pend">Pendente</span>' : '<span class="chip neutro">' + c.situacao + '</span>';
        alvo.innerHTML += '<div class="item-lista' + (c.situacao === 'aberta' || c.situacao === 'atrasada' ? ' destaque' : '') + '"><div><div class="item-t">Mensalidade · ' + LEV.dataCurta(c.periodo_inicio) + ' a ' + LEV.dataCurta(c.periodo_fim) + '</div><div class="item-d">' + (c.paga_em ? 'pago em ' + LEV.dataBR(c.paga_em) + (c.meio ? ' · ' + c.meio : '') : 'vence em ' + LEV.dataBR(c.vencimento)) + '</div>' + tag + '</div><div class="item-v">' + LEV.brl(c.valor) + '</div></div>';
      });
    } catch (e) { alvo.innerHTML = '<p class="sub">' + erroDe(e) + '</p>'; }
  }
  function desenharMeu() {
    var d = S.dados, a = d.assinatura, c = S.cfg;
    var fam = (d.familia || []).map(function (m) { return '<span class="membro">' + m.nome + ' <span class="par">· ' + (m.parentesco || m.papel) + '</span></span>'; }).join('');
    $('cardAss').innerHTML = '<div class="preco"><div class="bloco"><div class="valor">' + (d.colaborador ? 'R$ 0' : LEV.brlInt(c.mensalidade)) + '<span style="font-size:.75rem">/mês</span></div><div class="desc">' + (d.colaborador ? 'ativado pela sua empresa' : 'ativa o acesso da casa inteira') + '</div></div><div class="bloco"><div class="valor">' + LEV.brlInt(c.sessao) + '</div><div class="desc">por sessão — paga só quando acontece</div></div></div><div class="divisor"></div>' +
      (a ? '<div class="linha"><span class="k">Ativa desde</span><span class="v">' + LEV.dataBR(a.ativa_desde || a.aceite_em) + '</span></div><div class="linha"><span class="k">Situação</span><span class="v">' + ({ em_dia: 'em dia', inadimplente: 'em atraso', aguardando_pagamento: 'aguardando pagamento', pausada: 'pausada', cancelada: 'encerrada', encerrada: 'encerrada' }[a.situacao] || a.situacao) + '</span></div><div class="linha"><span class="k">Vencimento</span><span class="v">' + (a.proximo_vencimento ? 'dia ' + LEV.dataBR(a.proximo_vencimento).slice(0, 2) + ' de cada mês' : '—') + '</span></div>' : '') +
      '<div class="linha"><span class="k">Titular</span><span class="v">' + d.pessoa.nome + '</span></div><div class="divisor"></div><div class="linha" style="display:block"><span class="k">Família</span><br>' + (fam || '<span class="dica">Só você por enquanto.</span>') + '</div><p class="dica" style="margin-top:10px">Sem limite de pessoas — quanto mais gente com acesso, melhor pra casa.</p>';
    $('btnEncerrar').style.display = (a && ['em_dia', 'inadimplente', 'aguardando_pagamento'].indexOf(a.situacao) >= 0) ? 'inline-block' : 'none';
  }
  function verContrato() {
    var d = S.dados, a = d.assinatura; tela('t-contrato'); $('nav-meu').classList.add('ativa');
    $('cardContrato').innerHTML = a ? '<div class="linha"><span class="k">Versão</span><span class="v">' + String(a.aceite_contrato_versao || '').replace('provisorio-', '') + '</span></div><div class="linha"><span class="k">Aceito em</span><span class="v">' + (a.aceite_em ? new Date(a.aceite_em).toLocaleString('pt-BR') : '—') + '</span></div><div class="linha"><span class="k">Assinado via</span><span class="v">código WhatsApp ' + (a.aceite_whatsapp_mascarado || '') + '</span></div><div class="linha"><span class="k">Registro</span><span class="v" style="font-family:monospace;font-size:.7rem;word-break:break-all">' + (a.aceite_hash || '').slice(0, 24) + '…</span></div>' : '<p class="sub">Seu acesso é ativado pela sua empresa; o termo empresarial está disponível com a equipe.</p>';
    $('contratoCorpo').innerHTML = LEV_CONTRATO.html(S.cfg);
  }
  function imprimir() {
    var a = S.dados.assinatura || {}; var imp = $('impressao');
    imp.innerHTML = '<h2 style="font-family:Sora">Termo de Adesão · Assinatura Lev Soul</h2><p>Titular: ' + S.dados.pessoa.nome + ' · CPF ' + LEV.mCpf(S.dados.pessoa.cpf || '') + '<br>Aceito em ' + (a.aceite_em ? new Date(a.aceite_em).toLocaleString('pt-BR') : '') + ' · versão ' + String(a.aceite_contrato_versao || '').replace('provisorio-', '') + '<br>Registro: ' + (a.aceite_hash || '') + '</p>' + LEV_CONTRATO.html(S.cfg);
    imp.style.display = 'block'; window.print(); setTimeout(function () { imp.style.display = 'none'; }, 500);
  }
  async function desenharAjuda() {
    $('chkOptin').checked = !!S.dados.consentimento;
    var alvo = $('listaSol'); alvo.innerHTML = '<p class="sub">Carregando…</p>';
    try {
      var lista = await LEV.rpc('ls_cli_solicitacoes'); alvo.innerHTML = '';
      if (!lista.length) { alvo.innerHTML = '<p class="sub">Nenhuma solicitação por aqui ainda. 🤍</p>'; return; }
      var nomes = { estorno: 'Pedir estorno', familia: 'Alterar a família', remarcacao: 'Remarcar uma sessão', pausa: 'Pausa', cancelamento: 'Encerramento', outro: 'Outro assunto' };
      lista.forEach(function (s) {
        var tag = s.situacao === 'aprovada' || s.situacao === 'concluida' ? '<span class="chip ok">✓ ' + s.situacao + '</span>' : s.situacao === 'negada' ? '<span class="chip erro">não foi possível</span>' : '<span class="chip neutro">em análise</span>';
        alvo.innerHTML += '<div class="item-lista" style="display:block"><div class="item-t">' + (nomes[s.tipo] || s.tipo) + '</div><div class="item-d">' + LEV.dataBR(s.criado_em) + (s.texto ? ' · ' + s.texto.slice(0, 80) : '') + '</div>' + tag + (s.resposta ? '<div class="item-d" style="margin-top:6px;color:var(--grafite)">↳ ' + s.resposta + '</div>' : '') + '</div>';
      });
    } catch (e) { alvo.innerHTML = '<p class="sub">' + erroDe(e) + '</p>'; }
  }
  function novaSolicitacao(tipo) {
    S.solTipo = tipo;
    $('solTitulo').textContent = { estorno: 'Pedir estorno', familia: 'Alterar a família da assinatura', remarcacao: 'Remarcar uma sessão', outro: 'Outro assunto' }[tipo] || 'Pedir';
    $('solMsg').value = ''; irTab('ajuda'); $('veu').classList.add('mostrar'); $('sheetSol').classList.add('mostrar'); setTimeout(function () { $('solMsg').focus(); }, 400);
  }
  function fecharSheet() { $('veu').classList.remove('mostrar'); $('sheetSol').classList.remove('mostrar'); }
  async function enviarSolicitacao() {
    var msg = $('solMsg').value.trim(); if (msg.length < 3) return LEV.toast('Escreve pra gente o que você precisa, do seu jeito.');
    try { await LEV.rpc('ls_cli_solicitar', { p_tipo: S.solTipo, p_texto: msg }); fecharSheet(); LEV.toast('Recebido. A equipe responde em até 1 dia útil — aqui e no seu WhatsApp. 🤍'); desenharAjuda(); }
    catch (e) { LEV.toast(erroDe(e)); }
  }
  async function consentimento(ligar) {
    try { await LEV.rpc('ls_cli_consentimento', { p_ligar: !!ligar, p_aparelho: LEV.aparelho() }); S.dados.consentimento = !!ligar; LEV.toast(ligar ? 'Combinado: conteúdos e novidades ligados 🤍' : 'Pronto — só as mensagens do serviço daqui em diante.'); }
    catch (e) { LEV.toast(erroDe(e)); $('chkOptin').checked = !ligar; }
  }
  /* C6 · encerrar com retenção */
  function desenharMotivos() {
    var ops = [['preco', 'O preço apertou'], ['corrida', 'A vida está corrida'], ['nao_uso', 'Não estou usando'], ['momento', 'O momento da terapia mudou'], ['outro', 'Outro motivo'], ['nao_dizer', 'Prefiro não dizer']];
    $('motivos').innerHTML = ops.map(function (o) { return '<button class="opcao" onclick="CONTA.escolherMotivo(\'' + o[0] + '\')"><span>' + o[1] + '</span></button>'; }).join('');
  }
  function escolherMotivo(m) {
    S.motivo = m; var a = S.dados.assinatura; var podePausar = a && a.situacao === 'em_dia' && !a.ja_pausou;
    var h = '';
    if ((m === 'corrida' || m === 'nao_uso') && podePausar) h = '<h1>Que tal uma pausa?</h1><p class="sub">30 dias sem cobrança, com sua vaga e seu histórico guardados. Voltar é um toque. 🤍</p><button class="btn btn-pri btn-bloco" onclick="CONTA.pausar()" style="margin-top:16px">Pausar 30 dias</button>';
    else if (m === 'preco') h = '<h1>Entendo — e dá pra respirar.</h1><p class="sub">A mensalidade pode pausar por 30 dias, e as sessões continuam disponíveis pelo valor de membro, só quando você usar.</p>' + (podePausar ? '<button class="btn btn-pri btn-bloco" onclick="CONTA.pausar()" style="margin-top:16px">Pausar 30 dias</button>' : '');
    else if (m === 'momento') h = '<h1>Quer conversar com a gente antes?</h1><p class="sub">Às vezes é troca de profissional, não de caminho. Trocamos sem custo e sem constrangimento.</p><button class="btn btn-pri btn-bloco" onclick="CONTA.novaSolicitacao(\'outro\')" style="margin-top:16px">Conversar com a equipe</button>';
    else h = '<h1>Tudo bem.</h1><p class="sub">Decisão de cuidado se toma com calma — e a porta fica aberta.</p>';
    h += '<button class="btn btn-sec btn-bloco" onclick="CONTA.cancelar()" style="margin-top:12px">Encerrar a assinatura</button><p class="micro">Sem multa. Vale a partir do próximo vencimento. Quando quiser voltar, está tudo guardado aqui.</p>';
    $('oferta').innerHTML = h; tela('t-cx2');
  }
  async function pausar() {
    try { var r = await LEV.rpc('ls_cli_pausar', { p_motivo: S.motivo }); $('cx3titulo').textContent = 'Pausa registrada 🤍'; $('cx3texto').textContent = 'Sua assinatura volta sozinha em ' + LEV.dataBR(r.pausada_ate) + '. Sem cobrança até lá; sua vaga e seu histórico ficam guardados.'; tela('t-cx3'); }
    catch (e) { LEV.toast(erroDe(e)); }
  }
  async function cancelar() {
    if (!confirm('Encerrar a assinatura agora? Sem multa — e quando quiser voltar, está tudo guardado.')) return;
    try { await LEV.rpc('ls_cli_cancelar', { p_motivo: S.motivo }); $('cx3titulo').textContent = 'Assinatura encerrada.'; $('cx3texto').textContent = 'Obrigada por ter caminhado com a gente. Quando quiser voltar, está tudo guardado aqui. Alma leve. 🤍'; tela('t-cx3'); }
    catch (e) { LEV.toast(erroDe(e)); }
  }

  init();
  return { voltarWhats: voltarWhats, pedirCodigo: pedirCodigo, reenviar: reenviar, entrar: entrar, irTab: irTab, verContrato: verContrato, imprimir: imprimir, novaSolicitacao: novaSolicitacao, fecharSheet: fecharSheet, pagar: pagar, escolherMotivo: escolherMotivo, pausar: pausar, cancelar: cancelar };
})();
