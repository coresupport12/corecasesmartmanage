
import React from 'react';
import { CaseRecord } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Clock, HardHat } from 'lucide-react';

interface CaseReportProps {
  record: CaseRecord;
}

const CaseReport: React.FC<CaseReportProps> = ({ record }) => {
  const isConfirmed = record.status === 'replied' || record.status === 'completed';

  return (
    <div className="bg-white p-10 max-w-[850px] mx-auto min-h-[1100px] shadow-2xl print:shadow-none print:p-8 font-sans" id="case-report">
      {/* Header */}
      <div className="flex justify-between items-start border-b-4 border-gray-900 pb-8 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">CORE DENTAL STUDIO</h1>
          <p className="text-blue-600 font-bold text-xs tracking-[0.2em] uppercase mt-2">Laboratory Technical Report</p>
          <div className="flex items-center gap-2 mt-4 bg-gray-100 px-3 py-1.5 rounded-lg w-fit no-print print:hidden">
             <HardHat className="w-3 h-3 text-gray-500" />
             <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Report by: {record.createdBy || 'Laboratory Staff'}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block bg-black text-white px-4 py-2 rounded-lg font-black text-sm mb-3 uppercase tracking-widest">
            {record.category}
          </div>
          <div className="space-y-1">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Report Date</p>
            <p className="text-gray-900 text-sm font-bold">{new Date(record.timestamp).toLocaleDateString()} {new Date(record.timestamp).toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Main Info Blocks */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-200">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Client Information</h2>
          <p className="text-xl font-black text-gray-900 leading-tight mb-1">{record.clientName}</p>
          <p className="text-gray-500 text-xs font-bold truncate">{record.doctorEmail}</p>
        </div>
        <div className="col-span-1 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Patient Case</h2>
          <p className="text-xl font-black text-gray-900 leading-tight mb-1">{record.patientName}</p>
          <p className="text-blue-600 font-black text-xs tracking-widest uppercase">CASE ID: {record.caseNumber}</p>
        </div>
        <div className="col-span-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-3xl p-4 bg-white">
           {record.linkUrl ? (
             <>
               <QRCodeSVG value={record.linkUrl} size={90} level="H" />
               <p className="text-[9px] font-black text-gray-900 mt-3 uppercase tracking-[0.1em] text-center bg-gray-100 px-2 py-1 rounded">Scan 3D Web Preview</p>
             </>
           ) : (
             <p className="text-[10px] text-gray-300 italic font-medium">No 3D Preview Provided</p>
           )}
        </div>
      </div>

      {/* Message Section */}
      <div className="mb-10">
        <h3 className="text-xs font-black text-gray-900 border-l-4 border-blue-600 pl-4 mb-5 uppercase tracking-[0.2em]">Clinical Instructions & Observations</h3>
        <div className="bg-white border-2 border-gray-100 p-8 rounded-3xl min-h-[180px] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
             <h1 className="text-6xl font-black tracking-tighter">LAB</h1>
          </div>
          <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
            {record.polishedMessage || record.rawMessage}
          </p>
        </div>
      </div>

      {/* Visual Assets Gallery */}
      {record.fileData.length > 0 && (
        <div className="mb-10">
          <h3 className="text-xs font-black text-gray-900 border-l-4 border-indigo-600 pl-4 mb-5 uppercase tracking-[0.2em]">Photographic Evidence / Reference</h3>
          <div className="grid grid-cols-2 gap-5">
            {record.fileData.map((data, i) => (
              <div key={i} className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm aspect-video bg-gray-50 flex items-center justify-center relative">
                <img src={data} alt={`Screenshot ${i+1}`} className="max-w-full max-h-full object-contain" />
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[8px] px-2 py-1 rounded-md font-bold uppercase tracking-widest">Fig {i+1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Signature Area */}
      <div className="mt-auto border-t-4 border-gray-900 pt-10">
        <div className="grid grid-cols-2 gap-10 items-end">
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-[0.2em]">Verification Status</h4>
            
            {isConfirmed ? (
              <div className="bg-green-50 border-2 border-green-500 rounded-3xl p-6 relative overflow-hidden">
                <CheckCircle2 className="absolute -right-6 -bottom-6 w-32 h-32 text-green-500/10" />
                <div className="flex items-center gap-3 text-green-700 mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                  <span className="font-black text-xl uppercase tracking-tighter">Digitally Confirmed</span>
                </div>
                <div className="space-y-1 mb-4">
                  <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Approval Message</p>
                  <p className="text-sm text-green-800 font-bold leading-tight">{record.replyMessage || 'Confirmed via one-click email response.'}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-green-500 font-black uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  <span>Timestamp: {record.repliedAt ? new Date(record.repliedAt).toLocaleString() : 'Pre-verified'}</span>
                </div>
              </div>
            ) : (
              <div className="h-28 border-b-2 border-gray-200 flex flex-col justify-end pb-3">
                <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest text-center mb-1">Manual Signature Area</p>
                <p className="text-[9px] text-gray-200 italic font-medium text-center">(Authorized Clinician Signature Required for Delivery)</p>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="mb-6">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Issued by Laboratory</h4>
              <p className="text-2xl font-black text-gray-900 mt-2 tracking-tighter">CORE DENTAL STUDIO</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Quality Assurance Passed</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl inline-block border border-gray-100">
               <p className="text-[8px] text-gray-400 font-black uppercase leading-tight tracking-[0.1em]">Certified Technical Document<br/>Must remain with case contents</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseReport;
