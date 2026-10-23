// AICTE SmartVerify Type Definitions
// SIH Problem Statement 26261

export type UserRole = 
  | 'super_admin' 
  | 'scrutiny_officer' 
  | 'scrutiny_member' 
  | 'institution_user' 
  | 'admin' 
  | 'institution';

export interface ScrutinyTeam {
  id: string;
  officer_id: string;
  team_name: string;
  region_or_scope?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  officer_profile?: Profile;
  members?: TeamMemberWithProfile[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  member_id: string;
  assigned_by?: string;
  is_active: boolean;
  created_at: string;
}

export interface TeamMemberWithProfile extends TeamMember {
  profile?: Profile;
}

export interface ApplicationAssignment {
  id: string;
  application_id: string;
  team_id?: string;
  officer_id?: string;
  assigned_member_id?: string;
  assigned_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  team?: ScrutinyTeam;
  officer?: Profile;
  member?: Profile;
}

export type BureauCell =
  | 'Regulation Bureau (RB)'
  | 'Public Grievance Redressal Cell (PGRC)'
  | 'Vigilance Cell'
  | 'Approval Bureau'
  | 'Regional Office (Northern)'
  | 'Regional Office (Western)'
  | 'Regional Office (Southern)'
  | 'Regional Office (Eastern)'
  | 'Regional Office (Central)'
  | 'Regional Office (South-Western)'
  | 'Other Bureau/Cell';

export type ComplaintStatus =
  | 'Received'
  | 'Pending'
  | 'Under Process'
  | 'Awaiting Information'
  | 'Transferred'
  | 'Escalated'
  | 'Disposed'
  | 'Closed';

export type ComplaintPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

export type ComplaintCategory =
  | 'Capitation Fee & Excess Fees'
  | 'Faculty Shortage & Non-Payment'
  | 'Infrastructure & Safety Deficiencies'
  | 'Unauthorized Course / Intake'
  | 'Ragging & Student Harassment'
  | 'Admission Irregularities'
  | 'Deceptive Advertisements'
  | 'Non-Refund of Caution Money / Certificates Withheld'
  | 'Other Grievance';

export interface ComplaintTransfer {
  id: string;
  complaint_id: string;
  from_bureau: string;
  to_bureau: string;
  transfer_reason: string;
  transferred_by: string;
  transferred_at: string;
}

export interface ComplaintEscalation {
  id: string;
  complaint_id: string;
  escalated_to: string;
  escalation_reason: string;
  escalated_by: string;
  escalated_at: string;
}

export interface OverlapAlert {
  id: string;
  institution_id: string;
  institution_name: string;
  aicte_id: string;
  complaint_ids: string[];
  bureaus_involved: string[];
  reason: string;
  match_type: 'exact_aicte_id' | 'normalized_name' | 'category_similarity';
  status: 'Potential' | 'Confirmed' | 'Dismissed' | 'Needs Review';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
}

export interface ComplaintDisposal {
  decision: 'Substantiated - Directive Issued' | 'Resolved upon Rectification' | 'Unsubstantiated / Closed' | 'Referred to State Authority';
  disposal_order_number?: string;
  remarks: string;
  disposed_by: string;
  disposed_at: string;
}

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'Preliminary Validation'
  | 'Action Required'
  | 'Awaiting Official Review'
  | 'Under Review'
  | 'Needs Review'
  | 'Resubmitted'
  | 'Authenticity Confirmation Pending'
  | 'Verification Complete'
  | 'Review Completed'
  | 'Received'
  | 'Pending'
  | 'Under Process'
  | 'Awaiting Information'
  | 'Transferred'
  | 'Escalated'
  | 'Disposed'
  | 'Closed';

export type ValidationOutcome = 'Passed' | 'Failed' | 'Needs Review' | 'Not Checked';

export type ValidationSeverity = 'High' | 'Medium' | 'Low' | 'Info';

export type OCRStatus = 'Not Run' | 'Processing' | 'Completed' | 'Failed' | 'Low Readability';

export type ApplicationType =
  | 'Extension of Approval (EoA)'
  | 'New Institution Approval'
  | 'Increase in Intake'
  | 'Introduction of New Course / Faculty'
  | 'Change in Site / Campus Location';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  designation?: string;
  institution_id?: string;
  roles?: UserRole[];
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  aishe_code?: string;
  institution_type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  region?: string;
  district?: string;
  total_complaints?: number;
  pending_complaints?: number;
  disposed_complaints?: number;
  active_bureaus?: string[];
  latest_complaint_date?: string;
  related_complaint_ids?: string[];
  created_at: string;
  updated_at: string;
}

export type ExtractionMethod =
  | 'embedded_pdf_text'
  | 'ocr_scan'
  | 'digital_signature_parser'
  | 'manual_correction'
  | 'synthetic_fixture'
  | 'external_import';

export type FieldReviewStatus = 'extracted' | 'verified' | 'corrected' | 'unknown' | 'insufficient_evidence';

export interface ExtractedFieldItem {
  fieldName: string;
  label: string;
  extractedValue?: string;
  normalizedValue?: string;
  pageNumber?: number;
  confidence?: number;
  method: ExtractionMethod;
  reviewStatus: FieldReviewStatus;
  correctedValue?: string;
  evidenceSnippet?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ExtractedDocumentFields {
  institutionName?: string;
  institutionCode?: string;
  address?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  academicYear?: string;
  issuingAuthority?: string;
  hasSeal?: boolean;
  hasSignature?: boolean;
  isExpired?: boolean;
  ocrConfidence?: number;
  detailedFields?: Record<string, ExtractedFieldItem>;
  rawExtractedText?: string;
  pageCount?: number;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  checksum?: string;
  is_corrupt?: boolean;
  extracted_fields?: ExtractedDocumentFields;
  ocr_status: OCRStatus;
  ocr_confidence?: number;
  public_url?: string;
  local_preview_url?: string;
  version?: number;
  replaced_doc_id?: string;
  is_active_version?: boolean;
  created_at: string;
  updated_at: string;
}

export type RuleCategory =
  | 'Document Completeness'
  | 'File Validity'
  | 'Field Extraction'
  | 'Cross-Document Consistency'
  | 'Date & Validity'
  | 'Duplicate & Integrity'
  | 'Signatures & Seals'
  | 'Regulatory Compliance'
  | 'Authenticity Confirmation';

export interface RegulatoryRule {
  ruleId: string;
  name: string;
  description: string;
  category: RuleCategory;
  applicationTypes: ApplicationType[];
  requiredDocumentTypes?: string[];
  requiredFields?: string[];
  severity: ValidationSeverity;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string;
  aphReference: string;
  isOfficialNorm: boolean;
  isActive: boolean;
  lastUpdated: string;
}

export type AuthorityVerificationStatus =
  | 'Verified by Source'
  | 'Mismatched Details'
  | 'Expired at Authority'
  | 'Record Not Found'
  | 'Source Unavailable'
  | 'Verification Pending';

export interface AuthorityVerificationRequest {
  documentType: string;
  authorityName: string;
  documentNumber: string;
  institutionCode: string;
  institutionName: string;
  issueDate?: string;
}

export interface AuthorityVerificationResult {
  providerId: string;
  providerName: string;
  status: AuthorityVerificationStatus;
  lookupTimestamp: string;
  referenceNumber: string;
  matchedFields: string[];
  mismatchedFields: Array<{ field: string; requestedValue: string; authorityValue: string }>;
  authorityRecordExpiry?: string;
  responseSummary: string;
  isSyntheticSimulation: boolean;
  disclaimer: string;
  evidenceReference?: string;
}

export interface InfrastructureEvidenceItem {
  id: string;
  application_id: string;
  category: 'Land' | 'Building' | 'Laboratory' | 'Safety' | 'Barrier-Free Access';
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
  coordinates?: { latitude: number; longitude: number };
  timestamp_verified?: boolean;
  clarity_score?: number;
  reviewer_notes?: string;
  reviewer_status?: 'Pending' | 'Verified' | 'Deficiency Found';
}

export interface ValidationFinding {
  id: string;
  application_id: string;
  document_id?: string;
  check_name: string;
  category: RuleCategory;
  policy_id: string;
  rule_id?: string;
  rule_version?: string;
  result: ValidationOutcome;
  severity: ValidationSeverity;
  expected_condition?: string;
  observed_value?: string;
  explanation: string;
  recommended_action?: string;
  evidence_source?: string;
  page_reference?: string;
  evidence_snippet?: string;
  requires_human_review: boolean;
  is_reviewed?: boolean;
  reviewed_by?: string;
  review_note?: string;
  created_at: string;
  updated_at: string;
}

export interface OfficialReviewComment {
  id: string;
  application_id: string;
  author_id?: string;
  author_name: string;
  comment_type: 'Official Comment' | 'Correction Request' | 'Final Decision';
  decision?: 'Approved' | 'Rejected' | 'Action Required' | 'Needs Further Inspection';
  target_document_id?: string;
  target_finding_id?: string;
  comment_text: string;
  created_at: string;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  previous_status?: string;
  new_status: string;
  actor_id?: string;
  actor_name: string;
  reason: string;
  created_at: string;
}

export interface StatusUpdateRequest {
  id: string;
  application_id: string;
  institution_id: string;
  requested_by?: string;
  request_subject: string;
  request_message: string;
  reply_message?: string;
  replied_by?: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  created_at: string;
  replied_at?: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string;
  institution_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action_required';
  application_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface Application {
  id: string;
  application_number: string;
  institution_id: string;
  institution?: Institution;
  created_by?: string;
  application_type: ApplicationType;
  academic_year: string;
  status: ApplicationStatus;
  overall_validation_outcome: ValidationOutcome;
  is_synthetic_demo: boolean;
  submission_date?: string;
  created_at: string;
  updated_at: string;
  documents?: ApplicationDocument[];
  findings?: ValidationFinding[];
  comments?: OfficialReviewComment[];
  status_history?: ApplicationStatusHistory[];
  status_requests?: StatusUpdateRequest[];
  infrastructure_evidence?: InfrastructureEvidenceItem[];
  authority_verifications?: Record<string, AuthorityVerificationResult>;

  // Complaint Monitoring & Cross-Bureau Coordination fields
  case_id?: string;
  bureau?: BureauCell | string;
  receiving_bureau?: BureauCell | string;
  assigned_officer?: string;
  assigned_officer_id?: string;
  complaint_category?: ComplaintCategory | string;
  complaint_description?: string;
  complainant_type?: 'Student' | 'Faculty' | 'Parent' | 'Citizen' | 'Official Anonymous';
  complainant_name?: string;
  priority?: ComplaintPriority;
  date_received?: string;
  expected_disposal_date?: string;
  days_remaining?: number;
  is_overdue?: boolean;
  last_action_taken?: string;
  last_action_timestamp?: string;
  next_action_required?: string;
  transfers?: ComplaintTransfer[];
  escalations?: ComplaintEscalation[];
  related_complaint_ids?: string[];
  overlap_status?: 'None' | 'Potential Overlap Detected' | 'Confirmed Overlap - Coordinated' | 'Dismissed Overlap';
  overlap_alert?: OverlapAlert;
  disposal_decision?: ComplaintDisposal;
}

export type ComplaintCase = Application;
