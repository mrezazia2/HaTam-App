INSERT INTO `app_menu_items` (`id`, `label`, `subtitle`, `icon`, `action`, `target`, `variant`, `enabled`, `sort_order`, `created_at`, `updated_at`)
VALUES
  ('home', 'صفحه اصلی', '', 'home', 'home', '', 'item', 1, 10, 1787385600000, 1787385600000),
  ('urgent', 'فروش سریع', '', 'rocket', 'urgent', '', 'item', 1, 20, 1787385600000, 1787385600000),
  ('vip', 'مشتریان VIP', '', 'person', 'featured', '', 'item', 1, 30, 1787385600000, 1787385600000),
  ('featured', 'املاک ویژه', '', 'bookmark', 'featured', '', 'item', 1, 40, 1787385600000, 1787385600000),
  ('cooperate', 'همکاری با ما', '', 'consultant', 'consultants', '/register/consultant', 'item', 1, 50, 1787385600000, 1787385600000),
  ('contact', 'آدرس و ارتباط', '', 'contact', 'contact', '/content/contact', 'item', 1, 60, 1787385600000, 1787385600000),
  ('register', 'ثبت فوری ملک', 'ارزیابی و فروش در ۷۲ ساعت', 'plus', 'register-property', '', 'cta', 1, 70, 1787385600000, 1787385600000)
ON CONFLICT (`id`) DO NOTHING;

INSERT INTO `app_menu_items` (`id`, `label`, `subtitle`, `icon`, `action`, `target`, `variant`, `enabled`, `sort_order`, `created_at`, `updated_at`)
VALUES ('trust', 'اعتماد شما', '', 'heart', 'url', '/trust', 'item', 1, 15, 1787385600000, 1787385600000)
ON CONFLICT (`id`) DO UPDATE SET
  `label` = excluded.`label`,
  `icon` = excluded.`icon`,
  `action` = excluded.`action`,
  `target` = excluded.`target`,
  `variant` = excluded.`variant`,
  `enabled` = excluded.`enabled`,
  `sort_order` = excluded.`sort_order`,
  `updated_at` = excluded.`updated_at`;
