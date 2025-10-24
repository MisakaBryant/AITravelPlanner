-- AITravelPlanner 数据库初始化脚本
-- 请在 Supabase SQL Editor 中执行此脚本

-- 创建用户表
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建行程表
CREATE TABLE IF NOT EXISTS public.plans (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  origin TEXT,
  destination TEXT NOT NULL,
  days INTEGER NOT NULL,
  budget INTEGER NOT NULL,
  people INTEGER NOT NULL,
  preferences TEXT,
  itinerary JSONB,
  route_places JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建开销记录表
CREATE TABLE IF NOT EXISTS public.records (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id BIGINT NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON public.plans(user_id);
CREATE INDEX IF NOT EXISTS idx_records_user_id ON public.records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_plan_id ON public.records(plan_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- 授权（Supabase 默认会处理，但可显式声明）
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

-- 注释说明
COMMENT ON TABLE public.users IS '用户表，存储用户认证信息';
COMMENT ON TABLE public.plans IS '行程规划表，存储用户旅行计划';
COMMENT ON TABLE public.records IS '预算开销记录表，存储旅行费用明细';
