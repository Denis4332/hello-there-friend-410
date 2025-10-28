-- Fix broken city slugs by regenerating them correctly
UPDATE cities
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(name, 'ü', 'ue', 'g'),
          'ö', 'oe', 'g'),
        'ä', 'ae', 'g'),
      'é', 'e', 'g'),
    'è', 'e', 'g'),
  '[^a-z0-9]+', '-', 'g')
)
WHERE slug IS NOT NULL;