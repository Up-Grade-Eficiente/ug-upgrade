// ═══════════════════════════════════════════════════════════════
//  Upgrade — Cloudflare Pages Function: dados PIX seguros
//  Arquivo: functions/api/pix-info.js
//
//  Configure no Cloudflare Dashboard (NÃO no código):
//    PIX_KEY   = sua chave pix (email ou telefone, NÃO cpf público)
//    PIX_NOME  = nome do beneficiário
//    PIX_BANCO = banco/tipo da chave
// ═══════════════════════════════════════════════════════════════

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export async function onRequestGet(context) {
  // Lê do env do Cloudflare — nunca fica no código/HTML público
  const key  = context.env.PIX_KEY  || null;
  const nome = context.env.PIX_NOME || 'Upgrade Eficiente';
  const banco= context.env.PIX_BANCO|| 'Chave Email';

  if (!key) {
    // Se não configurado, retorna instrução para contato
    return new Response(JSON.stringify({
      configured: false,
      message: 'Entre em contato via WhatsApp: (88) 9.9764-0012',
      whatsapp: '5588997640012',
    }), { headers: CORS });
  }

  return new Response(JSON.stringify({
    configured: true,
    key,
    nome,
    banco,
  }), { headers: CORS });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
