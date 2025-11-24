-- Fix delete_storage_object trigger für photos Tabelle
-- Der Trigger versucht auf OLD.url zuzugreifen, aber das Feld heißt storage_path
CREATE OR REPLACE FUNCTION delete_storage_object()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM storage.objects 
  WHERE bucket_id = 'profile-photos' 
  AND name = OLD.storage_path;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix update_updated_at_column trigger
-- Die Funktion sollte nur auf Tabellen mit updated_at Feld angewendet werden
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Prüfe ob updated_at Spalte existiert
  IF TG_OP = 'UPDATE' AND to_regclass(TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME) IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = TG_TABLE_SCHEMA 
      AND table_name = TG_TABLE_NAME 
      AND column_name = 'updated_at'
    ) THEN
      NEW.updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;