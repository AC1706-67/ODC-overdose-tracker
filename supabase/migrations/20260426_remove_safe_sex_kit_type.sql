/*
  # Remove 'Safe Sex' from kit_type allowed values

  Updates the CHECK constraint on the distributions table to remove
  'Safe Sex' as an allowed kit_type value.

  Allowed values after this migration:
    - Narcan
    - Feminine Hygiene
    - Hygiene
    - Wound Care
*/

ALTER TABLE distributions
  DROP CONSTRAINT IF EXISTS distributions_kit_type_check;

ALTER TABLE distributions
  ADD CONSTRAINT distributions_kit_type_check
  CHECK (kit_type IN ('Narcan', 'Feminine Hygiene', 'Hygiene', 'Wound Care'));
