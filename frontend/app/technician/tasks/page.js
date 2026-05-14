import Link from 'next/link';
import Badge from '../../../components/ui/Badge';
import Card from '../../../components/ui/Card';
import { PRIORITY_LABELS_AR, TECHNICIAN_STATUS_LABELS } from '../../../lib/arabicMappings';

const tasks = [
  { id: 'wo-1001', title: 'فحص وحدة التكييف', status: 'ASSIGNED', priority: 'HIGH', location: 'المبنى الإداري - الدور الثاني' },
  { id: 'wo-1002', title: 'إصلاح تسريب مياه', status: 'IN_PROGRESS', priority: 'CRITICAL', location: 'الممر الخدمي' },
];

export default function TechnicianTasksPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f4f6f3] px-4 py-6 text-zinc-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-black text-zinc-950">مهامي اليوم</h1>
        <p className="mt-2 text-sm text-zinc-500">واجهة جاهزة للعمل دون اتصال ومزامنة لاحقة.</p>
        <div className="mt-6 grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-950">{task.title}</h2>
                  <p className="mt-2 text-sm text-zinc-600">{task.location}</p>
                </div>
                <Badge tone={task.priority === 'CRITICAL' ? 'red' : 'yellow'}>{PRIORITY_LABELS_AR[task.priority]}</Badge>
              </div>
              <p className="mt-4 text-sm font-semibold text-zinc-700">الحالة: {TECHNICIAN_STATUS_LABELS[task.status]}</p>
              <Link href={`/technician/tasks/${task.id}`} className="mt-5 inline-flex rounded-md bg-yellow-400 px-4 py-2 text-sm font-semibold text-zinc-950">
                فتح المهمة
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
