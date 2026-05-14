import ManagementModulePage from '../../../components/ManagementModulePage';

export default function WorkOrdersPage() {
  return (
    <ManagementModulePage
      title="Work Orders & Job Cards"
      description="Create, schedule, assign, track, and close work orders with team lead, scope, safety, tools, parts, and quality notes."
      moduleKey="workOrders"
      columns={['Work Order', 'Title', 'Priority', 'Status', 'Window']}
      actionHref="/management/scheduling"
    />
  );
}
