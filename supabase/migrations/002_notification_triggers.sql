-- ==================================================
-- TRIGGERS AUTOMÁTICOS PARA NOTIFICAÇÕES
-- Execute este arquivo após criar a tabela notifications
-- ==================================================

-- ==================================================
-- TRIGGER: Notificar sobre novo agendamento
-- ==================================================
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_name TEXT;
  v_appointment_type_raw TEXT;
  v_appointment_type TEXT;
  v_start_formatted TEXT;
BEGIN
  -- Busca nome do cliente
  SELECT nome INTO v_client_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Converte ENUM para TEXT primeiro
  v_appointment_type_raw := NEW.appointment_type::TEXT;

  -- Formata tipo de sessão para exibição
  v_appointment_type := CASE v_appointment_type_raw
    WHEN 'video' THEN 'Videochamada'
    WHEN 'chat' THEN 'Chat'
    ELSE v_appointment_type_raw
  END;

  -- Formata data/hora
  v_start_formatted := to_char(NEW.start_at AT TIME ZONE 'America/Sao_Paulo',
    'DD/MM/YYYY "às" HH24:MI');

  -- Notifica o profissional
  PERFORM public.create_notification(
    NEW.profissional_id,
    'appointment_new',
    'Novo agendamento',
    format('%s agendou uma sessão de %s para %s',
      COALESCE(v_client_name, 'Cliente'),
      v_appointment_type,
      v_start_formatted),
    jsonb_build_object(
      'appointment_id', NEW.id,
      'client_name', v_client_name,
      'appointment_type', v_appointment_type_raw,
      'start_at', NEW.start_at,
      'link', '/profissional/sessoes/' || NEW.id
    )
  );

  -- Notifica o cliente (confirmação)
  PERFORM public.create_notification(
    NEW.user_id,
    'appointment_new',
    'Agendamento confirmado',
    format('Sua sessão de %s foi agendada para %s',
      v_appointment_type,
      v_start_formatted),
    jsonb_build_object(
      'appointment_id', NEW.id,
      'appointment_type', v_appointment_type_raw,
      'start_at', NEW.start_at,
      'link', '/sessoes/' || NEW.id
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_appointment ON public.appointments;
CREATE TRIGGER trg_notify_new_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW
WHEN (NEW.status = 'scheduled')
EXECUTE FUNCTION public.notify_new_appointment();


-- ==================================================
-- TRIGGER: Notificar sobre cancelamento
-- ==================================================
CREATE OR REPLACE FUNCTION public.notify_appointment_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_name TEXT;
  v_start_formatted TEXT;
BEGIN
  -- Só executa se status mudou para 'cancelled'
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Busca nome do cliente
    SELECT nome INTO v_client_name FROM public.profiles WHERE id = NEW.user_id;

    v_start_formatted := to_char(NEW.start_at AT TIME ZONE 'America/Sao_Paulo',
      'DD/MM/YYYY "às" HH24:MI');

    -- Notifica profissional
    PERFORM public.create_notification(
      NEW.profissional_id,
      'appointment_cancelled',
      'Sessão cancelada',
      format('A sessão com %s em %s foi cancelada',
        COALESCE(v_client_name, 'Cliente'), v_start_formatted),
      jsonb_build_object(
        'appointment_id', NEW.id,
        'client_name', v_client_name,
        'start_at', NEW.start_at
      )
    );

    -- Notifica cliente
    PERFORM public.create_notification(
      NEW.user_id,
      'appointment_cancelled',
      'Sessão cancelada',
      format('Sua sessão de %s foi cancelada', v_start_formatted),
      jsonb_build_object(
        'appointment_id', NEW.id,
        'start_at', NEW.start_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_appointment_cancelled ON public.appointments;
CREATE TRIGGER trg_notify_appointment_cancelled
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_appointment_cancelled();


-- ==================================================
-- TRIGGER: Notificar sobre reagendamento
-- ==================================================
CREATE OR REPLACE FUNCTION public.notify_appointment_rescheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_name TEXT;
  v_old_formatted TEXT;
  v_new_formatted TEXT;
BEGIN
  -- Só executa se data mudou e status é 'rescheduled'
  IF OLD.start_at != NEW.start_at AND NEW.status = 'rescheduled' THEN
    SELECT nome INTO v_client_name FROM public.profiles WHERE id = NEW.user_id;

    v_old_formatted := to_char(OLD.start_at AT TIME ZONE 'America/Sao_Paulo',
      'DD/MM "às" HH24:MI');
    v_new_formatted := to_char(NEW.start_at AT TIME ZONE 'America/Sao_Paulo',
      'DD/MM "às" HH24:MI');

    -- Notifica profissional
    PERFORM public.create_notification(
      NEW.profissional_id,
      'appointment_rescheduled',
      'Sessão reagendada',
      format('Sessão com %s foi movida de %s para %s',
        COALESCE(v_client_name, 'Cliente'), v_old_formatted, v_new_formatted),
      jsonb_build_object(
        'appointment_id', NEW.id,
        'old_start_at', OLD.start_at,
        'new_start_at', NEW.start_at,
        'link', '/profissional/sessoes/' || NEW.id
      )
    );

    -- Notifica cliente
    PERFORM public.create_notification(
      NEW.user_id,
      'appointment_rescheduled',
      'Sessão reagendada',
      format('Sua sessão foi movida de %s para %s', v_old_formatted, v_new_formatted),
      jsonb_build_object(
        'appointment_id', NEW.id,
        'old_start_at', OLD.start_at,
        'new_start_at', NEW.start_at,
        'link', '/sessoes/' || NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_appointment_rescheduled ON public.appointments;
CREATE TRIGGER trg_notify_appointment_rescheduled
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_appointment_rescheduled();


-- ==================================================
-- TRIGGER: Notificar cliente quando PIX for validado
-- ==================================================
CREATE OR REPLACE FUNCTION public.notify_pix_validated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_title TEXT;
  v_sessions_count INT;
BEGIN
  -- Só executa quando status muda de 'pending_pix' para 'paid'
  IF OLD.status = 'pending_pix' AND NEW.status = 'paid' THEN
    -- Busca info do produto
    SELECT title, sessions_count INTO v_product_title, v_sessions_count
    FROM public.products
    WHERE id = NEW.product_id;

    -- Notifica cliente sobre validação do PIX
    PERFORM public.create_notification(
      NEW.user_id,
      'payment_pix_validated',
      'Pagamento PIX confirmado',
      format('Seu pagamento de %s foi validado com sucesso!',
        COALESCE(v_product_title, 'pacote de sessões')),
      jsonb_build_object(
        'order_id', NEW.id,
        'product_title', v_product_title
      )
    );

    -- Notifica sobre créditos liberados
    IF v_sessions_count IS NOT NULL AND v_sessions_count > 0 THEN
      PERFORM public.create_notification(
        NEW.user_id,
        'credits_released',
        'Créditos liberados',
        format('%s crédito(s) de sessão foram adicionados à sua conta', v_sessions_count),
        jsonb_build_object(
          'order_id', NEW.id,
          'credits_added', v_sessions_count,
          'link', '/agenda'
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_pix_validated ON public.orders;
CREATE TRIGGER trg_notify_pix_validated
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_pix_validated();


-- ==================================================
-- TRIGGER: Notificar sobre nova mensagem de chat
-- (Opcional - pode gerar muitas notificações)
-- ==================================================
CREATE OR REPLACE FUNCTION public.notify_new_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_name TEXT;
  v_recipient_id UUID;
  v_appointment_info RECORD;
BEGIN
  -- Busca nome do remetente
  SELECT nome INTO v_sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Busca info do appointment para saber quem notificar
  SELECT user_id, profissional_id INTO v_appointment_info
  FROM public.appointments
  WHERE id = NEW.appointment_id;

  -- Define destinatário (o outro participante)
  IF NEW.sender_role = 'profissional' THEN
    v_recipient_id := v_appointment_info.user_id;
  ELSE
    v_recipient_id := v_appointment_info.profissional_id;
  END IF;

  -- Notifica o destinatário
  PERFORM public.create_notification(
    v_recipient_id,
    'chat_message',
    'Nova mensagem',
    format('%s enviou: %s',
      COALESCE(v_sender_name, 'Alguém'),
      LEFT(NEW.message, 50) || CASE WHEN LENGTH(NEW.message) > 50 THEN '...' ELSE '' END),
    jsonb_build_object(
      'chat_appointment_id', NEW.appointment_id,
      'sender_name', v_sender_name,
      'sender_role', NEW.sender_role,
      'link', CASE
        WHEN NEW.sender_role = 'profissional' THEN '/sessoes/' || NEW.appointment_id
        ELSE '/profissional/sessoes/' || NEW.appointment_id
      END
    )
  );

  RETURN NEW;
END;
$$;

-- NOTA: Descomente as linhas abaixo se quiser ativar notificações de chat
-- Pode gerar muitas notificações durante uma sessão de chat ativa

-- DROP TRIGGER IF EXISTS trg_notify_new_chat_message ON public.chat_messages;
-- CREATE TRIGGER trg_notify_new_chat_message
-- AFTER INSERT ON public.chat_messages
-- FOR EACH ROW
-- EXECUTE FUNCTION public.notify_new_chat_message();
