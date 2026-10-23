// AICTE SmartVerify — Cross-Bureau Overlap Detection Service
// SIH Problem Statement: Integrated Institution Complaint Monitoring and Status Dashboard for AICTE

import { Application, OverlapAlert, BureauCell } from '../types';

/**
 * Normalizes an institution name for robust fuzzy and deterministic comparison:
 * - Lowercases and trims
 * - Eliminates noise words (college, institute, engineering, technology, polytechnic, university, trust, society, ltd, pvt, the, of, for, at, and, &)
 * - Strips punctuation and extra whitespace
 */
export function normalizeInstitutionName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b(college|institute|institution|engineering|technology|technologies|polytechnic|university|trust|society|foundation|campus|the|of|for|at|and)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes an AICTE Permanent Institute ID:
 * Removes spaces, dashes, prefixes (e.g., '1-1092837411' -> '11092837411')
 */
export function normalizeAicteId(id: string): string {
  if (!id) return '';
  return id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Calculates Token Jaccard Similarity between two strings
 */
export function calculateTokenSimilarity(strA: string, strB: string): number {
  const normA = normalizeInstitutionName(strA);
  const normB = normalizeInstitutionName(strB);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1.0;

  const setA = new Set(normA.split(' ').filter(Boolean));
  const setB = new Set(normB.split(' ').filter(Boolean));

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Calculates Category & Keyword similarity for complaints
 */
export function calculateComplaintContextOverlap(caseA: Application, caseB: Application): boolean {
  const catA = (caseA.complaint_category || '').toLowerCase();
  const catB = (caseB.complaint_category || '').toLowerCase();

  // Direct category match
  if (catA && catB && catA === catB) return true;

  // Key grievance domain overlaps
  const keywords = ['fee', 'refund', 'intake', 'course', 'salary', 'faculty', 'ragging', 'harassment', 'infrastructure', 'admission'];
  const textA = `${catA} ${caseA.complaint_description || ''}`.toLowerCase();
  const textB = `${catB} ${caseB.complaint_description || ''}`.toLowerCase();

  for (const kw of keywords) {
    if (textA.includes(kw) && textB.includes(kw)) {
      return true;
    }
  }

  return false;
}

class OverlapDetectionService {
  /**
   * Scans a set of complaints and identifies all cross-bureau or inter-case overlaps.
   */
  detectOverlaps(complaints: Application[]): OverlapAlert[] {
    const alerts: OverlapAlert[] = [];
    const activeComplaints = complaints.filter(c => c.status !== 'Disposed' && c.status !== 'Closed');

    // Group candidates by institution identifier
    for (let i = 0; i < activeComplaints.length; i++) {
      for (let j = i + 1; j < activeComplaints.length; j++) {
        const c1 = activeComplaints[i];
        const c2 = activeComplaints[j];

        // Must not be the identical complaint record
        if (c1.id === c2.id) continue;

        const aicteId1 = c1.institution?.code || '';
        const aicteId2 = c2.institution?.code || '';
        const name1 = c1.institution?.name || '';
        const name2 = c2.institution?.name || '';

        const bureau1 = c1.bureau || c1.receiving_bureau || 'Unspecified';
        const bureau2 = c2.bureau || c2.receiving_bureau || 'Unspecified';

        let isMatch = false;
        let matchType: 'exact_aicte_id' | 'normalized_name' | 'category_similarity' = 'exact_aicte_id';
        let reason = '';

        // Check 1: Exact AICTE Permanent ID Match
        if (aicteId1 && aicteId2 && normalizeAicteId(aicteId1) === normalizeAicteId(aicteId2)) {
          isMatch = true;
          matchType = 'exact_aicte_id';
          const isCrossBureau = bureau1 !== bureau2;
          reason = isCrossBureau
            ? `Identical AICTE Permanent ID (${aicteId1}) detected across active cases in ${bureau1} and ${bureau2}. Inter-departmental coordination required.`
            : `Multiple concurrent active complaints (${c1.case_id || c1.application_number} & ${c2.case_id || c2.application_number}) for the same AICTE ID (${aicteId1}) within ${bureau1}.`;
        } 
        // Check 2: Normalized Institution Name High Similarity (> 0.75)
        else if (calculateTokenSimilarity(name1, name2) >= 0.75) {
          isMatch = true;
          matchType = 'normalized_name';
          reason = `High institutional name similarity between "${name1}" and "${name2}" across ${bureau1} and ${bureau2}. Potential unlinked concurrent complaint.`;
        }

        if (isMatch) {
          const bureausInvolved = Array.from(new Set([bureau1, bureau2])).filter(Boolean);
          const relatedCaseIds = [
            c1.case_id || c1.application_number,
            c2.case_id || c2.application_number
          ];

          // Check if an existing alert already covers this pair
          const existing = alerts.find(a => 
            a.complaint_ids.includes(relatedCaseIds[0]) && a.complaint_ids.includes(relatedCaseIds[1])
          );

          if (!existing) {
            alerts.push({
              id: `overlap-${c1.id}-${c2.id}`,
              institution_id: c1.institution_id || c2.institution_id,
              institution_name: name1 || name2,
              aicte_id: aicteId1 || aicteId2,
              complaint_ids: relatedCaseIds,
              bureaus_involved: bureausInvolved,
              reason,
              match_type: matchType,
              status: (c1.overlap_alert?.status || c2.overlap_alert?.status || 'Potential'),
              created_at: new Date().toISOString()
            });
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Evaluates a single complaint against all other complaints in the system.
   * Returns an OverlapAlert if one is detected.
   */
  getOverlapForComplaint(complaint: Application, allComplaints: Application[]): {
    hasOverlap: boolean;
    alertText: string;
    overlappingCases: Application[];
    alert: OverlapAlert | null;
  } {
    const overlappingCases: Application[] = [];
    const thisAicteId = normalizeAicteId(complaint.institution?.code || '');
    const thisName = complaint.institution?.name || '';
    const thisCaseId = complaint.case_id || complaint.application_number;
    const thisBureau = complaint.bureau || complaint.receiving_bureau || 'Unknown Bureau';

    for (const other of allComplaints) {
      if (other.id === complaint.id) continue;
      // Exclude disposed / closed from triggering active overlap alert
      if (other.status === 'Disposed' || other.status === 'Closed') continue;

      const otherAicteId = normalizeAicteId(other.institution?.code || '');
      const otherName = other.institution?.name || '';

      const exactIdMatch = thisAicteId && otherAicteId && thisAicteId === otherAicteId;
      const nameMatch = calculateTokenSimilarity(thisName, otherName) >= 0.75;

      if (exactIdMatch || nameMatch) {
        overlappingCases.push(other);
      }
    }

    if (overlappingCases.length === 0) {
      return {
        hasOverlap: false,
        alertText: '',
        overlappingCases: [],
        alert: null
      };
    }

    const otherCaseIds = overlappingCases.map(c => c.case_id || c.application_number);
    const allBureaus = Array.from(new Set([
      thisBureau,
      ...overlappingCases.map(c => c.bureau || c.receiving_bureau || 'Unknown')
    ])).filter(Boolean);

    const alert: OverlapAlert = {
      id: `overlap-${complaint.id}`,
      institution_id: complaint.institution_id,
      institution_name: thisName,
      aicte_id: complaint.institution?.code || '',
      complaint_ids: [thisCaseId, ...otherCaseIds],
      bureaus_involved: allBureaus,
      reason: `Concurrent active case(s) detected for ${thisName} across ${allBureaus.join(' and ')}. Cases involved: ${[thisCaseId, ...otherCaseIds].join(', ')}.`,
      match_type: 'exact_aicte_id',
      status: complaint.overlap_alert?.status || 'Potential',
      created_at: complaint.overlap_alert?.created_at || new Date().toISOString()
    };

    return {
      hasOverlap: true,
      alertText: 'Potential Overlapping Cases — Coordination Required',
      overlappingCases,
      alert
    };
  }
}

export const overlapDetectionService = new OverlapDetectionService();
