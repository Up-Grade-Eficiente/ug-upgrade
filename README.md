# 🚀 UG UpGrade Eficiente

Plataforma SaaS brasileira de gestão de negócios para comerciantes de todos os portes.

## 👥 Perfis de Usuário

| # | Perfil | Plano |
|---|--------|-------|
| 1 | 🤝 Voluntário | Grátis (sem remuneração) |
| 2 | 🎁 Cliente Consumidor | Grátis (ganha R$1,50/indicação) |
| 3 | 🧑‍💼 Porte Autônomo | R$29,99/mês |
| 4 | 🏪 Pequeno Porte | R$59,99/mês |
| 5 | 🏢 Médio Porte | R$120,99/mês |
| 6 | 🏗️ Grande Porte | R$242,00/mês |
| 7 | 🏭 Fornecedor | R$484,00/mês |

## ⚙️ Stack Tecnológica

- **Frontend:** HTML5 + CSS3 + JavaScript puro
- **Backend:** Cloudflare Pages Functions
- **Banco de dados:** Supabase (PostgreSQL)
- **IA Chatbot:** Groq API (Llama 3)
- **Pagamentos:** PIX + Mercado Pago + Cartão

## 📁 Estrutura do Projeto

```
UG-Upgrade-Eficiente/
├── index.html              # App principal (SPA)
├── upgrade-fixes.js        # Correções e melhorias JS
├── upgrade-responsive.css  # CSS responsivo
├── wrangler.toml           # Config Cloudflare
├── _headers                # Headers HTTP
├── _redirects              # Redirecionamentos
├── .env.example            # Modelo de variáveis de ambiente
└── functions/
    └── api/
        ├── chat.js         # Proxy seguro Groq IA
        └── pix-info.js     # Dados PIX (variável de ambiente)
```

## 🔑 Variáveis de Ambiente (Cloudflare)

Configure no painel do Cloudflare Pages > Settings > Environment variables:

| Variável | Descrição |
|----------|-----------|
| `PIX_KEY` | Chave PIX do recebedor |
| `PIX_NOME` | Nome do beneficiário PIX |
| `PIX_BANCO` | Tipo da chave PIX |
| `GROQ_API_KEY` | Chave da API Groq |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_KEY` | Chave anon do Supabase |

## 📞 Contato

- 📧 upgradeeficiente@gmail.com
- 📱 WhatsApp: +55 (88) 9.9764-0012

---
© 2026 UG UpGrade Eficiente. Todos os direitos reservados.
