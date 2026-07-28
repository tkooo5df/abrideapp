-- جدول تتبع الإلغاءات
CREATE TABLE IF NOT EXISTS cancellation_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('driver', 'passenger')),
  cancellation_type VARCHAR(20) NOT NULL CHECK (cancellation_type IN ('trip_cancellation', 'booking_cancellation')),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_cancellation_tracking_user_id ON cancellation_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_tracking_cancelled_at ON cancellation_tracking(cancelled_at);
CREATE INDEX IF NOT EXISTS idx_cancellation_tracking_user_type ON cancellation_tracking(user_type);

-- جدول حالة الإيقاف
CREATE TABLE IF NOT EXISTS account_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suspension_type VARCHAR(20) NOT NULL CHECK (suspension_type IN ('cancellation_limit', 'manual', 'other')),
  suspension_reason TEXT NOT NULL,
  suspension_count INTEGER DEFAULT 1,
  suspended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  suspended_by UUID REFERENCES auth.users(id),
  reactivated_at TIMESTAMP WITH TIME ZONE,
  reactivated_by UUID REFERENCES auth.users(id),
  reactivation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_account_suspensions_user_id ON account_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_suspensions_suspended_at ON account_suspensions(suspended_at);

-- دالة لحساب عدد الإلغاءات في آخر 15 يوم
CREATE OR REPLACE FUNCTION get_cancellation_count_last_15_days(p_user_id UUID, p_user_type VARCHAR)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM cancellation_tracking
    WHERE user_id = p_user_id
      AND user_type = p_user_type
      AND cancelled_at >= NOW() - INTERVAL '15 days'
  );
END;
$$ LANGUAGE plpgsql;

-- دالة للتحقق من حالة الإيقاف
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM account_suspensions
    WHERE user_id = p_user_id
      AND reactivated_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;

-- دالة لإيقاف الحساب
CREATE OR REPLACE FUNCTION suspend_user_account(
  p_user_id UUID,
  p_suspension_type VARCHAR,
  p_suspension_reason TEXT,
  p_suspended_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  suspension_id UUID;
BEGIN
  -- إدراج سجل الإيقاف
  INSERT INTO account_suspensions (
    user_id,
    suspension_type,
    suspension_reason,
    suspended_by
  ) VALUES (
    p_user_id,
    p_suspension_type,
    p_suspension_reason,
    p_suspended_by
  ) RETURNING id INTO suspension_id;

  -- تحديث حالة المستخدم في جدول profiles
  UPDATE profiles 
  SET account_suspended = true,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN suspension_id;
END;
$$ LANGUAGE plpgsql;

-- دالة لإعادة فتح الحساب
CREATE OR REPLACE FUNCTION reactivate_user_account(
  p_user_id UUID,
  p_reactivation_reason TEXT,
  p_reactivated_by UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- تحديث سجل الإيقاف
  UPDATE account_suspensions
  SET reactivated_at = NOW(),
      reactivated_by = p_reactivated_by,
      reactivation_reason = p_reactivation_reason
  WHERE user_id = p_user_id
    AND reactivated_at IS NULL;

  -- تحديث حالة المستخدم في جدول profiles
  UPDATE profiles 
  SET account_suspended = false,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- دالة لتسجيل الإلغاء
CREATE OR REPLACE FUNCTION log_cancellation(
  p_user_id UUID,
  p_user_type VARCHAR,
  p_cancellation_type VARCHAR,
  p_trip_id UUID DEFAULT NULL,
  p_booking_id UUID DEFAULT NULL,
  p_cancellation_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  cancellation_id UUID;
  cancellation_count INTEGER;
BEGIN
  -- تسجيل الإلغاء
  INSERT INTO cancellation_tracking (
    user_id,
    user_type,
    cancellation_type,
    trip_id,
    booking_id,
    cancellation_reason
  ) VALUES (
    p_user_id,
    p_user_type,
    p_cancellation_type,
    p_trip_id,
    p_booking_id,
    p_cancellation_reason
  ) RETURNING id INTO cancellation_id;

  -- حساب عدد الإلغاءات في آخر 15 يوم
  SELECT get_cancellation_count_last_15_days(p_user_id, p_user_type) INTO cancellation_count;

  -- إذا وصل العدد إلى 3، إيقاف الحساب
  IF cancellation_count >= 3 THEN
    PERFORM suspend_user_account(
      p_user_id,
      'cancellation_limit',
      'تم إيقاف الحساب بسبب تجاوز حد الإلغاءات (3 إلغاءات في 15 يوم)'
    );
  END IF;

  RETURN cancellation_id;
END;
$$ LANGUAGE plpgsql;

-- إضافة سياسات الأمان (RLS)
ALTER TABLE cancellation_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_suspensions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول تتبع الإلغاءات
CREATE POLICY "Users can view their own cancellations" ON cancellation_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all cancellations" ON cancellation_tracking
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  );

-- سياسات الأمان لجدول إيقاف الحسابات
CREATE POLICY "Users can view their own suspensions" ON account_suspensions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all suspensions" ON account_suspensions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
  );

-- إضافة تعليقات للتوثيق
COMMENT ON TABLE cancellation_tracking IS 'جدول تتبع إلغاءات المستخدمين للرحلات والحجوزات';
COMMENT ON TABLE account_suspensions IS 'جدول إيقاف الحسابات بسبب تجاوز حد الإلغاءات أو أسباب أخرى';
COMMENT ON FUNCTION get_cancellation_count_last_15_days IS 'دالة لحساب عدد الإلغاءات في آخر 15 يوم';
COMMENT ON FUNCTION is_user_suspended IS 'دالة للتحقق من حالة إيقاف المستخدم';
COMMENT ON FUNCTION suspend_user_account IS 'دالة لإيقاف حساب المستخدم';
COMMENT ON FUNCTION reactivate_user_account IS 'دالة لإعادة فتح حساب المستخدم';
COMMENT ON FUNCTION log_cancellation IS 'دالة لتسجيل الإلغاء والتحقق من حد الإلغاءات';
