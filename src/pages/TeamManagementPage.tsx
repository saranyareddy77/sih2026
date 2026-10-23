// AICTE SmartVerify — Super Admin Team & Officer Assignment Management
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Building2, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Search, 
  Filter, 
  Layers, 
  FolderPlus, 
  Plus, 
  ChevronRight,
  Shield,
  Clock,
  AlertCircle
} from 'lucide-react';
import { authService } from '../services/authService';
import { applicationService } from '../services/applicationService';
import { ScrutinyTeam, Profile, ApplicationAssignment, Application } from '../types';

export const TeamManagementPage: React.FC = () => {
  const isSuperAdmin = authService.isSuperAdmin();
  const [teams, setTeams] = useState<ScrutinyTeam[]>([]);
  const [officers, setOfficers] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<ApplicationAssignment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form state
  const [showAddOfficerModal, setShowAddOfficerModal] = useState<boolean>(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);
  const [showAssignAppModal, setShowAssignAppModal] = useState<boolean>(false);

  // Add Officer Form
  const [officerName, setOfficerName] = useState<string>('');
  const [officerEmail, setOfficerEmail] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [teamScope, setTeamScope] = useState<string>('Northern Region');

  // Add Member Form
  const [memberName, setMemberName] = useState<string>('');
  const [memberEmail, setMemberEmail] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Assign Application Form
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [assignTeamId, setAssignTeamId] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');

  // Search
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamData, apps] = await Promise.all([
        authService.getOfficersAndTeams(),
        applicationService.getApplications()
      ]);

      setTeams(teamData.teams);
      setOfficers(teamData.officers);
      setMembers(teamData.members);
      setAssignments(teamData.assignments);
      setApplications(apps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOfficerTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!officerName.trim() || !officerEmail.trim() || !teamName.trim()) {
      setMessage({ type: 'error', text: 'All required fields must be filled.' });
      return;
    }

    // In local/demo or DB, register the new officer & team
    const newOfficerId = `officer-${Date.now()}`;
    const newOfficerProfile: Profile = {
      id: newOfficerId,
      full_name: officerName.trim(),
      email: officerEmail.trim(),
      designation: 'Regional Scrutiny Officer',
      roles: ['scrutiny_officer', 'admin'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newTeam: ScrutinyTeam = {
      id: `team-${Date.now()}`,
      officer_id: newOfficerId,
      team_name: teamName.trim(),
      region_or_scope: teamScope,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      officer_profile: newOfficerProfile,
      members: []
    };

    setTeams([newTeam, ...teams]);
    setOfficers([newOfficerProfile, ...officers]);
    setShowAddOfficerModal(false);
    setOfficerName('');
    setOfficerEmail('');
    setTeamName('');
    setMessage({ 
      type: 'success', 
      text: `Scrutiny Officer ${officerName} and Team "${teamName}" created successfully.` 
    });
  };

  const handleAddMemberToTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!memberName.trim() || !memberEmail.trim() || !selectedTeamId) {
      setMessage({ type: 'error', text: 'Please fill out member details and select a scrutiny team.' });
      return;
    }

    const newMemberId = `member-${Date.now()}`;
    const newMemberProfile: Profile = {
      id: newMemberId,
      full_name: memberName.trim(),
      email: memberEmail.trim(),
      designation: 'Scrutiny Committee Member',
      roles: ['scrutiny_member', 'admin'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedTeams = teams.map(t => {
      if (t.id === selectedTeamId) {
        return {
          ...t,
          members: [
            ...(t.members || []),
            {
              id: `tm-${Date.now()}`,
              team_id: t.id,
              member_id: newMemberId,
              is_active: true,
              created_at: new Date().toISOString(),
              profile: newMemberProfile
            }
          ]
        };
      }
      return t;
    });

    setTeams(updatedTeams);
    setMembers([newMemberProfile, ...members]);
    setShowAddMemberModal(false);
    setMemberName('');
    setMemberEmail('');
    setMessage({ 
      type: 'success', 
      text: `Scrutiny Member ${memberName} assigned to team successfully.` 
    });
  };

  const handleAssignApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedAppId || !assignTeamId) {
      setMessage({ type: 'error', text: 'Please select an application and a scrutiny team.' });
      return;
    }

    const targetTeam = teams.find(t => t.id === assignTeamId);
    const newAssignment: ApplicationAssignment = {
      id: `assign-${Date.now()}`,
      application_id: selectedAppId,
      team_id: assignTeamId,
      officer_id: targetTeam?.officer_id,
      notes: assignNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      team: targetTeam
    };

    // Filter existing if any and append
    const updatedAssignments = assignments.filter(a => a.application_id !== selectedAppId);
    setAssignments([newAssignment, ...updatedAssignments]);
    setShowAssignAppModal(false);
    setSelectedAppId('');
    setAssignNotes('');
    setMessage({ 
      type: 'success', 
      text: 'Application assignment updated successfully.' 
    });
  };

  const filteredTeams = teams.filter(t => 
    t.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.region_or_scope?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.officer_profile?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Page Header */}
      <div className="page-header-clean">
        <div>
          <div className="page-category-label">
            <Users size={14} className="text-emerald-600" />
            <span>Super Administration • Role &amp; Team Management</span>
          </div>
          <h1 className="page-title">Scrutiny Team &amp; Workload Hierarchy</h1>
          <p className="page-subtext">
            Configure Scrutiny Officers, assign specialized committee members, and distribute institutional dossiers across scrutiny teams.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="page-header-actions">
            <button
              onClick={() => setShowAddOfficerModal(true)}
              className="btn btn-emerald-primary btn-sm"
            >
              <Plus size={15} />
              Add Scrutiny Officer
            </button>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="btn btn-outline-clean btn-sm"
            >
              <UserPlus size={15} />
              Add Team Member
            </button>
            <button
              onClick={() => setShowAssignAppModal(true)}
              className="btn btn-secondary-subtle btn-sm"
            >
              <FolderPlus size={15} />
              Assign Applications
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`auth-alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '24px' }}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <div>{message.text}</div>
        </div>
      )}

      {/* Hierarchy Flow Visual Card */}
      <div className="hierarchy-flow-card">
        <div className="flow-step">
          <div className="flow-badge super-admin">
            <ShieldCheck size={16} />
            <span>Super Admin</span>
          </div>
          <div className="flow-title">1 Central Authority</div>
          <div className="flow-desc">Full governance &amp; oversight</div>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-step">
          <div className="flow-badge officer">
            <Users size={16} />
            <span>Scrutiny Officers</span>
          </div>
          <div className="flow-title">{teams.length} Active Teams</div>
          <div className="flow-desc">Regional lead evaluators</div>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-step">
          <div className="flow-badge member">
            <UserPlus size={16} />
            <span>Assigned Members</span>
          </div>
          <div className="flow-title">
            {teams.reduce((acc, t) => acc + (t.members?.length || 0), 0)} Scrutiny Members
          </div>
          <div className="flow-desc">Finding verification desk</div>
        </div>

        <div className="flow-arrow">→</div>

        <div className="flow-step">
          <div className="flow-badge apps">
            <FileText size={16} />
            <span>Dossier Scope</span>
          </div>
          <div className="flow-title">{applications.length} Applications</div>
          <div className="flow-desc">Evidence verification</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="table-controls-strip">
        <div className="table-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search teams by officer name, team title, or regional scope..."
            className="table-search-input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Scrutiny Teams & Officers Grid */}
      <div className="teams-grid">
        {filteredTeams.length === 0 ? (
          <div className="empty-state-clean">
            <Users size={32} className="empty-icon" />
            <div className="empty-title">No Scrutiny Teams Found</div>
            <div className="empty-desc">Create your first Scrutiny Officer and team to begin distributing workloads.</div>
          </div>
        ) : (
          filteredTeams.map(team => (
            <div key={team.id} className="team-card">
              <div className="team-card-header">
                <div>
                  <h3 className="team-name">{team.team_name}</h3>
                  <span className="team-scope-tag">{team.region_or_scope || 'National Scope'}</span>
                </div>
                <span className="badge badge-passed">Active</span>
              </div>

              {/* Lead Officer Info */}
              <div className="team-officer-box">
                <div className="officer-label">Lead Scrutiny Officer</div>
                <div className="officer-name">{team.officer_profile?.full_name || 'Designated Officer'}</div>
                <div className="officer-email">{team.officer_profile?.email || 'officer@aicte-india.org'}</div>
              </div>

              {/* Assigned Members List */}
              <div className="team-members-box">
                <div className="members-header">
                  <span>Assigned Members ({team.members?.length || 0})</span>
                </div>
                {team.members && team.members.length > 0 ? (
                  <div className="members-chips">
                    {team.members.map(m => (
                      <span key={m.id} className="member-chip">
                        {m.profile?.full_name || 'Committee Member'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="no-members-text">No committee members assigned to this cell yet.</div>
                )}
              </div>

              {/* Team Footer Actions */}
              <div className="team-card-footer">
                <div className="team-app-count">
                  <FileText size={14} />
                  <span>
                    {assignments.filter(a => a.team_id === team.id).length} Assigned Dossiers
                  </span>
                </div>

                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setShowAddMemberModal(true);
                    }}
                    className="btn btn-outline-clean btn-xs"
                  >
                    <Plus size={12} />
                    Assign Member
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Officer Modal */}
      {showAddOfficerModal && (
        <div className="modal-overlay" onClick={() => setShowAddOfficerModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Authorize Scrutiny Officer &amp; Team</h2>
              <button onClick={() => setShowAddOfficerModal(false)} className="modal-close-btn">✕</button>
            </div>
            <form onSubmit={handleCreateOfficerTeam} style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Officer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajeshwari Sengupta"
                  className="form-input"
                  value={officerName}
                  onChange={e => setOfficerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official AICTE Email *</label>
                <input
                  type="email"
                  required
                  placeholder="r.sengupta@aicte-india.org"
                  className="form-input"
                  value={officerEmail}
                  onChange={e => setOfficerEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Team / Cell Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Western Regional Scrutiny Cell"
                  className="form-input"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Regional / Subject Scope</label>
                <select
                  className="form-input"
                  value={teamScope}
                  onChange={e => setTeamScope(e.target.value)}
                >
                  <option value="Northern Region">Northern Region (UP, UK, Delhi, Punjab, Haryana)</option>
                  <option value="Western Region">Western Region (Maharashtra, Gujarat, Goa)</option>
                  <option value="Southern Region">Southern Region (Karnataka, TN, Kerala, AP, Telangana)</option>
                  <option value="Eastern Region">Eastern &amp; North-Eastern Region</option>
                  <option value="Central Region">Central Region (MP, Chhattisgarh, Rajasthan)</option>
                  <option value="Specialized Technical / Pharmacy">Specialized Technical / Pharmacy Cell</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddOfficerModal(false)}
                  className="btn btn-secondary-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-emerald-primary"
                >
                  Authorize Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Add Scrutiny Member to Team</h2>
              <button onClick={() => setShowAddMemberModal(false)} className="modal-close-btn">✕</button>
            </div>
            <form onSubmit={handleAddMemberToTeam} style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Select Scrutiny Team *</label>
                <select
                  className="form-input"
                  required
                  value={selectedTeamId}
                  onChange={e => setSelectedTeamId(e.target.value)}
                >
                  <option value="">-- Select Team --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.team_name} ({t.officer_profile?.full_name || 'Lead Officer'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Member Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Anand Kulkarni"
                  className="form-input"
                  value={memberName}
                  onChange={e => setMemberName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Official Member Email *</label>
                <input
                  type="email"
                  required
                  placeholder="a.kulkarni@aicte-india.org"
                  className="form-input"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="btn btn-secondary-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-emerald-primary"
                >
                  Assign to Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Application Modal */}
      {showAssignAppModal && (
        <div className="modal-overlay" onClick={() => setShowAssignAppModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>Assign Application Dossier to Team</h2>
              <button onClick={() => setShowAssignAppModal(false)} className="modal-close-btn">✕</button>
            </div>
            <form onSubmit={handleAssignApplication} style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Select Application Dossier *</label>
                <select
                  className="form-input"
                  required
                  value={selectedAppId}
                  onChange={e => setSelectedAppId(e.target.value)}
                >
                  <option value="">-- Select Application --</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.application_number} — {app.institution?.name} ({app.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To Scrutiny Team *</label>
                <select
                  className="form-input"
                  required
                  value={assignTeamId}
                  onChange={e => setAssignTeamId(e.target.value)}
                >
                  <option value="">-- Select Team --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.team_name} — {t.officer_profile?.full_name} ({t.region_or_scope})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Special Scrutiny Notes / Instructions</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Verify land deed registration seal and architectural FSI norms..."
                  value={assignNotes}
                  onChange={e => setAssignNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowAssignAppModal(false)}
                  className="btn btn-secondary-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-emerald-primary"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
