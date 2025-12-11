-- Add new AGB CMS settings for full 18-section structure

-- Intro fields
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_stand', 'Stand: 10. Dezember 2025', 'text', 'content', 'AGB Stand/Datum', 'Datum der aktuellen AGB-Version'),
('legal_agb_intro', '<p><strong>Betreiberin:</strong> isyWeb KLG, [Adresse], [PLZ/Ort], [Handelsregister-Nr.], E-Mail: info@isyweb.ch</p><p><strong>Portal:</strong> Die Website escoria.ch samt Subdomains und zugehörigen Diensten (nachfolgend «Portal»).</p><p><strong>Datenschutz:</strong> Hinweise zur Datenbearbeitung finden sich in der Datenschutzerklärung.</p>', 'textarea', 'content', 'AGB Intro/Betreiber-Info', 'Einleitender Block mit Betreiber-Informationen');

-- Section 6: Zahlung
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section6_title', '6. Zahlung, Fälligkeit, Rückerstattung, Chargebacks', 'text', 'content', 'AGB Section 6 Titel', 'Titel für AGB Abschnitt 6'),
('legal_agb_section6_content', '<p><strong>6.1</strong> Gebühren sind im Voraus fällig (Vorkasse). Veröffentlichung erfolgt erst nach Zahlungseingang und ggf. Prüfung/Moderation.</p><p><strong>6.2</strong> Kein Anspruch auf Rückerstattung nach Veröffentlichung. Wird ein Inserat vor Veröffentlichung abgelehnt, erhält der Inserent Gelegenheit zur Nachbesserung; scheitert diese endgültig aus Gründen, die der Inserent nicht zu vertreten hat, kann eine Erstattung erfolgen.</p><p><strong>6.3</strong> Bei Verzug: 10,0 % p. a. Verzugszins; CHF 25.00 pro Mahnung; Zugangssperre, Forderungsabtretung oder Inkasso möglich.</p><p><strong>6.4</strong> Chargebacks/Disputes: Entstehen der Betreiberin durch Rückbelastungen Gebühren/Schäden, die auf Verstösse des Inserenten zurückgehen, hat der Inserent diese zu erstatten.</p><p><strong>6.5</strong> Zahlungen für beworbene Drittleistungen sind nicht Gegenstand des Portals.</p>', 'textarea', 'content', 'AGB Section 6 Inhalt', 'Inhalt für AGB Abschnitt 6');

-- Section 7: Inhalte, Rechte
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section7_title', '7. Inhalte, Rechte, verbotene Inhalte', 'text', 'content', 'AGB Section 7 Titel', 'Titel für AGB Abschnitt 7'),
('legal_agb_section7_content', '<p><strong>7.1</strong> Inserenten sind für Richtigkeit, Aktualität, Rechtmässigkeit ihrer Inserate allein verantwortlich; veraltete Inserate sind unverzüglich zu löschen.</p><p><strong>7.2</strong> Inserenten garantieren, alle Rechte (Urheber-, Marken-, Persönlichkeitsrechte) an übermittelten Inhalten zu besitzen und räumen der Betreiberin ein nicht-exklusives, zeitlich/örtlich unbeschränktes, übertragbares und unterlizenzierbares Nutzungsrecht zur Darstellung, technischen Aufbereitung (z. B. Komprimierung/Thumbnails), Archivierung und internen Bewerbung ein.</p><p><strong>7.3</strong> Strafrechtsverweise (Schweiz): Die Veröffentlichung harter oder sonst strafbarer Pornografie im Sinne von Art. 197 StGB sowie sonstiger strafbarer Inhalte (u. a. Art. 135, 259 StGB) ist strikt untersagt.</p><p><strong>7.4</strong> Explizites verboten: sichtbare Genitalien, sexuelle Handlungen (einschliesslich penetrierender Akte), Gewalt- oder Erniedrigungsdarstellungen, Inhalte mit Minderjährigen (auch «kindlich wirkend»/virtuell) oder Tieren, ungeschützter Geschlechtsverkehr, Darstellungen von menschlichen Ausscheidungen.</p><p><strong>7.5</strong> Weiche Erotik (z. B. nackter Oberkörper) kann zulässig sein, sofern keine Sexualhandlung gezeigt/nahegelegt wird und Jugendschutz/Persönlichkeitsrechte gewahrt bleiben sowie die Content-Policy eingehalten ist.</p><p><strong>7.6</strong> Irreführung & Rechte Dritter: Unwahre/irreführende Angaben, Verletzung von Immaterialgüter-/Persönlichkeitsrechten sowie Werbung für Konkurrenzportale, Geldspiele, Heimarbeit/MLM, Schneeball-/Schenkkreise sind untersagt.</p><p><strong>7.7</strong> Abgebildete Personen müssen mindestens 18 Jahre alt sein; die Betreiberin kann Alters-/Identitätsnachweise verlangen.</p>', 'textarea', 'content', 'AGB Section 7 Inhalt', 'Inhalt für AGB Abschnitt 7');

-- Section 8: Moderation
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section8_title', '8. Moderation, Notice-&-Takedown, Sanktionen', 'text', 'content', 'AGB Section 8 Titel', 'Titel für AGB Abschnitt 8'),
('legal_agb_section8_content', '<p><strong>8.1</strong> Die Betreiberin darf Inserate/Konten vor Veröffentlichung prüfen und ablehnen, anpassen, herabstufen, sperren oder löschen, wenn dies zur Einhaltung von Recht/AGB/Policy erforderlich ist.</p><p><strong>8.2</strong> Es besteht ein Meldesystem. Meldungen werden in der Regel innerhalb von 24 Stunden geprüft; rechtswidrige oder gegen diese AGB verstossende Inhalte werden entfernt/gesperrt (Notice-&-Takedown).</p><p><strong>8.3</strong> Bei Verdacht auf Straftaten kann die Betreiberin Daten sichern, Zugänge sperren und Behörden informieren.</p><p><strong>8.4</strong> Bei schwerwiegenden Verstössen, Betrug oder Missbrauch kostenpflichtiger Leistungen kann die Betreiberin eine Vertragsstrafe von CHF 1''000.00 verhängen (unabhängig vom Schadensnachweis).</p>', 'textarea', 'content', 'AGB Section 8 Inhalt', 'Inhalt für AGB Abschnitt 8');

-- Section 9: Kommunikation
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section9_title', '9. Kommunikation, Benachrichtigungen', 'text', 'content', 'AGB Section 9 Titel', 'Titel für AGB Abschnitt 9'),
('legal_agb_section9_content', '<p><strong>9.1</strong> Die Betreiberin kann Nutzer über E-Mail, SMS, Messenger oder vergleichbare Kanäle kontaktieren (z. B. Systeminfos, Rechnungen, Sicherheit).</p><p><strong>9.2</strong> Nachrichten können Werbung enthalten; Nutzer können dem jederzeit widersprechen (Opt-out).</p><p><strong>9.3</strong> Inserenten und Besucher kommunizieren direkt miteinander und sind hierfür selbst verantwortlich.</p>', 'textarea', 'content', 'AGB Section 9 Inhalt', 'Inhalt für AGB Abschnitt 9');

-- Section 10: Technische Nutzung
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section10_title', '10. Technische Nutzung, Betrieb, Sicherheit', 'text', 'content', 'AGB Section 10 Titel', 'Titel für AGB Abschnitt 10'),
('legal_agb_section10_content', '<p><strong>10.1</strong> Automatisierter Zugriff (Bots, Scraping, Crawler, Spiders, Skripte) ist untersagt.</p><p><strong>10.2</strong> Es besteht keine Garantie auf ununterbrochene Verfügbarkeit; Wartungen, Störungen oder Änderungen können die Nutzung einschränken.</p><p><strong>10.3</strong> Nutzer schützen eigene Systeme/Daten gegen Missbrauch, Verlust und unbefugten Zugriff.</p>', 'textarea', 'content', 'AGB Section 10 Inhalt', 'Inhalt für AGB Abschnitt 10');

-- Section 11: Haftung
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section11_title', '11. Gewährleistung, Haftung, Freistellung', 'text', 'content', 'AGB Section 11 Titel', 'Titel für AGB Abschnitt 11'),
('legal_agb_section11_content', '<p><strong>11.1</strong> Das Portal wird „as is" bereitgestellt; es besteht keine Zusicherung bestimmter Reichweiten, Platzierungen oder Vermittlungserfolge.</p><p><strong>11.2</strong> Die Betreiberin haftet nur für Schäden aus Vorsatz oder grober Fahrlässigkeit; jede weitergehende Haftung (insb. für indirekte Schäden, entgangenen Gewinn, Datenverlust, Drittinhalte) ist ausgeschlossen. Hilfspersonenhaftung wird wegbedungen.</p><p><strong>11.3</strong> Inserenten stellen die Betreiberin frei von Ansprüchen Dritter (inkl. Anwalts-/Gerichtskosten), die aus ihren Inhalten, Rechtsverletzungen oder Verstössen gegen diese AGB entstehen.</p>', 'textarea', 'content', 'AGB Section 11 Inhalt', 'Inhalt für AGB Abschnitt 11');

-- Section 12: Laufzeit, Kündigung
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section12_title', '12. Laufzeit, Kündigung, Sperre', 'text', 'content', 'AGB Section 12 Titel', 'Titel für AGB Abschnitt 12'),
('legal_agb_section12_content', '<p><strong>12.1</strong> Der Nutzungsvertrag läuft auf unbestimmte Zeit. Nutzer können ihr Konto löschen, sofern keine offenen Forderungen bestehen.</p><p><strong>12.2</strong> Die Betreiberin kann den Zugriff fristlos sperren/kündigen, wenn gewichtige Gründe vorliegen (z. B. Rechtsverstösse, Missbrauch, Zahlungsverzug).</p><p><strong>12.3</strong> Bereits bezahlte Leistungen werden bei Sperre/Kündigung nicht erstattet, sofern die Leistung begonnen/erbracht wurde oder eine Löschung wegen Verstosses erfolgt.</p>', 'textarea', 'content', 'AGB Section 12 Inhalt', 'Inhalt für AGB Abschnitt 12');

-- Section 13: Datenschutz
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section13_title', '13. Datenschutz', 'text', 'content', 'AGB Section 13 Titel', 'Titel für AGB Abschnitt 13'),
('legal_agb_section13_content', '<p>Es gilt die Datenschutzerklärung der Betreiberin. Die Betreiberin verarbeitet Personendaten zur Vertragserfüllung, Portalbetrieb, Abrechnung, Sicherheit, Rechtsdurchsetzung und – wo zulässig – zu Marketingzwecken (Opt-out möglich). Auftragsverarbeiter und Drittlandtransfers werden gemäss Datenschutzerklärung geregelt.</p>', 'textarea', 'content', 'AGB Section 13 Inhalt', 'Inhalt für AGB Abschnitt 13');

-- Section 14: Compliance
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section14_title', '14. Compliance, Behörden, Zahlungsdienstleister', 'text', 'content', 'AGB Section 14 Titel', 'Titel für AGB Abschnitt 14'),
('legal_agb_section14_content', '<p><strong>14.1</strong> Die Betreiberin kann zur Einhaltung gesetzlicher/vertraglicher Vorgaben (z. B. Zahlungsdienstleister) zusätzliche Nachweise oder Prozessanpassungen verlangen (Age-Gate, Identitäts-/Altersnachweise der Inserenten, Moderations-SOP, Logs).</p><p><strong>14.2</strong> Leistungen dürfen angepasst oder vorübergehend eingestellt werden, soweit dies Gesetze, behördliche Anordnungen oder Vorgaben von Zahlungsdienstleistern erfordern.</p><p><strong>14.3</strong> Inserenten halten behördliche Bewilligungen/Registrierungen (sofern erforderlich) ein und weisen diese auf Verlangen nach.</p>', 'textarea', 'content', 'AGB Section 14 Inhalt', 'Inhalt für AGB Abschnitt 14');

-- Section 15: Rechteübertragung
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section15_title', '15. Rechteübertragung, Subunternehmer', 'text', 'content', 'AGB Section 15 Titel', 'Titel für AGB Abschnitt 15'),
('legal_agb_section15_content', '<p>Die Betreiberin darf Rechte und Pflichten aus diesen AGB ganz/teilweise übertragen und Subunternehmer beauftragen, sofern Datenschutz und Vertraulichkeit gewahrt bleiben.</p>', 'textarea', 'content', 'AGB Section 15 Inhalt', 'Inhalt für AGB Abschnitt 15');

-- Section 16: Salvatorische Klausel
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section16_title', '16. Salvatorische Klausel', 'text', 'content', 'AGB Section 16 Titel', 'Titel für AGB Abschnitt 16'),
('legal_agb_section16_content', '<p>Sollte eine Bestimmung unwirksam/unvollständig sein, bleibt der Rest wirksam. Anstelle der betroffenen Regel gilt eine zulässige, die dem wirtschaftlichen Zweck am nächsten kommt. (Für Konsumentinnen/Konsumenten gelten die zwingenden Bestimmungen.)</p>', 'textarea', 'content', 'AGB Section 16 Inhalt', 'Inhalt für AGB Abschnitt 16');

-- Section 17: Anwendbares Recht
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section17_title', '17. Anwendbares Recht, Gerichtsstand', 'text', 'content', 'AGB Section 17 Titel', 'Titel für AGB Abschnitt 17'),
('legal_agb_section17_content', '<p>Es gilt schweizerisches Recht unter Ausschluss kollisionsrechtlicher Normen. Erfüllungsort und Gerichtsstand ist – soweit zulässig – der Sitz der Betreiberin. Für Konsumentinnen/Konsumenten gelten die zwingenden Gerichtsstände.</p>', 'textarea', 'content', 'AGB Section 17 Inhalt', 'Inhalt für AGB Abschnitt 17');

-- Section 18: Schlussbestimmungen
INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
('legal_agb_section18_title', '18. Schlussbestimmungen', 'text', 'content', 'AGB Section 18 Titel', 'Titel für AGB Abschnitt 18'),
('legal_agb_section18_content', '<p>Die Betreiberin kann den Portalbetrieb jederzeit ganz/teilweise einstellen. Die jeweils aktuelle Fassung der AGB ist auf dem Portal veröffentlicht.</p>', 'textarea', 'content', 'AGB Section 18 Inhalt', 'Inhalt für AGB Abschnitt 18');

-- Update existing sections 1-5 with new content
UPDATE public.site_settings SET value = '1. Zweck, Rolle, Geltungsbereich' WHERE key = 'legal_agb_section1_title';
UPDATE public.site_settings SET value = '<p><strong>1.1</strong> Das Portal stellt Werbeflächen für Inserate zur Verfügung. Inserate bewerben Leistungen, die eigenständig und unabhängig vom Portal von Inserenten angeboten/erbracht werden.</p><p><strong>1.2</strong> Die Betreiberin ist keine Vermittlerin und keine Vertragspartei zwischen Inserenten und Besuchern; sie beteiligt sich nicht an der Erbringung oder am Entgelt der beworbenen Leistungen. Angaben im Portal dienen ausschliesslich der Information.</p><p><strong>1.3</strong> Diese AGB regeln alle Nutzungen des Portals. Ergänzend können Richtlinien (z. B. Content-Policy), Preislisten und rechtliche Hinweise gelten. Wesentliche Änderungen werden bekanntgegeben.</p>' WHERE key = 'legal_agb_section1_content';

UPDATE public.site_settings SET value = '2. Begriffe' WHERE key = 'legal_agb_section2_title';
UPDATE public.site_settings SET value = '<p>«Nutzer» umfasst Inserenten und Besucher. «Inserenten» erfassen/verwalten Inserate; «Besucher» sehen Inserate und kontaktieren Inserenten. «Inhalte» sind alle von Nutzern bereitgestellten Daten (Texte, Bilder, Videos, Profile usw.).</p>' WHERE key = 'legal_agb_section2_content';

UPDATE public.site_settings SET value = '3. Annahme, Versionierung' WHERE key = 'legal_agb_section3_title';
UPDATE public.site_settings SET value = '<p><strong>3.1</strong> Besucher akzeptieren die AGB durch Aufruf/Nutzung des Portals. Inserenten akzeptieren die AGB aktiv per Checkbox.</p><p><strong>3.2</strong> Die Betreiberin protokolliert AGB-Zustimmungen (Version, Zeitpunkt, IP, Nutzerkennung) sowie Moderations-/Freigabeentscheidungen zu Beweiszwecken.</p>' WHERE key = 'legal_agb_section3_content';

UPDATE public.site_settings SET value = '4. Zugang, Registrierung, Pflichten' WHERE key = 'legal_agb_section4_title';
UPDATE public.site_settings SET value = '<p><strong>4.1</strong> Nutzung nur für volljährige (18+) und handlungsfähige natürliche Personen sowie juristische Personen.</p><p><strong>4.2</strong> Für bestimmte Funktionen ist Registrierung erforderlich. Pro Person ist nur ein Konto zulässig; Angaben müssen wahr und aktuell sein. Die Betreiberin kann Registrierungen ablehnen, sperren oder löschen.</p><p><strong>4.3</strong> Zugangsdaten sind geheim zu halten; Weitergabe (entgeltlich/unentgeltlich) ist untersagt.</p><p><strong>4.4</strong> Nutzer verpflichten sich zu rechtskonformer Nutzung und kommen sämtlichen Pflichten fristgerecht nach.</p>' WHERE key = 'legal_agb_section4_content';

UPDATE public.site_settings SET value = '5. Leistungen, Pakete, Preise' WHERE key = 'legal_agb_section5_title';
UPDATE public.site_settings SET value = '<p><strong>5.1</strong> Inserenten können Inseratspakete (z. B. Standard/Premium) buchen. Leistungsumfang (Laufzeit, Sichtbarkeit, Fotoanzahl usw.) und Preise ergeben sich aus dem Portal und dürfen jederzeit angepasst werden.</p><p><strong>5.2</strong> Premium-Inserate können gegenüber Standard-Inseraten priorisiert/hervorgehoben werden. Ein Anspruch auf bestimmte Platzierungen/Ergebnisse besteht nicht; Such-/Sortiermechanismen dürfen angepasst werden.</p>' WHERE key = 'legal_agb_section5_content';