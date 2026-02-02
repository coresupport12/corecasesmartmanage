import React, { useState, useEffect, useMemo } from 'react';
import { CaseRecord, CaseCategory, CaseStatus, Contact } from './types';
import CaseForm from './components/CaseForm';
import CaseReport from './components/CaseReport';
import { Plus, Printer, ChevronLeft, Search, Trash2, Mail, CheckCircle, Clock, User, Phone, BookUser, X, ShieldCheck, CheckCircle2, HardHat, Download, Upload, Database, LayoutDashboard, Settings, UserPlus, LogOut, Send, Globe, AlertCircle, Loader2, RefreshCw, Cloud, CloudCheck, ExternalLink, MessageSquare, Check, RotateCcw, Link as LinkIcon, Wifi, WifiOff } from 'lucide-react';

const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Inland Choice Dental (Dr. Andrew Choi)', email: 'andrewchoidds@gmail.com', phone: '(951) 779-8862', isLab: false },
  { id: '4', name: 'Aesthetic Ceramics Inc', email: 'aestheticceramics@yahoo.co.jp', phone: '3104134685', isLab: true },
  { id: '39', name: 'Maestro Dental Studio', email: 'info@maestrodental.us', phone: '7147359600', isLab: true }
];

const DEFAULT_STAFF = ["Jenny", "Andrew", "David", "Sarah", "Technical Team"];

const App: React.FC = () => {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [staffList, setStaffList] = useState<string[]>(DEFAULT_STAFF);
  const [newStaffName, setNewStaffName] = useState('');
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [gasUrl, setGasUrl] = useState('');
  const [view, setView] = useState<'login' | 'list' | 'form' | 'report' | 'contacts' | 'settings' | 'portal'>('login');
  const [activeCase, setActiveCase] = useState<CaseRecord | null>(null);
  const [staffName, setStaffName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'all'>('all');
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  const [replyNotes, setReplyNotes] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const caseId = params.get('caseId');
    const sourceParam = params.get('source');
    
    // URL 파라미터(source)가 있으면 그것을 우선 사용 (Doctor 접속 시), 없으면 로컬 스토리지 사용 (Staff 접속 시)
    let effectiveGasUrl = localStorage.getItem('core-dental-gas-url') || '';
    
    if (sourceParam) {
      try {
        effectiveGasUrl = decodeURIComponent(sourceParam);
        // 세션 동안 사용할 URL 업데이트
        setGasUrl(effectiveGasUrl);
      } catch (e) {
        console.error("Invalid source param");
      }
    } else if (effectiveGasUrl) {
      setGasUrl(effectiveGasUrl);
    }

    if (caseId) {
      // Case ID가 있으면 로그인 화면 건너뛰고 바로 포털 모드로 진입
      setView('portal');
      loadPortalCase(caseId, effectiveGasUrl);
    } else {
      // 일반 스태프 접속 흐름
      const savedStaffName = localStorage.getItem('core-dental-active-staff');
      if (savedStaffName) {
        setStaffName(savedStaffName);
        setView('list');
        if (effectiveGasUrl) syncFromCloud(effectiveGasUrl);
      }
      
      if (effectiveGasUrl) {
        testCloudConnection(effectiveGasUrl);
      }
    }

    const savedContacts = localStorage.getItem('core-dental-contacts');
    const savedStaffList = localStorage.getItem('core-dental-staff-list');
    if (savedContacts) setContacts(JSON.parse(savedContacts));
    if (savedStaffList) setStaffList(JSON.parse(savedStaffList));
  }, []);

  const addStaff = () => {
    if (newStaffName.trim() && !staffList.includes(newStaffName.trim())) {
      setStaffList([...staffList, newStaffName.trim()]);
      setNewStaffName('');
    }
  };

  const removeStaff = (nameToRemove: string) => {
    if (confirm(`Remove ${nameToRemove} from staff list?`)) {
      setStaffList(staffList.filter(name => name !== nameToRemove));
    }
  };

  const testCloudConnection = async (url: string) => {
    try {
      const res = await fetch(url);
      if (res.ok) setCloudStatus('connected');
      else setCloudStatus('error');
    } catch {
      setCloudStatus('error');
    }
  };

  const loadPortalCase = async (id: string, url: string) => {
    if (!url) {
      console.warn("Cloud connection required for portal");
      setLoadError("Connection link is invalid or expired.");
      return;
    }
    setIsSyncing(true);
    setLoadError(null);
    try {
      const response = await fetch(`${url}?caseId=${id}`);
      const data = await response.json();
      if (data && data.id) {
        const record = {
          ...data,
          fileData: typeof data.fileData === 'string' ? JSON.parse(data.fileData) : (data.fileData || [])
        };
        setActiveCase(record);
        // view는 useEffect에서 이미 설정되지만 확실히 하기 위해
        setView('portal');
      } else {
        setLoadError("Case not found.");
      }
    } catch (err) {
      console.error("Portal Case Load Error:", err);
      setCloudStatus('error');
      setLoadError("Failed to load case data. Please check your internet connection.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('core-dental-contacts', JSON.stringify(contacts));
    localStorage.setItem('core-dental-staff-list', JSON.stringify(staffList));
    localStorage.setItem('core-dental-active-staff', staffName);
    localStorage.setItem('core-dental-gas-url', gasUrl);
  }, [contacts, staffList, staffName, gasUrl]);

  const syncFromCloud = async (overrideUrl?: string) => {
    const url = overrideUrl || gasUrl;
    if (!url) return;
    setIsSyncing(true);
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        setCases(data.map(c => ({
          ...c,
          fileData: typeof c.fileData === 'string' ? JSON.parse(c.fileData) : (c.fileData || [])
        })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setCloudStatus('connected');
      }
    } catch (err) {
      console.error("Cloud Sync Failed:", err);
      setCloudStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToCloud = async (record: CaseRecord, isNotify: boolean = false, emailData: any = {}) => {
    if (!gasUrl) return;
    try {
      const payload = { 
        ...record, 
        isNotify, 
        ...emailData,
      };
      
      await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      setCloudStatus('connected');
    } catch (err) {
      console.error("Cloud Save Failed:", err);
      setCloudStatus('error');
    }
  };

  const buildEmailPayload = (record: CaseRecord) => {
    const currentUrl = window.location.origin + window.location.pathname;
    // Doctor가 접속할 때 GAS URL 정보를 알 수 있도록 파라미터에 추가 (URL 인코딩)
    const portalLink = `${currentUrl}?caseId=${record.id}&source=${encodeURIComponent(gasUrl)}`;
    const subject = `[Design Approval Needed] Patient: ${record.patientName}`;
    
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; margin: 0 auto;">
        <div style="background: #000; padding: 30px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 20px; letter-spacing: 3px; font-weight: 900;">CORE DENTAL STUDIO</h1>
        </div>
        <div style="padding: 40px; background: #fff;">
          <p style="font-size: 16px; font-weight: 600;">Dear Doctor,</p>
          <p style="font-size: 15px; color: #475569; margin-bottom: 30px;">${(record.polishedMessage || record.rawMessage).replace(/\n/g, '<br>')}</p>
          
          <div style="text-align: center; margin-bottom: 40px;">
            <a href="${portalLink}" style="background: #2563eb; color: #ffffff; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 800; display: inline-block; font-size: 16px;">VIEW DESIGN & CONFIRM</a>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Patient Name</p>
            <p style="margin: 4px 0 0; font-size: 15px; font-weight: 800; color: #0f172a;">${record.patientName}</p>
          </div>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 40px; text-align: center;">Secure Lab-to-Clinic Communication Portal</p>
        </div>
      </div>
    `;
    return { subject, htmlBody };
  };

  const automatedNotify = async (record: CaseRecord) => {
    const targetEmail = record.isWhiteLabel ? record.partnerLabEmail : record.doctorEmail;
    if (!gasUrl) { alert("Please set your GAS URL in Settings first."); setView('settings'); return; }
    if (!targetEmail) { alert("Doctor's email is missing for this case."); return; }

    setIsSending(record.id);
    const { subject, htmlBody } = buildEmailPayload(record);
    const updatedRecord: CaseRecord = { ...record, status: 'sent' as CaseStatus };
    
    try {
      const notifyRecord = { ...updatedRecord };
      if (notifyRecord.fileData && notifyRecord.fileData.length > 2) {
          notifyRecord.fileData = notifyRecord.fileData.slice(0, 1);
      }

      await saveToCloud(notifyRecord, true, {
        email: targetEmail,
        subject,
        htmlMessage: htmlBody
      });
      setCases(prev => prev.map(c => c.id === record.id ? updatedRecord : c));
      alert(`Portal notification sent to: ${targetEmail}`);
    } catch (e) {
      console.error(e);
      alert("Failed to send notification. Please check console logs.");
    } finally {
      setIsSending(null);
    }
  };

  const handlePortalResponse = async (isApproved: boolean) => {
    if (!activeCase) return;
    setIsSyncing(true);
    const status: CaseStatus = isApproved ? 'replied' : 'pending';
    const finalRecord: CaseRecord = {
      ...activeCase,
      status,
      repliedAt: new Date().toISOString(),
      replyMessage: replyNotes || (isApproved ? 'Approved via Client Portal' : 'Modification requested via Portal')
    };
    
    try {
      await saveToCloud(finalRecord);
      setActiveCase(finalRecord);
      alert(isApproved ? "Case Approved! Lab notified." : "Modification request sent.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveCase = async (data: Partial<CaseRecord>) => {
    const newCase: CaseRecord = {
      id: activeCase?.id || Date.now().toString(),
      timestamp: data.timestamp || new Date().toISOString(),
      createdBy: staffName,
      isWhiteLabel: !!data.isWhiteLabel,
      clientName: data.clientName || 'Unknown',
      partnerLabEmail: data.partnerLabEmail,
      patientName: data.patientName || 'Unknown',
      caseNumber: data.caseNumber || '0000',
      category: data.category || CaseCategory.GENERAL_UPDATE,
      doctorEmail: data.doctorEmail || '',
      phoneNumber: data.phoneNumber || '',
      rawMessage: data.rawMessage || '',
      polishedMessage: data.polishedMessage || '',
      linkUrl: data.linkUrl || '',
      fileData: data.fileData || [],
      status: data.status || 'sent',
    };

    setCases(prev => {
      const idx = prev.findIndex(c => c.id === newCase.id);
      if (idx !== -1) return prev.map(c => c.id === newCase.id ? newCase : c);
      return [newCase, ...prev];
    });

    await saveToCloud(newCase);
    setActiveCase(newCase);
    setView('report');
  };

  const filteredCases = useMemo(() => 
    cases.filter(c => {
      const matchSearch = (c.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.caseNumber || '').includes(searchTerm);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    })
  , [cases, searchTerm, statusFilter]);

  // --- PORTAL VIEW RENDER ---
  if (view === 'portal') {
    if (loadError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-6">{loadError}</p>
          <a href="/" className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm hover:bg-gray-50 shadow-sm">Return Home</a>
        </div>
      );
    }

    if (!activeCase) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
          <p className="text-gray-900 font-black text-lg animate-pulse tracking-wide uppercase">Loading Secure Case Data...</p>
          <p className="text-gray-400 text-xs mt-2 font-medium">Connecting to Core Dental Studio Lab Server</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white pb-20 font-sans">
        <header className="bg-black text-white py-10 px-8 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl">C</div>
            <h1 className="font-black text-xl tracking-[0.3em]">CLIENT PORTAL</h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Case ID</p>
            <p className="text-lg font-black text-blue-400">{activeCase.caseNumber}</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-8 space-y-12">
          <CaseReport record={activeCase} />

          {activeCase.status !== 'replied' ? (
            <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100 shadow-xl">
              <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                <MessageSquare className="text-blue-600 w-8 h-8" />
                Review Response
              </h3>
              <textarea 
                className="w-full p-6 border-2 border-white bg-white rounded-3xl shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 min-h-[150px] mb-8 font-medium text-gray-700" 
                placeholder="Message for the laboratory (Optional)..."
                value={replyNotes}
                onChange={e => setReplyNotes(e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => handlePortalResponse(false)} className="bg-white text-gray-400 py-5 rounded-2xl font-black border-2 border-gray-100 hover:bg-gray-100 transition-all flex items-center justify-center gap-3" disabled={isSyncing}>
                  <RotateCcw className="w-6 h-6" /> REQUEST CHANGE
                </button>
                <button onClick={() => handlePortalResponse(true)} className="bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3" disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="animate-spin" /> : <Check className="w-6 h-6" />} APPROVE & PROCEED
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-600 p-12 rounded-[50px] text-center shadow-2xl">
              <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-6" />
              <h3 className="text-3xl font-black text-white mb-2">CASE APPROVED</h3>
              <p className="text-green-100 font-bold">The laboratory team is now processing your case for final production.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  if (view === 'login') {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[56px] shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] mx-auto mb-10 flex items-center justify-center text-white text-4xl font-black">C</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-4 uppercase">Core Station</h1>
          <div className="flex justify-between items-center mb-6 px-2">
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Select Profile</p>
            <button onClick={() => setIsEditingStaff(!isEditingStaff)} className="text-xs font-bold text-blue-500 hover:text-blue-700">
              {isEditingStaff ? 'Done' : 'Edit List'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar mb-4">
            {staffList.map(name => (
              <div key={name} className="relative group">
                <button 
                  onClick={() => { setStaffName(name); setView('list'); syncFromCloud(); }} 
                  className="w-full p-5 border-2 border-gray-50 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all font-black text-gray-800 flex items-center justify-between group"
                >
                  <span>{name}</span>
                  {!isEditingStaff && <ChevronLeft className="w-5 h-5 rotate-180 text-gray-200 group-hover:text-blue-500" />}
                </button>
                {isEditingStaff && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeStaff(name); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isEditingStaff && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
              <input 
                type="text" 
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                placeholder="New Staff Name"
                value={newStaffName}
                onChange={e => setNewStaffName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addStaff()}
              />
              <button onClick={addStaff} className="bg-black text-white px-4 rounded-xl hover:bg-gray-800 transition-all">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN APP VIEW ---
  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20 font-sans">
      <nav className="no-print bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50 h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setView('list'); syncFromCloud(); }}>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-lg group-hover:scale-105 transition-transform">C</div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-gray-900 uppercase leading-none">Core Dental</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${cloudStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">{cloudStatus === 'connected' ? 'Synced' : 'Offline'}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => syncFromCloud()} className={`p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw className="w-5 h-5 text-gray-400" /></button>
            <button onClick={() => setView('settings')} className={`p-3 rounded-xl transition-all ${cloudStatus === 'error' ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}><Settings className="w-5 h-5" /></button>
            <button onClick={() => { setActiveCase(null); setView('form'); }} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg font-black text-sm">
              <Plus className="w-5 h-5" /> NEW CASE
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        {view === 'list' && (
          <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100"><LayoutDashboard className="w-8 h-8 text-gray-900" /></div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Case Dashboard</h2>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="Search Patients..." className="w-full pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl outline-none shadow-sm font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <select className="bg-white px-5 py-3.5 border border-gray-100 rounded-2xl outline-none font-black text-gray-600 shadow-sm text-xs" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                  <option value="all">ALL</option>
                  <option value="sent">SENT</option>
                  <option value="replied">CONFIRMED</option>
                  <option value="pending">MODIF</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCases.map(c => (
                <div key={c.id} onClick={() => { setActiveCase(c); setView('report'); }} className={`bg-white p-8 rounded-[40px] border transition-all cursor-pointer group relative overflow-hidden flex flex-col min-h-[350px] ${c.status === 'replied' ? 'border-green-200 shadow-xl' : 'border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2'}`}>
                  {c.status === 'replied' && (
                    <div className="absolute top-6 right-6 bg-green-500 text-white p-1.5 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>
                  )}
                  <div className="flex gap-2 mb-6">
                    <span className="text-[9px] font-black px-3 py-1.5 bg-gray-50 rounded-lg uppercase text-gray-400 tracking-widest">{c.category}</span>
                    <span className="text-[9px] font-black px-3 py-1.5 bg-blue-50 rounded-lg uppercase text-blue-600 tracking-widest">{c.createdBy}</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{c.patientName}</h3>
                  <p className="text-blue-500 font-black text-xs tracking-widest mb-6 uppercase">ID: {c.caseNumber}</p>
                  
                  {c.replyMessage && (
                    <div className={`mb-auto p-4 rounded-2xl border-2 border-dashed ${c.status === 'replied' ? 'bg-green-50/50 border-green-100 text-green-900' : 'bg-amber-50/50 border-amber-100 text-amber-900'}`}>
                       <p className="text-[9px] font-black uppercase mb-2 opacity-50">Latest Response</p>
                       <p className="text-xs font-bold italic line-clamp-3">"{c.replyMessage}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-6">
                    <div className="flex gap-2">
                       <button onClick={(e) => { e.stopPropagation(); setIsConfirming(c.id); }} className={`p-4 rounded-xl transition-all ${c.status === 'replied' ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400 hover:text-green-600'}`}><CheckCircle2 className="w-5 h-5" /></button>
                       <button onClick={(e) => { e.stopPropagation(); automatedNotify(c); }} className={`p-4 rounded-xl transition-all ${isSending === c.id ? 'bg-blue-100 text-blue-600' : 'bg-blue-600 text-white hover:bg-black'}`} disabled={isSending !== null}>
                         {isSending === c.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                       </button>
                    </div>
                    <div className="flex -space-x-3">
                      {c.fileData?.slice(0, 3).map((img, i) => (
                        <img key={i} src={img} className="w-10 h-10 rounded-xl border-2 border-white object-cover bg-gray-100 shadow-sm" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Settings</h2>
            
            <div className="bg-white p-10 rounded-[48px] border border-blue-50 shadow-2xl">
              <div className="flex items-center gap-6 mb-10">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-lg">
                  <Globe className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Cloud Sync (GAS)</h3>
                  <p className="text-gray-500 font-bold text-sm">Connect to Google Sheets & Email Service</p>
                </div>
              </div>
              <div className="space-y-6">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Web App URL</label>
                <div className="flex gap-3">
                  <input type="url" className="flex-1 px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold" placeholder="https://script.google.com/macros/s/..." value={gasUrl} onChange={e => setGasUrl(e.target.value)} />
                  {gasUrl && <button onClick={() => syncFromCloud()} className="bg-green-600 text-white px-6 rounded-2xl flex items-center hover:bg-green-700 transition-all"><RefreshCw className={`w-6 h-6 ${isSyncing ? 'animate-spin' : ''}`} /></button>}
                </div>
                <div className="bg-blue-50 p-6 rounded-3xl flex gap-4 items-start">
                  <ExternalLink className="w-6 h-6 text-blue-500 shrink-0 mt-1" />
                  <div className="space-y-2">
                    <p className="text-sm text-blue-900 font-black">Quick Setup Guide</p>
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      1. Deploy GAS as 'Web App'.<br/>
                      2. Set access to 'Anyone'.<br/>
                      3. Authorize Google Account once.<br/>
                      4. Paste URL here and Sync.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl flex flex-col justify-center text-center">
               <LogOut className="w-12 h-12 text-gray-200 mx-auto mb-6" />
               <button onClick={() => { setStaffName(''); setView('login'); }} className="bg-gray-900 text-white py-5 rounded-3xl font-black hover:bg-black transition-all">Logout Session</button>
            </div>
          </div>
        )}

        {view === 'form' && (
          <div className="animate-in fade-in slide-in-from-bottom-12">
            <button onClick={() => setView('list')} className="flex items-center gap-3 text-gray-400 hover:text-gray-900 mb-10 font-black text-xs uppercase tracking-widest"><ChevronLeft className="w-6 h-6" /> Back</button>
            <CaseForm onSave={handleSaveCase} initialData={activeCase} contacts={contacts} staffName={staffName} />
          </div>
        )}

        {view === 'report' && activeCase && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="no-print flex flex-wrap justify-between items-center gap-8 mb-12">
              <button onClick={() => setView('list')} className="flex items-center gap-3 text-gray-400 hover:text-gray-900 font-black text-xs uppercase tracking-widest"><ChevronLeft className="w-6 h-6" /> Dashboard</button>
              <div className="flex flex-wrap gap-4">
                <button onClick={() => automatedNotify(activeCase)} className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-xl ${isSending === activeCase.id ? 'bg-blue-100 text-blue-600' : 'bg-blue-600 text-white hover:bg-black'}`} disabled={isSending !== null}>
                  {isSending === activeCase.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Globe className="w-6 h-6" />}
                  {isSending === activeCase.id ? 'SENDING...' : 'SEND PORTAL LINK'}
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-3 bg-white text-black border-4 border-black px-10 py-4 rounded-2xl hover:bg-black hover:text-white font-black transition-all shadow-xl"><Printer className="w-6 h-6" /> PRINT REPORT</button>
              </div>
            </div>
            <CaseReport record={activeCase} />
          </div>
        )}
      </main>
    </div>
  );

  async function handleConfirmReply(id: string) {
    const now = new Date().toISOString();
    const target = cases.find(c => c.id === id);
    if (!target) return;
    const final = { ...target, status: 'replied' as CaseStatus, repliedAt: now, replyMessage: replyNotes || 'Manually confirmed by Lab Staff' };
    setCases(prev => prev.map(c => c.id === id ? final : c));
    await saveToCloud(final);
    setIsConfirming(null);
    setReplyNotes('');
    if (activeCase?.id === id) setActiveCase(final);
  }
};

export default App;
