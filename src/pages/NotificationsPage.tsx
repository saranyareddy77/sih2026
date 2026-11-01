// AICTE SmartVerify — In-App Notifications Center (Strictly No Email)
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  ExternalLink,
  Clock,
  Trash2
} from 'lucide-react';
import { NotificationItem } from '../types';
import { notificationService } from '../services/notificationService';
import { authService } from '../services/authService';

export const NotificationsPage: React.FC = () => {
  const currentUser = authService.getCurrentUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    notificationService.filterForUser(notificationService.getAllLocal(), currentUser)
  );
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    notificationService.getNotifications(currentUser);
    const unsub = notificationService.subscribe(items => {
      const roleItems = notificationService.filterForUser(items, currentUser);
      setNotifications(roleItems);
    });
    return () => unsub();
  }, [currentUser]);

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  const filtered = notifications.filter(n => filter === 'all' || !n.is_read);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#059669" />;
      case 'error':
      case 'action_required':
        return <AlertTriangle size={18} color="#dc2626" />;
      case 'warning':
        return <AlertTriangle size={18} color="#d97706" />;
      default:
        return <Info size={18} color="#0284c7" />;
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '860px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1>In-App Notifications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            System dispatches, regulatory alerts, and official scrutiny desk updates (In-App Only).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')} 
            className="btn btn-outline btn-sm"
          >
            {filter === 'all' ? 'Show Unread Only' : 'Show All'}
          </button>
          <button 
            onClick={handleMarkAllRead} 
            className="btn btn-outline btn-sm"
          >
            <CheckCheck size={14} />
            Mark All Read
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <Bell size={42} style={{ opacity: 0.4, marginBottom: '12px' }} />
            <p>No {filter === 'unread' ? 'unread' : ''} notifications found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: item.is_read ? '#ffffff' : '#f0f9ff',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {getIcon(item.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h4>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
                    {item.message}
                  </p>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {(item.action_url || item.application_id) && (
                      <Link 
                        to={item.action_url || `/applications/${item.application_id}`}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                      >
                        <ExternalLink size={12} />
                        View Application Dossier
                      </Link>
                    )}

                    {!item.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(item.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
