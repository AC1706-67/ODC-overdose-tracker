export type Org = {
  id?: string;
  slug?: string;
  name?: string;
  outreach_enabled?: boolean;
  features?: Record<string, any>;
};

// Normalize strings: trim and lowercase
function norm(s?: string) {
  return (s ?? '').trim().toLowerCase();
}

// Canonical Recovery Alliance of El Paso org ID
const CANON_RAEP_ID = '6e892800-0429-442f-bff8-417b4d4ec793';

export function canUseOutreach(org?: Org | null) {
  if (!org) return false;

  // 1) Explicit DB flags win
  if (org.outreach_enabled === true) return true;
  if (org.features?.outreach === true) return true;

  // 2) Canonical RAEP org id
  if (org.id === CANON_RAEP_ID) return true;

  // 3) Fallback: known slugs/names (normalized)
  const allowedSlugs = new Set([
    'recovery-alliance-el-paso',
    'recovery-alliance-of-el-paso',
    'recovery-alliance', // keep if you still use it
  ]);
  
  const allowedNames = new Set([
    'recovery alliance of el paso',
    'recovery alliance',
  ]);

  return allowedSlugs.has(norm(org.slug)) || allowedNames.has(norm(org.name));
}
