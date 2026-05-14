import Link from 'next/link';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import { PRIORITY_LABELS_AR, TECHNICIAN_STATUS_LABELS } from '../../../lib/arabicMappings';

const tasks = [
  {
    id: 'wo-1001',
    title: 'فحص وإصلاح وحدة التكييف',
    status: 'ASSIGNED',
    priority: 'HIGH',
    window: '09:00 - 11:00',
    location: 'المبنى الإداري - الدور الثاني',
    scope: 'فحص التبريد، تنظيف الفلاتر، والتأكد من رجوع الوحدة للعمل الطبيعي.',
  },
  {
    id: 'wo-1002',
    title: 'فحص ضغط مضخة المياه',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    window: '10:30 - 12:00',
    location: 'غرفة المضخات',
    scope: 'قياس الضغط، فحص الصمامات، وتسجيل الملاحظات.',
  },
  {
    id: 'wo-1003',
    title: 'فحص لوحة الكهرباء الوقائي',
    status: 'ASSIGNED',
    priority: 'HIGH',
    window: '13:00 - 15:00',
    location: 'غرفة الكهرباء - الدور الثاني',
    scope: 'فحص الأحمال، شد نقاط التوصيل، وتوثيق القراءات الحرارية.',
  },
];

export default function TechnicianTasksPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#edf1ea] px-4 py-6 text-zinc-900">
      <div className="mx-auto grid max-w-4xl gap-5">
        <header className="rounded-lg bg-zinc-950 p-6 text-white shadow-xl shadow-zinc-950/10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">Dar Al HAI</p>
          <h1 className="mt-2 text-3xl font-black">مهامي اليوم</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-300">واجهة ميدانية عربية للجوب كارد، بدء العمل، الملاحظات، الصور، والإغلاق.</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="مهام اليوم" value={tasks.length} />
          <Stat label="قيد التنفيذ" value={tasks.filter((task) => task.status === 'IN_PROGRESS').length} />
          <Stat label="أولوية عالية" value={tasks.filter((task) => task.priority === 'HIGH').length} />
        </div>

        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs text-zinc-500">{task.id.toUpperCase()}</p>
                  <h2 className="mt-1 text-xl font-bold text-zinc-950">{task.title}</h2>
                  <p className="mt-2 text-sm text-zinc-600">{task.location}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={task.priority === 'HIGH' ? 'red' : 'yellow'}>{PRIORITY_LABELS_AR[task.priority]}</Badge>
                  <Badge tone={task.status === 'IN_PROGRESS' ? 'green' : 'yellow'}>{TECHNICIAN_STATUS_LABELS[task.status]}</Badge>
                </div>
              </div>
              <div className="mt-4 rounded-md bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-800">الوقت: {task.window}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{task.scope}</p>
              </div>
              <Link href={`/technician/tasks/${task.id}`} className="mt-5 inline-flex rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-yellow-300">
                فتح الجوب كارد
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-zinc-950">{value}</p>
    </Card>
  );
}
