-- Add Olten and other important missing cities
INSERT INTO cities (name, canton_id, postal_code, lat, lng, slug)
SELECT 'Olten', id, '4600', 47.3520, 7.9078, 'olten'
FROM cantons WHERE abbreviation = 'SO'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, canton_id, postal_code, lat, lng, slug)
SELECT 'Aarau', id, '5000', 47.3905, 8.0455, 'aarau'
FROM cantons WHERE abbreviation = 'AG'
ON CONFLICT DO NOTHING;

INSERT INTO cities (name, canton_id, postal_code, lat, lng, slug)
SELECT 'Solothurn', id, '4500', 47.2088, 7.5323, 'solothurn'
FROM cantons WHERE abbreviation = 'SO'
ON CONFLICT DO NOTHING;

-- Update existing profiles with city='Olten' that have NULL coordinates
UPDATE profiles 
SET lat = 47.3520, lng = 7.9078 
WHERE LOWER(city) = 'olten' AND (lat IS NULL OR lng IS NULL);