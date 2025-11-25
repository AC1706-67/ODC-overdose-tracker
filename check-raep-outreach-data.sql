-- Quick check: Does RAEP have outreach logs?
SELECT 
  ol.id,
  ol.outreach_date,
  ol.zip_code,
  ol.kit_types,
  ol.num_kits,
  ol.people_reached,
  ol.males_reached,
  ol.females_reached,
  ol.created_at,
  o.name as org_name,
  o.slug as org_slug,
  o.outreach_enabled
FROM outreach_logs ol
JOIN organizations o ON o.id = ol.organization_id
WHERE o.slug = 'raep'
ORDER BY ol.outreach_date DESC, ol.created_at DESC
LIMIT 10;

-- If empty, check if ANY outreach logs exist
SELECT COUNT(*) as total_outreach_logs FROM outreach_logs;

-- Check RAEP org settings
SELECT 
  id,
  name,
  slug,
  outreach_enabled,
  is_active,
  is_certified
FROM organizations
WHERE slug = 'raep';
