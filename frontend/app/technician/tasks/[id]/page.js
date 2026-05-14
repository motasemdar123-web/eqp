import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { ARABIC_ACTION_TO_STATUS } from '../../../../lib/arabicMappings';

export default function TechnicianTaskDetailsPage({ params }) {
  return (
    <main dir="rtl" className="min-h-screen bg-[#f4f6f3] px-4 py-6 text-zinc-900">
      <div className="mx-auto grid max-w-3xl gap-5">
        <div>
          <p className="text-sm text-zinc-500">رقم المهمة: {params.id}</p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">تفاصيل المهمة</h1>
        </div>
        <Card className="p-5">
          <h2 className="text-xl font-bold">قائمة الفحص</h2>
          <label className="mt-4 flex items-center gap-3"><input type="checkbox" /> تم الوصول للموقع</label>
          <label className="mt-3 flex items-center gap-3"><input type="checkbox" /> تم تصوير الحالة قبل العمل</label>
          <label className="mt-3 flex items-center gap-3"><input type="checkbox" /> تم تنفيذ الإصلاح</label>
          <label className="mt-3 flex items-center gap-3"><input type="checkbox" /> تم تصوير الحالة بعد العمل</label>
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold">ملاحظات الفني</h2>
          <textarea className="mt-4 min-h-32 w-full rounded-md border border-zinc-300 p-3 text-right" placeholder="اكتب الملاحظات باللغة العربية..." />
        </Card>
        <Card className="p-5">
          <h2 className="text-xl font-bold">الإجراءات</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {Object.entries(ARABIC_ACTION_TO_STATUS).map(([label, status]) => (
              <Button key={status}>{label}</Button>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
