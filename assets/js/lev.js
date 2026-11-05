/* Lev Soul · base do site (v1.0 · 05/11/2026)
   Supabase (chave publicável) + ajudantes compartilhados. Nada aqui é segredo:
   a chave publicável só alcança as funções ls_site_* / ls_cli_*, cada uma com a própria trava. */
window.LEV = (function () {
  var SB_URL = 'https://xcucoryngkkuszztpxyq.supabase.co';
  var SB_KEY = 'sb_publishable_6ATQUvqBBRS5xx7jAYKlmw_2FwTuHG7';
  var sb = window.supabase ? window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;

  var PADRAO = {
    mensalidade: 100, sessao: 60, particular: 150,
    rt_nome: 'Marinalva Ferreira', rt_crp: '09/9006',
    email: 'contato@levsoul.com.br', whatsapp_equipe: '',
    razao_social: 'Centro Médico e Especialidades Judithe Ferreira Ltda', cnpj: '25.408.736/0001-24',
    contrato_versao: 'provisorio-1.0', site_url: 'https://levsoul.com.br',
    aviso: 'O Lev Soul é um programa de assinatura que dá acesso a serviços de psicologia em condições de membro. Não é plano de saúde: não garante, não intermedeia risco e não custeia atendimentos, que são pagos diretamente pelo usuário quando realizados.'
  };
  var _config = null;

  function $(id) { return document.getElementById(id); }
  function qs(s, el) { return (el || document).querySelector(s); }
  function qsa(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

  function erro(e) {
    var msg = (e && (e.message || e.details || e.hint)) || 'Algo não deu certo. Tenta de novo, com calma.';
    var m = String(msg).match(/^([A-Z_]+):?\s*(.*)$/);
    return { code: m ? m[1] : 'ERRO', message: (m && m[2]) ? m[2] : msg, raw: e };
  }
  async function rpc(fn, args) {
    if (!sb) throw { code: 'SEM_SUPABASE', message: 'O site não conseguiu carregar a conexão. Recarrega a página?' };
    var r = await sb.rpc(fn, args || {});
    if (r.error) throw erro(r.error);
    return r.data;
  }
  async function config() {
    if (_config) return _config;
    try {
      var c = await rpc('ls_site_config');
      _config = Object.assign({}, PADRAO, c || {});
    } catch (e) { _config = Object.assign({}, PADRAO); }
    return _config;
  }

  /* sessão anônima do funil + ref */
  function sessao() {
    try {
      var s = localStorage.getItem('ls_sessao');
      if (!s) { s = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem('ls_sessao', s); }
      return s;
    } catch (e) { return 'anon'; }
  }
  function capturarRef() {
    try {
      var ref = new URLSearchParams(location.search).get('ref');
      if (ref) localStorage.setItem('ls_ref', JSON.stringify({ ref: ref.slice(0, 40), ate: Date.now() + 30 * 864e5 }));
    } catch (e) { }
  }
  function ref() {
    try {
      var r = JSON.parse(localStorage.getItem('ls_ref') || 'null');
      if (r && r.ate > Date.now()) return r.ref;
    } catch (e) { }
    return null;
  }
  function evento(nome, pagina, token, dados) {
    try { rpc('ls_site_evento', { p_sessao: sessao(), p_evento: nome, p_pagina: pagina || location.pathname, p_porta: token ? 'convite' : 'site', p_ref: ref(), p_token: token || null, p_dados: dados || null }).catch(function () { }); } catch (e) { }
  }
  function aparelho() { return (navigator.userAgent || '').slice(0, 200); }

  /* máscaras */
  function soDigitos(v) { return String(v || '').replace(/\D/g, ''); }
  function mCpf(v) { v = soDigitos(v).slice(0, 11); return v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2'); }
  function mWhats(v) {
    v = soDigitos(v); if (v.slice(0, 2) === '55' && v.length > 11) v = v.slice(2); v = v.slice(0, 11);
    if (v.length <= 2) return v.length ? '(' + v : '';
    if (v.length <= 6) return '(' + v.slice(0, 2) + ') ' + v.slice(2);
    if (v.length <= 10) return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
    return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
  }
  function mascara(el, fn) { if (!el) return; el.addEventListener('input', function () { var p = el.selectionStart; el.value = fn(el.value); }); }
  function cpfValido(c) {
    var d = soDigitos(c); if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    var s = 0, i; for (i = 0; i < 9; i++) s += +d[i] * (10 - i); var r = (s * 10) % 11; if (r === 10) r = 0; if (r !== +d[9]) return false;
    s = 0; for (i = 0; i < 10; i++) s += +d[i] * (11 - i); r = (s * 10) % 11; if (r === 10) r = 0; return r === +d[10];
  }
  function whatsValido(w) { var d = soDigitos(w); if (d.slice(0, 2) === '55' && d.length > 11) d = d.slice(2); return (d.length === 11 && d[2] === '9') || (d.length === 10 && '6789'.indexOf(d[2]) >= 0); }
  function e164(w) { var d = soDigitos(w); if (d.slice(0, 2) !== '55') d = '55' + d; return '+' + d; }
  function brl(v) { return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function brlInt(v) { return 'R$ ' + Math.round(Number(v || 0)).toLocaleString('pt-BR'); }
  function dataBR(d) { if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function dataCurta(d) { if (!d) return ''; var p = String(d).slice(0, 10).split('-'); return p[2] + '/' + p[1]; }
  function primeiroNome(n) { n = String(n || '').trim().split(' ')[0]; return n ? n[0].toUpperCase() + n.slice(1).toLowerCase() : ''; }

  function toast(msg) {
    var t = $('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('mostrar'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('mostrar'); }, 3000);
  }
  function mostrarErro(id, msg) { var el = $(id); if (!el) return; el.innerHTML = '<span>⚠</span><span>' + msg + '</span>'; el.classList.add('mostrar'); }
  function esconderErro(id) { var el = $(id); if (el) el.classList.remove('mostrar'); }
  function irPara(id) { qsa('.tela').forEach(function (t) { t.classList.remove('ativa'); }); var el = $(id); if (el) el.classList.add('ativa'); window.scrollTo(0, 0); }

  async function linkWhats(texto) {
    var c = await config();
    var n = soDigitos(c.whatsapp_equipe);
    if (!n) return 'mailto:' + c.email;
    return 'https://wa.me/' + n + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }

  /* cabeçalho e rodapé das páginas públicas */
  function montarTopo(ativo) {
    var el = qs('header.topo'); if (!el) return;
    var itens = [['/', 'Início'], ['/#como-funciona', 'Como funciona'], ['/#valores', 'Valores'], ['/empresas/', 'Empresas'], ['/nosso-nome/', 'Nosso nome'], ['/minha-conta/', 'Minha conta']];
    var links = itens.map(function (i) { return '<a href="' + i[0] + '">' + i[1] + '</a>'; }).join('');
    el.innerHTML = '<div class="wrap"><a class="marca" href="/" aria-label="Lev Soul"><img src="/assets/img/logo-cor.png" alt="Lev Soul"></a>' +
      '<nav class="menu">' + links + '<a class="btn btn-pri" href="/assinar/">Quero ativar o Lev Soul</a></nav>' +
      '<button class="hamb" aria-label="Menu" onclick="document.getElementById(\'menuMobile\').classList.toggle(\'aberto\')"><span></span><span></span><span></span></button></div>';
    var mm = document.createElement('div'); mm.id = 'menuMobile'; mm.className = 'menu-mobile';
    mm.innerHTML = links + '<a href="/assinar/" style="color:var(--indigo)">Quero ativar o Lev Soul →</a>';
    el.after(mm);
  }
  async function montarRodape() {
    var el = qs('footer.rodape'); if (!el) return;
    var c = await config();
    el.innerHTML = '<div class="wrap">' +
      '<div><img src="/assets/img/logo-creme.png" alt="Lev Soul"><p>Psicologia para a família inteira, em formato de assinatura. Acolhimento que abraça, ciência que sustenta.</p><p style="margin-top:10px">+10 anos de história · +20 psicólogos · +2.000 atendimentos por mês</p><p style="margin-top:10px;font-family:Sora;font-weight:700;color:#fff">Alma leve.</p></div>' +
      '<div><h4>Navegar</h4><a href="/assinar/">Ativar o Lev Soul</a><a href="/empresas/">Lev Soul Empresas</a><a href="/nosso-nome/">Nosso nome</a><a href="/minha-conta/">Minha conta</a><a href="/privacidade/">Privacidade e comunicação</a></div>' +
      '<div><h4>Fale com a gente</h4><a href="mailto:' + c.email + '">' + c.email + '</a>' + (soDigitos(c.whatsapp_equipe) ? '<a href="https://wa.me/' + soDigitos(c.whatsapp_equipe) + '">WhatsApp da equipe de acolhimento</a>' : '') + '<p style="margin-top:10px">Anápolis · GO<br>Online e presencial, das 7h às 22h</p></div>' +
      '<div class="aviso-reg"><p><strong>Responsável Técnica:</strong> ' + c.rt_nome + ' · CRP ' + c.rt_crp + '</p><p style="margin-top:6px">' + c.razao_social + ' · CNPJ ' + c.cnpj + ' · Encarregado de dados (LGPD): ' + c.email + '</p><p style="margin-top:8px"><em>' + c.aviso + '</em></p><p style="margin-top:8px">"Guarda o teu coração, porque dele procedem as fontes da vida." — Provérbios 4:23</p></div></div>';
  }
  async function montarFlutuante(texto) {
    var el = qs('.flutuante, .falar'); if (!el) return;
    el.href = await linkWhats(texto || 'Oi! Vim pelo site da Lev Soul e queria conversar com a equipe de acolhimento 🤍');
    el.target = '_blank'; el.rel = 'noopener';
  }
  async function preencherValores() {
    var c = await config();
    qsa('[data-valor]').forEach(function (el) {
      var k = el.getAttribute('data-valor');
      if (k === 'mensalidade') el.textContent = brlInt(c.mensalidade);
      if (k === 'sessao') el.textContent = brlInt(c.sessao);
      if (k === 'rt') el.textContent = c.rt_nome + ' · CRP ' + c.rt_crp;
      if (k === 'email') el.textContent = c.email;
      if (k === 'contrato_versao') el.textContent = c.contrato_versao;
      if (k === 'retencao_lead') el.textContent = c.retencao_lead_dias || 90;
    });
  }

  capturarRef();
  return { sb: sb, rpc: rpc, config: config, sessao: sessao, ref: ref, evento: evento, aparelho: aparelho, $: $, qs: qs, qsa: qsa,
    soDigitos: soDigitos, mCpf: mCpf, mWhats: mWhats, mascara: mascara, cpfValido: cpfValido, whatsValido: whatsValido, e164: e164,
    brl: brl, brlInt: brlInt, dataBR: dataBR, dataCurta: dataCurta, primeiroNome: primeiroNome, toast: toast, mostrarErro: mostrarErro,
    esconderErro: esconderErro, irPara: irPara, linkWhats: linkWhats, montarTopo: montarTopo, montarRodape: montarRodape,
    montarFlutuante: montarFlutuante, preencherValores: preencherValores, erro: erro };
})();
