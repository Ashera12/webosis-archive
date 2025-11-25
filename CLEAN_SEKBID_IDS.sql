-- Audit current sekbid table (list all IDs and names)
SELECT id, name, description FROM sekbid ORDER BY id;

-- Show members referencing non-active sekbid IDs (>6)
SELECT id, name, nama, sekbid_id FROM members WHERE sekbid_id NOT IN (1,2,3,4,5,6) AND sekbid_id IS NOT NULL;

-- (Optional) Archive sekbid rows outside active range by tagging description
UPDATE sekbid SET description = COALESCE(description,'') || ' [ARCHIVED]' WHERE id NOT IN (1,2,3,4,5,6);

-- (Optional) Nullify invalid member sekbid references (preserve data integrity)
UPDATE members SET sekbid_id = NULL WHERE sekbid_id NOT IN (1,2,3,4,5,6);

-- (Optional) Permanently remove sekbid rows outside range (ONLY if confirmed not needed)
-- DELETE FROM sekbid WHERE id NOT IN (1,2,3,4,5,6);

-- Verification after cleanup
SELECT id, name, description FROM sekbid ORDER BY id;
SELECT id, name, nama, sekbid_id FROM members WHERE sekbid_id NOT IN (1,2,3,4,5,6) AND sekbid_id IS NOT NULL;
