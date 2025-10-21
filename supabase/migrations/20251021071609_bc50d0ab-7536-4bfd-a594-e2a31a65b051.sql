-- Migration 5: Seed Data (Categories & Cantons)

-- Insert 10 neutral dating categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
('Outdoor & Natur', 'outdoor', 1),
('Sport & Fitness', 'sport', 2),
('Kultur & Kunst', 'kultur', 3),
('Musik & Konzerte', 'musik', 4),
('Reisen & Abenteuer', 'reisen', 5),
('Kochen & Genuss', 'kochen', 6),
('Lesen & Literatur', 'lesen', 7),
('Gaming & Technologie', 'gaming', 8),
('Tiere & Natur', 'tiere', 9),
('Mode & Styling', 'mode', 10);

-- Insert all 26 Swiss cantons
INSERT INTO public.cantons (name, abbreviation) VALUES
('Zürich', 'ZH'),
('Bern', 'BE'),
('Luzern', 'LU'),
('Uri', 'UR'),
('Schwyz', 'SZ'),
('Obwalden', 'OW'),
('Nidwalden', 'NW'),
('Glarus', 'GL'),
('Zug', 'ZG'),
('Freiburg', 'FR'),
('Solothurn', 'SO'),
('Basel-Stadt', 'BS'),
('Basel-Landschaft', 'BL'),
('Schaffhausen', 'SH'),
('Appenzell Ausserrhoden', 'AR'),
('Appenzell Innerrhoden', 'AI'),
('St. Gallen', 'SG'),
('Graubünden', 'GR'),
('Aargau', 'AG'),
('Thurgau', 'TG'),
('Tessin', 'TI'),
('Waadt', 'VD'),
('Wallis', 'VS'),
('Neuenburg', 'NE'),
('Genf', 'GE'),
('Jura', 'JU');