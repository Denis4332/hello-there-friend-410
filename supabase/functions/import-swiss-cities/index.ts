import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenPLZLocality {
  name: string;
  postalCode: string;
  canton: string;
  // Coordinates might be in different format
}

interface SwissCity {
  name: string;
  postal_code: string;
  canton_abbreviation: string;
  lat: number;
  lng: number;
}

// Comprehensive Swiss cities data with coordinates
// Source: Swiss Post PLZ database + OpenStreetMap coordinates
const SWISS_CITIES: SwissCity[] = [
  // Zürich (ZH)
  { name: "Zürich", postal_code: "8001", canton_abbreviation: "ZH", lat: 47.3769, lng: 8.5417 },
  { name: "Winterthur", postal_code: "8400", canton_abbreviation: "ZH", lat: 47.4984, lng: 8.7235 },
  { name: "Uster", postal_code: "8610", canton_abbreviation: "ZH", lat: 47.3474, lng: 8.7217 },
  { name: "Dübendorf", postal_code: "8600", canton_abbreviation: "ZH", lat: 47.3972, lng: 8.6181 },
  { name: "Dietikon", postal_code: "8953", canton_abbreviation: "ZH", lat: 47.4044, lng: 8.4001 },
  { name: "Wetzikon", postal_code: "8620", canton_abbreviation: "ZH", lat: 47.3260, lng: 8.7979 },
  { name: "Horgen", postal_code: "8810", canton_abbreviation: "ZH", lat: 47.2592, lng: 8.5986 },
  { name: "Bülach", postal_code: "8180", canton_abbreviation: "ZH", lat: 47.5214, lng: 8.5392 },
  { name: "Kloten", postal_code: "8302", canton_abbreviation: "ZH", lat: 47.4515, lng: 8.5849 },
  { name: "Opfikon", postal_code: "8152", canton_abbreviation: "ZH", lat: 47.4319, lng: 8.5681 },
  { name: "Wädenswil", postal_code: "8820", canton_abbreviation: "ZH", lat: 47.2307, lng: 8.6717 },
  { name: "Schlieren", postal_code: "8952", canton_abbreviation: "ZH", lat: 47.3967, lng: 8.4478 },
  { name: "Thalwil", postal_code: "8800", canton_abbreviation: "ZH", lat: 47.2925, lng: 8.5617 },
  { name: "Illnau-Effretikon", postal_code: "8307", canton_abbreviation: "ZH", lat: 47.4267, lng: 8.7083 },
  { name: "Regensdorf", postal_code: "8105", canton_abbreviation: "ZH", lat: 47.4342, lng: 8.4694 },
  { name: "Adliswil", postal_code: "8134", canton_abbreviation: "ZH", lat: 47.3103, lng: 8.5244 },
  { name: "Küsnacht", postal_code: "8700", canton_abbreviation: "ZH", lat: 47.3192, lng: 8.5836 },
  { name: "Wallisellen", postal_code: "8304", canton_abbreviation: "ZH", lat: 47.4150, lng: 8.5950 },
  { name: "Volketswil", postal_code: "8604", canton_abbreviation: "ZH", lat: 47.3917, lng: 8.6878 },
  { name: "Richterswil", postal_code: "8805", canton_abbreviation: "ZH", lat: 47.2067, lng: 8.6983 },
  { name: "Meilen", postal_code: "8706", canton_abbreviation: "ZH", lat: 47.2700, lng: 8.6433 },
  { name: "Stäfa", postal_code: "8712", canton_abbreviation: "ZH", lat: 47.2417, lng: 8.7250 },
  { name: "Männedorf", postal_code: "8708", canton_abbreviation: "ZH", lat: 47.2550, lng: 8.6983 },
  { name: "Rüti", postal_code: "8630", canton_abbreviation: "ZH", lat: 47.2567, lng: 8.8550 },
  { name: "Zollikon", postal_code: "8702", canton_abbreviation: "ZH", lat: 47.3417, lng: 8.5717 },
  { name: "Bassersdorf", postal_code: "8303", canton_abbreviation: "ZH", lat: 47.4433, lng: 8.6283 },
  { name: "Affoltern am Albis", postal_code: "8910", canton_abbreviation: "ZH", lat: 47.2783, lng: 8.4517 },
  { name: "Pfäffikon", postal_code: "8330", canton_abbreviation: "ZH", lat: 47.3650, lng: 8.7833 },
  { name: "Rümlang", postal_code: "8153", canton_abbreviation: "ZH", lat: 47.4517, lng: 8.5317 },
  { name: "Embrach", postal_code: "8424", canton_abbreviation: "ZH", lat: 47.5067, lng: 8.5950 },
  { name: "Oberrieden", postal_code: "8942", canton_abbreviation: "ZH", lat: 47.2733, lng: 8.5783 },
  { name: "Erlenbach", postal_code: "8703", canton_abbreviation: "ZH", lat: 47.3050, lng: 8.5917 },
  { name: "Langnau am Albis", postal_code: "8135", canton_abbreviation: "ZH", lat: 47.2883, lng: 8.5383 },
  { name: "Uitikon", postal_code: "8142", canton_abbreviation: "ZH", lat: 47.3683, lng: 8.4550 },
  { name: "Greifensee", postal_code: "8606", canton_abbreviation: "ZH", lat: 47.3683, lng: 8.6817 },
  { name: "Egg", postal_code: "8132", canton_abbreviation: "ZH", lat: 47.2983, lng: 8.6867 },

  // Bern (BE)
  { name: "Bern", postal_code: "3000", canton_abbreviation: "BE", lat: 46.9480, lng: 7.4474 },
  { name: "Biel/Bienne", postal_code: "2500", canton_abbreviation: "BE", lat: 47.1368, lng: 7.2467 },
  { name: "Thun", postal_code: "3600", canton_abbreviation: "BE", lat: 46.7580, lng: 7.6280 },
  { name: "Köniz", postal_code: "3098", canton_abbreviation: "BE", lat: 46.9242, lng: 7.4153 },
  { name: "Burgdorf", postal_code: "3400", canton_abbreviation: "BE", lat: 47.0590, lng: 7.6280 },
  { name: "Langenthal", postal_code: "4900", canton_abbreviation: "BE", lat: 47.2150, lng: 7.7870 },
  { name: "Ostermundigen", postal_code: "3072", canton_abbreviation: "BE", lat: 46.9567, lng: 7.4867 },
  { name: "Muri bei Bern", postal_code: "3074", canton_abbreviation: "BE", lat: 46.9333, lng: 7.4917 },
  { name: "Spiez", postal_code: "3700", canton_abbreviation: "BE", lat: 46.6850, lng: 7.6767 },
  { name: "Interlaken", postal_code: "3800", canton_abbreviation: "BE", lat: 46.6863, lng: 7.8632 },
  { name: "Steffisburg", postal_code: "3612", canton_abbreviation: "BE", lat: 46.7783, lng: 7.6317 },
  { name: "Worb", postal_code: "3076", canton_abbreviation: "BE", lat: 46.9300, lng: 7.5617 },
  { name: "Lyss", postal_code: "3250", canton_abbreviation: "BE", lat: 47.0742, lng: 7.3064 },
  { name: "Münsingen", postal_code: "3110", canton_abbreviation: "BE", lat: 46.8733, lng: 7.5617 },
  { name: "Ittigen", postal_code: "3063", canton_abbreviation: "BE", lat: 46.9750, lng: 7.4800 },
  { name: "Zollikofen", postal_code: "3052", canton_abbreviation: "BE", lat: 46.9983, lng: 7.4583 },
  { name: "Belp", postal_code: "3123", canton_abbreviation: "BE", lat: 46.8917, lng: 7.5017 },
  { name: "Nidau", postal_code: "2560", canton_abbreviation: "BE", lat: 47.1267, lng: 7.2383 },
  { name: "Herzogenbuchsee", postal_code: "3360", canton_abbreviation: "BE", lat: 47.1883, lng: 7.7083 },
  { name: "Wohlen bei Bern", postal_code: "3033", canton_abbreviation: "BE", lat: 46.9683, lng: 7.3517 },
  { name: "Moutier", postal_code: "2740", canton_abbreviation: "BE", lat: 47.2783, lng: 7.3717 },
  { name: "Langnau im Emmental", postal_code: "3550", canton_abbreviation: "BE", lat: 46.9400, lng: 7.7867 },
  { name: "Huttwil", postal_code: "4950", canton_abbreviation: "BE", lat: 47.1150, lng: 7.8517 },
  { name: "Grindelwald", postal_code: "3818", canton_abbreviation: "BE", lat: 46.6244, lng: 8.0414 },
  { name: "Lauterbrunnen", postal_code: "3822", canton_abbreviation: "BE", lat: 46.5933, lng: 7.9083 },
  { name: "Wengen", postal_code: "3823", canton_abbreviation: "BE", lat: 46.6067, lng: 7.9217 },

  // Luzern (LU)
  { name: "Luzern", postal_code: "6000", canton_abbreviation: "LU", lat: 47.0502, lng: 8.3093 },
  { name: "Emmen", postal_code: "6020", canton_abbreviation: "LU", lat: 47.0833, lng: 8.2833 },
  { name: "Kriens", postal_code: "6010", canton_abbreviation: "LU", lat: 47.0333, lng: 8.2833 },
  { name: "Horw", postal_code: "6048", canton_abbreviation: "LU", lat: 47.0167, lng: 8.3083 },
  { name: "Ebikon", postal_code: "6030", canton_abbreviation: "LU", lat: 47.0833, lng: 8.3417 },
  { name: "Sursee", postal_code: "6210", canton_abbreviation: "LU", lat: 47.1717, lng: 8.1083 },
  { name: "Hochdorf", postal_code: "6280", canton_abbreviation: "LU", lat: 47.1683, lng: 8.2917 },
  { name: "Rothenburg", postal_code: "6023", canton_abbreviation: "LU", lat: 47.0983, lng: 8.2650 },
  { name: "Root", postal_code: "6037", canton_abbreviation: "LU", lat: 47.1150, lng: 8.3917 },
  { name: "Willisau", postal_code: "6130", canton_abbreviation: "LU", lat: 47.1217, lng: 7.9933 },
  { name: "Meggen", postal_code: "6045", canton_abbreviation: "LU", lat: 47.0450, lng: 8.3750 },
  { name: "Adligenswil", postal_code: "6043", canton_abbreviation: "LU", lat: 47.0683, lng: 8.3617 },
  { name: "Buchrain", postal_code: "6033", canton_abbreviation: "LU", lat: 47.0967, lng: 8.3483 },
  { name: "Neuenkirch", postal_code: "6206", canton_abbreviation: "LU", lat: 47.1000, lng: 8.2050 },

  // Uri (UR)
  { name: "Altdorf", postal_code: "6460", canton_abbreviation: "UR", lat: 46.8808, lng: 8.6386 },
  { name: "Bürglen", postal_code: "6463", canton_abbreviation: "UR", lat: 46.8750, lng: 8.6750 },
  { name: "Schattdorf", postal_code: "6467", canton_abbreviation: "UR", lat: 46.8617, lng: 8.6533 },
  { name: "Erstfeld", postal_code: "6472", canton_abbreviation: "UR", lat: 46.8217, lng: 8.6500 },
  { name: "Flüelen", postal_code: "6454", canton_abbreviation: "UR", lat: 46.9017, lng: 8.6267 },
  { name: "Andermatt", postal_code: "6490", canton_abbreviation: "UR", lat: 46.6333, lng: 8.5933 },

  // Schwyz (SZ)
  { name: "Schwyz", postal_code: "6430", canton_abbreviation: "SZ", lat: 47.0208, lng: 8.6569 },
  { name: "Freienbach", postal_code: "8807", canton_abbreviation: "SZ", lat: 47.2067, lng: 8.7583 },
  { name: "Einsiedeln", postal_code: "8840", canton_abbreviation: "SZ", lat: 47.1267, lng: 8.7517 },
  { name: "Küssnacht am Rigi", postal_code: "6403", canton_abbreviation: "SZ", lat: 47.0850, lng: 8.4383 },
  { name: "Arth", postal_code: "6415", canton_abbreviation: "SZ", lat: 47.0633, lng: 8.5217 },
  { name: "Lachen", postal_code: "8853", canton_abbreviation: "SZ", lat: 47.1967, lng: 8.8550 },
  { name: "Wollerau", postal_code: "8832", canton_abbreviation: "SZ", lat: 47.1950, lng: 8.7217 },
  { name: "Brunnen", postal_code: "6440", canton_abbreviation: "SZ", lat: 46.9933, lng: 8.6050 },
  { name: "Ingenbohl", postal_code: "6440", canton_abbreviation: "SZ", lat: 46.9833, lng: 8.6167 },

  // Obwalden (OW)
  { name: "Sarnen", postal_code: "6060", canton_abbreviation: "OW", lat: 46.8964, lng: 8.2453 },
  { name: "Kerns", postal_code: "6064", canton_abbreviation: "OW", lat: 46.9017, lng: 8.2750 },
  { name: "Sachseln", postal_code: "6072", canton_abbreviation: "OW", lat: 46.8667, lng: 8.2333 },
  { name: "Alpnach", postal_code: "6055", canton_abbreviation: "OW", lat: 46.9417, lng: 8.2717 },
  { name: "Engelberg", postal_code: "6390", canton_abbreviation: "OW", lat: 46.8217, lng: 8.4017 },

  // Nidwalden (NW)
  { name: "Stans", postal_code: "6370", canton_abbreviation: "NW", lat: 46.9578, lng: 8.3650 },
  { name: "Hergiswil", postal_code: "6052", canton_abbreviation: "NW", lat: 46.9833, lng: 8.3083 },
  { name: "Buochs", postal_code: "6374", canton_abbreviation: "NW", lat: 46.9717, lng: 8.4217 },
  { name: "Stansstad", postal_code: "6362", canton_abbreviation: "NW", lat: 46.9783, lng: 8.3400 },
  { name: "Ennetbürgen", postal_code: "6373", canton_abbreviation: "NW", lat: 46.9833, lng: 8.4117 },

  // Glarus (GL)
  { name: "Glarus", postal_code: "8750", canton_abbreviation: "GL", lat: 47.0411, lng: 9.0678 },
  { name: "Näfels", postal_code: "8752", canton_abbreviation: "GL", lat: 47.0983, lng: 9.0633 },
  { name: "Netstal", postal_code: "8754", canton_abbreviation: "GL", lat: 47.0650, lng: 9.0550 },
  { name: "Mollis", postal_code: "8753", canton_abbreviation: "GL", lat: 47.0917, lng: 9.0717 },
  { name: "Elm", postal_code: "8767", canton_abbreviation: "GL", lat: 46.9183, lng: 9.1750 },

  // Zug (ZG)
  { name: "Zug", postal_code: "6300", canton_abbreviation: "ZG", lat: 47.1724, lng: 8.5174 },
  { name: "Baar", postal_code: "6340", canton_abbreviation: "ZG", lat: 47.1967, lng: 8.5283 },
  { name: "Cham", postal_code: "6330", canton_abbreviation: "ZG", lat: 47.1817, lng: 8.4633 },
  { name: "Steinhausen", postal_code: "6312", canton_abbreviation: "ZG", lat: 47.1950, lng: 8.4867 },
  { name: "Risch-Rotkreuz", postal_code: "6343", canton_abbreviation: "ZG", lat: 47.1433, lng: 8.4317 },
  { name: "Hünenberg", postal_code: "6331", canton_abbreviation: "ZG", lat: 47.1783, lng: 8.4233 },
  { name: "Menzingen", postal_code: "6313", canton_abbreviation: "ZG", lat: 47.1783, lng: 8.5917 },
  { name: "Oberägeri", postal_code: "6315", canton_abbreviation: "ZG", lat: 47.1367, lng: 8.6217 },
  { name: "Unterägeri", postal_code: "6314", canton_abbreviation: "ZG", lat: 47.1383, lng: 8.5833 },
  { name: "Walchwil", postal_code: "6318", canton_abbreviation: "ZG", lat: 47.1017, lng: 8.5183 },
  { name: "Neuheim", postal_code: "6345", canton_abbreviation: "ZG", lat: 47.2017, lng: 8.5833 },

  // Fribourg/Freiburg (FR)
  { name: "Fribourg", postal_code: "1700", canton_abbreviation: "FR", lat: 46.8065, lng: 7.1620 },
  { name: "Bulle", postal_code: "1630", canton_abbreviation: "FR", lat: 46.6192, lng: 7.0578 },
  { name: "Villars-sur-Glâne", postal_code: "1752", canton_abbreviation: "FR", lat: 46.7933, lng: 7.1200 },
  { name: "Marly", postal_code: "1723", canton_abbreviation: "FR", lat: 46.7783, lng: 7.1583 },
  { name: "Düdingen", postal_code: "3186", canton_abbreviation: "FR", lat: 46.8517, lng: 7.1883 },
  { name: "Murten", postal_code: "3280", canton_abbreviation: "FR", lat: 46.9283, lng: 7.1183 },
  { name: "Estavayer-le-Lac", postal_code: "1470", canton_abbreviation: "FR", lat: 46.8500, lng: 6.8467 },
  { name: "Romont", postal_code: "1680", canton_abbreviation: "FR", lat: 46.6933, lng: 6.9183 },
  { name: "Châtel-Saint-Denis", postal_code: "1618", canton_abbreviation: "FR", lat: 46.5233, lng: 6.9017 },
  { name: "Givisiez", postal_code: "1762", canton_abbreviation: "FR", lat: 46.8117, lng: 7.1283 },
  { name: "Granges-Paccot", postal_code: "1763", canton_abbreviation: "FR", lat: 46.8217, lng: 7.1400 },
  { name: "Wünnewil-Flamatt", postal_code: "3175", canton_abbreviation: "FR", lat: 46.8900, lng: 7.2950 },

  // Solothurn (SO)
  { name: "Solothurn", postal_code: "4500", canton_abbreviation: "SO", lat: 47.2088, lng: 7.5378 },
  { name: "Olten", postal_code: "4600", canton_abbreviation: "SO", lat: 47.3520, lng: 7.9078 },
  { name: "Grenchen", postal_code: "2540", canton_abbreviation: "SO", lat: 47.1928, lng: 7.3953 },
  { name: "Zuchwil", postal_code: "4528", canton_abbreviation: "SO", lat: 47.2050, lng: 7.5617 },
  { name: "Derendingen", postal_code: "4552", canton_abbreviation: "SO", lat: 47.1950, lng: 7.5917 },
  { name: "Biberist", postal_code: "4562", canton_abbreviation: "SO", lat: 47.1800, lng: 7.5617 },
  { name: "Bellach", postal_code: "4512", canton_abbreviation: "SO", lat: 47.2167, lng: 7.5017 },
  { name: "Gerlafingen", postal_code: "4563", canton_abbreviation: "SO", lat: 47.1717, lng: 7.5783 },
  { name: "Trimbach", postal_code: "4632", canton_abbreviation: "SO", lat: 47.3617, lng: 7.8833 },
  { name: "Dornach", postal_code: "4143", canton_abbreviation: "SO", lat: 47.4800, lng: 7.6167 },
  { name: "Balsthal", postal_code: "4710", canton_abbreviation: "SO", lat: 47.3150, lng: 7.6933 },
  { name: "Oensingen", postal_code: "4702", canton_abbreviation: "SO", lat: 47.2867, lng: 7.7217 },
  { name: "Härkingen", postal_code: "4624", canton_abbreviation: "SO", lat: 47.3100, lng: 7.8233 },
  { name: "Wangen bei Olten", postal_code: "4612", canton_abbreviation: "SO", lat: 47.3483, lng: 7.8717 },
  { name: "Dulliken", postal_code: "4657", canton_abbreviation: "SO", lat: 47.3483, lng: 7.9450 },

  // Basel-Stadt (BS)
  { name: "Basel", postal_code: "4000", canton_abbreviation: "BS", lat: 47.5596, lng: 7.5886 },
  { name: "Riehen", postal_code: "4125", canton_abbreviation: "BS", lat: 47.5833, lng: 7.6500 },
  { name: "Bettingen", postal_code: "4126", canton_abbreviation: "BS", lat: 47.5717, lng: 7.6633 },

  // Basel-Landschaft (BL)
  { name: "Allschwil", postal_code: "4123", canton_abbreviation: "BL", lat: 47.5500, lng: 7.5333 },
  { name: "Reinach", postal_code: "4153", canton_abbreviation: "BL", lat: 47.4933, lng: 7.5917 },
  { name: "Muttenz", postal_code: "4132", canton_abbreviation: "BL", lat: 47.5222, lng: 7.6444 },
  { name: "Pratteln", postal_code: "4133", canton_abbreviation: "BL", lat: 47.5217, lng: 7.6917 },
  { name: "Binningen", postal_code: "4102", canton_abbreviation: "BL", lat: 47.5417, lng: 7.5667 },
  { name: "Liestal", postal_code: "4410", canton_abbreviation: "BL", lat: 47.4847, lng: 7.7344 },
  { name: "Oberwil", postal_code: "4104", canton_abbreviation: "BL", lat: 47.5150, lng: 7.5500 },
  { name: "Therwil", postal_code: "4106", canton_abbreviation: "BL", lat: 47.5000, lng: 7.5500 },
  { name: "Münchenstein", postal_code: "4142", canton_abbreviation: "BL", lat: 47.5167, lng: 7.6167 },
  { name: "Arlesheim", postal_code: "4144", canton_abbreviation: "BL", lat: 47.4933, lng: 7.6200 },
  { name: "Birsfelden", postal_code: "4127", canton_abbreviation: "BL", lat: 47.5533, lng: 7.6233 },
  { name: "Bottmingen", postal_code: "4103", canton_abbreviation: "BL", lat: 47.5250, lng: 7.5717 },
  { name: "Laufen", postal_code: "4242", canton_abbreviation: "BL", lat: 47.4217, lng: 7.5017 },
  { name: "Sissach", postal_code: "4450", canton_abbreviation: "BL", lat: 47.4633, lng: 7.8100 },
  { name: "Gelterkinden", postal_code: "4460", canton_abbreviation: "BL", lat: 47.4650, lng: 7.8567 },
  { name: "Aesch", postal_code: "4147", canton_abbreviation: "BL", lat: 47.4717, lng: 7.5917 },
  { name: "Ettingen", postal_code: "4107", canton_abbreviation: "BL", lat: 47.4817, lng: 7.5450 },
  { name: "Füllinsdorf", postal_code: "4414", canton_abbreviation: "BL", lat: 47.5067, lng: 7.7333 },

  // Schaffhausen (SH)
  { name: "Schaffhausen", postal_code: "8200", canton_abbreviation: "SH", lat: 47.6961, lng: 8.6350 },
  { name: "Neuhausen am Rheinfall", postal_code: "8212", canton_abbreviation: "SH", lat: 47.6833, lng: 8.6167 },
  { name: "Thayngen", postal_code: "8240", canton_abbreviation: "SH", lat: 47.7450, lng: 8.7050 },
  { name: "Beringen", postal_code: "8222", canton_abbreviation: "SH", lat: 47.6983, lng: 8.5733 },
  { name: "Stein am Rhein", postal_code: "8260", canton_abbreviation: "SH", lat: 47.6600, lng: 8.8600 },
  { name: "Hallau", postal_code: "8215", canton_abbreviation: "SH", lat: 47.6967, lng: 8.4550 },

  // Appenzell Ausserrhoden (AR)
  { name: "Herisau", postal_code: "9100", canton_abbreviation: "AR", lat: 47.3864, lng: 9.2792 },
  { name: "Teufen", postal_code: "9053", canton_abbreviation: "AR", lat: 47.3917, lng: 9.3833 },
  { name: "Speicher", postal_code: "9042", canton_abbreviation: "AR", lat: 47.4217, lng: 9.4417 },
  { name: "Heiden", postal_code: "9410", canton_abbreviation: "AR", lat: 47.4433, lng: 9.5317 },
  { name: "Bühler", postal_code: "9055", canton_abbreviation: "AR", lat: 47.3783, lng: 9.4150 },
  { name: "Gais", postal_code: "9056", canton_abbreviation: "AR", lat: 47.3617, lng: 9.4533 },
  { name: "Urnäsch", postal_code: "9107", canton_abbreviation: "AR", lat: 47.3217, lng: 9.2800 },

  // Appenzell Innerrhoden (AI)
  { name: "Appenzell", postal_code: "9050", canton_abbreviation: "AI", lat: 47.3306, lng: 9.4097 },
  { name: "Gonten", postal_code: "9108", canton_abbreviation: "AI", lat: 47.3267, lng: 9.3433 },
  { name: "Haslen", postal_code: "9054", canton_abbreviation: "AI", lat: 47.3533, lng: 9.3800 },

  // St. Gallen (SG)
  { name: "St. Gallen", postal_code: "9000", canton_abbreviation: "SG", lat: 47.4245, lng: 9.3767 },
  { name: "Rapperswil-Jona", postal_code: "8640", canton_abbreviation: "SG", lat: 47.2267, lng: 8.8183 },
  { name: "Wil", postal_code: "9500", canton_abbreviation: "SG", lat: 47.4617, lng: 9.0450 },
  { name: "Gossau", postal_code: "9200", canton_abbreviation: "SG", lat: 47.4167, lng: 9.2500 },
  { name: "Buchs", postal_code: "9470", canton_abbreviation: "SG", lat: 47.1667, lng: 9.4667 },
  { name: "Uzwil", postal_code: "9240", canton_abbreviation: "SG", lat: 47.4350, lng: 9.1350 },
  { name: "Altstätten", postal_code: "9450", canton_abbreviation: "SG", lat: 47.3783, lng: 9.5483 },
  { name: "Flawil", postal_code: "9230", canton_abbreviation: "SG", lat: 47.4133, lng: 9.1867 },
  { name: "Rorschach", postal_code: "9400", canton_abbreviation: "SG", lat: 47.4783, lng: 9.4883 },
  { name: "Wattwil", postal_code: "9630", canton_abbreviation: "SG", lat: 47.3000, lng: 9.0833 },
  { name: "Goldach", postal_code: "9403", canton_abbreviation: "SG", lat: 47.4750, lng: 9.4633 },
  { name: "Wittenbach", postal_code: "9300", canton_abbreviation: "SG", lat: 47.4617, lng: 9.3833 },
  { name: "Mörschwil", postal_code: "9402", canton_abbreviation: "SG", lat: 47.4550, lng: 9.4217 },
  { name: "Widnau", postal_code: "9443", canton_abbreviation: "SG", lat: 47.4050, lng: 9.6317 },
  { name: "Oberuzwil", postal_code: "9242", canton_abbreviation: "SG", lat: 47.4283, lng: 9.1217 },
  { name: "Bad Ragaz", postal_code: "7310", canton_abbreviation: "SG", lat: 47.0033, lng: 9.5033 },
  { name: "Sargans", postal_code: "7320", canton_abbreviation: "SG", lat: 47.0483, lng: 9.4417 },
  { name: "Mels", postal_code: "8887", canton_abbreviation: "SG", lat: 47.0450, lng: 9.4217 },
  { name: "Ebnat-Kappel", postal_code: "9642", canton_abbreviation: "SG", lat: 47.2600, lng: 9.1133 },
  { name: "Lichtensteig", postal_code: "9620", canton_abbreviation: "SG", lat: 47.3267, lng: 9.0867 },
  { name: "Diepoldsau", postal_code: "9444", canton_abbreviation: "SG", lat: 47.3883, lng: 9.6500 },
  { name: "Au", postal_code: "9434", canton_abbreviation: "SG", lat: 47.4317, lng: 9.6350 },

  // Graubünden (GR)
  { name: "Chur", postal_code: "7000", canton_abbreviation: "GR", lat: 46.8499, lng: 9.5329 },
  { name: "Davos", postal_code: "7270", canton_abbreviation: "GR", lat: 46.8027, lng: 9.8360 },
  { name: "Landquart", postal_code: "7302", canton_abbreviation: "GR", lat: 46.9650, lng: 9.5550 },
  { name: "Domat/Ems", postal_code: "7013", canton_abbreviation: "GR", lat: 46.8333, lng: 9.4500 },
  { name: "St. Moritz", postal_code: "7500", canton_abbreviation: "GR", lat: 46.4986, lng: 9.8383 },
  { name: "Arosa", postal_code: "7050", canton_abbreviation: "GR", lat: 46.7833, lng: 9.6833 },
  { name: "Klosters", postal_code: "7250", canton_abbreviation: "GR", lat: 46.8717, lng: 9.8783 },
  { name: "Pontresina", postal_code: "7504", canton_abbreviation: "GR", lat: 46.4933, lng: 9.9000 },
  { name: "Thusis", postal_code: "7430", canton_abbreviation: "GR", lat: 46.6967, lng: 9.4400 },
  { name: "Ilanz", postal_code: "7130", canton_abbreviation: "GR", lat: 46.7733, lng: 9.2050 },
  { name: "Maienfeld", postal_code: "7304", canton_abbreviation: "GR", lat: 47.0033, lng: 9.5267 },
  { name: "Igis", postal_code: "7206", canton_abbreviation: "GR", lat: 46.9450, lng: 9.5717 },
  { name: "Zizers", postal_code: "7205", canton_abbreviation: "GR", lat: 46.9367, lng: 9.5667 },
  { name: "Scuol", postal_code: "7550", canton_abbreviation: "GR", lat: 46.7967, lng: 10.3033 },
  { name: "Poschiavo", postal_code: "7742", canton_abbreviation: "GR", lat: 46.3233, lng: 10.0583 },
  { name: "Flims", postal_code: "7017", canton_abbreviation: "GR", lat: 46.8383, lng: 9.2867 },
  { name: "Laax", postal_code: "7031", canton_abbreviation: "GR", lat: 46.8067, lng: 9.2517 },
  { name: "Lenzerheide", postal_code: "7078", canton_abbreviation: "GR", lat: 46.7333, lng: 9.5583 },
  { name: "Savognin", postal_code: "7460", canton_abbreviation: "GR", lat: 46.5967, lng: 9.6000 },

  // Aargau (AG)
  { name: "Aarau", postal_code: "5000", canton_abbreviation: "AG", lat: 47.3925, lng: 8.0442 },
  { name: "Wettingen", postal_code: "5430", canton_abbreviation: "AG", lat: 47.4667, lng: 8.3167 },
  { name: "Baden", postal_code: "5400", canton_abbreviation: "AG", lat: 47.4733, lng: 8.3064 },
  { name: "Oftringen", postal_code: "4665", canton_abbreviation: "AG", lat: 47.3133, lng: 7.9217 },
  { name: "Wohlen", postal_code: "5610", canton_abbreviation: "AG", lat: 47.3517, lng: 8.2767 },
  { name: "Spreitenbach", postal_code: "8957", canton_abbreviation: "AG", lat: 47.4217, lng: 8.3633 },
  { name: "Brugg", postal_code: "5200", canton_abbreviation: "AG", lat: 47.4833, lng: 8.2000 },
  { name: "Rheinfelden", postal_code: "4310", canton_abbreviation: "AG", lat: 47.5544, lng: 7.7939 },
  { name: "Zofingen", postal_code: "4800", canton_abbreviation: "AG", lat: 47.2878, lng: 7.9464 },
  { name: "Buchs AG", postal_code: "5033", canton_abbreviation: "AG", lat: 47.3900, lng: 8.0733 },
  { name: "Lenzburg", postal_code: "5600", canton_abbreviation: "AG", lat: 47.3883, lng: 8.1750 },
  { name: "Windisch", postal_code: "5210", canton_abbreviation: "AG", lat: 47.4833, lng: 8.2167 },
  { name: "Suhr", postal_code: "5034", canton_abbreviation: "AG", lat: 47.3717, lng: 8.0783 },
  { name: "Obersiggenthal", postal_code: "5415", canton_abbreviation: "AG", lat: 47.4917, lng: 8.2483 },
  { name: "Möhlin", postal_code: "4313", canton_abbreviation: "AG", lat: 47.5617, lng: 7.8417 },
  { name: "Muri AG", postal_code: "5630", canton_abbreviation: "AG", lat: 47.2750, lng: 8.3383 },
  { name: "Neuenhof", postal_code: "5432", canton_abbreviation: "AG", lat: 47.4500, lng: 8.3217 },
  { name: "Oberentfelden", postal_code: "5036", canton_abbreviation: "AG", lat: 47.3550, lng: 8.0483 },
  { name: "Frick", postal_code: "5070", canton_abbreviation: "AG", lat: 47.5050, lng: 8.0233 },
  { name: "Sins", postal_code: "5643", canton_abbreviation: "AG", lat: 47.1917, lng: 8.3917 },
  { name: "Mellingen", postal_code: "5507", canton_abbreviation: "AG", lat: 47.4183, lng: 8.2733 },
  { name: "Turgi", postal_code: "5300", canton_abbreviation: "AG", lat: 47.4933, lng: 8.2550 },
  { name: "Ennetbaden", postal_code: "5408", canton_abbreviation: "AG", lat: 47.4817, lng: 8.3217 },
  { name: "Würenlos", postal_code: "5436", canton_abbreviation: "AG", lat: 47.4417, lng: 8.3650 },
  { name: "Döttingen", postal_code: "5312", canton_abbreviation: "AG", lat: 47.5700, lng: 8.2550 },
  { name: "Untersiggenthal", postal_code: "5417", canton_abbreviation: "AG", lat: 47.5133, lng: 8.2517 },
  { name: "Kölliken", postal_code: "5742", canton_abbreviation: "AG", lat: 47.3383, lng: 8.0217 },
  { name: "Rothrist", postal_code: "4852", canton_abbreviation: "AG", lat: 47.3050, lng: 7.8883 },
  { name: "Stein AG", postal_code: "4332", canton_abbreviation: "AG", lat: 47.5433, lng: 7.9450 },
  { name: "Kaiseraugst", postal_code: "4303", canton_abbreviation: "AG", lat: 47.5383, lng: 7.7283 },
  { name: "Killwangen", postal_code: "8956", canton_abbreviation: "AG", lat: 47.4333, lng: 8.3517 },
  { name: "Gebenstorf", postal_code: "5412", canton_abbreviation: "AG", lat: 47.4817, lng: 8.2383 },

  // Thurgau (TG)
  { name: "Frauenfeld", postal_code: "8500", canton_abbreviation: "TG", lat: 47.5569, lng: 8.8989 },
  { name: "Kreuzlingen", postal_code: "8280", canton_abbreviation: "TG", lat: 47.6500, lng: 9.1750 },
  { name: "Arbon", postal_code: "9320", canton_abbreviation: "TG", lat: 47.5167, lng: 9.4333 },
  { name: "Amriswil", postal_code: "8580", canton_abbreviation: "TG", lat: 47.5483, lng: 9.3017 },
  { name: "Weinfelden", postal_code: "8570", canton_abbreviation: "TG", lat: 47.5667, lng: 9.1000 },
  { name: "Romanshorn", postal_code: "8590", canton_abbreviation: "TG", lat: 47.5650, lng: 9.3783 },
  { name: "Sirnach", postal_code: "8370", canton_abbreviation: "TG", lat: 47.4617, lng: 8.9983 },
  { name: "Aadorf", postal_code: "8355", canton_abbreviation: "TG", lat: 47.4933, lng: 8.9017 },
  { name: "Bischofszell", postal_code: "9220", canton_abbreviation: "TG", lat: 47.4983, lng: 9.2367 },
  { name: "Münchwilen", postal_code: "9542", canton_abbreviation: "TG", lat: 47.4783, lng: 9.0017 },
  { name: "Egnach", postal_code: "9313", canton_abbreviation: "TG", lat: 47.5417, lng: 9.3867 },
  { name: "Steckborn", postal_code: "8266", canton_abbreviation: "TG", lat: 47.6667, lng: 8.9833 },
  { name: "Ermatingen", postal_code: "8272", canton_abbreviation: "TG", lat: 47.6700, lng: 9.0833 },
  { name: "Tägerwilen", postal_code: "8274", canton_abbreviation: "TG", lat: 47.6550, lng: 9.1333 },
  { name: "Sulgen", postal_code: "8583", canton_abbreviation: "TG", lat: 47.5383, lng: 9.2017 },
  { name: "Diessenhofen", postal_code: "8253", canton_abbreviation: "TG", lat: 47.6900, lng: 8.7467 },

  // Ticino (TI)
  { name: "Lugano", postal_code: "6900", canton_abbreviation: "TI", lat: 46.0037, lng: 8.9511 },
  { name: "Bellinzona", postal_code: "6500", canton_abbreviation: "TI", lat: 46.1955, lng: 9.0234 },
  { name: "Locarno", postal_code: "6600", canton_abbreviation: "TI", lat: 46.1700, lng: 8.7936 },
  { name: "Mendrisio", postal_code: "6850", canton_abbreviation: "TI", lat: 45.8700, lng: 8.9817 },
  { name: "Chiasso", postal_code: "6830", canton_abbreviation: "TI", lat: 45.8333, lng: 9.0333 },
  { name: "Giubiasco", postal_code: "6512", canton_abbreviation: "TI", lat: 46.1717, lng: 9.0050 },
  { name: "Ascona", postal_code: "6612", canton_abbreviation: "TI", lat: 46.1550, lng: 8.7717 },
  { name: "Minusio", postal_code: "6648", canton_abbreviation: "TI", lat: 46.1783, lng: 8.8133 },
  { name: "Massagno", postal_code: "6900", canton_abbreviation: "TI", lat: 46.0133, lng: 8.9367 },
  { name: "Paradiso", postal_code: "6900", canton_abbreviation: "TI", lat: 45.9917, lng: 8.9467 },
  { name: "Viganello", postal_code: "6962", canton_abbreviation: "TI", lat: 46.0117, lng: 8.9683 },
  { name: "Losone", postal_code: "6616", canton_abbreviation: "TI", lat: 46.1667, lng: 8.7583 },
  { name: "Muralto", postal_code: "6602", canton_abbreviation: "TI", lat: 46.1717, lng: 8.8000 },
  { name: "Bioggio", postal_code: "6934", canton_abbreviation: "TI", lat: 46.0317, lng: 8.9083 },
  { name: "Agno", postal_code: "6982", canton_abbreviation: "TI", lat: 45.9983, lng: 8.9017 },
  { name: "Coldrerio", postal_code: "6877", canton_abbreviation: "TI", lat: 45.8483, lng: 8.9783 },
  { name: "Stabio", postal_code: "6855", canton_abbreviation: "TI", lat: 45.8433, lng: 8.9383 },
  { name: "Balerna", postal_code: "6828", canton_abbreviation: "TI", lat: 45.8467, lng: 9.0117 },
  { name: "Tenero-Contra", postal_code: "6598", canton_abbreviation: "TI", lat: 46.1717, lng: 8.8450 },
  { name: "Gordola", postal_code: "6596", canton_abbreviation: "TI", lat: 46.1783, lng: 8.8617 },
  { name: "Morbio Inferiore", postal_code: "6834", canton_abbreviation: "TI", lat: 45.8533, lng: 9.0217 },
  { name: "Vacallo", postal_code: "6833", canton_abbreviation: "TI", lat: 45.8467, lng: 9.0417 },
  { name: "Caslano", postal_code: "6987", canton_abbreviation: "TI", lat: 45.9667, lng: 8.8750 },
  { name: "Magliaso", postal_code: "6983", canton_abbreviation: "TI", lat: 45.9917, lng: 8.8883 },

  // Vaud (VD)
  { name: "Lausanne", postal_code: "1000", canton_abbreviation: "VD", lat: 46.5197, lng: 6.6323 },
  { name: "Yverdon-les-Bains", postal_code: "1400", canton_abbreviation: "VD", lat: 46.7783, lng: 6.6414 },
  { name: "Montreux", postal_code: "1820", canton_abbreviation: "VD", lat: 46.4312, lng: 6.9107 },
  { name: "Renens", postal_code: "1020", canton_abbreviation: "VD", lat: 46.5333, lng: 6.5833 },
  { name: "Nyon", postal_code: "1260", canton_abbreviation: "VD", lat: 46.3831, lng: 6.2397 },
  { name: "Vevey", postal_code: "1800", canton_abbreviation: "VD", lat: 46.4628, lng: 6.8431 },
  { name: "Morges", postal_code: "1110", canton_abbreviation: "VD", lat: 46.5117, lng: 6.4983 },
  { name: "Pully", postal_code: "1009", canton_abbreviation: "VD", lat: 46.5100, lng: 6.6617 },
  { name: "Prilly", postal_code: "1008", canton_abbreviation: "VD", lat: 46.5333, lng: 6.6000 },
  { name: "Ecublens", postal_code: "1024", canton_abbreviation: "VD", lat: 46.5283, lng: 6.5550 },
  { name: "Gland", postal_code: "1196", canton_abbreviation: "VD", lat: 46.4217, lng: 6.2683 },
  { name: "Aigle", postal_code: "1860", canton_abbreviation: "VD", lat: 46.3183, lng: 6.9650 },
  { name: "Bussigny", postal_code: "1030", canton_abbreviation: "VD", lat: 46.5517, lng: 6.5517 },
  { name: "Crissier", postal_code: "1023", canton_abbreviation: "VD", lat: 46.5450, lng: 6.5783 },
  { name: "Lutry", postal_code: "1095", canton_abbreviation: "VD", lat: 46.5050, lng: 6.6833 },
  { name: "Epalinges", postal_code: "1066", canton_abbreviation: "VD", lat: 46.5483, lng: 6.6683 },
  { name: "Chavannes-près-Renens", postal_code: "1022", canton_abbreviation: "VD", lat: 46.5317, lng: 6.5700 },
  { name: "Le Mont-sur-Lausanne", postal_code: "1052", canton_abbreviation: "VD", lat: 46.5583, lng: 6.6283 },
  { name: "Rolle", postal_code: "1180", canton_abbreviation: "VD", lat: 46.4583, lng: 6.3367 },
  { name: "Payerne", postal_code: "1530", canton_abbreviation: "VD", lat: 46.8200, lng: 6.9367 },
  { name: "Villeneuve", postal_code: "1844", canton_abbreviation: "VD", lat: 46.3983, lng: 6.9267 },
  { name: "Saint-Prex", postal_code: "1162", canton_abbreviation: "VD", lat: 46.4817, lng: 6.4517 },
  { name: "Aubonne", postal_code: "1170", canton_abbreviation: "VD", lat: 46.4967, lng: 6.3933 },
  { name: "Orbe", postal_code: "1350", canton_abbreviation: "VD", lat: 46.7250, lng: 6.5317 },
  { name: "Moudon", postal_code: "1510", canton_abbreviation: "VD", lat: 46.6683, lng: 6.7983 },
  { name: "La Tour-de-Peilz", postal_code: "1814", canton_abbreviation: "VD", lat: 46.4533, lng: 6.8617 },
  { name: "Blonay", postal_code: "1807", canton_abbreviation: "VD", lat: 46.4667, lng: 6.8933 },
  { name: "Cully", postal_code: "1096", canton_abbreviation: "VD", lat: 46.4883, lng: 6.7283 },

  // Valais (VS)
  { name: "Sion", postal_code: "1950", canton_abbreviation: "VS", lat: 46.2333, lng: 7.3600 },
  { name: "Sierre", postal_code: "3960", canton_abbreviation: "VS", lat: 46.2917, lng: 7.5333 },
  { name: "Martigny", postal_code: "1920", canton_abbreviation: "VS", lat: 46.0983, lng: 7.0717 },
  { name: "Monthey", postal_code: "1870", canton_abbreviation: "VS", lat: 46.2550, lng: 6.9550 },
  { name: "Brig-Glis", postal_code: "3900", canton_abbreviation: "VS", lat: 46.3167, lng: 7.9833 },
  { name: "Visp", postal_code: "3930", canton_abbreviation: "VS", lat: 46.2933, lng: 7.8817 },
  { name: "Naters", postal_code: "3904", canton_abbreviation: "VS", lat: 46.3283, lng: 7.9883 },
  { name: "Zermatt", postal_code: "3920", canton_abbreviation: "VS", lat: 46.0207, lng: 7.7491 },
  { name: "Leukerbad", postal_code: "3954", canton_abbreviation: "VS", lat: 46.3817, lng: 7.6267 },
  { name: "Crans-Montana", postal_code: "3963", canton_abbreviation: "VS", lat: 46.3117, lng: 7.4817 },
  { name: "Verbier", postal_code: "1936", canton_abbreviation: "VS", lat: 46.0967, lng: 7.2283 },
  { name: "Saas-Fee", postal_code: "3906", canton_abbreviation: "VS", lat: 46.1083, lng: 7.9267 },
  { name: "Fully", postal_code: "1926", canton_abbreviation: "VS", lat: 46.1383, lng: 7.1117 },
  { name: "Collombey-Muraz", postal_code: "1868", canton_abbreviation: "VS", lat: 46.2717, lng: 6.9417 },
  { name: "Conthey", postal_code: "1964", canton_abbreviation: "VS", lat: 46.2233, lng: 7.3033 },
  { name: "Savièse", postal_code: "1965", canton_abbreviation: "VS", lat: 46.2550, lng: 7.3550 },
  { name: "Leuk", postal_code: "3953", canton_abbreviation: "VS", lat: 46.3183, lng: 7.6333 },
  { name: "St-Maurice", postal_code: "1890", canton_abbreviation: "VS", lat: 46.2183, lng: 7.0033 },
  { name: "Saxon", postal_code: "1907", canton_abbreviation: "VS", lat: 46.1483, lng: 7.1750 },
  { name: "Bagnes", postal_code: "1934", canton_abbreviation: "VS", lat: 46.0800, lng: 7.2200 },

  // Neuchâtel (NE)
  { name: "Neuchâtel", postal_code: "2000", canton_abbreviation: "NE", lat: 46.9900, lng: 6.9293 },
  { name: "La Chaux-de-Fonds", postal_code: "2300", canton_abbreviation: "NE", lat: 47.1042, lng: 6.8261 },
  { name: "Le Locle", postal_code: "2400", canton_abbreviation: "NE", lat: 47.0583, lng: 6.7500 },
  { name: "Peseux", postal_code: "2034", canton_abbreviation: "NE", lat: 46.9883, lng: 6.8783 },
  { name: "Boudry", postal_code: "2017", canton_abbreviation: "NE", lat: 46.9517, lng: 6.8383 },
  { name: "Val-de-Travers", postal_code: "2105", canton_abbreviation: "NE", lat: 46.9217, lng: 6.6217 },
  { name: "Cortaillod", postal_code: "2016", canton_abbreviation: "NE", lat: 46.9417, lng: 6.8417 },
  { name: "Hauterive", postal_code: "2068", canton_abbreviation: "NE", lat: 47.0100, lng: 6.9617 },
  { name: "Marin-Epagnier", postal_code: "2074", canton_abbreviation: "NE", lat: 47.0117, lng: 7.0050 },
  { name: "Bevaix", postal_code: "2022", canton_abbreviation: "NE", lat: 46.9283, lng: 6.8167 },
  { name: "Colombier", postal_code: "2013", canton_abbreviation: "NE", lat: 46.9667, lng: 6.8633 },
  { name: "Saint-Blaise", postal_code: "2072", canton_abbreviation: "NE", lat: 47.0150, lng: 6.9883 },
  { name: "Corcelles-Cormondrèche", postal_code: "2035", canton_abbreviation: "NE", lat: 46.9817, lng: 6.8817 },

  // Genève (GE)
  { name: "Genève", postal_code: "1200", canton_abbreviation: "GE", lat: 46.2044, lng: 6.1432 },
  { name: "Vernier", postal_code: "1214", canton_abbreviation: "GE", lat: 46.2167, lng: 6.0833 },
  { name: "Lancy", postal_code: "1212", canton_abbreviation: "GE", lat: 46.1833, lng: 6.1167 },
  { name: "Meyrin", postal_code: "1217", canton_abbreviation: "GE", lat: 46.2333, lng: 6.0833 },
  { name: "Carouge", postal_code: "1227", canton_abbreviation: "GE", lat: 46.1833, lng: 6.1417 },
  { name: "Onex", postal_code: "1213", canton_abbreviation: "GE", lat: 46.1833, lng: 6.1000 },
  { name: "Thônex", postal_code: "1226", canton_abbreviation: "GE", lat: 46.1917, lng: 6.2000 },
  { name: "Plan-les-Ouates", postal_code: "1228", canton_abbreviation: "GE", lat: 46.1667, lng: 6.1167 },
  { name: "Le Grand-Saconnex", postal_code: "1218", canton_abbreviation: "GE", lat: 46.2333, lng: 6.1167 },
  { name: "Bernex", postal_code: "1233", canton_abbreviation: "GE", lat: 46.1750, lng: 6.0667 },
  { name: "Chêne-Bougeries", postal_code: "1224", canton_abbreviation: "GE", lat: 46.1983, lng: 6.1917 },
  { name: "Versoix", postal_code: "1290", canton_abbreviation: "GE", lat: 46.2833, lng: 6.1667 },
  { name: "Satigny", postal_code: "1242", canton_abbreviation: "GE", lat: 46.2183, lng: 6.0333 },
  { name: "Veyrier", postal_code: "1255", canton_abbreviation: "GE", lat: 46.1667, lng: 6.1833 },
  { name: "Confignon", postal_code: "1232", canton_abbreviation: "GE", lat: 46.1750, lng: 6.0833 },
  { name: "Cologny", postal_code: "1223", canton_abbreviation: "GE", lat: 46.2167, lng: 6.1833 },
  { name: "Pregny-Chambésy", postal_code: "1292", canton_abbreviation: "GE", lat: 46.2417, lng: 6.1500 },
  { name: "Chêne-Bourg", postal_code: "1225", canton_abbreviation: "GE", lat: 46.1950, lng: 6.1917 },
  { name: "Bellevue", postal_code: "1293", canton_abbreviation: "GE", lat: 46.2550, lng: 6.1550 },
  { name: "Puplinge", postal_code: "1241", canton_abbreviation: "GE", lat: 46.2083, lng: 6.2250 },
  { name: "Collonge-Bellerive", postal_code: "1245", canton_abbreviation: "GE", lat: 46.2550, lng: 6.1917 },
  { name: "Bardonnex", postal_code: "1257", canton_abbreviation: "GE", lat: 46.1467, lng: 6.1083 },
  { name: "Aire-la-Ville", postal_code: "1288", canton_abbreviation: "GE", lat: 46.1883, lng: 6.0283 },

  // Jura (JU)
  { name: "Delémont", postal_code: "2800", canton_abbreviation: "JU", lat: 47.3650, lng: 7.3433 },
  { name: "Porrentruy", postal_code: "2900", canton_abbreviation: "JU", lat: 47.4150, lng: 7.0750 },
  { name: "Saignelégier", postal_code: "2350", canton_abbreviation: "JU", lat: 47.2567, lng: 6.9950 },
  { name: "Courgenay", postal_code: "2950", canton_abbreviation: "JU", lat: 47.4050, lng: 7.1267 },
  { name: "Bassecourt", postal_code: "2854", canton_abbreviation: "JU", lat: 47.3383, lng: 7.2417 },
  { name: "Courtételle", postal_code: "2852", canton_abbreviation: "JU", lat: 47.3450, lng: 7.3017 },
  { name: "Courroux", postal_code: "2822", canton_abbreviation: "JU", lat: 47.3667, lng: 7.3767 },
  { name: "Le Noirmont", postal_code: "2340", canton_abbreviation: "JU", lat: 47.2217, lng: 6.9567 },
  { name: "Alle", postal_code: "2942", canton_abbreviation: "JU", lat: 47.4283, lng: 7.1283 },
  { name: "Boncourt", postal_code: "2926", canton_abbreviation: "JU", lat: 47.4967, lng: 7.0167 },
  { name: "Fontenais", postal_code: "2902", canton_abbreviation: "JU", lat: 47.4017, lng: 7.0883 },
  { name: "Develier", postal_code: "2802", canton_abbreviation: "JU", lat: 47.3583, lng: 7.2967 },
];

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/é|è|ê/g, 'e')
    .replace(/à|â/g, 'a')
    .replace(/ô/g, 'o')
    .replace(/î/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting Swiss cities import...');

    // 1. Get all cantons
    const { data: cantons, error: cantonsError } = await supabase
      .from('cantons')
      .select('id, abbreviation');

    if (cantonsError) {
      throw new Error(`Failed to fetch cantons: ${cantonsError.message}`);
    }

    const cantonMap = new Map(cantons.map((c: any) => [c.abbreviation, c.id]));
    console.log(`Found ${cantons.length} cantons`);

    // 2. Delete existing cities (to avoid duplicates)
    const { error: deleteError } = await supabase
      .from('cities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.log('Note: Could not delete existing cities (may be empty):', deleteError.message);
    }

    // 3. Prepare cities for insert
    const citiesToInsert = SWISS_CITIES.map(city => {
      const canton_id = cantonMap.get(city.canton_abbreviation);
      if (!canton_id) {
        console.warn(`Canton not found for ${city.name}: ${city.canton_abbreviation}`);
        return null;
      }
      return {
        name: city.name,
        postal_code: city.postal_code,
        canton_id,
        lat: city.lat,
        lng: city.lng,
        slug: generateSlug(city.name),
      };
    }).filter(Boolean);

    console.log(`Prepared ${citiesToInsert.length} cities for insert`);

    // 4. Insert in batches of 100
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < citiesToInsert.length; i += batchSize) {
      const batch = citiesToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('cities')
        .insert(batch);
      
      if (insertError) {
        console.error(`Batch insert error at ${i}:`, insertError.message);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`Successfully inserted ${insertedCount} cities`);

    // 5. Update existing profiles without GPS coordinates
    const { data: updateResult, error: updateError } = await supabase.rpc('update_profiles_gps_from_cities');
    
    if (updateError) {
      console.log('Note: Could not run profile GPS update RPC:', updateError.message);
      // Fallback: manual update
      const { error: manualUpdateError } = await supabase
        .from('profiles')
        .update({ lat: null }) // Trigger will handle it
        .is('lat', null);
        
      if (manualUpdateError) {
        console.log('Manual update also failed:', manualUpdateError.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Imported ${insertedCount} Swiss cities with GPS coordinates`,
        cantons_count: cantons.length,
        cities_count: insertedCount,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
