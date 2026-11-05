/* Lev Soul · fluxo de contratação (A0 → A4), usado por /assinar/ (porta site) e /c/ (porta assistida) */
(function () {
  var $ = LEV.$, qsa = LEV.qsa;
  var F = { modo: document.body.getAttribute('data-modo') || 'site', token: null, dados: null, familia: [], cfg: null, poll: null, reenvio: null, codigoPedido: false };

  function setProgresso(n) {
    qsa('.p-item').forEach(function (it, i) { it.classList.remove('atual', 'feito'); if (i + 1 < n || n === 4) it.classList.add('feito'); if (i + 1 === n) it.classList.add('atual'); });
    $('progresso').style.display = n ? 'flex' : 'none';
  }
  function tela(id, prog) { LEV.irPara(id); if (prog !== undefined) setProgresso(prog); }
  function falhou(e, idErro) { var er = LEV.erro(e); LEV.mostrarErro(idErro, er.message); LEV.toast(er.message); console.warn(er); }

  async function init() {
    F.cfg = await LEV.config();
    LEV.montarFlutuante('Oi! Estou ativando o Lev Soul pelo site e preciso de uma ajuda 🤍');
    LEV.preencherValores();
    var p = new URLSearchParams(location.search);
    F.token = p.get('t');
    if (F.token) { await abrir(); return; }
    if (F.modo === 'convite') { tela('t-inexistente', 0); return; }
    LEV.evento('a0_abriu', '/assinar');
    tela('t-a0', 0);
  }

  async function abrir() {
    try {
      var d = await LEV.rpc('ls_site_convite_abrir', { p_token: F.token, p_sessao: LEV.sessao(), p_aparelho: LEV.aparelho() });
      F.dados = d;
      if (d.situacao === 'inexistente') { tela('t-inexistente', 0); return; }
      if (d.situacao === 'vencido' || d.situacao === 'cancelado') { tela('t-vencido', 0); return; }
      if (d.assinatura && d.assinatura.id) {
        if (d.assinatura.situacao === 'aguardando_pagamento') { montarA3(d.cobranca, d.assinatura.meio); return; }
        montarA4(); return;
      }
      montarA1(d);
    } catch (e) { tela('t-inexistente', 0); console.warn(e); }
  }

  /* ───── A0 (só porta site) ───── */
  function validarA0() {
    LEV.esconderErro('a0erro');
    var nome = $('a0nome').value.trim(), whats = $('a0whats').value, cpf = $('a0cpf').value;
    if (nome.split(' ').filter(Boolean).length < 2) return LEV.mostrarErro('a0erro', 'Escreve o nome completo, com calma — nome e sobrenome.');
    if (!LEV.whatsValido(whats)) return LEV.mostrarErro('a0erro', 'Confere o WhatsApp com DDD. É por ele que o código chega.');
    if (LEV.soDigitos(cpf) && !LEV.cpfValido(cpf)) return LEV.mostrarErro('a0erro', 'O CPF não conferiu. Dá uma olhada nos números?');
    var b = $('btnA0'); b.disabled = true;
    LEV.rpc('ls_site_iniciar', { p_nome: nome, p_whatsapp: LEV.soDigitos(whats), p_cpf: LEV.soDigitos(cpf) || null, p_familia: F.familia, p_ref: LEV.ref(), p_sessao: LEV.sessao(), p_aparelho: LEV.aparelho() })
      .then(function (r) {
        F.token = r.token;
        try { history.replaceState(null, '', location.pathname + '?t=' + r.token); } catch (e) { }
        return abrir();
      })
      .catch(function (e) { falhou(e, 'a0erro'); })
      .finally(function () { b.disabled = false; });
  }

  /* ───── A1 ───── */
  function montarA1(d) {
    $('a1titulo').textContent = 'Que bom ter você aqui, ' + (d.primeiro_nome || '') + ' 🤍';
    $('vNome').textContent = d.nome;
    $('vCpf').value = d.cpf ? LEV.mCpf(d.cpf) : '';
    F.familia = Array.isArray(d.familia) ? d.familia : [];
    desenharFamilia();
    $('contratoCorpo').innerHTML = LEV_CONTRATO.html(F.cfg);
    $('txtAceite').innerHTML = 'Li e concordo com o Termo de Adesão (versão ' + LEV_CONTRATO.versaoHumana(F.cfg) + ')';
    $('chkAceite').checked = false; $('btnAceitar').disabled = true;
    tela('t-a1', 1);
    setTimeout(function () { if (!d.cpf) $('vCpf').focus(); }, 400);
  }
  function desenharFamilia() {
    var alvo = $('listaFamilia'); alvo.innerHTML = '';
    if (!F.familia.length) { alvo.innerHTML = '<span class="dica">Só você por enquanto — dá pra incluir a família agora ou depois.</span>'; return; }
    F.familia.forEach(function (m, i) {
      var el = document.createElement('span'); el.className = 'membro';
      el.innerHTML = m.nome + ' <span class="par">· ' + (m.parentesco || 'família') + '</span><button type="button" aria-label="remover" data-i="' + i + '">×</button>';
      el.querySelector('button').onclick = function () { F.familia.splice(i, 1); desenharFamilia(); };
      alvo.appendChild(el);
    });
  }
  function toggleMembro() { $('formMembro').classList.toggle('aberto'); $('fmNome').focus(); }
  function addMembro() {
    var n = $('fmNome').value.trim(); var nasc = $('fmNasc').value;
    if (n.length < 2) return LEV.toast('Escreve o nome de quem entra na casa.');
    F.familia.push({ nome: n, parentesco: $('fmPar').value, nascimento: nasc || null });
    $('fmNome').value = ''; $('fmNasc').value = ''; $('formMembro').classList.remove('aberto'); desenharFamilia();
  }
  async function validarA1() {
    LEV.esconderErro('a1erro');
    var cpf = LEV.soDigitos($('vCpf').value);
    if (!LEV.cpfValido(cpf)) { LEV.mostrarErro('a1erro', 'Confirma seu CPF ali em cima — precisa dos 11 dígitos, e eles precisam conferir.'); $('vCpf').focus(); return; }
    F.cpf = cpf;
    var b = $('btnAceitar'); b.disabled = true;
    try {
      await pedirCodigo();
      tela('t-a2', 2);
      setTimeout(function () { var c = qsa('#otp input'); c.forEach(function (x) { x.value = ''; x.classList.remove('cheia'); }); c[0].focus(); }, 380);
    } catch (e) { falhou(e, 'a1erro'); }
    finally { b.disabled = false; }
  }

  /* ───── A2 · código ───── */
  async function pedirCodigo() {
    var r = await LEV.rpc('ls_site_codigo_enviar', { p_token: F.token, p_finalidade: 'aceite', p_aparelho: LEV.aparelho() });
    $('a2sub').innerHTML = 'Número terminado em <strong>' + (r.whatsapp_mascarado || F.dados.whatsapp_mascarado) + '</strong>';
    contagem(r.ok ? (r.reenvio_seg || 60) : (r.segundos || 60));
    LEV.esconderErro('a2erro');
    return r;
  }
  function contagem(seg) {
    var link = $('reenviar'); clearInterval(F.reenvio); var faltam = seg;
    link.disabled = true; link.style.opacity = .5; link.textContent = 'Reenviar código em ' + faltam + ' s';
    F.reenvio = setInterval(function () { faltam--; if (faltam <= 0) { clearInterval(F.reenvio); link.disabled = false; link.style.opacity = 1; link.textContent = 'Não chegou? Reenviar código'; return; } link.textContent = 'Reenviar código em ' + faltam + ' s'; }, 1000);
  }
  function ligarOtp() {
    var caixas = qsa('#otp input');
    caixas.forEach(function (c, i) {
      c.addEventListener('input', function () {
        var v = LEV.soDigitos(c.value);
        if (v.length > 1) { v.split('').slice(0, caixas.length - i).forEach(function (d, k) { caixas[i + k].value = d; caixas[i + k].classList.add('cheia'); }); var prox = Math.min(i + v.length, caixas.length - 1); caixas[prox].focus(); }
        else { c.value = v; c.classList.toggle('cheia', !!v); if (v && i < caixas.length - 1) caixas[i + 1].focus(); }
        if (caixas.every(function (x) { return x.value; })) conferirCodigo();
      });
      c.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !c.value && i > 0) caixas[i - 1].focus(); });
      c.addEventListener('paste', function (e) { var t = (e.clipboardData || window.clipboardData).getData('text'); var d = LEV.soDigitos(t).slice(0, caixas.length); if (d.length === caixas.length) { e.preventDefault(); caixas.forEach(function (x, k) { x.value = d[k]; x.classList.add('cheia'); }); conferirCodigo(); } });
    });
  }
  async function conferirCodigo() {
    if (F.codigoPedido) return; F.codigoPedido = true;
    var codigo = qsa('#otp input').map(function (x) { return x.value; }).join('');
    try {
      var hash = await LEV_CONTRATO.hash(F.cfg);
      var r = await LEV.rpc('ls_site_aceitar', { p_token: F.token, p_codigo: codigo, p_cpf: F.cpf, p_familia: F.familia, p_contrato_hash: hash, p_optin_relacionamento: !!$('chkOptin').checked, p_aparelho: LEV.aparelho(), p_sessao: LEV.sessao() });
      if (r.ok) { LEV.esconderErro('a2erro'); F.dados.assinatura = { id: r.assinatura_id, situacao: 'aguardando_pagamento' }; montarA3({ id: r.cobranca_id, valor: r.valor, situacao: 'aberta' }, null); return; }
      var msg = r.motivo === 'vencido' ? 'Esse código venceu. Pede um novo ali embaixo que a gente manda outro, fresquinho.'
        : r.motivo === 'bloqueado' ? 'Foram muitas tentativas. Pede um código novo ali embaixo.'
        : 'O código não conferiu. Tenta de novo, com calma (' + (r.restam != null ? r.restam : '') + ' de 5).';
      LEV.mostrarErro('a2erro', msg);
      qsa('#otp input').forEach(function (x) { x.value = ''; x.classList.remove('cheia'); }); qsa('#otp input')[0].focus();
    } catch (e) {
      var er = LEV.erro(e);
      if (er.code === 'JA_TEM') { LEV.mostrarErro('a2erro', er.message + ' <a href="/minha-conta/">Entrar na minha conta →</a>'); return; }
      falhou(e, 'a2erro');
    } finally { F.codigoPedido = false; }
  }
  async function reenviar() { try { await pedirCodigo(); LEV.toast('Código reenviado 🤍'); } catch (e) { falhou(e, 'a2erro'); } }

  /* ───── A3 · pagar ───── */
  function montarA3(cob, meio) {
    tela('t-a3', 3);
    $('a3valor').textContent = LEV.brl(cob && cob.valor != null ? cob.valor : F.cfg.mensalidade);
    trocarAba(meio || 'cartao', true);
    renderPagamento(cob || {}, meio);
    clearInterval(F.poll);
    F.poll = setInterval(verificarEstado, 6000);
  }
  async function trocarAba(meio, silencioso) {
    qsa('#abas button').forEach(function (b) { b.classList.toggle('ativa', b.getAttribute('data-meio') === meio); });
    $('pag-cartao').classList.toggle('ativa', meio === 'cartao'); $('pag-pix').classList.toggle('ativa', meio === 'pix');
    if (silencioso) return;
    try { var r = await LEV.rpc('ls_site_pagamento_escolher', { p_token: F.token, p_meio: meio, p_sessao: LEV.sessao() }); renderPagamento(r, meio); }
    catch (e) { LEV.toast(LEV.erro(e).message); }
  }
  function renderPagamento(cob, meio) {
    var plat = (cob && cob.plataforma) || {};
    /* cartão: a plataforma de pagamento devolve um link/checkout em plataforma_dados.checkout_url (plugado depois) */
    var cc = $('cartaoCorpo');
    if (plat.checkout_url) {
      cc.innerHTML = '<div class="aviso-neutro">O cartão é digitado na página segura da nossa plataforma de pagamento — os dados nunca passam por aqui. Marque "usar nas próximas mensalidades" para a casa ficar no automático.</div><a class="btn btn-pri btn-bloco" target="_blank" rel="noopener" href="' + plat.checkout_url + '">Pagar ' + LEV.brl(cob.valor) + ' no cartão</a><div class="aguardando" style="margin-top:14px"><span class="pontinhos"><span></span><span></span><span></span></span> Aguardando a confirmação</div>';
    } else {
      cc.innerHTML = '<div class="aviso-neutro">Estamos preparando o seu pagamento no cartão. Assim que estiver pronto, esta tela se atualiza sozinha — e, se preferir, a equipe conclui com você pelo WhatsApp.</div><div class="aguardando"><span class="pontinhos"><span></span><span></span><span></span></span> Preparando</div><a class="btn btn-sec btn-bloco" id="btnWaPag" href="#">💬 Concluir com a equipe no WhatsApp</a>';
      LEV.linkWhats('Oi! Aceitei o Lev Soul pelo site e quero concluir o pagamento da mensalidade. Meu código: ' + F.token).then(function (u) { var b = $('btnWaPag'); if (b) { b.href = u; b.target = '_blank'; } });
    }
    var px = $('pixCorpo');
    if (cob && cob.pix_copia_cola) {
      px.innerHTML = '<div id="qr" style="display:flex;justify-content:center;margin-top:12px"></div><button class="btn btn-sec btn-bloco" id="btnCopiarPix">Copiar código Pix</button><div class="pix-copia">' + cob.pix_copia_cola + '</div><div class="aviso-neutro"><b>1.</b> Toque em "Copiar código Pix" · <b>2.</b> App do banco → Pix → Copia e Cola · <b>3.</b> Cole e confirme — a confirmação chega aqui sozinha.</div><div class="aguardando"><span class="pontinhos"><span></span><span></span><span></span></span> Aguardando o banco confirmar</div>';
      if (window.QRCode) { try { new QRCode($('qr'), { text: cob.pix_copia_cola, width: 196, height: 196, colorDark: '#232043', colorLight: '#ffffff' }); } catch (e) { } }
      $('btnCopiarPix').onclick = function () { navigator.clipboard && navigator.clipboard.writeText(cob.pix_copia_cola).then(function () { LEV.toast('Código Pix copiado'); }); };
    } else {
      px.innerHTML = '<div class="aviso-neutro">O Pix da primeira mensalidade está sendo gerado. Esta tela se atualiza sozinha; se preferir, a equipe manda o Pix pelo WhatsApp.</div><div class="aguardando"><span class="pontinhos"><span></span><span></span><span></span></span> Preparando</div><a class="btn btn-sec btn-bloco" id="btnWaPix" href="#">💬 Receber o Pix pelo WhatsApp</a>';
      LEV.linkWhats('Oi! Aceitei o Lev Soul pelo site e prefiro pagar a mensalidade no Pix. Meu código: ' + F.token).then(function (u) { var b = $('btnWaPix'); if (b) { b.href = u; b.target = '_blank'; } });
    }
  }
  async function verificarEstado() {
    try {
      var r = await LEV.rpc('ls_site_estado', { p_token: F.token });
      if (r.assinatura && r.assinatura !== 'aguardando_pagamento') { clearInterval(F.poll); F.dados.assinatura = { situacao: r.assinatura }; F.dados.proximo_vencimento = r.proximo_vencimento; montarA4(r); return; }
      if (r.cobranca) { var meioAtivo = (LEV.qs('#abas button.ativa') || {}).getAttribute ? LEV.qs('#abas button.ativa').getAttribute('data-meio') : 'cartao'; if ((r.cobranca.pix_copia_cola && !$('btnCopiarPix')) || (r.cobranca.plataforma && r.cobranca.plataforma.checkout_url && !LEV.qs('#cartaoCorpo a.btn-pri'))) renderPagamento(r.cobranca, meioAtivo); }
    } catch (e) { }
  }

  /* ───── A4 ───── */
  function montarA4(r) {
    clearInterval(F.poll);
    tela('t-a4', 4);
    var nome = (r && r.primeiro_nome) || (F.dados && F.dados.primeiro_nome) || '';
    $('a4titulo').textContent = 'Tudo certo' + (nome ? ', ' + nome : '') + ' 🤍';
    var venc = (r && r.proximo_vencimento) || (F.dados && F.dados.proximo_vencimento);
    $('a4venc').textContent = venc ? 'Próxima mensalidade em ' + LEV.dataBR(venc) : 'Mensalidade todo mês, no mesmo dia';
    LEV.evento('a4_confirmado', location.pathname, F.token);
  }

  /* ───── liga ───── */
  LEV.mascara($('a0cpf'), LEV.mCpf); LEV.mascara($('vCpf'), LEV.mCpf); LEV.mascara($('a0whats'), LEV.mWhats);
  ligarOtp();
  $('chkAceite').addEventListener('change', function () { $('btnAceitar').disabled = !this.checked; });
  window.FLUXO = { validarA0: validarA0, validarA1: validarA1, toggleMembro: toggleMembro, addMembro: addMembro, reenviar: reenviar, trocarAba: trocarAba };
  init();
})();
