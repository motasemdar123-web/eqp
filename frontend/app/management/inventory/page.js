import ManagementModulePage from '../../../components/ManagementModulePage';

export default function InventoryPage() {
  return (
    <ManagementModulePage
      title="Inventory & Spare Parts"
      description="Spare part catalog, stock levels, reorder thresholds, issue and return logs, suppliers, purchase triggers, and work order usage."
      moduleKey="inventory"
      columns={['SKU', 'Item', 'Unit', 'Stock', 'Reorder']}
      actionHref="/management/scheduling"
    />
  );
}
