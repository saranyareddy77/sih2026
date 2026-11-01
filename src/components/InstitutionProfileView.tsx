// AICTE SmartVerify — Institution Profile View & Management Component
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Award, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  Layers,
  GraduationCap,
  HardHat
} from 'lucide-react';
import { Institution, ApprovedCourseItem } from '../types';
import { authService, calculateProfileCompletion } from '../services/authService';

interface InstitutionProfileViewProps {
  onProfileUpdated?: (updated: Institution) => void;
}

export const InstitutionProfileView: React.FC<InstitutionProfileViewProps> = ({ onProfileUpdated }) => {
  const currentUser = authService.getCurrentUser();
  const initialInst = currentUser?.institution;

  const [formData, setFormData] = useState<Partial<Institution>>({
    name: initialInst?.name || '',
    code: initialInst?.code || '',
    aishe_code: initialInst?.aishe_code || '',
    institution_type: initialInst?.institution_type || 'Engineering & Technology',
    address: initialInst?.address || '',
    city: initialInst?.city || '',
    district: initialInst?.district || '',
    state: initialInst?.state || '',
    pincode: initialInst?.pincode || '',
    contact_email: initialInst?.contact_email || '',
    contact_phone: initialInst?.contact_phone || '',
    website: initialInst?.website || '',
    region: initialInst?.region || 'Northern',

    director_name: initialInst?.director_name || '',
    director_email: initialInst?.director_email || '',
    director_phone: initialInst?.director_phone || '',
    representative_name: initialInst?.representative_name || currentUser?.full_name || '',
    representative_designation: initialInst?.representative_designation || currentUser?.designation || 'Registrar',

    previous_approval_details: initialInst?.previous_approval_details || {
      approvalNumber: 'F.No. Northern/1-1092837411/2025/EoA',
      approvalDate: '2025-05-12',
      academicYear: '2025-2026',
      status: 'Approved with Full Intake',
      remarks: 'Compliant with all AICTE APH 2025-2026 prescribed norms.'
    },

    approved_programmes: initialInst?.approved_programmes && initialInst.approved_programmes.length > 0 
      ? initialInst.approved_programmes 
      : [
          { id: 'c-1', programme: 'Engineering & Technology', course: 'Computer Science & Engineering', level: 'Under Graduate', approvedIntake: 180, yearStarted: '2012' },
          { id: 'c-2', programme: 'Engineering & Technology', course: 'Artificial Intelligence & Data Science', level: 'Under Graduate', approvedIntake: 120, yearStarted: '2020' },
          { id: 'c-3', programme: 'Engineering & Technology', course: 'Electronics & Communication Engineering', level: 'Under Graduate', approvedIntake: 60, yearStarted: '2012' }
        ],

    faculty_records: initialInst?.faculty_records || {
      totalFaculty: 58,
      cadreRatio: '1:2:6',
      phdCount: 24,
      studentFacultyRatio: '1:15'
    },

    accreditation_details: initialInst?.accreditation_details || {
      naacGrade: 'A+',
      naacValidUntil: '2028-12-31',
      nbaAccreditedCourses: 'CSE, ECE (Tier-1)',
      universityAffiliation: 'Affiliated',
      affiliatingUniversity: 'Dr. A.P.J. Abdul Kalam Technical University (AKTU)'
    },

    infrastructure_details: initialInst?.infrastructure_details || {
      landAreaAcres: 10.5,
      builtUpAreaSqm: 24500,
      classroomsCount: 36,
      labsCount: 28,
      computersCount: 650,
      libraryTitlesCount: 18500
    }
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New course input state
  const [newProg, setNewProg] = useState<string>('Engineering & Technology');
  const [newCourse, setNewCourse] = useState<string>('');
  const [newLevel, setNewLevel] = useState<string>('Under Graduate');
  const [newIntake, setNewIntake] = useState<number>(60);
  const [newYear, setNewYear] = useState<string>('2026');

  // Compute profile completeness
  const completion = calculateProfileCompletion(formData);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.name?.trim()) {
      setErrorMessage('Institution Name is required.');
      return;
    }
    if (!formData.contact_email?.trim()) {
      setErrorMessage('Official Email Address is required.');
      return;
    }

    setSaving(true);
    try {
      const instId = initialInst?.id || currentUser?.institution_id || 'inst-current';
      const res = await authService.updateInstitutionProfile(instId, formData);

      if (res.success && res.institution) {
        setSuccessMessage('Institution profile updated and persisted successfully to the AICTE central registry!');
        if (onProfileUpdated) {
          onProfileUpdated(res.institution);
        }
      } else {
        setErrorMessage(res.error || 'Failed to update institution profile.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCourse = () => {
    if (!newCourse.trim()) return;
    const newEntry: ApprovedCourseItem = {
      id: `c-${Date.now()}`,
      programme: newProg,
      course: newCourse.trim(),
      level: newLevel,
      approvedIntake: Number(newIntake) || 60,
      yearStarted: newYear
    };

    setFormData(prev => ({
      ...prev,
      approved_programmes: [...(prev.approved_programmes || []), newEntry]
    }));

    setNewCourse('');
    setNewIntake(60);
  };

  const handleRemoveCourse = (id: string) => {
    setFormData(prev => ({
      ...prev,
      approved_programmes: (prev.approved_programmes || []).filter(c => c.id !== id)
    }));
  };

  return (
    <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Profile Completeness Header Card */}
      <div className="dashboard-content-card" style={{ padding: '24px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={24} className="text-emerald-600" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#065f46' }}>
                Institution Regulatory Profile Completeness
              </h2>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: '#047857' }}>
              A complete institutional profile accelerates automated application validation and reduces Scrutiny Desk queries.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#059669' }}>
                {completion.percentage}%
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#047857', textTransform: 'uppercase' }}>
                {completion.isComplete ? 'Verified Profile' : 'Action Recommended'}
              </div>
            </div>

            {/* Visual Ring / Bar */}
            <div style={{ width: '120px', height: '10px', backgroundColor: '#dcfce7', borderRadius: '999px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${completion.percentage}%`, 
                  height: '100%', 
                  backgroundColor: completion.percentage >= 80 ? '#10b981' : '#f59e0b',
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Missing fields alert if any */}
        {completion.missingFields.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #bbf7d0', fontSize: '0.8125rem', color: '#92400e' }}>
            <span style={{ fontWeight: 600 }}>Missing / Incomplete Fields to achieve 100%: </span>
            {completion.missingFields.join(' • ')}
          </div>
        )}
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="auth-alert alert-success">
          <CheckCircle2 size={18} className="alert-icon" />
          <div>{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="auth-alert alert-error">
          <AlertCircle size={18} className="alert-icon" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Form with Sections */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Basic Institutional Information */}
        <div className="dashboard-content-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={20} className="text-emerald-600" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                1. Basic Institutional Information
              </h3>
            </div>
            <span className="badge badge-passed" style={{ fontSize: '0.7rem' }}>
              AICTE Verified Entity
            </span>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Institution Full Legal Name *</label>
              <input 
                type="text" 
                required 
                className="form-input" 
                value={formData.name || ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                AICTE Permanent Institute ID (Regulatory Read-Only)
                <Lock size={12} style={{ display: 'inline', marginLeft: '6px', color: '#64748b' }} />
              </label>
              <input 
                type="text" 
                disabled 
                className="form-input" 
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                value={formData.code || ''} 
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">AISHE Code</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.aishe_code || ''} 
                onChange={e => setFormData({ ...formData, aishe_code: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Institution Category / Type *</label>
              <select 
                className="form-input" 
                value={formData.institution_type || 'Engineering & Technology'} 
                onChange={e => setFormData({ ...formData, institution_type: e.target.value })}
              >
                <option value="Engineering & Technology">Engineering &amp; Technology</option>
                <option value="Polytechnic & Diploma">Polytechnic &amp; Diploma</option>
                <option value="Management & Technical">Management &amp; Technical</option>
                <option value="Pharmacy & Health Sciences">Pharmacy &amp; Health Sciences</option>
                <option value="Architecture & Planning">Architecture &amp; Planning</option>
                <option value="Applied Arts & Crafts">Applied Arts &amp; Crafts</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">AICTE Administrative Region</label>
              <select 
                className="form-input" 
                value={formData.region || 'Northern'} 
                onChange={e => setFormData({ ...formData, region: e.target.value })}
              >
                <option value="Northern">Northern Region (Kanpur/New Delhi)</option>
                <option value="Western">Western Region (Mumbai)</option>
                <option value="Southern">Southern Region (Chennai)</option>
                <option value="Eastern">Eastern Region (Kolkata)</option>
                <option value="Central">Central Region (Bhopal)</option>
                <option value="South-Western">South-Western Region (Bengaluru)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Previous Approval Information */}
        <div className="dashboard-content-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={20} className="text-emerald-600" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                2. Previous AICTE Approval &amp; Identification Records
              </h3>
            </div>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Official Approval History</span>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Previous EoA Letter Reference No.</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.previous_approval_details?.approvalNumber || ''} 
                onChange={e => setFormData({
                  ...formData,
                  previous_approval_details: { ...formData.previous_approval_details, approvalNumber: e.target.value }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Previous Approval Letter</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.previous_approval_details?.approvalDate || ''} 
                onChange={e => setFormData({
                  ...formData,
                  previous_approval_details: { ...formData.previous_approval_details, approvalDate: e.target.value }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Approval Academic Year</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.previous_approval_details?.academicYear || '2025-2026'} 
                onChange={e => setFormData({
                  ...formData,
                  previous_approval_details: { ...formData.previous_approval_details, academicYear: e.target.value }
                })} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Official Approval Status &amp; Bureau Observations</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.previous_approval_details?.status || ''} 
              onChange={e => setFormData({
                ...formData,
                previous_approval_details: { ...formData.previous_approval_details, status: e.target.value }
              })} 
            />
          </div>
        </div>

        {/* Section 3: Campus Location & Official Contacts */}
        <div className="dashboard-content-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <MapPin size={20} className="text-emerald-600" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                3. Campus Address &amp; Official Contact Information
              </h3>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Permanent Campus Address *</label>
            <input 
              type="text" 
              required 
              className="form-input" 
              value={formData.address || ''} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
            />
          </div>

          <div className="form-grid-4">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input 
                type="text" 
                required 
                className="form-input" 
                value={formData.city || ''} 
                onChange={e => setFormData({ ...formData, city: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">District *</label>
              <input 
                type="text" 
                required 
                className="form-input" 
                value={formData.district || ''} 
                onChange={e => setFormData({ ...formData, district: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">State / UT *</label>
              <input 
                type="text" 
                required 
                className="form-input" 
                value={formData.state || ''} 
                onChange={e => setFormData({ ...formData, state: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">PIN Code *</label>
              <input 
                type="text" 
                required 
                maxLength={6} 
                className="form-input" 
                value={formData.pincode || ''} 
                onChange={e => setFormData({ ...formData, pincode: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Official Contact Email *</label>
              <input 
                type="email" 
                required 
                className="form-input" 
                value={formData.contact_email || ''} 
                onChange={e => setFormData({ ...formData, contact_email: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Telephone Number</label>
              <input 
                type="tel" 
                className="form-input" 
                value={formData.contact_phone || ''} 
                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Website URL</label>
              <input 
                type="url" 
                placeholder="https://..." 
                className="form-input" 
                value={formData.website || ''} 
                onChange={e => setFormData({ ...formData, website: e.target.value })} 
              />
            </div>
          </div>
        </div>

        {/* Section 4: Authorized Director/Principal & Representative Details */}
        <div className="dashboard-content-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} className="text-emerald-600" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                4. Authorized Director/Principal &amp; Institutional Representative
              </h3>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Director / Principal Full Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Dr. S. K. Sharma"
                value={formData.director_name || ''} 
                onChange={e => setFormData({ ...formData, director_name: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Director Official Email</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="director@institution.edu.in"
                value={formData.director_email || ''} 
                onChange={e => setFormData({ ...formData, director_email: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Director Contact Number</label>
              <input 
                type="tel" 
                className="form-input" 
                placeholder="+91 98765 00000"
                value={formData.director_phone || ''} 
                onChange={e => setFormData({ ...formData, director_phone: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Authorized Submitting Representative Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.representative_name || ''} 
                onChange={e => setFormData({ ...formData, representative_name: e.target.value })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Representative Designation</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.representative_designation || ''} 
                onChange={e => setFormData({ ...formData, representative_designation: e.target.value })} 
              />
            </div>
          </div>
        </div>

        {/* Section 5: Approved Programmes, Courses & Intake */}
        <div className="dashboard-content-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GraduationCap size={20} className="text-emerald-600" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                5. Approved Programmes, Courses &amp; Intake
              </h3>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Total Approved Courses: {(formData.approved_programmes || []).length}
            </span>
          </div>

          {/* Courses Table */}
          <div className="table-responsive-wrapper" style={{ marginBottom: '20px' }}>
            <table className="clean-data-table">
              <thead>
                <tr>
                  <th>Programme</th>
                  <th>Course / Discipline</th>
                  <th>Level</th>
                  <th>Approved Intake</th>
                  <th>Year Introduced</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(formData.approved_programmes || []).map(c => (
                  <tr key={c.id}>
                    <td><span className="badge badge-info">{c.programme}</span></td>
                    <td style={{ fontWeight: 600 }}>{c.course}</td>
                    <td>{c.level}</td>
                    <td><strong style={{ color: '#059669' }}>{c.approvedIntake}</strong></td>
                    <td>{c.yearStarted}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCourse(c.id)}
                        className="btn btn-outline-clean btn-xs"
                        style={{ color: '#e11d48', borderColor: '#fecdd3' }}
                        title="Remove Course"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Course Row */}
          <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '12px' }}>
              + Add Approved Course / Programme Slot:
            </div>
            <div className="form-grid-4">
              <input 
                type="text" 
                placeholder="Course Name (e.g. Mechanical Engineering)" 
                className="form-input" 
                value={newCourse} 
                onChange={e => setNewCourse(e.target.value)} 
              />
              <select 
                className="form-input" 
                value={newLevel} 
                onChange={e => setNewLevel(e.target.value)}
              >
                <option value="Under Graduate">Under Graduate (UG)</option>
                <option value="Post Graduate">Post Graduate (PG)</option>
                <option value="Diploma">Diploma</option>
                <option value="Post Graduate Diploma">PGDM</option>
              </select>
              <input 
                type="number" 
                placeholder="Intake (e.g. 60)" 
                className="form-input" 
                value={newIntake} 
                onChange={e => setNewIntake(Number(e.target.value))} 
              />
              <button 
                type="button" 
                onClick={handleAddCourse}
                className="btn btn-outline-clean btn-sm"
                style={{ backgroundColor: '#fff', borderColor: '#10b981', color: '#059669' }}
              >
                <Plus size={14} /> Add Course
              </button>
            </div>
          </div>
        </div>

        {/* Section 6: Faculty & Institutional Records */}
        <div className="dashboard-content-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={20} className="text-emerald-600" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                6. Faculty &amp; Institutional Norms Records
              </h3>
            </div>
          </div>

          <div className="form-grid-4">
            <div className="form-group">
              <label className="form-label">Total Full-Time Faculty</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.faculty_records?.totalFaculty || 0} 
                onChange={e => setFormData({
                  ...formData,
                  faculty_records: { ...formData.faculty_records, totalFaculty: Number(e.target.value) }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cadre Ratio (Prof:Assoc:Asst)</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.faculty_records?.cadreRatio || '1:2:6'} 
                onChange={e => setFormData({
                  ...formData,
                  faculty_records: { ...formData.faculty_records, cadreRatio: e.target.value }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ph.D. Qualified Faculty Count</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.faculty_records?.phdCount || 0} 
                onChange={e => setFormData({
                  ...formData,
                  faculty_records: { ...formData.faculty_records, phdCount: Number(e.target.value) }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Student-Faculty Ratio (SFR)</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.faculty_records?.studentFacultyRatio || '1:15'} 
                onChange={e => setFormData({
                  ...formData,
                  faculty_records: { ...formData.faculty_records, studentFacultyRatio: e.target.value }
                })} 
              />
            </div>
          </div>
        </div>

        {/* Section 7: Accreditation & Affiliation */}
        <div className="dashboard-content-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardHat size={20} className="text-emerald-600" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                7. Accreditation, Affiliation &amp; Infrastructure Records
              </h3>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">NAAC Grade</label>
              <input 
                type="text" 
                placeholder="e.g. A+ / A" 
                className="form-input" 
                value={formData.accreditation_details?.naacGrade || ''} 
                onChange={e => setFormData({
                  ...formData,
                  accreditation_details: { ...formData.accreditation_details, naacGrade: e.target.value }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">NBA Accredited Disciplines</label>
              <input 
                type="text" 
                placeholder="e.g. CSE, ECE" 
                className="form-input" 
                value={formData.accreditation_details?.nbaAccreditedCourses || ''} 
                onChange={e => setFormData({
                  ...formData,
                  accreditation_details: { ...formData.accreditation_details, nbaAccreditedCourses: e.target.value }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Affiliating University</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.accreditation_details?.affiliatingUniversity || ''} 
                onChange={e => setFormData({
                  ...formData,
                  accreditation_details: { ...formData.accreditation_details, affiliatingUniversity: e.target.value }
                })} 
              />
            </div>
          </div>

          <div className="form-grid-4">
            <div className="form-group">
              <label className="form-label">Total Land Area (Acres)</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                value={formData.infrastructure_details?.landAreaAcres || 0} 
                onChange={e => setFormData({
                  ...formData,
                  infrastructure_details: { ...formData.infrastructure_details, landAreaAcres: Number(e.target.value) }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Built-Up Area (Sqm)</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.infrastructure_details?.builtUpAreaSqm || 0} 
                onChange={e => setFormData({
                  ...formData,
                  infrastructure_details: { ...formData.infrastructure_details, builtUpAreaSqm: Number(e.target.value) }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Total Classrooms</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.infrastructure_details?.classroomsCount || 0} 
                onChange={e => setFormData({
                  ...formData,
                  infrastructure_details: { ...formData.infrastructure_details, classroomsCount: Number(e.target.value) }
                })} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Instructional Laboratories</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.infrastructure_details?.labsCount || 0} 
                onChange={e => setFormData({
                  ...formData,
                  infrastructure_details: { ...formData.infrastructure_details, labsCount: Number(e.target.value) }
                })} 
              />
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingBottom: '32px' }}>
          <button 
            type="submit" 
            disabled={saving} 
            className="btn btn-emerald-primary"
            style={{ padding: '12px 28px', fontSize: '0.9375rem' }}
          >
            <Save size={16} />
            {saving ? 'Saving Institutional Profile...' : 'Save & Persist Institution Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstitutionProfileView;
