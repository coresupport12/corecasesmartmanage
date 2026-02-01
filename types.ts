
export enum CaseCategory {
  DESIGN_CONFIRMATION = "Design Confirmation",
  INFORMATION_CHECK = "Information Check",
  SCHEDULE_DUE_DATE = "Schedule / Due Date",
  TECHNICAL_ISSUE = "Technical Issue",
  PARTS_BILLING = "Parts & Billing",
  GENERAL_UPDATE = "Case Update"
}

export type CaseStatus = 'pending' | 'sent' | 'replied' | 'completed';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  isLab: boolean;
}

export interface CaseRecord {
  id: string;
  timestamp: string;
  repliedAt?: string; 
  createdBy: string; // Staff member name
  isWhiteLabel: boolean;
  clientName: string; 
  partnerLabEmail?: string;
  patientName: string;
  caseNumber: string;
  category: CaseCategory;
  doctorEmail: string;
  phoneNumber?: string;
  rawMessage: string;
  polishedMessage: string;
  linkUrl: string;
  fileData: string[]; 
  replyMessage?: string; 
  status: CaseStatus;
}
