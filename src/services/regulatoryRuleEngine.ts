// AICTE SmartVerify — Configurable Versioned Regulatory Rule Engine
// SIH Problem Statement 26261
//
// Governed by official AICTE Approval Process Handbook (APH) 2026-2027 norms.
// Clearly labels official statutory clauses vs prototype demonstration fixtures.

import { RegulatoryRule, ApplicationType, ValidationSeverity, RuleCategory } from '../types';

export const CURRENT_RULESET_VERSION = 'AICTE-APH-2026-27-V2.1';

export const INITIAL_REGULATORY_RULES: RegulatoryRule[] = [
  {
    ruleId: 'RULE-APH-COMP-01',
    name: 'Mandatory Technical Document Completeness',
    description: 'Requires all statutory documents specified for the application type to be uploaded prior to scrutiny.',
    category: 'Document Completeness',
    applicationTypes: [
      'Extension of Approval (EoA)',
      'New Institution Approval',
      'Increase in Intake',
      'Introduction of New Course / Faculty',
      'Change in Site / Campus Location'
    ],
    requiredDocumentTypes: [
      'Land Use Certificate',
      'Building Plan Approval',
      'Occupancy Certificate',
      'Fire Safety Certificate',
      'AICTE Previous Approval Letter',
      'Society Registration / Trust Deed',
      'Affidavit (Format 1)'
    ],
    severity: 'High',
    version: '2026.1',
    effectiveFrom: '2026-04-01',
    aphReference: 'AICTE Approval Process Handbook 2026-2027, Chapter II, Clause 2.1 (Mandatory Disclosures)',
    isOfficialNorm: true,
    isActive: true,
    lastUpdated: '2026-04-01T00:00:00Z'
  },
  {
    ruleId: 'RULE-APH-EXP-02',
    name: 'Statutory Safety & Fire Certificate Validity',
    description: 'Statutory fire safety, structural stability, and temporary affiliations must remain active through the evaluation academic year.',
    category: 'Date & Validity',
    applicationTypes: [
      'Extension of Approval (EoA)',
      'New Institution Approval',
      'Increase in Intake',
      'Introduction of New Course / Faculty',
      'Change in Site / Campus Location'
    ],
    requiredFields: ['expiryDate'],
    severity: 'High',
    version: '2026.1',
    effectiveFrom: '2026-04-01',
    aphReference: 'AICTE Approval Process Handbook 2026-2027, Appendix 4, Clause 4.3 (Essential Safety Norms)',
    isOfficialNorm: true,
    isActive: true,
    lastUpdated: '2026-04-01T00:00:00Z'
  },
  {
    ruleId: 'RULE-APH-CROSS-03',
    name: 'Legal Entity Title and Permanent ID Consistency',
    description: 'The institution title, society name, and permanent AICTE identification number must be consistent across deed and certificate filings.',
    category: 'Cross-Document Consistency',
    applicationTypes: [
      'Extension of Approval (EoA)',
      'New Institution Approval',
      'Increase in Intake',
      'Change in Site / Campus Location'
    ],
    requiredFields: ['institutionName', 'institutionCode'],
    severity: 'High',
    version: '2026.1',
    effectiveFrom: '2026-04-01',
    aphReference: 'AICTE Approval Process Handbook 2026-2027, Chapter I, Clause 1.7 (Applicant Integrity)',
    isOfficialNorm: true,
    isActive: true,
    lastUpdated: '2026-04-01T00:00:00Z'
  },
  {
    ruleId: 'RULE-APH-DUP-04',
    name: 'Binary Checksum Uniqueness Across Document Categories',
    description: 'Validates that distinct statutory document categories do not reuse identical binary byte streams (SHA-256 duplicate detection).',
    category: 'Duplicate & Integrity',
    applicationTypes: [
      'Extension of Approval (EoA)',
      'New Institution Approval',
      'Increase in Intake',
      'Introduction of New Course / Faculty',
      'Change in Site / Campus Location'
    ],
    severity: 'Medium',
    version: '2026.1',
    effectiveFrom: '2026-04-01',
    aphReference: 'SIH-2026 Prototype Technical Specification (PS 26261 Integrity Norm)',
    isOfficialNorm: false, // Labelled as prototype specification rule
    isActive: true,
    lastUpdated: '2026-04-01T00:00:00Z'
  },
  {
    ruleId: 'RULE-APH-VALID-05',
    name: 'Readable Header and Minimum OCR Readability',
    description: 'Ensures files are valid, uncorrupted, unencrypted PDFs or images with readable scan quality (>60% OCR character confidence).',
    category: 'File Validity',
    applicationTypes: [
      'Extension of Approval (EoA)',
      'New Institution Approval',
      'Increase in Intake',
      'Introduction of New Course / Faculty',
      'Change in Site / Campus Location'
    ],
    severity: 'High',
    version: '2026.1',
    effectiveFrom: '2026-04-01',
    aphReference: 'AICTE Approval Process Handbook 2026-2027, Appendix 16 (Digital Document Standards)',
    isOfficialNorm: true,
    isActive: true,
    lastUpdated: '2026-04-01T00:00:00Z'
  },
  {
    ruleId: 'RULE-APH-SEAL-06',
    name: 'Official Seal and Competent Signatory Presence',
    description: 'Checks for visual or cryptographic evidence of official stamps and authorized signatures on certificates.',
    category: 'Signatures & Seals',
    applicationTypes: [
      'Extension of Approval (EoA)',
      'New Institution Approval',
      'Increase in Intake',
      'Change in Site / Campus Location'
    ],
    severity: 'Medium',
    version: '2026.1',
    effectiveFrom: '2026-04-01',
    aphReference: 'AICTE Approval Process Handbook 2026-2027, Clause 2.5 (Competent Authority Attestation)',
    isOfficialNorm: true,
    isActive: true,
    lastUpdated: '2026-04-01T00:00:00Z'
  },
  {
    ruleId: 'RULE-APH-REG-07',
    name: 'Academic Cycle 2026-2027 Policy Conformance',
    description: 'Validates that applications are submitted for the authorized 2026-2027 statutory calendar cycle.',
    category: 'Regulatory Compliance',
    applicationTypes: [
      'Extension of Approval (EoA)',
      'New Institution Approval',
      'Increase in Intake',
      'Introduction of New Course / Faculty',
      'Change in Site / Campus Location'
    ],
    severity: 'Info',
    version: '2026.1',
    effectiveFrom: '2026-04-01',
    aphReference: 'AICTE Approval Process Handbook 2026-2027, Notification F.No. AICTE/AB/APH/2026-27',
    isOfficialNorm: true,
    isActive: true,
    lastUpdated: '2026-04-01T00:00:00Z'
  },
  {
    ruleId: 'RULE-APH-AUTH-08',
    name: 'Issuing Authority Verification Readiness',
    description: 'Tracks third-party registry validation status without falsely rejecting applications when external state gateways are offline.',
    category: 'Authenticity Confirmation',
    applicationTypes: [
      'Extension of Approval (EoA)',
      'New Institution Approval',
      'Increase in Intake',
      'Change in Site / Campus Location'
    ],
    severity: 'Info',
    version: '2026.1',
    effectiveFrom: '2026-04-01',
    aphReference: 'SIH-2026 Interoperability Gateway Architecture Specification',
    isOfficialNorm: false,
    isActive: true,
    lastUpdated: '2026-04-01T00:00:00Z'
  }
];

const RULES_STORAGE_KEY = 'aicte_smartverify_regulatory_rules_v1';
const RULES_AUDIT_KEY = 'aicte_smartverify_rules_audit_log';

export interface RuleAuditEvent {
  id: string;
  ruleId: string;
  actorName: string;
  action: 'Created' | 'Updated' | 'Toggled Active' | 'Version Bumped';
  previousVersion?: string;
  newVersion?: string;
  changesSummary: string;
  timestamp: string;
}

class RegulatoryRuleEngine {
  private rules: RegulatoryRule[] = [];
  private auditLog: RuleAuditEvent[] = [];

  constructor() {
    this.loadRules();
  }

  private loadRules() {
    if (typeof localStorage === 'undefined') {
      this.rules = [...INITIAL_REGULATORY_RULES];
      return;
    }

    const saved = localStorage.getItem(RULES_STORAGE_KEY);
    if (saved) {
      try {
        this.rules = JSON.parse(saved);
      } catch (e) {
        this.rules = [...INITIAL_REGULATORY_RULES];
      }
    } else {
      this.rules = [...INITIAL_REGULATORY_RULES];
      this.saveLocal();
    }

    const savedAudit = localStorage.getItem(RULES_AUDIT_KEY);
    if (savedAudit) {
      try {
        this.auditLog = JSON.parse(savedAudit);
      } catch (e) {
        this.auditLog = [];
      }
    }
  }

  private saveLocal() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(this.rules));
      localStorage.setItem(RULES_AUDIT_KEY, JSON.stringify(this.auditLog));
    }
  }

  getRules(): RegulatoryRule[] {
    return [...this.rules];
  }

  getActiveRules(): RegulatoryRule[] {
    return this.rules.filter(r => r.isActive);
  }

  getRuleById(ruleId: string): RegulatoryRule | undefined {
    return this.rules.find(r => r.ruleId === ruleId);
  }

  getRulesForApplicationType(appType: ApplicationType): RegulatoryRule[] {
    return this.rules.filter(r => r.isActive && r.applicationTypes.includes(appType));
  }

  getRulesByCategory(category: RuleCategory): RegulatoryRule[] {
    return this.rules.filter(r => r.category === category);
  }

  getAuditLog(): RuleAuditEvent[] {
    return [...this.auditLog];
  }

  /**
   * Updates an existing rule with full audit trail
   */
  updateRule(
    ruleId: string,
    updates: Partial<RegulatoryRule>,
    actorName: string = 'Super Admin'
  ): { success: boolean; rule?: RegulatoryRule; error?: string } {
    const idx = this.rules.findIndex(r => r.ruleId === ruleId);
    if (idx === -1) {
      return { success: false, error: `Rule ${ruleId} not found.` };
    }

    const oldRule = this.rules[idx];
    const prevVersion = oldRule.version;

    // Bump version if substantive change
    let newVersion = oldRule.version;
    if (updates.severity || updates.requiredDocumentTypes || updates.requiredFields) {
      const parts = oldRule.version.split('.');
      const minor = parseInt(parts[1] || '0', 10) + 1;
      newVersion = `${parts[0]}.${minor}`;
    }

    const updatedRule: RegulatoryRule = {
      ...oldRule,
      ...updates,
      version: newVersion,
      lastUpdated: new Date().toISOString()
    };

    this.rules[idx] = updatedRule;

    const auditEntry: RuleAuditEvent = {
      id: `audit-rule-${Date.now()}`,
      ruleId,
      actorName,
      action: updates.isActive !== undefined && updates.isActive !== oldRule.isActive ? 'Toggled Active' : 'Updated',
      previousVersion: prevVersion,
      newVersion,
      changesSummary: `Modified fields: ${Object.keys(updates).join(', ')}.`,
      timestamp: new Date().toISOString()
    };

    this.auditLog.unshift(auditEntry);
    this.saveLocal();

    return { success: true, rule: updatedRule };
  }

  /**
   * Resets rules to official defaults
   */
  resetToDefaults(actorName: string = 'Super Admin') {
    this.rules = [...INITIAL_REGULATORY_RULES];
    this.auditLog.unshift({
      id: `audit-rule-${Date.now()}`,
      ruleId: 'ALL',
      actorName,
      action: 'Updated',
      changesSummary: 'Restored regulatory rules to default AICTE APH 2026-2027 configuration.',
      timestamp: new Date().toISOString()
    });
    this.saveLocal();
  }
}

export const regulatoryRuleEngine = new RegulatoryRuleEngine();
