-- ==================================================
-- TABELA: notifications
-- Sistema de notificações em tempo real
-- ==================================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Destinatário da notificação
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tipo de notificação (para filtros e ícones)
  type TEXT NOT NULL CHECK (type IN (
    'appointment_new',        -- Novo agendamento
    'appointment_cancelled',  -- Agendamento cancelado
    'appointment_rescheduled',-- Agendamento reagendado
    'payment_pix_validated',  -- PIX validado pelo profissional
    'credits_released',       -- Créditos liberados
    'session_reminder',       -- Lembrete de sessão próxima
    'chat_message',           -- Nova mensagem no chat
    'system'                  -- Notificação do sistema
  )),

  -- Conteúdo
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Metadados para navegação/ações
  metadata JSONB DEFAULT '{}',

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint
  CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- ==================================================
-- ÍNDICES
-- ==================================================
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read)
  WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- ==================================================
-- RLS (Row Level Security)
-- ==================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Usuário só vê suas próprias notificações
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Usuário pode atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuário pode deletar suas próprias notificações
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Backend (service role) pode inserir notificações
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (TRUE);

-- ==================================================
-- REALTIME: Habilitar para a tabela
-- ==================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ==================================================
-- FUNÇÃO: create_notification
-- Função auxiliar para criar notificações
-- ==================================================
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;
