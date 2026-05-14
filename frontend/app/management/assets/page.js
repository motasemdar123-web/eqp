import ManagementModulePage from '../../../components/ManagementModulePage';

export default function AssetsPage() {
  return (
    <ManagementModulePage
      title="Assets"
      description="Asset register, QR readiness, serial numbers, warranty, lifecycle state, linked history, cost tracking, and service location."
      moduleKey="assets"
      columns={['Asset Code', 'Asset', 'Category', 'Status', 'Location']}
      actionHref="/management/scheduling"
    />
  );
}
