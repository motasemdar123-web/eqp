export default function manifest() {
  return {
    name: 'Dar Al HAI Technician',
    short_name: 'DH Tech',
    description: 'Daily technician schedule and task completion app',
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
