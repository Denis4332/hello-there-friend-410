-- Add new CMS settings for improved pricing page explanation (using 'content' category)
INSERT INTO site_settings (category, key, value, type, label, description) VALUES
-- How it works section
('content', 'pricing_howto_title', 'So funktioniert''s', 'text', 'Preise: So funktioniert''s Titel', 'Überschrift für Prozess-Sektion'),
('content', 'pricing_howto_step1_title', 'Account erstellen', 'text', 'Preise: Schritt 1 Titel', 'Titel für Schritt 1'),
('content', 'pricing_howto_step1_text', 'Registriere dich kostenlos mit deiner E-Mail-Adresse.', 'text', 'Preise: Schritt 1 Text', 'Beschreibung für Schritt 1'),
('content', 'pricing_howto_step2_title', 'Inserat erstellen', 'text', 'Preise: Schritt 2 Titel', 'Titel für Schritt 2'),
('content', 'pricing_howto_step2_text', 'Fülle dein Profil aus und lade attraktive Fotos hoch.', 'text', 'Preise: Schritt 2 Text', 'Beschreibung für Schritt 2'),
('content', 'pricing_howto_step3_title', 'Paket wählen', 'text', 'Preise: Schritt 3 Titel', 'Titel für Schritt 3'),
('content', 'pricing_howto_step3_text', 'Wähle das passende Paket für deine Bedürfnisse.', 'text', 'Preise: Schritt 3 Text', 'Beschreibung für Schritt 3'),
('content', 'pricing_howto_step4_title', 'Freischaltung', 'text', 'Preise: Schritt 4 Titel', 'Titel für Schritt 4'),
('content', 'pricing_howto_step4_text', 'Nach kurzer Prüfung wird dein Inserat freigeschaltet.', 'text', 'Preise: Schritt 4 Text', 'Beschreibung für Schritt 4'),

-- Visibility explanation section
('content', 'pricing_visibility_title', 'Wo erscheint mein Inserat?', 'text', 'Preise: Sichtbarkeit Titel', 'Überschrift für Sichtbarkeits-Erklärung'),
('content', 'pricing_visibility_intro', 'Je höher dein Paket, desto mehr Sichtbarkeit und bessere Platzierung erhältst du.', 'textarea', 'Preise: Sichtbarkeit Intro', 'Einleitungstext'),
('content', 'pricing_visibility_top_title', 'TOP AD', 'text', 'Preise: TOP Sichtbarkeit Titel', 'Titel für TOP'),
('content', 'pricing_visibility_top_text', 'Schweizweit auf der Homepage sichtbar + in allen Suchergebnissen immer an erster Stelle', 'textarea', 'Preise: TOP Sichtbarkeit Text', 'Erklärung für TOP'),
('content', 'pricing_visibility_premium_title', 'Premium', 'text', 'Preise: Premium Sichtbarkeit Titel', 'Titel für Premium'),
('content', 'pricing_visibility_premium_text', 'Im gewählten Kanton oder GPS-Radius sichtbar, wird vor Basic-Inseraten angezeigt', 'textarea', 'Preise: Premium Sichtbarkeit Text', 'Erklärung für Premium'),
('content', 'pricing_visibility_basic_title', 'Basic', 'text', 'Preise: Basic Sichtbarkeit Titel', 'Titel für Basic'),
('content', 'pricing_visibility_basic_text', 'Im gewählten Kanton oder GPS-Radius sichtbar, Standard-Platzierung', 'textarea', 'Preise: Basic Sichtbarkeit Text', 'Erklärung für Basic'),

-- Verification section
('content', 'pricing_verification_title', 'Verifizierung – Mehr Vertrauen', 'text', 'Preise: Verifizierung Titel', 'Überschrift für Verifizierungs-Box'),
('content', 'pricing_verification_text', 'Verifizierte Profile erhalten ein Vertrauens-Badge und werden innerhalb ihrer Stufe bevorzugt angezeigt. Lade ein Foto hoch, das dich mit einem Zettel zeigt, auf dem unser Plattformname steht.', 'textarea', 'Preise: Verifizierung Text', 'Erklärungstext für Verifizierung'),

-- Additional FAQs (4-8)
('content', 'pricing_faq4_question', 'Wie lange dauert die Freischaltung?', 'text', 'Preise FAQ 4: Frage', 'Vierte FAQ Frage'),
('content', 'pricing_faq4_answer', 'Nach Prüfung durch unser Team wird dein Inserat normalerweise innerhalb von 24 Stunden freigeschaltet.', 'textarea', 'Preise FAQ 4: Antwort', 'Vierte FAQ Antwort'),
('content', 'pricing_faq5_question', 'Wann erscheint mein Inserat auf der Homepage?', 'text', 'Preise FAQ 5: Frage', 'Fünfte FAQ Frage'),
('content', 'pricing_faq5_answer', 'Nur TOP AD Inserate erscheinen auf der Homepage – und zwar schweizweit für alle Besucher sichtbar.', 'textarea', 'Preise FAQ 5: Antwort', 'Fünfte FAQ Antwort'),
('content', 'pricing_faq6_question', 'Was ist der Unterschied zwischen Kanton und GPS-Radius?', 'text', 'Preise FAQ 6: Frage', 'Sechste FAQ Frage'),
('content', 'pricing_faq6_answer', 'Der Kantonsfilter zeigt alle Inserate im gewählten Kanton. Der GPS-Radius zeigt nur Inserate innerhalb eines bestimmten Kilometer-Umkreises von deinem Standort.', 'textarea', 'Preise FAQ 6: Antwort', 'Sechste FAQ Antwort'),
('content', 'pricing_faq7_question', 'Kann ich mein Inserat pausieren?', 'text', 'Preise FAQ 7: Frage', 'Siebte FAQ Frage'),
('content', 'pricing_faq7_answer', 'Ja, in deinem Dashboard kannst du dein Inserat jederzeit deaktivieren und später wieder aktivieren.', 'textarea', 'Preise FAQ 7: Antwort', 'Siebte FAQ Antwort'),
('content', 'pricing_faq8_question', 'Kann ich mein Paket später upgraden?', 'text', 'Preise FAQ 8: Frage', 'Achte FAQ Frage'),
('content', 'pricing_faq8_answer', 'Ja, du kannst jederzeit auf ein höheres Paket wechseln, um mehr Sichtbarkeit zu erhalten.', 'textarea', 'Preise FAQ 8: Antwort', 'Achte FAQ Antwort')
ON CONFLICT (key) DO NOTHING;