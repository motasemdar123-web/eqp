import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';

const requests = [
  { no: 'REQ-20260514-1001', title: 'AC not cooling - Admin Building', priority: 'HIGH', status: 'IN_PROGRESS', sla: '2h 15m' },
  { no: 'REQ-20260514-1002', title: 'Water leak near service corridor', priority: 'CRITICAL', status: 'ASSIGNED', sla: '45m' },
  { no: 'REQ-20260514-1003', title: 'Generator inspection request', priority: 'MEDIUM', status: 'NEW', sla: '8h' },
];

export default function RequestsPage() {
  return (
    <main className="min-h-screen bg-[#f4f6f3] px-6 py-8 text-zinc-900">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-black text-zinc-950">Maintenance Requests</h1>
        <p className="mt-2 text-sm text-zinc-500">Request lifecycle, SLA, notes, attachments, and dispatch readiness.</p>
        <Card className="mt-6 overflow-hidden">
          <table className="w-full min-w-[820px]">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
              <tr>
                <th className="px-5 py-4 text-left">Request</th>
                <th className="px-5 py-4 text-left">Title</th>
                <th className="px-5 py-4 text-left">Priority</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">SLA</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.no} className="border-t border-zinc-100">
                  <td className="px-5 py-4 font-mono text-sm">{request.no}</td>
                  <td className="px-5 py-4 font-semibold text-zinc-950">{request.title}</td>
                  <td className="px-5 py-4"><Badge tone={request.priority === 'CRITICAL' ? 'red' : 'yellow'}>{request.priority}</Badge></td>
                  <td className="px-5 py-4">{request.status}</td>
                  <td className="px-5 py-4 text-zinc-600">{request.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </main>
  );
}
