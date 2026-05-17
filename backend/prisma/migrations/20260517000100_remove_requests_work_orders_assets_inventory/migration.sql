-- Remove the retired Requests, Work Orders, Assets, and Inventory modules.
-- These tables are intentionally dropped because the product surface now keeps
-- technician administration, scheduling, and EQP reporting only.

DELETE FROM role_permissions
WHERE permission_id IN (
  SELECT id
  FROM permissions
  WHERE code IN (
    'REQUESTS_CREATE',
    'REQUESTS_READ',
    'REQUESTS_ASSIGN',
    'REQUESTS_APPROVE',
    'WORK_ORDERS_MANAGE',
    'WORK_ORDERS_CLOSE',
    'ASSETS_MANAGE',
    'INVENTORY_MANAGE'
  )
);

DELETE FROM permissions
WHERE code IN (
  'REQUESTS_CREATE',
  'REQUESTS_READ',
  'REQUESTS_ASSIGN',
  'REQUESTS_APPROVE',
  'WORK_ORDERS_MANAGE',
  'WORK_ORDERS_CLOSE',
  'ASSETS_MANAGE',
  'INVENTORY_MANAGE'
);

DROP TABLE IF EXISTS purchase_requests CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

DROP TABLE IF EXISTS work_order_assignments CASCADE;
DROP TABLE IF EXISTS checklist_responses CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS checklists CASCADE;
DROP TABLE IF EXISTS activity_timelines CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;

DROP TABLE IF EXISTS preventive_maintenance_schedules CASCADE;
DROP TABLE IF EXISTS preventive_maintenance_plans CASCADE;
DROP TABLE IF EXISTS qr_assets CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS asset_categories CASCADE;

DELETE FROM custom_fields
WHERE entity IN ('REQUEST', 'WORK_ORDER', 'ASSET');
