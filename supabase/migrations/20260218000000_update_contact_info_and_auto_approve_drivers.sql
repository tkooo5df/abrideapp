-- Update contact information in system_settings
-- Add auto_approve_drivers setting

-- Update support phone
UPDATE system_settings
SET value = '"213559509817"'::jsonb,
    description = 'رقم الهاتف البديل للدعم',
    updated_at = now()
WHERE key = 'support_phone_alt';

-- Insert if not exists
INSERT INTO system_settings (key, value, description)
VALUES ('support_phone_alt', '"213559509817"'::jsonb, 'رقم الهاتف البديل للدعم')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

-- Update support email
UPDATE system_settings
SET value = '"support@abride.online"'::jsonb,
    description = 'بريد الدعم الرسمي',
    updated_at = now()
WHERE key = 'support_email';

-- Update support phone main
UPDATE system_settings
SET value = '"+213 782 307 777"'::jsonb,
    description = 'رقم الدعم الرئيسي',
    updated_at = now()
WHERE key = 'support_phone';

-- Add auto_approve_drivers setting
INSERT INTO system_settings (key, value, description)
VALUES ('auto_approve_drivers', 'false'::jsonb, 'قبول السائقين الجدد تلقائياً (true) أو مراجعتهم بواسطة الأدمن (false)')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

-- Add support email alt
INSERT INTO system_settings (key, value, description)
VALUES ('support_email_alt', '"amineatazpro@gmail.com"'::jsonb, 'بريد الدعم البديل')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = now();

