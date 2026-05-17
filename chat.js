// ═══════════════════════════════════════════════════════════════
//  Upgrade — Cloudflare Pages Function: proxy seguro Groq API
//  Arquivo: functions/api/chat.js
//  IMPORTANTE: CPF/dados sensíveis NUNCA aparecem aqui
//  A chave PIX real fica SOMENTE no env do Cloudflare: PIX_KEY
// ═══════════════════════════════════════════════════════════════

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const SYSTEM_PROMPTS = {
  admin: `Você é assistente exclusivo do administrador do Upgrade (upgradeeficiente@gmail.com).
Responda em português sobre: usuários, vendas, deploy Cloudflare Pages, Supabase, bugs.
Seja direto e profissional. Máximo 3 parágrafos por resposta.`,

  fornecedor: `Você é Hadley Alves, atendente B2B do Upgrade.
Ajude fornecedores com: catálogo B2B, pedidos atacado, comerciantes parceiros.
Responda em português. Máximo 3 parágrafos por resposta.`,

  lead: `Você é Hadley Alves, atendente virtual do Upgrade — plataforma brasileira de gestão de negócios.
Responda SEMPRE em português, de forma amigável e comercial.
Quando não souber, direcione para: WhatsApp (88) 9.9764-0012

PLANOS UPGRADE:
— Cliente Consumidor: GRÁTIS para sempre
— Porte Autônomo: R$29,99/mês (CPF + WhatsApp + banco)
— Pequeno Porte: R$59,99/mês (CPF + nome pai/mãe + WhatsApp + banco)
— Médio Porte: R$120,99/mês (CNPJ + WhatsApp + banco)
— Grande Porte: R$242,00/mês (CNPJ + WhatsApp + banco)
— Fornecedor: R$484,00/mês (CNPJ + Razão Social + banco)

PAGAMENTOS:
— PIX: entre em contato pelo WhatsApp para receber a chave
— Confirmar via WhatsApp: (88) 9.9764-0012
— Aceita cartão, Mercado Pago, PayPal, PicPay, Nubank, boleto

INDIQUE E GANHE:
— R$1,50 por indicação confirmada
— Condição: cadastro completo + 1ª compra mínima R$5,00
— 50 indicações = R$75,00 via PIX pago pelo comerciante favorito
— Sem limite máximo de indicações

FUNCIONALIDADES:
— Estoque com leitor de código de barras pela câmera
— QR Code de produto com etiqueta para impressão
— Login por reconhecimento facial
— Dashboard: vendas, clientes, relatórios, pagamentos, marketplace B2B
— Modo escuro e 8 temas de cores

REGRAS: Nunca invente informações. Máximo 4 parágrafos por resposta.`,

  cliente: `Você é Hadley Alves, atendente do Upgrade.
Ajude clientes e comerciantes com dúvidas sobre a plataforma, pagamentos e suporte.
Use português brasileiro. Seja direto e prestativo. Máx 3 parágrafos por resposta.
Suporte: WhatsApp (88) 9.9764-0012 | Email: upgradeeficiente@gmail.com`,
};

export async function onRequestPost(context) {
  try {
    const GROQ_KEY = context.env.GROQ_API_KEY;

    if (!GROQ_KEY) {
      return new Response(
        JSON.stringify({ fallback: true, error: 'GROQ_API_KEY não configurada no Cloudflare' }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const body = await context.request.json();
    const { messages, type, context: contextExtra } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages é obrigatório e deve ser um array' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Sanitiza mensagens — remove campos extras, limita tamanho
    const sanitizedMessages = messages.slice(-8).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').substring(0, 800),
    }));

    const basePrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.lead;
    const systemPrompt = contextExtra ? basePrompt + contextExtra : basePrompt;

    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 400,
        temperature: 0.65,
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizedMessages,
        ],
      }),
    });

    if (!groqResponse.ok) {
      const errData = await groqResponse.json().catch(() => ({}));
      console.error('Groq error:', errData);
      // Retorna fallback silencioso — frontend usa respostas locais
      return new Response(
        JSON.stringify({ fallback: true, error: errData?.error?.message || 'Groq indisponível' }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || '';

    if (!reply) {
      return new Response(
        JSON.stringify({ fallback: true, error: 'Resposta vazia da IA' }),
        { status: 200, headers: CORS_HEADERS }
      );
    }

    return new Response(JSON.stringify({ reply }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    console.error('chat.js error:', err);
    return new Response(
      JSON.stringify({ fallback: true, error: err.message }),
      { status: 200, headers: CORS_HEADERS }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: CORS_HEADERS });
}
