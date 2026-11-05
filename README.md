# levsoul.com.br · site da Lev Soul

Site estático (GitHub Pages) que conversa só com funções do Supabase da clínica (`ls_site_*` para o público, `ls_cli_*` para a área do cliente). Nada aqui é segredo: a chave publicável só alcança essas funções, e cada uma tem a própria trava.

## Páginas
| Caminho | O que é | Fala com |
|---|---|---|
| `/` | Home (blueprint 8.4 do Documento-Mestre) | `ls_site_config`, `ls_site_evento` |
| `/assinar/` | Contratação pelo site (A0 → A4) | `ls_site_iniciar`, `ls_site_convite_abrir`, `ls_site_codigo_enviar`, `ls_site_aceitar`, `ls_site_pagamento_escolher`, `ls_site_estado` |
| `/c/TOKEN` | Link da porta assistida (secretária gera no Cortex) — o `404.html` redireciona para `/c/?t=TOKEN` | as mesmas, sem A0 |
| `/empresas/` | Página Empresas (sem preço, sem "custo zero") + ativação do colaborador + pedido de conversa | `ls_site_lead_empresa`, `ls_site_colab_iniciar`, `ls_site_colab_aceitar` |
| `/minha-conta/` | Área do cliente — login oficial (Supabase Auth: WhatsApp + código; senha opcional) | `ls_site_conta`, `ls_cli_*` |
| `/nosso-nome/` · `/privacidade/` | Institucional e Política de Privacidade + Termo de Comunicação | — |

Arquivos compartilhados: `assets/css/lev.css`, `assets/js/lev.js` (conexão + ajudantes + cabeçalho/rodapé), `assets/js/fluxo.js` (A0–A4), `assets/js/conta.js`, `assets/js/contrato.js` e `contrato-empresarial.js` (textos provisórios dos termos — o hash do texto vai no aceite).

## Banco (Supabase)
Os scripts do banco (`LS_v1_0_estrutura.sql`, `LS_v1_1_site_e_cliente.sql`) **não ficam neste repositório** (ele é público). Ficam com o dono.

Parâmetros que o site lê (fx0_parametros_geral): `ls_mensalidade_valor`, `ls_sessao_valor`, `ls_particular_valor`, `ls_rt_nome`, `ls_rt_crp`, `ls_email_contato`, `ls_whatsapp_equipe` (botão "Falar com a gente"), `ls_contrato_versao`, `ls_site_url`, `ls_retencao_lead_dias`.

## Publicar (GitHub Pages)
Settings → Pages → Source "Deploy from a branch" → `main` / `/ (root)`. O `CNAME` já aponta para `levsoul.com.br`.

DNS no Registro.br (apex + www):
```
A     @    185.199.108.153
A     @    185.199.109.153
A     @    185.199.110.153
A     @    185.199.111.153
CNAME www  centromedicojuditheferreira.github.io.
```
Depois, em Settings → Pages, marcar "Enforce HTTPS" (aparece quando o DNS propagar).

## Área do cliente — ligar o login (Supabase, uma vez)
1. Authentication → Providers → **Phone** → Enable. (Não precisa de Twilio: o gancho abaixo manda o código pelo WhatsApp.)
2. Authentication → Hooks → **Send SMS** → Enable · tipo "Postgres" · schema `public` · função `ls_auth_sms` → Save.
3. Authentication → Sessions (plano Pro) → "Time-box user sessions" = 30 dias (sessão lembrada por 30 dias, decisão de 24/10).
4. Authentication → Rate limits: manter os padrões.
Sem o gancho ligado, o site mostra "não conseguimos enviar o código" — nada quebra.

## WhatsApp (SM Click)
Chaves no cofre do Supabase (Vault): `smclick_api_key` e `smclick_instance`. Templates (ids no fx0): `ls_smclick_template_codigo` (autenticação, com "Copiar código"), `ls_smclick_template_convite`, `ls_smclick_template_boas_vindas`. Enquanto um template estiver vazio, as mensagens daquele tipo ficam em `ls_mensagens` com situação `fila` — nada sai.

## Pagamento (plugar depois)
O site não conhece plataforma nenhuma. Quando a cobrança nasce (`ls_cobrancas`, situação `aberta`, com `meio` escolhido e sem `plataforma_ref`), o robô do PC robô cria a cobrança na plataforma escolhida e grava `pix_copia_cola` / `plataforma_dados.checkout_url`; a tela A3 se atualiza sozinha (consulta `ls_site_estado` a cada 6 s). A confirmação do pagamento vira `situacao = 'paga'` e o banco faz o resto (ativa, gera a próxima, libera comissão no 2º mês).
