-- Add intro_text column to cities table
ALTER TABLE cities ADD COLUMN intro_text TEXT;

-- Add intro_text column to categories table
ALTER TABLE categories ADD COLUMN intro_text TEXT;

-- Migrate existing category intro texts
UPDATE categories SET intro_text = 'Unabhängige Freelancer mit verifizierten Profilen. Direkte Kontaktaufnahme, flexible Terminvereinbarung und höchste Diskretion garantiert.' WHERE slug = 'freelancer';
UPDATE categories SET intro_text = 'Professionelle Agenturen mit geprüften Referenzen. Zuverlässige Vermittlung und qualifizierte Beratung für Ihre Bedürfnisse.' WHERE slug = 'agenturen';
UPDATE categories SET intro_text = 'Etablierte Studios mit verifizierten Standorten. Gepflegte Räumlichkeiten und professioneller Service in diskreter Atmosphäre.' WHERE slug = 'studios';
UPDATE categories SET intro_text = 'Lifestyle-Angebote für besondere Anlässe. Von Event-Begleitung bis zu persönlichen Services – stilvoll und seriös.' WHERE slug = 'lifestyle';
UPDATE categories SET intro_text = 'Event-Begleitung für private und geschäftliche Anlässe. Kompetente und stilvolle Begleitung für jeden Anlass.' WHERE slug = 'events';
UPDATE categories SET intro_text = 'Vielfältige Service-Angebote mit Qualitätsgarantie. Von individueller Betreuung bis zu massgeschneiderten Lösungen.' WHERE slug = 'service';

-- Migrate existing city intro texts
UPDATE cities SET intro_text = 'Finden Sie verifizierte Anbieter und Profile in Zürich. Alle Kontaktdaten werden vor der Freischaltung geprüft, um höchste Qualität und Seriosität zu gewährleisten. Diskrete und professionelle Kontaktaufnahme direkt über die Plattform.' WHERE slug = 'zurich';
UPDATE cities SET intro_text = 'Entdecken Sie geprüfte Profile und Agenturen in Basel. Jedes Profil durchläuft einen Verifizierungsprozess, der Identität und Erreichbarkeit sicherstellt. Transparente Darstellung und sichere Kontaktmöglichkeiten für alle Nutzer.' WHERE slug = 'basel';
UPDATE cities SET intro_text = 'Verifizierte Anbieter in Bern mit geprüften Kontaktdaten. Qualität steht bei ESCORIA an erster Stelle – alle Profile werden manuell überprüft. Seriöse Plattform für diskrete und zuverlässige Kontakte in der Bundesstadt.' WHERE slug = 'bern';
UPDATE cities SET intro_text = 'Profile und Agenturen in Genf mit Verifizierung. ESCORIA garantiert echte und aktuelle Kontaktdaten durch sorgfältige Prüfung. Professionelle Abwicklung und höchste Standards für alle Nutzer in der Genferseeregion.' WHERE slug = 'genf';