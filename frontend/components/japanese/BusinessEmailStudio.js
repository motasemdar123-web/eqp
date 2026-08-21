'use client';

import { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import {
  BUSINESS_EMAIL_TEMPLATES,
  KEIGO_TRANSFORMATION_MATRIX
} from '../../lib/japanese/businessEmailData';

function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}

export default function BusinessEmailStudio({ onToast }) {
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'keigo_matrix'
  const [selectedTemplate, setSelectedTemplate] = useState(BUSINESS_EMAIL_TEMPLATES[0]);
  const [params, setParams] = useState(BUSINESS_EMAIL_TEMPLATES[0].defaultParams);
  const [keigoSearch, setKeigoSearch] = useState('');

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setParams(tpl.defaultParams);
  };

  const handleParamChange = (field, value) => {
    setParams((prev) => ({ ...prev, [field]: value }));
  };

  const generatedSubject = selectedTemplate.generateSubject(params);
  const generatedBody = selectedTemplate.generateBody(params);

  const handleCopyEmail = () => {
    const fullText = `Subject: ${generatedSubject}\n\n${generatedBody}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullText);
      onToast?.('📋 Business email copied to clipboard!', 'success');
    }
  };

  const filteredKeigo = KEIGO_TRANSFORMATION_MATRIX.filter((k) => {
    const q = keigoSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      k.meaning.toLowerCase().includes(q) ||
      k.plain.toLowerCase().includes(q) ||
      k.teineigo.toLowerCase().includes(q) ||
      k.kenjougo.toLowerCase().includes(q) ||
      k.sonkeigo.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-9xl font-bold font-mono">
          メール
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Komatsu Business Japanese Studio
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-2.5 py-1 rounded-full">
              敬語工房・ビジネスメール
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Komatsu Partner Business Email & Keigo Studio
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Generate formal Japanese business emails for urgent parts inquiries, warranty submissions, and technical assistance. Convert plain speech into flawless Humble (謙譲語) and Respectful (尊敬語) Keigo.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant={activeTab === 'generator' ? 'primary' : 'outline'}
              className={activeTab === 'generator' ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold' : 'text-white border-slate-600'}
              onClick={() => setActiveTab('generator')}
            >
              ✉️ Business Email Generator
            </Button>
            <Button
              variant={activeTab === 'keigo_matrix' ? 'primary' : 'outline'}
              className={activeTab === 'keigo_matrix' ? 'bg-blue-600 hover:bg-blue-700 text-white font-bold' : 'text-white border-slate-600'}
              onClick={() => setActiveTab('keigo_matrix')}
            >
              📊 Keigo Transformation Matrix (敬語変換表)
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Template Selection & Inputs (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Template Selector Cards */}
            <Card className="p-4 space-y-3 border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Select Communication Template
              </span>
              <div className="space-y-2">
                {BUSINESS_EMAIL_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      selectedTemplate.id === tpl.id
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{tpl.title}</span>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{tpl.description}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Custom Parameters Form */}
            <Card className="p-5 space-y-3.5 border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block border-b pb-2">
                ⚙️ Customize Email Parameters
              </span>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Recipient Organization</label>
                  <input
                    type="text"
                    value={params.recipientCompany}
                    onChange={(e) => handleParamChange('recipientCompany', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Machine Model</label>
                    <input
                      type="text"
                      value={params.machineModel}
                      onChange={(e) => handleParamChange('machineModel', e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Serial / Order No</label>
                    <input
                      type="text"
                      value={params.orderNumber}
                      onChange={(e) => handleParamChange('orderNumber', e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Part Number & Details</label>
                  <input
                    type="text"
                    value={params.partNumber}
                    onChange={(e) => handleParamChange('partNumber', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-amber-700 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity / Scope</label>
                  <input
                    type="text"
                    value={params.quantity}
                    onChange={(e) => handleParamChange('quantity', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Urgency / Failure Reason</label>
                  <textarea
                    rows={2}
                    value={params.urgencyReason}
                    onChange={(e) => handleParamChange('urgencyReason', e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium resize-none"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Generated Email Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-6 space-y-4 border-slate-200 shadow-sm bg-white">
              {/* Header action bar */}
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Ready to Send (完成)
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">Formal Japanese Keigo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-slate-700 border-slate-300 hover:bg-slate-50"
                    onClick={() => speak(generatedBody)}
                  >
                    🔊 Read Aloud
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                    onClick={handleCopyEmail}
                  >
                    📋 Copy Email
                  </Button>
                </div>
              </div>

              {/* Subject Line */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">件名 (Subject Line)</span>
                <p className="text-sm font-black text-slate-900 font-mono">{generatedSubject}</p>
              </div>

              {/* Email Body */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">本文 (Email Body)</span>
                <pre className="text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200 max-h-[500px] overflow-y-auto">
                  {generatedBody}
                </pre>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* KEIGO TRANSFORMATION MATRIX */
        <Card className="p-6 space-y-6 border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Keigo Transformation Matrix (敬語変換マトリックス)
              </h3>
              <p className="text-xs text-slate-500">
                Master the differences between Plain (普通), Polite (丁寧語), Humble (謙譲語 - for your actions), and Respectful (尊敬語 - for partner actions).
              </p>
            </div>
            <input
              type="text"
              placeholder="Filter verbs (e.g. する, see, say)..."
              value={keigoSearch}
              onChange={(e) => setKeigoSearch(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b">
                  <th className="p-3 font-black">Action / Meaning</th>
                  <th className="p-3 font-bold text-slate-500">Plain (普通語)</th>
                  <th className="p-3 font-bold text-blue-700">Polite (丁寧語)</th>
                  <th className="p-3 font-bold text-amber-700">Humble (謙譲語 - Me)</th>
                  <th className="p-3 font-bold text-purple-700">Respectful (尊敬語 - You)</th>
                  <th className="p-3 font-bold text-slate-600">Business Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredKeigo.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-black text-slate-900">{row.meaning}</td>
                    <td className="p-3 font-mono text-slate-600">{row.plain}</td>
                    <td className="p-3 font-bold text-blue-800 bg-blue-50/30">{row.teineigo}</td>
                    <td className="p-3 font-bold text-amber-900 bg-amber-50/40">{row.kenjougo}</td>
                    <td className="p-3 font-bold text-purple-900 bg-purple-50/30">{row.sonkeigo}</td>
                    <td className="p-3 text-slate-700 italic flex items-center justify-between gap-2">
                      <span>{row.businessExample}</span>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="p-1 h-auto text-slate-400 hover:text-amber-600"
                        onClick={() => speak(row.businessExample)}
                      >
                        🔊
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
