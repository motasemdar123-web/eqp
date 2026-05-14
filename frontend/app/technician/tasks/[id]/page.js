import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import Badge from '../../../../components/ui/Badge';
import { ARABIC_ACTION_TO_STATUS } from '../../../../lib/arabicMappings';

export default async function TechnicianTaskDetailsPage({ params }) {
  const { id } = await params;

  return (
    <main dir="rtl" className="min-h-screen bg-[#edf1ea] px-4 py-6 text-zinc-900">
      <div className="mx-auto grid max-w-4xl gap-5">
        <header className="rounded-lg bg-zinc-950 p-6 text-white shadow-xl shadow-zinc-950/10">
          <p className="font-mono text-sm text-yellow-300">رقم المهمة: {id}</p>
          <h1 className="mt-2 text-3xl font-black">تفاصيل الجوب كارد</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-300">اتبع خطوات السلامة، وثق الصور والملاحظات، ثم أغلق المهمة عند الانتهاء.</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-950">نطاق العمل</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  فحص المعدة، تأكيد سبب العطل، تنفيذ الإصلاح المطلوب، تسجيل القراءات، وإضافة ملاحظات الإغلاق.
                </p>
              </div>
              <Badge tone="yellow">مجدولة</Badge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Info label="الوقت" value="09:00 - 11:00" />
              <Info label="الأولوية" value="عالية" />
              <Info label="الموقع" value="المبنى الإداري - الدور الثاني" />
              <Info label="قائد الفريق" value="Motasem Ghanem" />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-xl font-bold text-zinc-950">السلامة والأدوات</h2>
            <div className="mt-4 grid gap-3 text-sm text-zinc-700">
              <p className="rounded-md bg-red-50 p-3 font-semibold text-red-700">افصل مصدر الكهرباء قبل فتح المعدة.</p>
              <p className="rounded-md bg-zinc-50 p-3">الأدوات: ملتيميتر، عدة يدوية، فلاتر احتياطية.</p>
              <p className="rounded-md bg-zinc-50 p-3">التصريح: مطلوب إذا كان العمل على السطح.</p>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-xl font-bold text-zinc-950">قائمة الفحص</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {['تم الوصول للموقع', 'تم تصوير الحالة قبل العمل', 'تم تنفيذ الإصلاح', 'تم تصوير الحالة بعد العمل', 'تم تنظيف منطقة العمل', 'تم إبلاغ المشرف'].map((item) => (
              <label key={item} className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3 text-sm font-semibold text-zinc-700">
                <input type="checkbox" />
                {item}
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-bold text-zinc-950">ملاحظات الفني</h2>
          <textarea className="mt-4 min-h-32 w-full rounded-md border border-zinc-300 p-3 text-right outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100" placeholder="اكتب الملاحظات باللغة العربية..." />
        </Card>

        <Card className="p-5">
          <h2 className="text-xl font-bold text-zinc-950">الإجراءات</h2>
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

function Info({ label, value }) {
  return (
    <div className="rounded-md bg-zinc-50 p-3">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 font-bold text-zinc-950">{value}</p>
    </div>
  );
}
