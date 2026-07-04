-- Add rich metadata fields to satellite_captures from Copernicus OData API
ALTER TABLE satellite_captures ADD COLUMN product_name TEXT;
ALTER TABLE satellite_captures ADD COLUMN cloud_cover DOUBLE PRECISION;
ALTER TABLE satellite_captures ADD COLUMN product_type TEXT;
ALTER TABLE satellite_captures ADD COLUMN platform TEXT;
ALTER TABLE satellite_captures ADD COLUMN orbit_number INTEGER;
ALTER TABLE satellite_captures ADD COLUMN content_length BIGINT;
ALTER TABLE satellite_captures ADD COLUMN online BOOLEAN DEFAULT true;
ALTER TABLE satellite_captures ADD COLUMN geo_footprint JSONB;
