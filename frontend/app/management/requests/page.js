import ManagementModulePage from '../../../components/ManagementModulePage';

export default function RequestsPage() {
  return (
    <ManagementModulePage
      title="Maintenance Requests"
      description="Request intake, categorization, priority, SLA target, notes, attachments, source tracking, and lifecycle control."
      moduleKey="requests"
      columns={['Request', 'Title', 'Priority', 'Status', 'SLA']}
      actionHref="/management/scheduling"
    />
  );
}
