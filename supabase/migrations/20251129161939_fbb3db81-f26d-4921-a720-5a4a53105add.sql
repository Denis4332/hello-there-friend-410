-- Bereinigung der Cities-Tabelle: Lösche Müll-Einträge
-- 1. Nummerierte Duplikate (z.B. "Zürich 1", "Bern 5", "Genève 10")
-- 2. Bank/Logistik/Spezial-Einträge (UBS, PostFinance, SPI GLS, etc.)

-- Schritt 1: Lösche alle nummerierten Duplikate (133 Einträge)
DELETE FROM public.cities 
WHERE name ~ ' [0-9]+$';

-- Schritt 2: Lösche alle Bank/Logistik/Spezial-Einträge (14 Einträge)
DELETE FROM public.cities 
WHERE name LIKE '%UBS%'
   OR name LIKE '%SPI GLS%'
   OR name LIKE '%SPILOG%'
   OR name LIKE '%SSF%'
   OR name LIKE '%PostFinance%'
   OR name LIKE '%CS CP%'
   OR name LIKE '%Votation%'
   OR name LIKE '%Retour%';