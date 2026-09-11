'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Dialog, { DialogHeader, DialogContent, DialogFooter } from './ui/Dialog';
import {
  checkLocalSapBridge,
  checkLocalOutlookBridge,
  downloadSapBridgeZip,
  downloadOutlookBridgeZip,
  getSapBridgeDownloadUrl,
  getOutlookBridgeDownloadUrl,
} from '../lib/api';

export function BridgesStatusBadge({ onClick, className = '' }) {
  const [sapOnline, setSapOnline] = useState(null);
  const [outlookOnline, setOutlookOnline] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkAll = useCallback(async () => {
    setChecking(true);
    try {
      const [sap, outlook] = await Promise.all([
        checkLocalSapBridge(),
        checkLocalOutlookBridge(),
      ]);
      setSapOnline(Boolean(sap));
      setOutlookOnline(Boolean(outlook));
    } catch {
      setSapOnline(false);
      setOutlookOnline(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 20000);
    return () => clearInterval(interval);
  }, [checkAll]);

  const anyOnline = sapOnline || outlookOnline;
  const bothOnline = sapOnline && outlookOnline;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-xs cursor-pointer ${
        bothOnline
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20'
          : anyOnline
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 hover:bg-blue-500/20'
          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/80'
      } ${className}`}
      title="Open Local Automation Bridges (SAP B1 & Desktop Outlook)"
    >
      <span className="relative flex h-2 w-2">
        {anyOnline && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              bothOnline ? 'bg-emerald-400' : 'bg-blue-400'
            }`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            bothOnline ? 'bg-emerald-500' : anyOnline ? 'bg-blue-500' : 'bg-slate-400'
          }`}
        />
      </span>
      <span>
        {checking ? 'Checking Bridges...' : bothOnline ? 'Bridges Online' : anyOnline ? '1 Bridge Active' : 'Local Bridges'}
      </span>
      <span className="text-[10px] opacity-70 px-1 py-0.5 rounded bg-black/5 font-mono">5005 / 5008</span>
    </button>
  );
}

export default function BridgesModal({ open, onClose }) {
  const [sapStatus, setSapStatus] = useState(null);
  const [outlookStatus, setOutlookStatus] = useState(null);
  const [checkingSap, setCheckingSap] = useState(false);
  const [checkingOutlook, setCheckingOutlook] = useState(false);
  const [downloadingSap, setDownloadingSap] = useState(false);
  const [downloadingOutlook, setDownloadingOutlook] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'sap' | 'outlook'

  const checkSap = useCallback(async () => {
    setCheckingSap(true);
    try {
      const res = await checkLocalSapBridge();
      setSapStatus(res);
    } catch {
      setSapStatus(null);
    } finally {
      setCheckingSap(false);
    }
  }, []);

  const checkOutlook = useCallback(async () => {
    setCheckingOutlook(true);
    try {
      const res = await checkLocalOutlookBridge();
      setOutlookStatus(res);
    } catch {
      setOutlookStatus(null);
    } finally {
      setCheckingOutlook(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    checkSap();
    checkOutlook();
  }, [checkSap, checkOutlook]);

  useEffect(() => {
    if (open) {
      refreshAll();
    }
  }, [open, refreshAll]);

  const handleDownloadSap = async () => {
    try {
      setDownloadingSap(true);
      await downloadSapBridgeZip();
    } catch {
      window.location.href = getSapBridgeDownloadUrl();
    } finally {
      setDownloadingSap(false);
    }
  };

  const handleDownloadOutlook = async () => {
    try {
      setDownloadingOutlook(true);
      await downloadOutlookBridgeZip();
    } catch {
      window.location.href = getOutlookBridgeDownloadUrl();
    } finally {
      setDownloadingOutlook(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="max-w-3xl">
      <DialogHeader
        title="Local Automation Bridges"
        description="Local desktop companion bridges connecting Dar Al Hai web platform with on-premise SAP Business One & Desktop Outlook MAPI."
        onClose={onClose}
      />

      <DialogContent className="space-y-5">
        {/* Quick Intro Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">Automated Desktop Companions</div>
              <p className="mt-0.5 leading-relaxed text-slate-600">
                Running locally on <code className="font-mono bg-slate-200/70 px-1 py-0.5 rounded text-slate-800">127.0.0.1</code> to bridge browser actions directly into desktop applications without cloud security or tenant consent constraints.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            disabled={checkingSap || checkingOutlook}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${checkingSap || checkingOutlook ? 'animate-spin text-primary' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{checkingSap || checkingOutlook ? 'Checking...' : 'Check Both'}</span>
          </button>
        </div>

        {/* Bridges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bridge 1: SAP B1 Local Bridge */}
          <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    SAP
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">SAP B1 Local Bridge</h4>
                    <span className="text-[11px] font-mono text-slate-500">Port :5005 • Playwright</span>
                  </div>
                </div>

                <div className="flex items-center">
                  {sapStatus ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      ONLINE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      STANDBY
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Automates SAP Business One transactions directly through your browser or desktop session:
              </p>

              <ul className="text-xs space-y-1.5 text-slate-600 pl-4 list-disc">
                <li>
                  <strong className="text-slate-800">Sales Quotations:</strong> Auto-fills CardCode, selects Sales Employee (<span className="text-emerald-700 font-medium">Motasem / Mohammad</span>), inserts line items & prices.
                </li>
                <li>
                  <strong className="text-slate-800">Purchase Orders (PO):</strong> Automated batch entry for Komatsu Emergency Orders.
                </li>
                <li>
                  Runs locally on your PC via isolated headless browser automation.
                </li>
              </ul>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                <div className="font-semibold text-slate-800">Quick Launch Instructions:</div>
                <div className="text-slate-600">1. Download & extract <code className="font-mono text-slate-900 bg-white px-1 py-0.2 rounded border border-slate-200">sap-local-bridge.zip</code></div>
                <div className="text-slate-600">2. Double-click <code className="font-mono text-slate-900 bg-white px-1 py-0.2 rounded border border-slate-200">start-bridge.bat</code></div>
                <div className="text-slate-600">3. Keep SAP B1 Web Client session open</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={checkSap}
                disabled={checkingSap}
                className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 text-center"
              >
                {checkingSap ? 'Pinging...' : '🔄 Test Status'}
              </button>
              <button
                type="button"
                onClick={handleDownloadSap}
                disabled={downloadingSap}
                className="flex-2 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{downloadingSap ? 'Downloading...' : 'Download SAP Bridge (.zip)'}</span>
              </button>
            </div>
          </div>

          {/* Bridge 2: Outlook Ingestion Bridge */}
          <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-white shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                    MAPI
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Outlook Ingestion Bridge</h4>
                    <span className="text-[11px] font-mono text-slate-500">Port :5008 • MAPI COM</span>
                  </div>
                </div>

                <div className="flex items-center">
                  {outlookStatus ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      ONLINE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      STANDBY
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Reads inquiry emails from Desktop Outlook without requiring Microsoft Graph admin tenant consent:
              </p>

              <ul className="text-xs space-y-1.5 text-slate-600 pl-4 list-disc">
                <li>
                  <strong className="text-slate-800">Direct Ingestion:</strong> Connects to your active Outlook profile and monitors folder <code className="font-mono text-blue-800 bg-blue-50 px-1 py-0.2 rounded text-[10px]">Inbox\Parts Inquiries</code>.
                </li>
                <li>
                  <strong className="text-slate-800">Dual Specialist Support:</strong> Automatically attributes inquiries to <span className="text-blue-700 font-medium">Motasem Ghanem</span> or <span className="text-blue-700 font-medium">Mohammad Qraein</span>.
                </li>
                <li>
                  Extracts part numbers, quantities, and reads PDF/Excel attachments.
                </li>
              </ul>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                <div className="font-semibold text-slate-800">Quick Launch Instructions:</div>
                <div className="text-slate-600">1. Download & extract <code className="font-mono text-slate-900 bg-white px-1 py-0.2 rounded border border-slate-200">outlook-bridge.zip</code></div>
                <div className="text-slate-600">2. Double-click <code className="font-mono text-slate-900 bg-white px-1 py-0.2 rounded border border-slate-200">start-bridge.bat</code></div>
                <div className="text-slate-600">3. Ensure Desktop Outlook is open with your Dar Al Hai account</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={checkOutlook}
                disabled={checkingOutlook}
                className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 text-center"
              >
                {checkingOutlook ? 'Pinging...' : '🔄 Test Status'}
              </button>
              <button
                type="button"
                onClick={handleDownloadOutlook}
                disabled={downloadingOutlook}
                className="flex-2 py-1.5 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>{downloadingOutlook ? 'Downloading...' : 'Download Outlook Bridge (.zip)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Guidance Note for Mohammad & Remote Team */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Deployment Note for Motasem & Mohammad
          </div>
          <p className="leading-relaxed">
            Each specialist can run these bridges locally on their work laptop or desktop. When running, the EQP web app automatically connects to the local bridge to scan your personal Outlook folder and submit quotations under your SAP user profile.
          </p>
        </div>
      </DialogContent>

      <DialogFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          Close
        </button>
      </DialogFooter>
    </Dialog>
  );
}
