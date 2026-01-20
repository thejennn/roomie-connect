
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'landlord', 'tenant');

-- Create enum for room status
CREATE TYPE public.room_status AS ENUM ('pending', 'active', 'rejected', 'expired');

-- Create enum for transaction type
CREATE TYPE public.transaction_type AS ENUM ('topup', 'post_fee', 'subscription', 'token_purchase');

-- User roles table (security-first design)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_landlord()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'landlord')
$$;

CREATE OR REPLACE FUNCTION public.is_tenant()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'tenant')
$$;

-- Profiles table (common fields)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    -- Tenant specific
    university TEXT,
    workplace TEXT,
    -- Landlord specific
    bank_account TEXT,
    bank_name TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Wallets table (for landlords)
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance BIGINT NOT NULL DEFAULT 0, -- Store in VND (integer)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type transaction_type NOT NULL,
    amount BIGINT NOT NULL,
    description TEXT,
    reference_id UUID, -- For linking to rooms, subscriptions, etc.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- AI Tokens table (for tenants)
CREATE TABLE public.ai_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    tokens INTEGER NOT NULL DEFAULT 20,
    max_tokens INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_tokens ENABLE ROW LEVEL SECURITY;

-- Rooms table (comprehensive)
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    -- Location
    district TEXT NOT NULL, -- Thạch Hòa, Tân Xã, etc.
    address TEXT NOT NULL,
    -- Specs
    price BIGINT NOT NULL, -- Monthly rent in VND
    deposit BIGINT DEFAULT 0,
    area DECIMAL(10,2), -- m2
    capacity INTEGER NOT NULL DEFAULT 1,
    -- Utilities (stored as VND)
    electricity_price INTEGER DEFAULT 3500,
    water_price INTEGER DEFAULT 100000,
    internet_price INTEGER DEFAULT 0,
    cleaning_fee INTEGER DEFAULT 0,
    parking_fee INTEGER DEFAULT 0,
    -- Amenities (booleans)
    has_elevator BOOLEAN DEFAULT false,
    has_fire_safety BOOLEAN DEFAULT false,
    has_shared_washing BOOLEAN DEFAULT false,
    has_private_washing BOOLEAN DEFAULT false,
    has_parking BOOLEAN DEFAULT false,
    has_security_camera BOOLEAN DEFAULT false,
    has_pet_friendly BOOLEAN DEFAULT false,
    has_shared_owner BOOLEAN DEFAULT false,
    has_drying_area BOOLEAN DEFAULT false,
    -- Furniture
    has_bed BOOLEAN DEFAULT false,
    has_wardrobe BOOLEAN DEFAULT false,
    has_air_conditioner BOOLEAN DEFAULT false,
    has_water_heater BOOLEAN DEFAULT false,
    has_kitchen BOOLEAN DEFAULT false,
    has_fridge BOOLEAN DEFAULT false,
    is_fully_furnished BOOLEAN DEFAULT false,
    -- Media
    images TEXT[] DEFAULT '{}',
    -- Status
    status room_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Roommate profiles (for tenant matching)
CREATE TABLE public.roommate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    bio TEXT,
    looking_for TEXT,
    university TEXT,
    budget_min BIGINT,
    budget_max BIGINT,
    preferred_district TEXT[],
    sleep_time TEXT, -- 'early', 'late', 'flexible'
    cleanliness TEXT, -- 'very_clean', 'moderate', 'relaxed'
    noise_level TEXT, -- 'quiet', 'moderate', 'social'
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roommate_profiles ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'match'
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Chat messages for AI (store conversation history)
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User roles: Users can read their own roles, admins can manage all
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "System can insert roles" ON public.user_roles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Profiles: Users can manage their own, admins can view all
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Wallets: Users can view/update own, admins can view all
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own wallet" ON public.wallets
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Transactions: Users can view own, admins can view all
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- AI Tokens: Users can manage their own
CREATE POLICY "Users can view own tokens" ON public.ai_tokens
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tokens" ON public.ai_tokens
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tokens" ON public.ai_tokens
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Rooms: Public read for active, landlords manage own, admins manage all
CREATE POLICY "Anyone can view active rooms" ON public.rooms
    FOR SELECT
    USING (status = 'active' OR landlord_id = auth.uid() OR public.is_admin());

CREATE POLICY "Landlords can insert rooms" ON public.rooms
    FOR INSERT TO authenticated
    WITH CHECK (landlord_id = auth.uid() AND public.is_landlord());

CREATE POLICY "Landlords can update own rooms" ON public.rooms
    FOR UPDATE TO authenticated
    USING (landlord_id = auth.uid() OR public.is_admin());

CREATE POLICY "Landlords can delete own rooms" ON public.rooms
    FOR DELETE TO authenticated
    USING (landlord_id = auth.uid() OR public.is_admin());

-- Roommate profiles: Public profiles visible to authenticated, own always visible
CREATE POLICY "View public or own roommate profiles" ON public.roommate_profiles
    FOR SELECT TO authenticated
    USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can insert own roommate profile" ON public.roommate_profiles
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own roommate profile" ON public.roommate_profiles
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Notifications: Users can manage their own
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Chat messages: Users can manage their own
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Updated at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_tokens_updated_at
    BEFORE UPDATE ON public.ai_tokens
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roommate_profiles_updated_at
    BEFORE UPDATE ON public.roommate_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
