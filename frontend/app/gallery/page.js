'use client';

import { useState } from 'react';
import SystemShell from '../../components/SystemShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const screens = [
  {
    cat: 'operations',
    title: 'Operations Command Center',
    route: '/management',
    img: '/screenshots/01_command_center.png',
    desc: 'High-density operational cockpit with 56px unified Health Bar and above-the-fold Work Orders table.'
  },
  {
    cat: 'operations',
    title: 'Dispatch & Scheduling Timeline',
    route: '/management/scheduling',
    img: '/screenshots/02_dispatch_scheduling_timeline.png',
    desc: '24-hour visual scheduling board with technician assignment rows and collision detection.'
  },
  {
    cat: 'operations',
    title: 'Work Order Creation & Shift Presets Drawer',
    route: '/management/scheduling',
    img: '/screenshots/03_dispatch_scheduling_drawer.png',
    desc: 'Compact 2-column slide-over drawer with 1-click Morning / Evening shift presets and searchable technician picker.'
  },
  {
    cat: 'operations',
    title: 'Emergency Order PDX Dispatcher',
    route: '/management/parts-inquiry',
    img: '/screenshots/04_parts_inquiry_eo_dispatcher.png',
    desc: '35%/65% desktop split-pane layout for simultaneous part matching and live Komatsu PDX dispatch queue.'
  },
  {
    cat: 'operations',
    title: 'Quotation to Sales Order Converter',
    route: '/management/parts-inquiry',
    img: '/screenshots/05_parts_inquiry_so_converter.png',
    desc: 'Batch conversion and confirmation interface for in-process Komatsu quotations.'
  },
  {
    cat: 'operations',
    title: 'Stock & Price Batch Inquiry',
    route: '/management/parts-inquiry',
    img: '/screenshots/06_parts_inquiry_bulk_stock.png',
    desc: 'Live multi-part inventory & price query engine connecting to Komatsu Middle East PDX master warehouse.'
  },
  {
    cat: 'governance',
    title: 'Greasing Compliance Matrix',
    route: '/management/fleet-analytics',
    img: '/screenshots/07_fleet_analytics_greasing.png',
    desc: '123-machine monthly greasing matrix, active site deployments (Desire, Sabah, Tricon, Salmi), and machine health stats.'
  },
  {
    cat: 'governance',
    title: 'Component Lifecycle & Rotations',
    route: '/management/fleet-analytics',
    img: '/screenshots/08_fleet_analytics_components.png',
    desc: 'Heavy machinery critical component tracking (D155A-6 fan pumps, hydraulic cylinders, torque converters).'
  },
  {
    cat: 'governance',
    title: 'Staff & Technicians Roster',
    route: '/management/technicians',
    img: '/screenshots/09_technicians_roster.png',
    desc: 'Active workforce directory, duty status, shift rosters, region assignments, and skill matrices.'
  },
  {
    cat: 'governance',
    title: 'Workshop Fleet & Maintenance Countdowns',
    route: '/management/workshop',
    img: '/screenshots/10_workshop_fleet.png',
    desc: 'Service vehicles 5,000 km PM countdowns, fuel allocation ledgers, and battery warranty tracker.'
  },
  {
    cat: 'governance',
    title: 'Master Sheets Database Hub',
    route: '/management/sheets-hub',
    img: '/screenshots/11_sheets_hub.png',
    desc: '34 enterprise Google Sheets catalog with live explorer and fast full-text filter.'
  },
  {
    cat: 'governance',
    title: 'Daily Schedule Planner',
    route: '/management/daily-planner',
    img: '/screenshots/12_daily_planner.png',
    desc: 'Engineering day planner with time-blocking, duration estimation, and supervisor dispatch sync.'
  },
  {
    cat: 'eqp',
    title: 'EQP PM Hub Overview',
    route: '/eqp',
    img: '/screenshots/13_eqp_hub_overview.png',
    desc: 'Central compliance overview with standardized EqpNav sub-navigation and fleet SMR distributions.'
  },
  {
    cat: 'eqp',
    title: 'Komatsu PM Report Builder',
    route: '/eqp/generate-reports',
    img: '/screenshots/14_eqp_report_builder.png',
    desc: 'Batch generation wizard with pre-filled date workflows, interval selector, and auto-signatures.'
  },
  {
    cat: 'eqp',
    title: 'Certified PDF Archive & Vault',
    route: '/eqp/reports',
    img: '/screenshots/15_eqp_reports_archive.png',
    desc: 'Permanent archive of generated inspection PDFs, sequential file numbering, and batch ZIP export.'
  },
  {
    cat: 'eqp',
    title: 'Machinery Asset Register',
    route: '/eqp/machines',
    img: '/screenshots/16_eqp_machines_register.png',
    desc: 'Tracked fleet assets database, engine serial numbers, customer accounts, and SMR operating meters.'
  },
  {
    cat: 'eqp',
    title: 'Machine Lifecycle Tracker',
    route: '/eqp/lifecycle',
    img: '/screenshots/17_eqp_lifecycle_tracker.png',
    desc: 'Factory delivery milestone progression, service interval completion rates, and monthly gap verification.'
  },
  {
    cat: 'eqp',
    title: 'Inspection Commentary Pool',
    route: '/eqp/comments',
    img: '/screenshots/18_eqp_comments_pool.png',
    desc: 'Standardized library of weighted inspection remarks and service findings picked during PDF generation.'
  },
  {
    cat: 'technician',
    title: 'Mobile Technician (Standard Arabic RTL)',
    route: '/technician',
    img: '/screenshots/19_technician_mobile_standard.png',
    desc: 'Native Arabic RTL interface, voice recording memos, camera upload, checklist touch targets, and offline sync.'
  },
  {
    cat: 'technician',
    title: 'Mobile Technician (Outdoor / High-Contrast)',
    route: '/technician',
    img: '/screenshots/20_technician_mobile_outdoor.png',
    desc: 'Maximum contrast solid #000000/#FFFFFF theme with 48px+ touch targets for direct desert sunlight conditions.'
  },
  {
    cat: 'tools',
    title: 'Engineering Collaborative Canvas',
    route: '/workspace',
    img: '/screenshots/21_engineering_canvas.png',
    desc: 'Infinite whiteboard workspace for mechanical troubleshooting, hydraulic schematics, and root cause analysis.'
  },
  {
    cat: 'tools',
    title: 'Media Production Studio',
    route: '/media',
    img: '/screenshots/22_media_studio.png',
    desc: 'Monthly content calendar, multi-platform copy generation, and videographer shoot sheets.'
  },
  {
    cat: 'tools',
    title: 'Technical Japanese Learning Dojo',
    route: '/japanese',
    img: '/screenshots/23_japanese_dojo.png',
    desc: 'Komatsu technical Japanese terminology, JLPT N3/N2 exam simulator, and parts explorer.'
  },
  {
    cat: 'tools',
    title: 'Document Certificate Verification Portal',
    route: '/verify',
    img: '/screenshots/24_verify_portal.png',
    desc: 'Public-facing digital certificate and PDF report validation endpoint.'
  }
];

export default function GalleryPage() {
  const [filter, setFilter] = useState('all');
  const [activeModalImg, setActiveModalImg] = useState(null);

  const filtered = filter === 'all' ? screens : screens.filter((s) => s.cat === filter);

  return (
    <SystemShell
      activePath="/gallery"
      eyebrow="System QA Showcase"
      title="UI Screen Verification Gallery"
      description="Visual verification catalog covering all 24 rendered production screens across the Dar Al Hai platform."
      actions={
        <Badge tone="live" size="sm">
          24 Screens Captured
        </Badge>
      }
    >
      <div className="space-y-6">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-lg border border-slate-200/80 w-fit">
          {[
            { id: 'all', label: 'All Screens (24)' },
            { id: 'operations', label: 'Core Operations & Dispatch (6)' },
            { id: 'governance', label: 'Fleet & Governance (6)' },
            { id: 'eqp', label: 'EQP Compliance Suite (6)' },
            { id: 'technician', label: 'Mobile Technician (2)' },
            { id: 'tools', label: 'Engineering & Studio Tools (4)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Screens Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s, idx) => (
            <Card key={s.img} className="flex flex-col overflow-hidden hover:border-amber-400 transition-colors">
              <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-900 truncate">{s.title}</span>
                <span className="text-[10px] font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                  {s.route}
                </span>
              </div>
              <div
                className="bg-slate-900 relative cursor-pointer group overflow-hidden flex items-center justify-center"
                style={{ minHeight: s.cat === 'technician' ? '380px' : '220px' }}
                onClick={() => setActiveModalImg(s)}
              >
                <img
                  src={s.img}
                  alt={s.title}
                  className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-200"
                  style={{ maxHeight: s.cat === 'technician' ? '380px' : '220px' }}
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/95 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-md shadow-md">
                    Click to Enlarge
                  </span>
                </div>
              </div>
              <div className="p-3 text-xs text-slate-600 bg-white grow flex items-center">
                {s.desc}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Zoom */}
      {activeModalImg && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setActiveModalImg(null)}
        >
          <div
            className="relative max-w-7xl max-h-[95vh] bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold">{activeModalImg.title}</h3>
                <p className="text-xs text-slate-400 font-mono">{activeModalImg.route}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalImg(null)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-red-600 text-white transition-colors cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="overflow-auto max-h-[85vh] bg-slate-950 p-2 flex justify-center">
              <img
                src={activeModalImg.img}
                alt={activeModalImg.title}
                className="max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </SystemShell>
  );
}
