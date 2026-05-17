-- ═══════════════════════════════════════════════════════════════
--  Upgrade — Schema Supabase COMPLETO e CORRIGIDO
--  Execute TODO este script no SQL Editor do Supabase
--  Projeto: pgskzavlgayozbwizpwm
-- ═══════════════════════════════════════════════════════════════

-- ── Extensões ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════
-- TABELA: profiles (usuários)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                  TEXT NOT NULL,
  email                 TEXT NOT NULL,
  tipo                  TEXT NOT NULL DEFAULT 'cliente',
  plano                 TEXT,
  telefone              TEXT,
  cpf                   TEXT,       -- armazenado SEM máscara, apenas números
  cnpj                  TEXT,       -- armazenado SEM máscara, apenas números
  nome_pai              TEXT,
  nome_mae              TEXT,
  banco                 TEXT,
  pix_key               TEXT,       -- chave PIX do USUÁRIO (não do sistema)
  ref_code              TEXT UNIQUE,
  ref_count             INTEGER DEFAULT 0,
  ref_saldo             NUMERIC(10,2) DEFAULT 0,
  razao_social          TEXT,
  tipo_empresa          TEXT,
  segmento              TEXT,
  site_forn             TEXT,
  nome_negocio          TEXT,
  link_slug             TEXT UNIQUE,
  bio                   TEXT,
  foto_url              TEXT,
  via_indicador         UUID REFERENCES public.profiles(id),
  comerciante_favorito_id UUID REFERENCES public.profiles(id),
  via_comerciante       UUID REFERENCES public.profiles(id),  -- ← estava faltando
  ativo                 BOOLEAN DEFAULT TRUE,
  facial_hash           TEXT,       -- hash biométrico criptografado (nunca a imagem)
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- TABELA: products (estoque do comerciante)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comerciante_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  sku             TEXT,
  codigo_barras   TEXT,
  preco           NUMERIC(10,2) DEFAULT 0,
  estoque         INTEGER DEFAULT 0,
  estoque_minimo  INTEGER DEFAULT 5,
  categoria       TEXT,
  imagem_url      TEXT,
  ativo           BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- TABELA: sales (vendas / transações)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.sales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comerciante_id  UUID REFERENCES public.profiles(id),
  cliente_id      UUID REFERENCES public.profiles(id),
  cliente_nome    TEXT,
  plano           TEXT,
  valor           NUMERIC(10,2),
  metodo          TEXT DEFAULT 'pix',
  status          TEXT DEFAULT 'pending',  -- pending | paid | cancelled
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- TABELA: clients (agenda de clientes do comerciante)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.clients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comerciante_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  email           TEXT,
  telefone        TEXT,
  documento       TEXT,
  total_compras   INTEGER DEFAULT 0,
  valor_total     NUMERIC(10,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- TABELA: notifications (avisos para usuários)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  titulo      TEXT NOT NULL,
  mensagem    TEXT,
  tipo        TEXT DEFAULT 'info',  -- info | success | warning | error
  lida        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- TABELA: user_favorites (favoritos ilimitados)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  favorito_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  tipo_favorito   TEXT,  -- comerciante | fornecedor
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, favorito_id)
);

-- ══════════════════════════════════════════
-- TABELA: supplier_products (catálogo B2B dos fornecedores)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.supplier_products (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fornecedor_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nome                    TEXT NOT NULL,
  descricao               TEXT,
  preco                   NUMERIC(10,2) NOT NULL,
  qtd_minima              INTEGER DEFAULT 1,
  preco_varejo_sugerido   NUMERIC(10,2),
  estoque                 INTEGER DEFAULT 0,
  categoria               TEXT,
  sku                     TEXT,
  imagem_url              TEXT,
  link_produto            TEXT,
  prazo_entrega           INTEGER DEFAULT 5,
  visivel                 BOOLEAN DEFAULT TRUE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- TABELA: subscriptions (assinaturas dos planos)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  plano       TEXT NOT NULL,
  valor       NUMERIC(10,2) NOT NULL,
  status      TEXT DEFAULT 'pending',  -- pending | active | cancelled
  metodo      TEXT DEFAULT 'pix',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- TABELA: b2b_orders (pedidos atacado fornecedor→comerciante)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.b2b_orders (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fornecedor_id     UUID REFERENCES public.profiles(id),
  comerciante_id    UUID REFERENCES public.profiles(id),
  produto_id        UUID REFERENCES public.supplier_products(id),
  produto_nome      TEXT,
  comerciante_nome  TEXT,
  quantidade        INTEGER DEFAULT 1,
  valor_total       NUMERIC(10,2) DEFAULT 0,
  status            TEXT DEFAULT 'pending',  -- pending | confirmed | cancelled
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_orders        ENABLE ROW LEVEL SECURITY;

-- ── DROP políticas antigas para recriar ──
DROP POLICY IF EXISTS "profiles_own"    ON public.profiles;
DROP POLICY IF EXISTS "products_own"    ON public.products;
DROP POLICY IF EXISTS "sales_own"       ON public.sales;
DROP POLICY IF EXISTS "clients_own"     ON public.clients;
DROP POLICY IF EXISTS "notif_own"       ON public.notifications;
DROP POLICY IF EXISTS "fav_own"         ON public.user_favorites;
DROP POLICY IF EXISTS "sp_select"       ON public.supplier_products;
DROP POLICY IF EXISTS "sp_own"          ON public.supplier_products;
DROP POLICY IF EXISTS "subs_own"        ON public.subscriptions;
DROP POLICY IF EXISTS "b2b_forn"        ON public.b2b_orders;
DROP POLICY IF EXISTS "b2b_com"         ON public.b2b_orders;

-- ── Profiles: usuário vê/edita o próprio; admin vê todos ──
CREATE POLICY "profiles_own" ON public.profiles
  FOR ALL USING (
    auth.uid() = id
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'upgradeeficiente@gmail.com'
  );

-- Leitura pública de perfis (para busca de comerciantes/fornecedores via link)
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (ativo = TRUE);

-- ── Products: comerciante gerencia os próprios ──
CREATE POLICY "products_own" ON public.products
  FOR ALL USING (auth.uid() = comerciante_id);

-- ── Sales: comerciante e cliente veem as próprias ──
CREATE POLICY "sales_own" ON public.sales
  FOR ALL USING (auth.uid() = comerciante_id OR auth.uid() = cliente_id);

-- ── Clients: comerciante gerencia os próprios ──
CREATE POLICY "clients_own" ON public.clients
  FOR ALL USING (auth.uid() = comerciante_id);

-- ── Notifications: cada usuário vê as próprias ──
CREATE POLICY "notif_own" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- ── Favorites: cada usuário gerencia os próprios ──
CREATE POLICY "fav_own" ON public.user_favorites
  FOR ALL USING (auth.uid() = user_id);

-- ── Supplier Products: fornecedor gerencia; comerciantes leem (visíveis) ──
CREATE POLICY "sp_own" ON public.supplier_products
  FOR ALL USING (auth.uid() = fornecedor_id);

CREATE POLICY "sp_select" ON public.supplier_products
  FOR SELECT USING (visivel = TRUE);

-- ── Subscriptions: usuário vê as próprias ──
CREATE POLICY "subs_own" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ── B2B Orders: fornecedor e comerciante veem os próprios ──
CREATE POLICY "b2b_forn" ON public.b2b_orders
  FOR ALL USING (auth.uid() = fornecedor_id);

CREATE POLICY "b2b_com" ON public.b2b_orders
  FOR ALL USING (auth.uid() = comerciante_id);

-- ══════════════════════════════════════════
-- TRIGGER: cria profile automaticamente ao signup
-- ══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, tipo, plano)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo', 'cliente'),
    COALESCE(NEW.raw_user_meta_data->>'plano', 'Cliente')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ══════════════════════════════════════════
-- FUNÇÃO: incrementar ref_count via RPC
-- (mais seguro que update direto do frontend)
-- ══════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.incrementar_ref(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET
    ref_count = ref_count + 1,
    ref_saldo = (ref_count + 1) * 1.50,
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ══════════════════════════════════════════
-- ÍNDICES para performance
-- ══════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_profiles_tipo         ON public.profiles(tipo);
CREATE INDEX IF NOT EXISTS idx_profiles_ref_code     ON public.profiles(ref_code);
CREATE INDEX IF NOT EXISTS idx_profiles_link_slug    ON public.profiles(link_slug);
CREATE INDEX IF NOT EXISTS idx_products_comerciante  ON public.products(comerciante_id);
CREATE INDEX IF NOT EXISTS idx_sales_comerciante     ON public.sales(comerciante_id);
CREATE INDEX IF NOT EXISTS idx_sales_cliente         ON public.sales(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notif_user            ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sp_fornecedor         ON public.supplier_products(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_b2b_fornecedor        ON public.b2b_orders(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_b2b_comerciante       ON public.b2b_orders(comerciante_id);
