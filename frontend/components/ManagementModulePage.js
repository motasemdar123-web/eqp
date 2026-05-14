import Link from 'next/link';
import SystemShell from './SystemShell';
import Card from './ui/Card';
import Badge from './ui/Badge';

const sampleRows = {
  requests: [
    ['REQ-20260514-1001', 'AC not cooling - Admin Building', 'HIGH', 'ASSIGNED', '2h 15m'],
    ['REQ-20260514-1002', 'Water leak near service corridor', 'CRITICAL', 'IN_PROGRESS', '45m'],
    ['REQ-20260514-1003', 'Generator inspection request', 'MEDIUM', 'NEW', '8h'],
  ],
  workOrders: [
    ['WO-20260514-1001', 'Inspect and repair AC cooling issue', 'HIGH', 'ASSIGNED', '09:00-11:00'],
    ['JC-DAH-DEMO-1002', 'Water pump pressure inspection', 'MEDIUM', 'ASSIGNED', '10:30-12:00'],
    ['JC-DAH-DEMO-1003', 'Electrical panel preventive inspection', 'MEDIUM', 'ASSIGNED', '13:00-15:00'],
  ],
  assets: [
    ['DAH-HVAC-0001', 'Rooftop AC Unit 1', 'HVAC', 'ACTIVE', 'HQ-F2-MECH'],
    ['DAH-PUMP-0002', 'Domestic Water Pump Set', 'Pump', 'ACTIVE', 'Mechanical'],
    ['DAH-DB-0003', 'Floor Distribution Board', 'Electrical', 'ACTIVE', 'Floor 2'],
  ],
  inventory: [
    ['FILTER-24X24', 'AC Filter 24x24', 'PCS', '25', '10'],
    ['GASKET-VALVE', 'Valve Gasket Set', 'SET', '14', '6'],
    ['LUG-25MM', 'Cable Lug 25mm', 'PCS', '80', '20'],
  ],
};

const modulePaths = {
  requests: '/management/requests',
  workOrders: '/management/work-orders',
  assets: '/management/assets',
  inventory: '/management/inventory',
};

export default function ManagementModulePage({ title, description, moduleKey, columns, actionHref }) {
  const rows = sampleRows[moduleKey] || [];

  return (
    <SystemShell
      activePath={modulePaths[moduleKey] || '/management'}
      eyebrow="Dar Al HAI Operations"
      title={title}
      description={description}
      actions={actionHref ? (
        <Link href={actionHref} className="rounded-md bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-yellow-300">
          Open Workflow
        </Link>
      ) : null}
    >
      <div className="grid gap-6">

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Open', rows.length],
            ['High Priority', rows.filter((row) => row.includes('HIGH') || row.includes('CRITICAL')).length],
            ['Ready For Action', rows.length],
            ['Governed', 'Yes'],
          ].map(([label, value], index) => (
            <Card key={label} className={`p-5 ${index === 0 ? 'border-zinc-900 bg-zinc-950 text-white' : ''}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${index === 0 ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</p>
              <p className={`mt-3 text-3xl font-black ${index === 0 ? 'text-yellow-400' : 'text-zinc-950'}`}>{value}</p>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-xl font-bold text-zinc-950">Operational List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-5 py-4 text-left">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row[0]} className="border-t border-zinc-100 hover:bg-yellow-50/60">
                    {row.map((cell, index) => (
                      <td key={`${row[0]}-${index}`} className="px-5 py-4 text-sm">
                        {index === 0 ? (
                          <span className="font-mono font-semibold text-zinc-950">{cell}</span>
                        ) : ['HIGH', 'CRITICAL', 'MEDIUM', 'LOW', 'ACTIVE', 'ASSIGNED', 'IN_PROGRESS', 'NEW'].includes(cell) ? (
                          <Badge tone={cell === 'CRITICAL' ? 'red' : cell === 'ACTIVE' ? 'green' : 'yellow'}>{cell}</Badge>
                        ) : (
                          <span className="text-zinc-700">{cell}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </SystemShell>
  );
}
