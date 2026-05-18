export default function manifest() {
  return {
    name: 'تطبيق فني دار الحي',
    short_name: 'فني دار الحي',
    description: 'جدول الفني اليومي وإنهاء المهام',
    start_url: '/technician',
    scope: '/',
    display: 'standalone',
    background_color: '#edf1ea',
    theme_color: '#facc15',
    icons: [
      {
        src: '/dh-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
