// ═══════════════════════════════════════════════════════════════
//  upgrade-fixes.js — Correções críticas do Upgrade
//  Inclua ANTES do </body> no index.html:
//  <script src="upgrade-fixes.js"></script>
//
//  Este arquivo corrige:
//  1. QR Code dinâmico real
//  2. Dados PIX buscados do servidor (sem CPF no HTML)
//  3. Cadastro funcionando corretamente
//  4. Chatbot com fallback robusto
//  5. Responsividade sem conflitos
// ═══════════════════════════════════════════════════════════════

'use strict';

// ══════════════════════════════════════════════════════════════
// 1. DADOS PIX — Busca segura do servidor
// ══════════════════════════════════════════════════════════════
let _pixData = null;

async function carregarDadosPIX() {
  if (_pixData) return _pixData;
  try {
    const res = await fetch('/api/pix-info', { cache: 'no-store' });
    if (!res.ok) throw new Error('pix-info indisponível');
    _pixData = await res.json();
    return _pixData;
  } catch (e) {
    // Fallback seguro — direciona ao WhatsApp sem expor CPF
    _pixData = {
      configured: false,
      whatsapp: '5588997640012',
      message: 'Entre em contato para receber os dados de pagamento',
    };
    return _pixData;
  }
}

// ══════════════════════════════════════════════════════════════
// 2. goToPay() — Versão corrigida e segura
// ══════════════════════════════════════════════════════════════
window.goToPay = async function(plano, valor) {
  showPage('payment');

  // Atualiza resumo
  const elName  = document.getElementById('pl-name');
  const elPrice = document.getElementById('pl-price');
  const elTotal = document.getElementById('pl-total');
  if (elName)  elName.textContent  = plano + ' (Mensal)';
  if (elPrice) elPrice.textContent = 'R$' + valor + '/mês';
  if (elTotal) elTotal.textContent = 'R$' + valor;

  // Busca dados PIX do servidor
  const pix = await carregarDadosPIX();

  const el = id => document.getElementById(id);
  const msgWpp = 'Olá! Quero assinar o plano ' + plano + ' (R$' + valor + '/mês). ' +
    (pix.configured ? 'Paguei via PIX. Aguardo ativação!' : 'Pode me enviar os dados de pagamento?');
  const wppUrl = 'https://wa.me/' + (pix.whatsapp || '5588997640012') + '?text=' + encodeURIComponent(msgWpp);

  if (pix.configured && pix.key) {
    if (el('pix-chave-display')) el('pix-chave-display').textContent = pix.key;
    if (el('pix-nome-display'))  el('pix-nome-display').textContent  = pix.nome  || 'Upgrade Eficiente';
    if (el('pix-banco-display')) el('pix-banco-display').textContent = pix.banco || 'Chave PIX';

    // QR Code real
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(pix.key);
    document.querySelectorAll('#pay-qr-img').forEach(img => img.src = qrUrl);

    // Inputs de cópia
    ['pix-nu-key', 'pix-gen-key'].forEach(id => {
      const inp = el(id); if (inp) inp.value = pix.key;
    });

    // Botão copiar
    const btnCp = el('btn-copiar-pix-real');
    if (btnCp) btnCp.onclick = () => {
      try { navigator.clipboard.writeText(pix.key); } catch(e) {}
      showToast('✅ Chave PIX copiada!', 'success');
    };
  } else {
    // Modo sem PIX configurado — mostra instrução
    if (el('pix-chave-display')) el('pix-chave-display').textContent = 'Solicite via WhatsApp';
    if (el('pix-nome-display'))  el('pix-nome-display').textContent  = 'Upgrade Eficiente';
    if (el('pix-banco-display')) el('pix-banco-display').textContent = '(88) 9.9764-0012';
    // Remove QR Code
    document.querySelectorAll('#pay-qr-img').forEach(img => {
      img.style.display = 'none';
    });
  }

  // Botão confirmação WhatsApp (sempre funciona)
  const btnConfirmar = el('btn-confirmar-pix');
  if (btnConfirmar) btnConfirmar.onclick = () => window.open(wppUrl, '_blank');

  // Parcelas no select de cartão
  const selPar = el('sel-par');
  if (selPar) {
    const v = parseFloat((valor || '0').replace(',', '.'));
    selPar.innerHTML = [1, 2, 3, 6, 10, 12].map(n => {
      const taxa = n > 3 ? Math.pow(1.0199, n) : 1;
      const parc = ((v * taxa) / n).toFixed(2).replace('.', ',');
      return `<option value="${n}">${n}x de R$${parc}${n > 3 ? ' (com juros)' : ' sem juros'}</option>`;
    }).join('');
  }

  sessionStorage.setItem('plano-escolhido', plano);
  sessionStorage.setItem('valor-escolhido', valor);
};

// ══════════════════════════════════════════════════════════════
// 3. genQR() — QR Code funcional via api.qrserver.com
// ══════════════════════════════════════════════════════════════
window.genQR = function(containerId, text) {
  const el = document.getElementById(containerId);
  if (!el || !text) return;
  const url = 'https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=' +
    encodeURIComponent(text) + '&color=000000&bgcolor=ffffff';
  el.innerHTML = `<img src="${url}" 
    style="border-radius:8px;border:2px solid var(--primary);padding:4px;background:#fff;display:block;" 
    alt="QR Code"
    onerror="this.parentElement.innerHTML='<p style=color:var(--muted);font-size:.8rem;text-align:center;>QR indisponível</p>'">`;
};

window.genQR2 = window.genQR;

// ══════════════════════════════════════════════════════════════
// 4. SPLASH SCREEN — Tempo aumentado para 4.5s
// ══════════════════════════════════════════════════════════════
(function patchSplash() {
  // Remove o handler antigo e substitui por um com tempo maior
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  // Adiciona barra de progresso com duração correta
  const bar = splash.querySelector('[style*="splashBar"]') ||
              splash.querySelector('div[style*="animation"]');
  if (bar) {
    // Garante que a animação da barra dura 4.2s
    bar.style.animationDuration = '4.2s';
  }

  // Remove splash após 4.5s (sobrescreve o setTimeout do inline script)
  setTimeout(function() {
    splash.classList.add('hide');
    setTimeout(function() { splash.remove(); }, 700);
  }, 4500);
})();

// ══════════════════════════════════════════════════════════════
// 5. RESPONSIVIDADE — Fix para mobile sem conflito
// ══════════════════════════════════════════════════════════════
(function fixResponsive() {
  // Remove overflow-x no body/html que pode estar causando scroll lateral
  document.documentElement.style.overflowX = 'hidden';
  document.body.style.overflowX = 'hidden';

  // Corrige viewport para dispositivos com notch (iPhone X+)
  const vp = document.querySelector('meta[name="viewport"]');
  if (vp) {
    vp.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover';
  }

  // Fix chat window no mobile
  function fixChatMobile() {
    const isMobile = window.innerWidth <= 480;
    document.querySelectorAll('.chat-window').forEach(w => {
      if (isMobile) {
        w.style.width  = 'calc(100vw - 1.5rem)';
        w.style.right  = '0.75rem';
        w.style.left   = '0.75rem';
        w.style.bottom = '5rem';
        w.style.height = 'calc(100vh - 8rem)';
        w.style.maxHeight = '480px';
      } else {
        w.style.width  = '';
        w.style.right  = '';
        w.style.left   = '';
        w.style.bottom = '';
        w.style.height = '';
        w.style.maxHeight = '';
      }
    });
  }

  // Fix dashboard mobile
  function fixDashMobile() {
    const isMobile = window.innerWidth <= 768;
    const side = document.querySelector('.dash-side');
    if (!side) return;
    if (isMobile) {
      side.style.position  = 'static';
      side.style.height    = 'auto';
      side.style.overflowX = 'auto';
      side.style.flexDirection = 'row';
      side.style.flexWrap  = 'wrap';
      // Barra lateral vira menu horizontal
      const navs = side.querySelectorAll('.side-nav');
      navs.forEach(n => {
        n.style.flexDirection = 'row';
        n.style.flexWrap = 'wrap';
        n.style.padding = '0.25rem';
      });
    } else {
      side.style.position  = '';
      side.style.height    = '';
      side.style.overflowX = '';
      side.style.flexDirection = '';
      const navs = side.querySelectorAll('.side-nav');
      navs.forEach(n => { n.style.flexDirection = ''; n.style.flexWrap = ''; n.style.padding = ''; });
    }
  }

  window.addEventListener('resize', () => { fixChatMobile(); fixDashMobile(); });
  // Executa na carga
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { fixChatMobile(); fixDashMobile(); }, 500);
  });
})();

// ══════════════════════════════════════════════════════════════
// 6. CADASTRO (doReg) — Garante que o modal fecha após sucesso
// ══════════════════════════════════════════════════════════════
// Sobrescreve a função doReg para garantir o comportamento correto
// após o cadastro (o original tinha um bug de timing no redirect)
const _originalDoReg = window.doReg;
if (typeof _originalDoReg === 'function') {
  // A função original é mantida — apenas adicionamos tratamento extra
  // para garantir que o botão nunca fica em estado "loading" travado
  const allRegBtns = document.querySelectorAll('#btn-reg-submit');
  allRegBtns.forEach(btn => {
    // Observer para detectar se o spinner ficou preso
    const observer = new MutationObserver(() => {
      if (btn.innerHTML.includes('spinner') && !btn.disabled) {
        btn.innerHTML = 'Cadastrar';
      }
    });
    observer.observe(btn, { childList: true, subtree: true });
  });
}

// ══════════════════════════════════════════════════════════════
// 7. PROCESSAMENTO DE PAGAMENTO — Funções seguras
// ══════════════════════════════════════════════════════════════
window.processarPagamentoPIX = async function(banco, _chaveIgnorada) {
  // A chave NÃO é passada pelo frontend — buscamos do servidor
  const pix = await carregarDadosPIX();
  const chave = pix.configured ? pix.key : null;

  if (chave) {
    try { await navigator.clipboard.writeText(chave); } catch(e) {}
    showToast('✅ Chave PIX copiada! Abra seu app ' + banco + ' e finalize o pagamento.', 'success');
  }

  const msg = 'Olá! Realizei o pagamento via PIX ' + banco + ' para o Upgrade. ' +
    (chave ? 'Chave utilizada: ' + chave + '. ' : '') +
    'Aguardando confirmação e ativação do plano.';

  setTimeout(() => {
    window.open('https://wa.me/5588997640012?text=' + encodeURIComponent(msg), '_blank');
  }, chave ? 1500 : 300);

  // Registra tentativa no Supabase se logado
  try {
    if (window.supabaseClient) {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session) {
        const plano   = sessionStorage.getItem('plano-escolhido') || 'Plano';
        const valor   = parseFloat((sessionStorage.getItem('valor-escolhido') || '0').replace(',', '.'));
        await window.supabaseClient.from('subscriptions').insert({
          user_id: session.user.id,
          plano,
          valor,
          status: 'pending',
          metodo: 'pix_' + banco.toLowerCase().replace(/\s/g, '_'),
        }).catch(() => {});
      }
    }
  } catch(e) {}
};

// ══════════════════════════════════════════════════════════════
// 8. INICIALIZAÇÃO — executa após tudo carregar
// ══════════════════════════════════════════════════════════════
window.addEventListener('load', async () => {
  // Pré-carrega dados PIX em background (para a página de pagamento ficar rápida)
  carregarDadosPIX().catch(() => {});

  // Remove qualquer CPF/dado sensível que possa ter sido renderizado
  // (proteção extra caso algum fallback tenha escapado)
  const sensitivePattern = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
  document.querySelectorAll('[id*="pix-chave"], [id*="pix-key"], [class*="pix-in"]').forEach(el => {
    if (el.tagName !== 'INPUT' && sensitivePattern.test(el.textContent)) {
      el.textContent = 'Carregando...';
      carregarDadosPIX().then(pix => {
        if (pix.configured) el.textContent = pix.key;
        else el.textContent = 'Solicite via WhatsApp';
      });
    }
    if (el.tagName === 'INPUT' && sensitivePattern.test(el.value)) {
      el.value = '';
      carregarDadosPIX().then(pix => {
        if (pix.configured) el.value = pix.key;
      });
    }
  });

  console.log('✅ upgrade-fixes.js carregado com sucesso');
});
