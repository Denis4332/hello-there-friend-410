-- Add site_settings entries for AGB page (legal content)
INSERT INTO site_settings (key, label, value, type, category, description) VALUES
('legal_agb_title', 'AGB: Titel', 'Allgemeine Geschäftsbedingungen', 'text', 'content', 'Haupttitel der AGB-Seite'),
('legal_agb_section1_title', 'AGB: Abschnitt 1 Titel', '1. Geltungsbereich', 'text', 'content', 'AGB Abschnitt 1 Titel'),
('legal_agb_section1_content', 'AGB: Abschnitt 1 Inhalt', 'ESCORIA betreibt ein Online-Verzeichnis für Anbieter in der Schweiz. Diese AGB regeln die Nutzung der Plattform sowie die Rechte und Pflichten zwischen Betreiber und Nutzern. Mit der Nutzung akzeptieren Sie diese Bedingungen.', 'textarea', 'content', 'AGB Abschnitt 1 Inhalt'),
('legal_agb_section2_title', 'AGB: Abschnitt 2 Titel', '2. Verbot rechtswidriger Inhalte', 'text', 'content', 'AGB Abschnitt 2 Titel'),
('legal_agb_section2_content', 'AGB: Abschnitt 2 Inhalt', 'Die Veröffentlichung von Inhalten, die gegen schweizerisches Recht verstossen, ist strengstens untersagt. Dies umfasst insbesondere die Darstellung von Minderjährigen, illegale Dienstleistungen sowie diskriminierende oder beleidigende Inhalte.', 'textarea', 'content', 'AGB Abschnitt 2 Inhalt'),
('legal_agb_section3_title', 'AGB: Abschnitt 3 Titel', '3. Notice-and-Takedown-Verfahren', 'text', 'content', 'AGB Abschnitt 3 Titel'),
('legal_agb_section3_content', 'AGB: Abschnitt 3 Inhalt', 'ESCORIA nimmt Hinweise auf rechtswidrige Inhalte ernst. Gemeldete Profile werden unverzüglich geprüft und bei begründetem Verdacht gesperrt. Nutzer können Verstösse über die Meldefunktion anzeigen. Bei wiederholten Verstössen erfolgt ein dauerhafter Ausschluss.', 'textarea', 'content', 'AGB Abschnitt 3 Inhalt'),
('legal_agb_section4_title', 'AGB: Abschnitt 4 Titel', '4. Sperrrecht und Haftungsausschluss', 'text', 'content', 'AGB Abschnitt 4 Titel'),
('legal_agb_section4_content', 'AGB: Abschnitt 4 Inhalt', 'ESCORIA behält sich das Recht vor, Profile ohne Angabe von Gründen zu sperren oder zu löschen. Die Plattform übernimmt keine Haftung für die Richtigkeit der Angaben in Profilen. Nutzer sind selbst verantwortlich für ihre Kontaktaufnahme und Vereinbarungen.', 'textarea', 'content', 'AGB Abschnitt 4 Inhalt'),
('legal_agb_section5_title', 'AGB: Abschnitt 5 Titel', '5. Gerichtsstand', 'text', 'content', 'AGB Abschnitt 5 Titel'),
('legal_agb_section5_content', 'AGB: Abschnitt 5 Inhalt', 'Es gilt ausschliesslich schweizerisches Recht. Gerichtsstand ist der Sitz des Betreibers in der Schweiz.', 'textarea', 'content', 'AGB Abschnitt 5 Inhalt');

-- Add site_settings entries for Datenschutz page (privacy policy)
INSERT INTO site_settings (key, label, value, type, category, description) VALUES
('legal_privacy_title', 'Datenschutz: Titel', 'Datenschutzerklärung', 'text', 'content', 'Haupttitel der Datenschutz-Seite'),
('legal_privacy_intro', 'Datenschutz: Einleitung', 'ESCORIA nimmt den Schutz Ihrer persönlichen Daten sehr ernst. Diese Datenschutzerklärung informiert Sie umfassend über die Verarbeitung Ihrer personenbezogenen Daten gemäss dem schweizerischen Datenschutzgesetz (DSG) und der EU-Datenschutz-Grundverordnung (DSGVO).', 'textarea', 'content', 'Einleitungstext der Datenschutz-Seite'),
('legal_privacy_section1_title', 'Datenschutz: Abschnitt 1 Titel', '1. Verantwortliche Stelle', 'text', 'content', 'Datenschutz Abschnitt 1 Titel'),
('legal_privacy_section1_content', 'Datenschutz: Abschnitt 1 Inhalt', 'Verantwortlich für die Datenverarbeitung auf dieser Website ist ESCORIA. Kontaktdaten finden Sie in unserem Impressum.', 'textarea', 'content', 'Datenschutz Abschnitt 1 Inhalt'),
('legal_privacy_contact', 'Datenschutz: Kontakt für Anfragen', 'Bitte richten Sie alle Anfragen an die im Impressum genannte E-Mail-Adresse.', 'textarea', 'content', 'Kontaktinformation für Datenschutzanfragen');

-- Add site_settings entries for Pricing FAQ
INSERT INTO site_settings (key, label, value, type, category, description) VALUES
('pricing_faq1_question', 'Preise FAQ 1: Frage', 'Kann ich später upgraden?', 'text', 'content', 'FAQ Frage 1'),
('pricing_faq1_answer', 'Preise FAQ 1: Antwort', 'Ja, du kannst jederzeit zu einem höheren Paket wechseln. Dein Inserat wird sofort mit den neuen Features aktualisiert.', 'textarea', 'content', 'FAQ Antwort 1'),
('pricing_faq2_question', 'Preise FAQ 2: Frage', 'Wie funktioniert die Bezahlung?', 'text', 'content', 'FAQ Frage 2'),
('pricing_faq2_answer', 'Preise FAQ 2: Antwort', 'Die Bezahlung erfolgt sicher über Stripe per Kreditkarte oder TWINT. Du kannst jederzeit kündigen.', 'textarea', 'content', 'FAQ Antwort 2'),
('pricing_faq3_question', 'Preise FAQ 3: Frage', 'Was passiert nach Ablauf des Pakets?', 'text', 'content', 'FAQ Frage 3'),
('pricing_faq3_answer', 'Preise FAQ 3: Antwort', 'Dein Inserat bleibt online, wird aber deaktiviert. Du kannst jederzeit wieder ein Paket buchen.', 'textarea', 'content', 'FAQ Antwort 3'),
('pricing_feature_comparison_title', 'Preise: Feature-Vergleich Titel', 'Feature-Vergleich', 'text', 'content', 'Titel für Feature-Vergleichstabelle'),
('pricing_cta_title', 'Preise: CTA Titel', 'Bereit durchzustarten?', 'text', 'content', 'Call-to-Action Titel am Ende'),
('pricing_cta_subtitle', 'Preise: CTA Untertitel', 'Erstelle jetzt dein Inserat und wähle das passende Paket.', 'textarea', 'content', 'Call-to-Action Untertitel'),
('pricing_cta_button', 'Preise: CTA Button', 'Jetzt Inserat erstellen', 'text', 'content', 'Call-to-Action Button Text');