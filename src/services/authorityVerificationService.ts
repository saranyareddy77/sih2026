// AICTE SmartVerify — Issuing-Authority Verification Connector Service
// SIH Problem Statement 26261
//
// Compliant with Mandatory Rules:
// 1. Clearly labels all simulated gateway outputs: SYNTHETIC REGISTRY SIMULATION.
// 2. Never claims a real statutory certificate is verified without an authorized real integration.
// 3. Implements 5 deterministic test cases for SIH demonstration:
//    - Case 1: Matching Verified Record
//    - Case 2: Mismatched Details (e.g. registered name/address differs)
//    - Case 3: Expired Record at Authority
//    - Case 4: Record Not Found
//    - Case 5: Temporarily Unavailable Gateway (honest error handling)

import { 
  AuthorityVerificationRequest, 
  AuthorityVerificationResult, 
  AuthorityVerificationStatus 
} from '../types';

export const SYNTHETIC_AUTHORITY_DISCLAIMER = 
  'SIMULATED REGISTRY ADAPTER — FOR SIH-2026 DEMONSTRATION PURPOSES ONLY. NOT CONNECTED TO LIVE PRODUCTION REGISTRIES.';

export interface AuthorityProvider {
  id: string;
  name: string;
  jurisdiction: string;
  supportedDocumentTypes: string[];
  verify(request: AuthorityVerificationRequest): Promise<AuthorityVerificationResult>;
}

/**
 * Deterministic Mock Provider for SIH Evaluation
 */
export class SyntheticStateRegistryProvider implements AuthorityProvider {
  id = 'prov-synthetic-gateway-v1';
  name = 'National e-Gov Statutory Registry Gateway (Simulated Adapter)';
  jurisdiction = 'Pan-India Technical Education Statutory Registries';
  supportedDocumentTypes = [
    'Land Use Certificate',
    'Building Plan Approval',
    'Occupancy Certificate',
    'Fire Safety Certificate',
    'Society Registration / Trust Deed'
  ];

  async verify(request: AuthorityVerificationRequest): Promise<AuthorityVerificationResult> {
    const timestamp = new Date().toISOString();
    const docNum = (request.documentNumber || '').trim().toUpperCase();

    // -------------------------------------------------------------
    // SCENARIO 5: Temporarily Unavailable Gateway
    // -------------------------------------------------------------
    if (docNum.includes('UNAVAIL') || docNum.includes('TIMEOUT') || docNum.includes('OFFLINE') || docNum.includes('1010')) {
      return {
        providerId: this.id,
        providerName: this.name,
        status: 'Source Unavailable',
        lookupTimestamp: timestamp,
        referenceNumber: request.documentNumber || 'N/A',
        matchedFields: [],
        mismatchedFields: [],
        responseSummary: 'State Revenue / Local Statutory Registry API timed out after 5000ms (HTTP 503 Service Unavailable).',
        isSyntheticSimulation: true,
        disclaimer: SYNTHETIC_AUTHORITY_DISCLAIMER,
        evidenceReference: 'Gateway Log: ERR_STATE_GATEWAY_TIMEOUT_503'
      };
    }

    // -------------------------------------------------------------
    // SCENARIO 4: Record Not Found
    // -------------------------------------------------------------
    if (docNum.includes('NOTFOUND') || docNum.includes('INVALID') || docNum.includes('UNKNOWN') || !request.documentNumber) {
      return {
        providerId: this.id,
        providerName: this.name,
        status: 'Record Not Found',
        lookupTimestamp: timestamp,
        referenceNumber: request.documentNumber || 'UNKNOWN',
        matchedFields: [],
        mismatchedFields: [],
        responseSummary: `No corresponding statutory certificate with reference number "${request.documentNumber || 'EMPTY'}" exists in the municipal/state registry database.`,
        isSyntheticSimulation: true,
        disclaimer: SYNTHETIC_AUTHORITY_DISCLAIMER,
        evidenceReference: 'Registry Query: SELECT_RETURN_0_ROWS'
      };
    }

    // -------------------------------------------------------------
    // SCENARIO 3: Expired Record at Authority
    // -------------------------------------------------------------
    if (docNum.includes('EXPIRED') || docNum.includes('1004')) {
      return {
        providerId: this.id,
        providerName: this.name,
        status: 'Expired at Authority',
        lookupTimestamp: timestamp,
        referenceNumber: request.documentNumber,
        matchedFields: ['institutionName', 'institutionCode'],
        mismatchedFields: [],
        authorityRecordExpiry: '2025-06-30',
        responseSummary: 'Certificate record found, but the authority database indicates that statutory validity expired on 30-Jun-2025. Renewal is mandatory.',
        isSyntheticSimulation: true,
        disclaimer: SYNTHETIC_AUTHORITY_DISCLAIMER,
        evidenceReference: 'Authority Database Status: LAPSED_INACTIVE'
      };
    }

    // -------------------------------------------------------------
    // SCENARIO 2: Mismatched Details
    // -------------------------------------------------------------
    if (docNum.includes('MISMATCH') || docNum.includes('1005') || docNum.includes('1006')) {
      return {
        providerId: this.id,
        providerName: this.name,
        status: 'Mismatched Details',
        lookupTimestamp: timestamp,
        referenceNumber: request.documentNumber,
        matchedFields: ['documentNumber'],
        mismatchedFields: [
          {
            field: 'institutionName',
            requestedValue: request.institutionName,
            authorityValue: 'Registered Trust: Greenfield Technical & Educational Foundation'
          }
        ],
        responseSummary: `Certificate reference ${request.documentNumber} was found, but the registered trust name on authority records differs from the application institution profile name.`,
        isSyntheticSimulation: true,
        disclaimer: SYNTHETIC_AUTHORITY_DISCLAIMER,
        evidenceReference: 'Authority Deed Record: VOL-942/REG-2018'
      };
    }

    // -------------------------------------------------------------
    // SCENARIO 1: Matching Verified Record
    // -------------------------------------------------------------
    return {
      providerId: this.id,
      providerName: this.name,
      status: 'Verified by Source',
      lookupTimestamp: timestamp,
      referenceNumber: request.documentNumber,
      matchedFields: ['institutionName', 'institutionCode', 'documentNumber'],
      mismatchedFields: [],
      authorityRecordExpiry: '2028-12-31',
      responseSummary: `Statutory certificate confirmed active in official State Directorate Registry. Issued to "${request.institutionName}".`,
      isSyntheticSimulation: true,
      disclaimer: SYNTHETIC_AUTHORITY_DISCLAIMER,
      evidenceReference: `State Digilocker/e-Pramaan Token: AUTH-REG-${Math.abs(hashCode(request.documentNumber))}`
    };
  }
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

class AuthorityVerificationService {
  private primaryProvider: AuthorityProvider;

  constructor() {
    this.primaryProvider = new SyntheticStateRegistryProvider();
  }

  /**
   * Queries external issuing authority for a document
   */
  async verifyDocumentWithAuthority(request: AuthorityVerificationRequest): Promise<AuthorityVerificationResult> {
    return this.primaryProvider.verify(request);
  }
}

export const authorityVerificationService = new AuthorityVerificationService();
