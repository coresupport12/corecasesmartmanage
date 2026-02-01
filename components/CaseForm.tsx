
import React, { useState, useEffect, useRef } from 'react';
import { CaseRecord, CaseCategory, Contact } from '../types';
import { polishMessage } from '../services/geminiService';
import { Wand2, Send, Save, Loader2, Link as LinkIcon, FileImage, Upload, X, ShieldCheck, User, Search, Phone, HardHat } from 'lucide-react';

interface CaseFormProps {
  onSave: (record: Partial<CaseRecord>) => void;
  initialData?: CaseRecord | null;
  contacts: Contact[];
  staffName: string;
}

const CaseForm: React.FC<CaseFormProps> = ({ onSave, initialData, contacts, staffName }) => {
  const [formData, setFormData] = useState<Partial<CaseRecord>>({
    isWhiteLabel: false,
    clientName: '',
    partnerLabEmail: '',
    patientName: '',
    caseNumber: '',
    category: CaseCategory.DESIGN_CONFIRMATION,
    doctorEmail: '',
    phoneNumber: '',
    rawMessage: '',
    polishedMessage: '',
    linkUrl: '',
    fileData: [],
    status: 'pending',
    createdBy: staffName
  });

  const [isPolishing, setIsPolishing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handlePolish = async () => {
    if (!formData.rawMessage) return;
    setIsPolishing(true);
    try {
      const result = await polishMessage(formData.rawMessage, formData.category as CaseCategory, !!formData.isWhiteLabel);
      setFormData(prev => ({ ...prev, polishedMessage: result }));
    } finally {
      setIsPolishing(false);
    }
  };

  const selectContact = (contact: Contact) => {
    setFormData(prev => ({
      ...prev,
      clientName: contact.name,
      doctorEmail: contact.email,
      phoneNumber: contact.phone,
      partnerLabEmail: contact.isLab ? contact.email : prev.partnerLabEmail,
      isWhiteLabel: contact.isLab
    }));
    setShowSuggestions(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          fileData: [...(prev.fileData || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      fileData: prev.fileData?.filter((_, i) => i !== index)
    }));
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes((formData.clientName || '').toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, timestamp: new Date().toISOString() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6 mb-6">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isWhiteLabel: false })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${!formData.isWhiteLabel ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            <User className="w-4 h-4" /> Direct Client
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isWhiteLabel: true })}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${formData.isWhiteLabel ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
          >
            <ShieldCheck className="w-4 h-4" /> B2B Partner
          </button>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
           <HardHat className="w-4 h-4 text-blue-600" />
           <span className="text-xs font-black text-blue-700 uppercase tracking-tighter">Staff: {staffName}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative">
          <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
            <span>{formData.isWhiteLabel ? 'Partner Lab Name' : 'Doctor / Clinic Name'}</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              onFocus={() => setShowSuggestions(true)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none pl-10"
              value={formData.clientName}
              onChange={e => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Search contacts..."
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          {showSuggestions && formData.clientName && filteredContacts.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
              {filteredContacts.map(c => (
                <div key={c.id} onClick={() => selectContact(c)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0">
                  <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                  <p className="text-[10px] text-gray-500">{c.email} | {c.phone}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
            <Phone className="w-3 h-3 text-green-500" /> Notification Phone
          </label>
          <input
            type="tel"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.phoneNumber}
            onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="+1..."
          />
        </div>

        {formData.isWhiteLabel && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Partner Lab Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.partnerLabEmail}
              onChange={e => setFormData({ ...formData, partnerLabEmail: e.target.value })}
            />
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Patient Name</label>
            <input type="text" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.patientName} onChange={e => setFormData({ ...formData, patientName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Case #</label>
            <input type="text" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.caseNumber} onChange={e => setFormData({ ...formData, caseNumber: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
          <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as CaseCategory })}>
            {Object.values(CaseCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Target Email</label>
          <input type="email" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.doctorEmail} onChange={e => setFormData({ ...formData, doctorEmail: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">Lab Message (Draft)</label>
        <div className="relative">
          <textarea rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" value={formData.rawMessage} onChange={e => setFormData({ ...formData, rawMessage: e.target.value })} placeholder="Type what you want to say to the doctor..." />
          <button type="button" onClick={handlePolish} disabled={isPolishing || !formData.rawMessage} className="absolute bottom-3 right-3 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:opacity-90 disabled:grayscale transition-all shadow-lg">
            {isPolishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} AI Business Polish
          </button>
        </div>
      </div>

      {formData.polishedMessage && (
        <div className="animate-in fade-in slide-in-from-top-2">
          <label className="block text-xs font-black text-blue-600 mb-1 uppercase tracking-wider">Polished Result</label>
          <textarea rows={4} className="w-full px-4 py-3 border border-blue-100 bg-blue-50 text-blue-900 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium" value={formData.polishedMessage} onChange={e => setFormData({ ...formData, polishedMessage: e.target.value })} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t pt-8">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-blue-500" /> 3D Preview Link
          </label>
          <input type="url" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={formData.linkUrl} onChange={e => setFormData({ ...formData, linkUrl: e.target.value })} placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            <FileImage className="w-4 h-4 text-indigo-500" /> Screenshots
          </label>
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 cursor-pointer transition-colors bg-gray-50">
            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500 font-medium">Click to upload case images</p>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {formData.fileData?.map((data, idx) => (
              <div key={idx} className="relative group w-20 h-20">
                <img src={data} className="w-full h-full object-cover rounded-lg border shadow-sm" alt="Preview" />
                <button type="button" onClick={() => removeFile(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 border-t pt-8">
        <button type="button" onClick={() => onSave({ ...formData, status: 'completed' })} className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-gray-700 transition-all">
          <Save className="w-5 h-5" /> Save to Archive
        </button>
        <button type="submit" className="flex items-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-xl shadow-blue-100">
          <Send className="w-5 h-5" /> Send & Finalize
        </button>
      </div>
    </form>
  );
};

export default CaseForm;
