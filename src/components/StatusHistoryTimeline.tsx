// AICTE SmartVerify — Status History & Audit Trail Component
// SIH Problem Statement 26261

import React from 'react';
import { Clock, CheckCircle2, User, Cpu, ArrowRight } from 'lucide-react';
import { ApplicationStatusHistory } from '../types';

interface StatusHistoryTimelineProps {
  history: ApplicationStatusHistory[];
}

export const StatusHistoryTimeline: React.FC<StatusHistoryTimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
        <Clock size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
        <p style={{ fontSize: '0.875rem' }}>No status transitions recorded yet.</p>
      </div>
    );
  }

  // Sort descending (latest on top)
  const sorted = [...history].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute',
        top: '10px',
        bottom: '10px',
        left: '9px',
        width: '2px',
        backgroundColor: 'var(--border-subtle)'
      }} />

      {sorted.map((item, idx) => {
        const isLatest = idx === 0;
        const isSystem = item.actor_name.toLowerCase().includes('engine') || item.actor_name.toLowerCase().includes('system');

        return (
          <div key={item.id} style={{ position: 'relative', marginBottom: '20px' }}>
            {/* Dot icon */}
            <div style={{
              position: 'absolute',
              left: '-24px',
              top: '2px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: isLatest ? 'var(--color-primary)' : '#ffffff',
              border: `2px solid ${isLatest ? 'var(--color-primary)' : 'var(--border-strong)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isLatest && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />}
            </div>

            {/* Timeline content */}
            <div style={{
              backgroundColor: isLatest ? 'var(--bg-subtle)' : '#ffffff',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.previous_status && (
                    <>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.previous_status}</span>
                      <ArrowRight size={12} color="var(--text-muted)" />
                    </>
                  )}
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.new_status}
                  </span>
                </div>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {item.reason}
              </p>

              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isSystem ? <Cpu size={12} /> : <User size={12} />}
                <span>Actor: <strong>{item.actor_name}</strong></span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
