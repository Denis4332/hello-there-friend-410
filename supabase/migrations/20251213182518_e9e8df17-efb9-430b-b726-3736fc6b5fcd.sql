-- Neue Datenschutzerklärung CMS-Settings hinzufügen
-- Erst alte legal_privacy Settings löschen und durch neue ersetzen

DELETE FROM public.site_settings WHERE key LIKE 'legal_privacy%';

INSERT INTO public.site_settings (key, value, type, category, label, description) VALUES
-- Hauptinfos
('legal_privacy_title', 'Datenschutzerklärung (escoria.ch)', 'text', 'content', 'Datenschutz Titel', 'Haupttitel der Datenschutzseite'),
('legal_privacy_stand', 'Stand: 12. Dezember 2025', 'text', 'content', 'Datenschutz Stand', 'Datum der letzten Aktualisierung'),
('legal_privacy_intro', 'Diese Datenschutzerklärung informiert darüber, wie die isyWeb KLG, Schaffhauserstrasse 30, 4332 Stein AG, CHE-297.490.821 (nachfolgend „Betreiberin", „wir") Personendaten im Zusammenhang mit der Nutzung der Inserate-Plattform escoria.ch (inkl. Subdomains und zugehöriger Dienste; nachfolgend „Portal") bearbeitet.', 'textarea', 'content', 'Datenschutz Intro', 'Einleitungstext'),
('legal_privacy_contact', 'Kontakt Datenschutz: info@isyweb.ch, +41 76 298 59 82', 'text', 'content', 'Datenschutz Kontakt', 'Kontaktinformationen'),

-- Abschnitt 1: Grundsätze & Rechtsgrundlagen
('legal_privacy_section1_title', '1. Grundsätze & Rechtsgrundlagen', 'text', 'content', 'Abschnitt 1 Titel', NULL),
('legal_privacy_section1_content', '<p>Wir bearbeiten Personendaten nach dem Schweizer Datenschutzgesetz (DSG) und – soweit anwendbar – der DSGVO. Rechtsgrundlagen sind je nach Situation insbesondere:</p><ul><li>Vertrag/Vertragsanbahnung (z. B. Konto, Inseratepakete),</li><li>berechtigte Interessen (sicherer Betrieb, Missbrauchs-/Betrugsprävention, Nachweise, Auswertung systemrelevanter Nutzung),</li><li>rechtliche Pflichten (z. B. Aufbewahrung, Mitwirkung an Verfahren),</li><li>Einwilligung (z. B. optionale Funktionen/Kommunikation; jederzeit widerruflich).</li></ul><p>Wir halten uns an Datenminimierung, Zweckbindung und Speicherbegrenzung.</p>', 'textarea', 'content', 'Abschnitt 1 Inhalt', NULL),

-- Abschnitt 2: Datenkategorien, Zwecke, Herkunft
('legal_privacy_section2_title', '2. Datenkategorien, Zwecke, Herkunft', 'text', 'content', 'Abschnitt 2 Titel', NULL),
('legal_privacy_section2_content', '<h3>2.1 Besuch des Portals</h3><ul><li><strong>Daten:</strong> IP-Adresse, Datum/Zeit, URL/Referrer, User-Agent, Antwortcodes, Sicherheits-/Firewall-Logs, Fehler-Logs.</li><li><strong>Zwecke:</strong> Auslieferung, Stabilität, Sicherheit (z. B. DDoS-Abwehr), Fehleranalyse.</li></ul><h3>2.2 Registrierung, Konto & Inserate (Profile)</h3><ul><li><strong>Daten:</strong> E-Mail/Login, Passwort-Hash; Profildaten/Inseratsinhalte (Texte, Kategorien, Standortangaben/PLZ, optionale Geodaten), Fotos (inkl. Metadaten), Status (pending/active/rejected/suspended), Verifizierungsstatus, Moderationsnotizen, Meldungen (Reports).</li><li><strong>Zwecke:</strong> Nutzerverwaltung, Erstellen/Moderieren/Veröffentlichen von Inseraten gemäss AGB, evidenzsichere Dokumentation.</li></ul><h3>2.3 Kommunikation & Support</h3><ul><li><strong>Daten:</strong> Name, E-Mail, Telefonnummer (freiwillig), Inhalt und Metadaten der Anfrage, Bearbeitungsverlauf.</li><li><strong>Zwecke:</strong> Beantwortung von Anfragen, Systembenachrichtigungen, Durchsetzung der AGB.</li></ul><h3>2.4 Zahlungen (bei Aktivierung)</h3><ul><li><strong>Daten:</strong> Transaktions-Metadaten (Betrag, Zeitpunkt, Währung, Zahlungsstatus, Transaktions-/Referenz-IDs); keine Speicherung vollständiger Karten-/TWINT-Zugangsdaten bei uns.</li><li><strong>Zwecke:</strong> Abwicklung entgeltlicher Leistungen (Inseratepakete), Buchführung, Betrugsprävention.</li><li><strong>Hinweis:</strong> Zahlungsdaten werden über einen externen Zahlungsdienstleister (PSP) verarbeitet, der eigene Datenschutzregeln hat; im Checkout weisen wir den jeweils eingesetzten PSP aus.</li></ul><h3>2.5 Missbrauch, Rechtsdurchsetzung & Compliance</h3><ul><li><strong>Daten:</strong> relevante Konto-, Inhalts-, Kommunikations- und Protokolldaten; Kopien gemeldeter Inhalte.</li><li><strong>Zwecke:</strong> Notice-&-Takedown, Beweissicherung, Abwehr/Verfolgung von Ansprüchen, Erfüllung gesetzlicher/vertraglicher Vorgaben (z. B. Anforderungen von PSPs).</li></ul>', 'textarea', 'content', 'Abschnitt 2 Inhalt', NULL),

-- Abschnitt 3: Cookies
('legal_privacy_section3_title', '3. Cookies, Local/Session Storage & Tracking', 'text', 'content', 'Abschnitt 3 Titel', NULL),
('legal_privacy_section3_content', '<p>Wir verwenden technisch notwendige Cookies bzw. Local/Session-Storage (z. B. Login-Status, CSRF-Schutz, Sprache). Ohne diese ist ein Login nicht möglich.</p><p>Derzeit setzen wir kein Drittanbieter-Tracking ein. Bei Einführung von Analyse- oder Marketing-Tools informieren wir vorab und holen – sofern erforderlich – Einwilligungen ein.</p>', 'textarea', 'content', 'Abschnitt 3 Inhalt', NULL),

-- Abschnitt 4: Empfänger
('legal_privacy_section4_title', '4. Empfänger & Auftragsbearbeiter', 'text', 'content', 'Abschnitt 4 Titel', NULL),
('legal_privacy_section4_content', '<p>Wir setzen sorgfältig ausgewählte Dienstleister ein, die Daten nur nach Weisung und mit geeigneten Schutzmassnahmen bearbeiten, u. a.:</p><ul><li><strong>Hosting/Deployment:</strong> z. B. Netlify (Web-Bereitstellung, Sicherheits-/Zugriffs-Logs)</li><li><strong>Datenbank/Authentifizierung/Storage:</strong> z. B. Supabase (inkl. Bild-Storage)</li><li><strong>E-Mail/Transaktionsmails:</strong> z. B. Hostpoint</li><li><strong>CDN/WAF (optional):</strong> z. B. Cloudflare</li><li><strong>Zahlungsdienstleister (bei Aktivierung):</strong> z. B. Worldline/Saferpay o. ä.</li></ul><p>Die aktuelle Dienstleisterliste halten wir im Admin-Bereich vor und teilen sie auf Anfrage mit.</p>', 'textarea', 'content', 'Abschnitt 4 Inhalt', NULL),

-- Abschnitt 5: Auslandübermittlung
('legal_privacy_section5_title', '5. Auslandübermittlung', 'text', 'content', 'Abschnitt 5 Titel', NULL),
('legal_privacy_section5_content', '<p>Je nach Dienstleister kann eine Verarbeitung ausserhalb der Schweiz/des EWR erfolgen. Wir stellen angemessene Garantien sicher (z. B. EU-Standardvertragsklauseln, ergänzende technische/organisatorische Massnahmen) oder stützen uns auf zulässige Ausnahmen. Soweit möglich wählen wir CH/EU-Regionen.</p>', 'textarea', 'content', 'Abschnitt 5 Inhalt', NULL),

-- Abschnitt 6: Jugendschutz
('legal_privacy_section6_title', '6. Jugendschutz', 'text', 'content', 'Abschnitt 6 Titel', NULL),
('legal_privacy_section6_content', '<p>Das Portal richtet sich gemäss AGB ausschliesslich an volljährige Personen (18+). Erhalten wir Kenntnis von Daten Minderjähriger, löschen wir diese nach Möglichkeit unverzüglich.</p>', 'textarea', 'content', 'Abschnitt 6 Inhalt', NULL),

-- Abschnitt 7: Sicherheit
('legal_privacy_section7_title', '7. Sicherheit', 'text', 'content', 'Abschnitt 7 Titel', NULL),
('legal_privacy_section7_content', '<p>Wir treffen angemessene technische und organisatorische Massnahmen (TOMs): TLS-Verschlüsselung, rollenbasierte Zugriffe (RBAC), Protokollierung/Monitoring, Firewalls/WAF, Backups/Recovery, Need-to-know/Least-Privilege, Prüf- und Freigabeprozesse im Admin-Bereich, Betrugs-/Missbrauchsprävention.</p>', 'textarea', 'content', 'Abschnitt 7 Inhalt', NULL),

-- Abschnitt 8: Speicherdauer
('legal_privacy_section8_title', '8. Speicherdauer', 'text', 'content', 'Abschnitt 8 Titel', NULL),
('legal_privacy_section8_content', '<ul><li><strong>Konten/Inserate:</strong> solange das Konto aktiv ist; nach Löschung nur, soweit erforderlich (gesetzliche Pflichten, Beweiszwecke).</li><li><strong>Protokolle/Sicherheits-Logs:</strong> typischerweise 7–180 Tage (zweckabhängig).</li><li><strong>Support-Kommunikation:</strong> bis Abschluss, danach gemäss Aufbewahrungsfristen.</li><li><strong>Zahlungsunterlagen:</strong> gemäss handels-/steuerrechtlichen Vorgaben.</li></ul>', 'textarea', 'content', 'Abschnitt 8 Inhalt', NULL),

-- Abschnitt 9: Rechte
('legal_privacy_section9_title', '9. Rechte der betroffenen Personen', 'text', 'content', 'Abschnitt 9 Titel', NULL),
('legal_privacy_section9_content', '<p>Sie haben – im gesetzlichen Rahmen – das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch gegen Bearbeitungen aus überwiegenden privaten Interessen. Einwilligungen können Sie jederzeit mit Wirkung für die Zukunft widerrufen.</p><p>Kontakt: info@isyweb.ch.</p><p>Beschwerden können an den Eidg. Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) gerichtet werden.</p>', 'textarea', 'content', 'Abschnitt 9 Inhalt', NULL),

-- Abschnitt 10: Meldungen
('legal_privacy_section10_title', '10. Meldungen & Moderation (Notice-&-Takedown)', 'text', 'content', 'Abschnitt 10 Titel', NULL),
('legal_privacy_section10_content', '<p>Nutzer können Inhalte melden, die gegen Recht/AGB verstossen. Wir prüfen Meldungen zeitnah, sperren/löschen rechtswidrige Inhalte, fordern Nachweise ein oder informieren – wo erforderlich – Behörden. Vorgänge werden protokolliert.</p>', 'textarea', 'content', 'Abschnitt 10 Inhalt', NULL),

-- Abschnitt 11: Verantwortung
('legal_privacy_section11_title', '11. Verantwortung der Nutzer & Drittseiten', 'text', 'content', 'Abschnitt 11 Titel', NULL),
('legal_privacy_section11_content', '<p>Für durch Nutzer eingestellte Inhalte (Texte/Bilder/Angaben) sind diese allein verantwortlich. Verlinkte Drittseiten/Dienste unterliegen deren eigenen Datenschutzbestimmungen.</p>', 'textarea', 'content', 'Abschnitt 11 Inhalt', NULL),

-- Abschnitt 12: Protokollierung AGB
('legal_privacy_section12_title', '12. Protokollierung der AGB-Zustimmung', 'text', 'content', 'Abschnitt 12 Titel', NULL),
('legal_privacy_section12_content', '<p>Gemäss AGB protokollieren wir Version, Zeitpunkt, IP-Adresse und Nutzerkennung der AGB-Zustimmung sowie Freigabe-/Moderationsentscheidungen zu Beweiszwecken.</p>', 'textarea', 'content', 'Abschnitt 12 Inhalt', NULL),

-- Abschnitt 13: Änderungen
('legal_privacy_section13_title', '13. Änderungen', 'text', 'content', 'Abschnitt 13 Titel', NULL),
('legal_privacy_section13_content', '<p>Wir können diese Erklärung anpassen, wenn sich Technik, Angebote oder Rechtslage ändern. Es gilt die jeweils veröffentlichte Version; über wesentliche Änderungen informieren wir angemessen.</p>', 'textarea', 'content', 'Abschnitt 13 Inhalt', NULL),

-- Verantwortliche Stelle Footer
('legal_privacy_responsible', 'isyWeb KLG, Schaffhauserstrasse 30, 4332 Stein AG, CHE-297.490.821', 'text', 'content', 'Verantwortliche Stelle', 'Name und Adresse der verantwortlichen Stelle'),
('legal_privacy_contact_footer', 'Kontakt Datenschutz: info@isyweb.ch · +41 76 298 59 82', 'text', 'content', 'Kontakt Footer', 'Kontaktinformationen im Footer');