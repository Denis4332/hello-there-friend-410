-- First, delete all existing cities to start fresh
DELETE FROM cities;

-- Insert all major Swiss cities with GPS coordinates
-- ZÜRICH (ZH)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Zürich', '8001', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.3769, 8.5417, 'zuerich'),
('Winterthur', '8400', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.4979, 8.7242, 'winterthur'),
('Uster', '8610', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.3474, 8.7217, 'uster'),
('Dübendorf', '8600', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.3971, 8.6187, 'duebendorf'),
('Dietikon', '8953', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.4044, 8.4001, 'dietikon'),
('Wetzikon', '8620', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.3265, 8.7979, 'wetzikon'),
('Kloten', '8302', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.4515, 8.5849, 'kloten'),
('Bülach', '8180', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.5186, 8.5393, 'buelach'),
('Horgen', '8810', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.2558, 8.5981, 'horgen'),
('Wädenswil', '8820', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.2307, 8.6717, 'waedenswil'),
('Adliswil', '8134', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.3098, 8.5244, 'adliswil'),
('Regensdorf', '8105', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.4341, 8.4691, 'regensdorf'),
('Schlieren', '8952', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.3966, 8.4477, 'schlieren'),
('Thalwil', '8800', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.2924, 8.5652, 'thalwil'),
('Wallisellen', '8304', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.4149, 8.5979, 'wallisellen'),
('Opfikon', '8152', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.4322, 8.5766, 'opfikon'),
('Meilen', '8706', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.2707, 8.6424, 'meilen'),
('Stäfa', '8712', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.2419, 8.7250, 'staefa'),
('Dällikon', '8108', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.4338, 8.4391, 'daellikon'),
('Volketswil', '8604', (SELECT id FROM cantons WHERE abbreviation = 'ZH'), 47.3918, 8.6903, 'volketswil');

-- BERN (BE)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Bern', '3000', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.9480, 7.4474, 'bern'),
('Biel', '2502', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 47.1368, 7.2467, 'biel'),
('Thun', '3600', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.7580, 7.6280, 'thun'),
('Köniz', '3098', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.9244, 7.4172, 'koeniz'),
('Burgdorf', '3400', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 47.0594, 7.6261, 'burgdorf'),
('Langenthal', '4900', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 47.2145, 7.7872, 'langenthal'),
('Interlaken', '3800', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.6863, 7.8632, 'interlaken'),
('Muri bei Bern', '3074', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.9298, 7.4870, 'muri-bei-bern'),
('Ostermundigen', '3072', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.9563, 7.4864, 'ostermundigen'),
('Ittigen', '3063', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.9752, 7.4783, 'ittigen'),
('Spiez', '3700', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.6843, 7.6795, 'spiez'),
('Worb', '3076', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.9297, 7.5624, 'worb'),
('Lyss', '3250', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 47.0745, 7.3063, 'lyss'),
('Münchenbuchsee', '3053', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 47.0222, 7.4476, 'muenchenbuchsee'),
('Steffisburg', '3612', (SELECT id FROM cantons WHERE abbreviation = 'BE'), 46.7776, 7.6329, 'steffisburg');

-- LUZERN (LU)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Luzern', '6000', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.0502, 8.3093, 'luzern'),
('Emmen', '6020', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.0764, 8.2793, 'emmen'),
('Kriens', '6010', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.0353, 8.2763, 'kriens'),
('Horw', '6048', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.0186, 8.3104, 'horw'),
('Ebikon', '6030', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.0797, 8.3408, 'ebikon'),
('Sursee', '6210', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.1711, 8.1093, 'sursee'),
('Hochdorf', '6280', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.1669, 8.2912, 'hochdorf'),
('Rothenburg', '6023', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.1024, 8.2681, 'rothenburg'),
('Root', '6037', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.1147, 8.3896, 'root'),
('Willisau', '6130', (SELECT id FROM cantons WHERE abbreviation = 'LU'), 47.1206, 7.9918, 'willisau');

-- URI (UR)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Altdorf', '6460', (SELECT id FROM cantons WHERE abbreviation = 'UR'), 46.8804, 8.6441, 'altdorf'),
('Bürglen', '6463', (SELECT id FROM cantons WHERE abbreviation = 'UR'), 46.8758, 8.6716, 'buerglen-ur'),
('Schattdorf', '6467', (SELECT id FROM cantons WHERE abbreviation = 'UR'), 46.8616, 8.6525, 'schattdorf'),
('Erstfeld', '6472', (SELECT id FROM cantons WHERE abbreviation = 'UR'), 46.8217, 8.6500, 'erstfeld'),
('Flüelen', '6454', (SELECT id FROM cantons WHERE abbreviation = 'UR'), 46.9063, 8.6268, 'fluelen');

-- SCHWYZ (SZ)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Schwyz', '6430', (SELECT id FROM cantons WHERE abbreviation = 'SZ'), 47.0207, 8.6530, 'schwyz'),
('Freienbach', '8807', (SELECT id FROM cantons WHERE abbreviation = 'SZ'), 47.2053, 8.7544, 'freienbach'),
('Einsiedeln', '8840', (SELECT id FROM cantons WHERE abbreviation = 'SZ'), 47.1286, 8.7447, 'einsiedeln'),
('Küssnacht am Rigi', '6403', (SELECT id FROM cantons WHERE abbreviation = 'SZ'), 47.0856, 8.4406, 'kuessnacht-am-rigi'),
('Arth', '6415', (SELECT id FROM cantons WHERE abbreviation = 'SZ'), 47.0636, 8.5224, 'arth'),
('Lachen', '8853', (SELECT id FROM cantons WHERE abbreviation = 'SZ'), 47.1954, 8.8540, 'lachen');

-- OBWALDEN (OW)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Sarnen', '6060', (SELECT id FROM cantons WHERE abbreviation = 'OW'), 46.8963, 8.2456, 'sarnen'),
('Kerns', '6064', (SELECT id FROM cantons WHERE abbreviation = 'OW'), 46.9011, 8.2750, 'kerns'),
('Alpnach', '6055', (SELECT id FROM cantons WHERE abbreviation = 'OW'), 46.9403, 8.2722, 'alpnach'),
('Sachseln', '6072', (SELECT id FROM cantons WHERE abbreviation = 'OW'), 46.8667, 8.2333, 'sachseln'),
('Engelberg', '6390', (SELECT id FROM cantons WHERE abbreviation = 'OW'), 46.8214, 8.4033, 'engelberg');

-- NIDWALDEN (NW)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Stans', '6370', (SELECT id FROM cantons WHERE abbreviation = 'NW'), 46.9578, 8.3650, 'stans'),
('Hergiswil', '6052', (SELECT id FROM cantons WHERE abbreviation = 'NW'), 46.9833, 8.3083, 'hergiswil'),
('Buochs', '6374', (SELECT id FROM cantons WHERE abbreviation = 'NW'), 46.9711, 8.4200, 'buochs'),
('Stansstad', '6362', (SELECT id FROM cantons WHERE abbreviation = 'NW'), 46.9789, 8.3403, 'stansstad'),
('Ennetbürgen', '6373', (SELECT id FROM cantons WHERE abbreviation = 'NW'), 46.9833, 8.4167, 'ennetbuergen');

-- GLARUS (GL)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Glarus', '8750', (SELECT id FROM cantons WHERE abbreviation = 'GL'), 47.0404, 9.0680, 'glarus'),
('Näfels', '8752', (SELECT id FROM cantons WHERE abbreviation = 'GL'), 47.1005, 9.0644, 'naefels'),
('Netstal', '8754', (SELECT id FROM cantons WHERE abbreviation = 'GL'), 47.0667, 9.0500, 'netstal'),
('Mollis', '8753', (SELECT id FROM cantons WHERE abbreviation = 'GL'), 47.0922, 9.0728, 'mollis'),
('Ennenda', '8755', (SELECT id FROM cantons WHERE abbreviation = 'GL'), 47.0333, 9.0833, 'ennenda');

-- ZUG (ZG)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Zug', '6300', (SELECT id FROM cantons WHERE abbreviation = 'ZG'), 47.1662, 8.5155, 'zug'),
('Baar', '6340', (SELECT id FROM cantons WHERE abbreviation = 'ZG'), 47.1963, 8.5295, 'baar'),
('Cham', '6330', (SELECT id FROM cantons WHERE abbreviation = 'ZG'), 47.1822, 8.4634, 'cham'),
('Steinhausen', '6312', (SELECT id FROM cantons WHERE abbreviation = 'ZG'), 47.1958, 8.4858, 'steinhausen'),
('Risch', '6343', (SELECT id FROM cantons WHERE abbreviation = 'ZG'), 47.1431, 8.4611, 'risch'),
('Hünenberg', '6331', (SELECT id FROM cantons WHERE abbreviation = 'ZG'), 47.1756, 8.4300, 'huenenberg'),
('Menzingen', '6313', (SELECT id FROM cantons WHERE abbreviation = 'ZG'), 47.1792, 8.5931, 'menzingen');

-- FRIBOURG (FR)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Fribourg', '1700', (SELECT id FROM cantons WHERE abbreviation = 'FR'), 46.8065, 7.1620, 'fribourg'),
('Bulle', '1630', (SELECT id FROM cantons WHERE abbreviation = 'FR'), 46.6186, 7.0580, 'bulle'),
('Villars-sur-Glâne', '1752', (SELECT id FROM cantons WHERE abbreviation = 'FR'), 46.7881, 7.1122, 'villars-sur-glane'),
('Granges-Paccot', '1763', (SELECT id FROM cantons WHERE abbreviation = 'FR'), 46.8236, 7.1444, 'granges-paccot'),
('Marly', '1723', (SELECT id FROM cantons WHERE abbreviation = 'FR'), 46.7778, 7.1597, 'marly'),
('Düdingen', '3186', (SELECT id FROM cantons WHERE abbreviation = 'FR'), 46.8497, 7.1933, 'duedingen'),
('Murten', '3280', (SELECT id FROM cantons WHERE abbreviation = 'FR'), 46.9283, 7.1178, 'murten'),
('Estavayer-le-Lac', '1470', (SELECT id FROM cantons WHERE abbreviation = 'FR'), 46.8500, 6.8500, 'estavayer-le-lac');

-- SOLOTHURN (SO)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Solothurn', '4500', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.2088, 7.5378, 'solothurn'),
('Olten', '4600', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.3520, 7.9041, 'olten'),
('Grenchen', '2540', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.1922, 7.3964, 'grenchen'),
('Zuchwil', '4528', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.2044, 7.5639, 'zuchwil'),
('Derendingen', '4552', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.1914, 7.5828, 'derendingen'),
('Bellach', '4512', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.2167, 7.4917, 'bellach'),
('Biberist', '4562', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.1767, 7.5578, 'biberist'),
('Oensingen', '4702', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.2878, 7.7247, 'oensingen'),
('Balsthal', '4710', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.3156, 7.6925, 'balsthal'),
('Trimbach', '4632', (SELECT id FROM cantons WHERE abbreviation = 'SO'), 47.3594, 7.8822, 'trimbach');

-- BASEL-STADT (BS)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Basel', '4001', (SELECT id FROM cantons WHERE abbreviation = 'BS'), 47.5596, 7.5886, 'basel'),
('Riehen', '4125', (SELECT id FROM cantons WHERE abbreviation = 'BS'), 47.5786, 7.6469, 'riehen'),
('Bettingen', '4126', (SELECT id FROM cantons WHERE abbreviation = 'BS'), 47.5700, 7.6633, 'bettingen');

-- BASEL-LANDSCHAFT (BL)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Allschwil', '4123', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.5508, 7.5364, 'allschwil'),
('Reinach', '4153', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.4936, 7.5936, 'reinach-bl'),
('Muttenz', '4132', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.5225, 7.6450, 'muttenz'),
('Pratteln', '4133', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.5214, 7.6925, 'pratteln'),
('Binningen', '4102', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.5403, 7.5694, 'binningen'),
('Birsfelden', '4127', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.5528, 7.6228, 'birsfelden'),
('Liestal', '4410', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.4842, 7.7342, 'liestal'),
('Arlesheim', '4144', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.4942, 7.6203, 'arlesheim'),
('Oberwil', '4104', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.5150, 7.5567, 'oberwil'),
('Therwil', '4106', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.5003, 7.5556, 'therwil'),
('Sissach', '4450', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.4628, 7.8094, 'sissach'),
('Laufen', '4242', (SELECT id FROM cantons WHERE abbreviation = 'BL'), 47.4219, 7.5003, 'laufen');

-- SCHAFFHAUSEN (SH)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Schaffhausen', '8200', (SELECT id FROM cantons WHERE abbreviation = 'SH'), 47.6959, 8.6350, 'schaffhausen'),
('Neuhausen am Rheinfall', '8212', (SELECT id FROM cantons WHERE abbreviation = 'SH'), 47.6833, 8.6167, 'neuhausen-am-rheinfall'),
('Thayngen', '8240', (SELECT id FROM cantons WHERE abbreviation = 'SH'), 47.7453, 8.7056, 'thayngen'),
('Beringen', '8222', (SELECT id FROM cantons WHERE abbreviation = 'SH'), 47.6992, 8.5742, 'beringen'),
('Stein am Rhein', '8260', (SELECT id FROM cantons WHERE abbreviation = 'SH'), 47.6592, 8.8600, 'stein-am-rhein');

-- APPENZELL AUSSERRHODEN (AR)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Herisau', '9100', (SELECT id FROM cantons WHERE abbreviation = 'AR'), 47.3861, 9.2789, 'herisau'),
('Teufen', '9053', (SELECT id FROM cantons WHERE abbreviation = 'AR'), 47.3900, 9.3833, 'teufen'),
('Speicher', '9042', (SELECT id FROM cantons WHERE abbreviation = 'AR'), 47.4167, 9.4333, 'speicher'),
('Heiden', '9410', (SELECT id FROM cantons WHERE abbreviation = 'AR'), 47.4422, 9.5331, 'heiden'),
('Bühler', '9055', (SELECT id FROM cantons WHERE abbreviation = 'AR'), 47.3833, 9.4167, 'buehler');

-- APPENZELL INNERRHODEN (AI)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Appenzell', '9050', (SELECT id FROM cantons WHERE abbreviation = 'AI'), 47.3306, 9.4111, 'appenzell'),
('Oberegg', '9413', (SELECT id FROM cantons WHERE abbreviation = 'AI'), 47.4333, 9.5500, 'oberegg'),
('Gonten', '9108', (SELECT id FROM cantons WHERE abbreviation = 'AI'), 47.3258, 9.3486, 'gonten'),
('Haslen', '9054', (SELECT id FROM cantons WHERE abbreviation = 'AI'), 47.3500, 9.3833, 'haslen');

-- ST. GALLEN (SG)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('St. Gallen', '9000', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.4245, 9.3767, 'st-gallen'),
('Rapperswil-Jona', '8640', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.2269, 8.8186, 'rapperswil-jona'),
('Wil', '9500', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.4614, 9.0436, 'wil'),
('Gossau', '9200', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.4158, 9.2533, 'gossau'),
('Buchs', '9470', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.1667, 9.4667, 'buchs-sg'),
('Uzwil', '9240', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.4358, 9.1342, 'uzwil'),
('Altstätten', '9450', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.3778, 9.5481, 'altstaetten'),
('Flawil', '9230', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.4133, 9.1900, 'flawil'),
('Rorschach', '9400', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.4778, 9.4906, 'rorschach'),
('Wattwil', '9630', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.2989, 9.0869, 'wattwil'),
('Bad Ragaz', '7310', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.0167, 9.5000, 'bad-ragaz'),
('Goldach', '9403', (SELECT id FROM cantons WHERE abbreviation = 'SG'), 47.4742, 9.4689, 'goldach');

-- GRAUBÜNDEN (GR)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Chur', '7000', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.8508, 9.5311, 'chur'),
('Davos', '7270', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.8027, 9.8360, 'davos'),
('St. Moritz', '7500', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.4973, 9.8384, 'st-moritz'),
('Landquart', '7302', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.9667, 9.5500, 'landquart'),
('Domat/Ems', '7013', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.8333, 9.4500, 'domat-ems'),
('Thusis', '7430', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.6967, 9.4389, 'thusis'),
('Ilanz', '7130', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.7736, 9.2050, 'ilanz'),
('Arosa', '7050', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.7794, 9.6789, 'arosa'),
('Pontresina', '7504', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.4950, 9.9011, 'pontresina'),
('Scuol', '7550', (SELECT id FROM cantons WHERE abbreviation = 'GR'), 46.7967, 10.2975, 'scuol');

-- AARGAU (AG)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Aarau', '5000', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.3904, 8.0458, 'aarau'),
('Baden', '5400', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.4733, 8.3069, 'baden'),
('Wettingen', '5430', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.4667, 8.3167, 'wettingen'),
('Wohlen', '5610', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.3517, 8.2778, 'wohlen'),
('Brugg', '5200', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.4833, 8.2000, 'brugg'),
('Rheinfelden', '4310', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.5536, 7.7931, 'rheinfelden'),
('Zofingen', '4800', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.2878, 7.9469, 'zofingen'),
('Lenzburg', '5600', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.3883, 8.1750, 'lenzburg'),
('Spreitenbach', '8957', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.4189, 8.3658, 'spreitenbach'),
('Windisch', '5210', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.4833, 8.2167, 'windisch'),
('Oftringen', '4665', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.3139, 7.9294, 'oftringen'),
('Muri', '5630', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.2742, 8.3378, 'muri'),
('Suhr', '5034', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.3722, 8.0781, 'suhr'),
('Obersiggenthal', '5415', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.4875, 8.2542, 'obersiggenthal'),
('Möhlin', '4313', (SELECT id FROM cantons WHERE abbreviation = 'AG'), 47.5600, 7.8433, 'moehlin');

-- THURGAU (TG)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Frauenfeld', '8500', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.5536, 8.8992, 'frauenfeld'),
('Kreuzlingen', '8280', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.6500, 9.1833, 'kreuzlingen'),
('Arbon', '9320', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.5167, 9.4333, 'arbon'),
('Amriswil', '8580', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.5500, 9.3000, 'amriswil'),
('Weinfelden', '8570', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.5667, 9.1000, 'weinfelden'),
('Romanshorn', '8590', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.5656, 9.3783, 'romanshorn'),
('Sirnach', '8370', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.4636, 8.9967, 'sirnach'),
('Münchwilen', '9542', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.4792, 8.9958, 'muenchwilen'),
('Bischofszell', '9220', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.4939, 9.2386, 'bischofszell'),
('Steckborn', '8266', (SELECT id FROM cantons WHERE abbreviation = 'TG'), 47.6667, 8.9833, 'steckborn');

-- TICINO (TI)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Lugano', '6900', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 46.0037, 8.9511, 'lugano'),
('Bellinzona', '6500', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 46.1955, 9.0247, 'bellinzona'),
('Locarno', '6600', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 46.1711, 8.7992, 'locarno'),
('Mendrisio', '6850', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 45.8703, 8.9822, 'mendrisio'),
('Chiasso', '6830', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 45.8333, 9.0333, 'chiasso'),
('Giubiasco', '6512', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 46.1667, 9.0000, 'giubiasco'),
('Ascona', '6612', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 46.1569, 8.7728, 'ascona'),
('Minusio', '6648', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 46.1833, 8.8167, 'minusio'),
('Massagno', '6900', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 46.0117, 8.9400, 'massagno'),
('Biasca', '6710', (SELECT id FROM cantons WHERE abbreviation = 'TI'), 46.3567, 8.9700, 'biasca');

-- VAUD (VD)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Lausanne', '1000', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.5197, 6.6323, 'lausanne'),
('Yverdon-les-Bains', '1400', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.7785, 6.6412, 'yverdon-les-bains'),
('Montreux', '1820', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.4333, 6.9167, 'montreux'),
('Renens', '1020', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.5397, 6.5878, 'renens'),
('Nyon', '1260', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.3833, 6.2333, 'nyon'),
('Vevey', '1800', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.4628, 6.8428, 'vevey'),
('Pully', '1009', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.5108, 6.6625, 'pully'),
('Morges', '1110', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.5117, 6.4994, 'morges'),
('Prilly', '1008', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.5333, 6.5833, 'prilly'),
('Ecublens', '1024', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.5236, 6.5611, 'ecublens'),
('La Tour-de-Peilz', '1814', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.4500, 6.8667, 'la-tour-de-peilz'),
('Gland', '1196', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.4167, 6.2667, 'gland'),
('Aigle', '1860', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.3167, 6.9667, 'aigle'),
('Bussigny', '1030', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.5500, 6.5500, 'bussigny'),
('Crissier', '1023', (SELECT id FROM cantons WHERE abbreviation = 'VD'), 46.5500, 6.5667, 'crissier');

-- VALAIS (VS)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Sion', '1950', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.2333, 7.3500, 'sion'),
('Sierre', '3960', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.2919, 7.5353, 'sierre'),
('Martigny', '1920', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.1028, 7.0722, 'martigny'),
('Monthey', '1870', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.2556, 6.9564, 'monthey'),
('Brig', '3900', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.3167, 7.9833, 'brig'),
('Naters', '3904', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.3250, 7.9917, 'naters'),
('Visp', '3930', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.2939, 7.8806, 'visp'),
('Zermatt', '3920', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.0207, 7.7491, 'zermatt'),
('Crans-Montana', '3963', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.3108, 7.4797, 'crans-montana'),
('Verbier', '1936', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.0964, 7.2286, 'verbier'),
('Leuk', '3953', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.3172, 7.6339, 'leuk'),
('Fully', '1926', (SELECT id FROM cantons WHERE abbreviation = 'VS'), 46.1333, 7.1167, 'fully');

-- NEUCHÂTEL (NE)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Neuchâtel', '2000', (SELECT id FROM cantons WHERE abbreviation = 'NE'), 46.9900, 6.9293, 'neuchatel'),
('La Chaux-de-Fonds', '2300', (SELECT id FROM cantons WHERE abbreviation = 'NE'), 47.0997, 6.8261, 'la-chaux-de-fonds'),
('Le Locle', '2400', (SELECT id FROM cantons WHERE abbreviation = 'NE'), 47.0561, 6.7483, 'le-locle'),
('Boudry', '2017', (SELECT id FROM cantons WHERE abbreviation = 'NE'), 46.9522, 6.8389, 'boudry'),
('Val-de-Travers', '2105', (SELECT id FROM cantons WHERE abbreviation = 'NE'), 46.9167, 6.6333, 'val-de-travers'),
('Peseux', '2034', (SELECT id FROM cantons WHERE abbreviation = 'NE'), 46.9833, 6.8833, 'peseux');

-- GENÈVE (GE)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Genève', '1200', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.2044, 6.1432, 'geneve'),
('Vernier', '1214', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.2167, 6.0833, 'vernier'),
('Lancy', '1212', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.1833, 6.1167, 'lancy'),
('Meyrin', '1217', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.2342, 6.0800, 'meyrin'),
('Carouge', '1227', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.1833, 6.1333, 'carouge'),
('Onex', '1213', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.1833, 6.1000, 'onex'),
('Thônex', '1226', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.2000, 6.2000, 'thonex'),
('Grand-Saconnex', '1218', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.2333, 6.1167, 'grand-saconnex'),
('Plan-les-Ouates', '1228', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.1667, 6.1167, 'plan-les-ouates'),
('Chêne-Bougeries', '1224', (SELECT id FROM cantons WHERE abbreviation = 'GE'), 46.1936, 6.1875, 'chene-bougeries');

-- JURA (JU)
INSERT INTO cities (name, postal_code, canton_id, lat, lng, slug) VALUES
('Delémont', '2800', (SELECT id FROM cantons WHERE abbreviation = 'JU'), 47.3656, 7.3439, 'delemont'),
('Porrentruy', '2900', (SELECT id FROM cantons WHERE abbreviation = 'JU'), 47.4153, 7.0753, 'porrentruy'),
('Saignelégier', '2350', (SELECT id FROM cantons WHERE abbreviation = 'JU'), 47.2556, 6.9942, 'saignelegier'),
('Courrendlin', '2830', (SELECT id FROM cantons WHERE abbreviation = 'JU'), 47.3456, 7.2711, 'courrendlin'),
('Bassecourt', '2854', (SELECT id FROM cantons WHERE abbreviation = 'JU'), 47.3375, 7.2414, 'bassecourt');

-- Now update all existing profiles with GPS coordinates from the cities table
UPDATE profiles p
SET 
  lat = c.lat,
  lng = c.lng
FROM cities c
WHERE LOWER(TRIM(p.city)) = LOWER(TRIM(c.name))
  AND (p.lat IS NULL OR p.lng IS NULL)
  AND c.lat IS NOT NULL
  AND c.lng IS NOT NULL;