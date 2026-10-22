// AICTE SmartVerify — Evidence-Linked Document Preview & Field Inspector
// SIH Problem Statement 26261

import React, { useState, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCw, 
  AlertTriangle, 
  FileX, 
  FileText, 
  CheckCircle2, 
  Download,
  Eye,
  Info,
  Edit2,
  Check,
  X,
  Shield,
  Layers,
  Code
} from 'lucide-react';
import { ApplicationDocument, AuthorityVerificationResult, ExtractedFieldItem } from '../types';
import { documentService } from '../services/documentService';
import { SYNTHETIC_BANNER_TEXT } from '../data/syntheticDemoData';

interface DocumentViewerProps {
  document: ApplicationDocument | null;
  onClose?: () => void;
  onCorrectField?: (documentId: string, fieldName: string, correctedValue: string) => void;
  onTriggerAuthorityVerification?: (documentType: string) => void;
  authorityResult?: AuthorityVerificationResult;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  document, 
  onCorrectField,
  onTriggerAuthorityVerification,
  authorityResult 
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [viewerTab, setViewerTab] = useState<'preview' | 'evidence' | 'raw_text' | 'authority'>('preview');

  // Inline field editing state
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editingFieldValue, setEditingFieldValue] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setHasError(false);
    setErrorMessage('');
    setZoomLevel(100);
    setRotation(0);
    setEditingFieldKey(null);

    if (!document) {
      setLoading(false);
      return;
    }

    if (document.is_corrupt || document.original_name.toLowerCase().includes('corrupt') || document.original_name.toLowerCase().includes('damaged')) {
      setHasError(true);
      setErrorMessage(
        `Document Parsing Error: The file "${document.original_name}" stream is corrupted or premature EOF was reached. Scanners or upload transmission damaged the PDF binary structure.`
      );
      setLoading(false);
      return;
    }

    documentService.getPreviewUrl(document).then(url => {
      if (isMounted) {
        setPreviewUrl(url);
        setLoading(false);
      }
    }).catch(err => {
      if (isMounted) {
        setHasError(true);
        setErrorMessage(`Failed to load document stream: ${err.message || 'Unknown render error'}`);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [document]);

  if (!document) {
    return (
      <div className="doc-preview-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
          <FileText size={48} strokeWidth={1.5} style={{ marginBottom: '12px', opacity: 0.6 }} />
          <h3>No Document Selected</h3>
          <p style={{ fontSize: '0.875rem' }}>Select an attachment from the document list to inspect its contents, extracted evidence, and validation findings.</p>
        </div>
      </div>
    );
  }

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 20, 50));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const startEditField = (key: string, currentValue?: string) => {
    setEditingFieldKey(key);
    setEditingFieldValue(currentValue || '');
  };

  const saveEditField = (key: string) => {
    if (onCorrectField && document) {
      onCorrectField(document.id, key, editingFieldValue);
    }
    setEditingFieldKey(null);
  };

  const detailedFields = document.extracted_fields?.detailedFields || {};
  const standardFields = [
    { key: 'institutionName', label: 'Institution Name' },
    { key: 'institutionCode', label: 'AICTE Permanent Institute ID' },
    { key: 'documentNumber', label: 'Certificate / Order Reference No.' },
    { key: 'issueDate', label: 'Date of Issue' },
    { key: 'expiryDate', label: 'Regulatory Expiry Date' },
    { key: 'issuingAuthority', label: 'Issuing Statutory Authority' }
  ];

  return (
    <div className="doc-preview-panel">
      {/* Viewer Header Strip */}
      <div className="preview-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            {document.document_type}
          </span>
          {document.version && document.version > 1 && (
            <span className="badge badge-info" style={{ fontSize: '0.625rem' }}>v{document.version} Replaced</span>
          )}
          {document.is_corrupt ? (
            <span className="badge badge-failed">Corrupt / Unreadable</span>
          ) : (
            <span className="badge badge-passed">Rendered</span>
          )}
        </div>

        {/* View Mode Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setViewerTab('preview')}
            className={`btn btn-sm ${viewerTab === 'preview' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
          >
            <Eye size={12} /> Preview
          </button>
          <button
            onClick={() => setViewerTab('evidence')}
            className={`btn btn-sm ${viewerTab === 'evidence' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
          >
            <Layers size={12} /> Extracted Fields
          </button>
          <button
            onClick={() => setViewerTab('raw_text')}
            className={`btn btn-sm ${viewerTab === 'raw_text' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
          >
            <Code size={12} /> Raw Text
          </button>
          <button
            onClick={() => setViewerTab('authority')}
            className={`btn btn-sm ${viewerTab === 'authority' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.6875rem', padding: '2px 8px' }}
          >
            <Shield size={12} /> Authority Check
          </button>
        </div>

        {/* Zoom Controls (only in preview tab) */}
        {viewerTab === 'preview' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button 
              onClick={handleZoomOut} 
              className="btn btn-outline btn-sm" 
              title="Zoom Out"
              disabled={hasError}
              style={{ padding: '2px 6px' }}
            >
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, width: '36px', textAlign: 'center' }}>
              {zoomLevel}%
            </span>
            <button 
              onClick={handleZoomIn} 
              className="btn btn-outline btn-sm" 
              title="Zoom In"
              disabled={hasError}
              style={{ padding: '2px 6px' }}
            >
              <ZoomIn size={13} />
            </button>
            <button 
              onClick={handleRotate} 
              className="btn btn-outline btn-sm" 
              title="Rotate Clockwise"
              disabled={hasError}
              style={{ padding: '2px 6px' }}
            >
              <RotateCw size={13} />
            </button>
            <button 
              onClick={handleResetZoom} 
              className="btn btn-outline btn-sm" 
              title="Reset Zoom"
              disabled={hasError}
              style={{ padding: '2px 6px' }}
            >
              <Maximize2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Synthetic Watermark Reminder */}
      <div style={{ backgroundColor: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '4px 12px', fontSize: '0.6875rem', color: '#92400e', textAlign: 'center', fontWeight: 600 }}>
        {SYNTHETIC_BANNER_TEXT}
      </div>

      {/* Main Viewport Content */}
      <div className="preview-viewport" style={{ overflowY: 'auto', maxHeight: '580px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
            <p>Loading document stream...</p>
          </div>
        ) : hasError ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px dashed #f87171',
            borderRadius: '8px',
            padding: '32px 24px',
            maxWidth: '520px',
            margin: '20px auto',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <FileX size={54} color="#dc2626" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: '#991b1b', marginBottom: '8px' }}>Controlled Preview Error</h3>
            <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '12px',
              fontSize: '0.75rem',
              color: '#991b1b',
              textAlign: 'left',
              marginBottom: '16px'
            }}>
              <strong>Regulatory Action Required:</strong>
              <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
                <li>Do not attempt to certify unreadable scanned files.</li>
                <li>The institution must export a fresh, uncorrupted PDF or 300 DPI PNG scan.</li>
                <li>Ensure the PDF format complies with standard ISO 32000-1 specification.</li>
              </ul>
            </div>
            <span className="badge badge-failed" style={{ fontSize: '0.8125rem', padding: '6px 12px' }}>
              Check Result: Failed (Corrupt Document Payload)
            </span>
          </div>
        ) : viewerTab === 'preview' ? (
          previewUrl ? (
            <div style={{
              transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
              maxWidth: '100%',
              textAlign: 'center'
            }}>
              <img 
                src={previewUrl} 
                alt={document.document_type}
                style={{
                  width: '100%',
                  maxHeight: '850px',
                  objectFit: 'contain',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1'
                }}
                onError={() => {
                  setHasError(true);
                  setErrorMessage('Unable to decode document raster stream.');
                }}
              />
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>Document preview is unavailable.</p>
          )
        ) : viewerTab === 'evidence' ? (
          /* TAB 2: Extracted Fields & Evidence Snippets */
          <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '6px' }}>
            <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                Evidence-Linked Field Extraction
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Field values extracted from original stream with provenance tracking, genuine confidence scores, and page references.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {standardFields.map(field => {
                const detailed = detailedFields[field.key];
                const rawVal = (document.extracted_fields as any)?.[field.key];
                const isEditing = editingFieldKey === field.key;

                return (
                  <div 
                    key={field.key}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                        {field.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {detailed?.method ? (
                          <span className={`badge ${detailed.method === 'manual_correction' ? 'badge-needs-review' : 'badge-passed'}`} style={{ fontSize: '0.625rem' }}>
                            {detailed.method.replace('_', ' ')}
                          </span>
                        ) : null}
                        {detailed?.pageNumber && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            Page {detailed.pageNumber}
                          </span>
                        )}
                        {!isEditing && onCorrectField && (
                          <button
                            onClick={() => startEditField(field.key, rawVal)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '1px 6px', fontSize: '0.6875rem' }}
                            title="Correct this extracted value"
                          >
                            <Edit2 size={10} /> Correct
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Value or Inline Edit Box */}
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <input
                          type="text"
                          value={editingFieldValue}
                          onChange={e => setEditingFieldValue(e.target.value)}
                          className="input"
                          style={{ flex: 1, fontSize: '0.8125rem', padding: '4px 8px' }}
                          placeholder={`Enter corrected ${field.label}...`}
                        />
                        <button
                          onClick={() => saveEditField(field.key)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 8px' }}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingFieldKey(null)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: rawVal ? 'var(--text-primary)' : '#94a3b8' }}>
                        {rawVal || '[Not Detected in Document Stream]'}
                      </div>
                    )}

                    {/* Evidence Snippet */}
                    {detailed?.evidenceSnippet && (
                      <div style={{
                        marginTop: '6px',
                        padding: '6px 8px',
                        backgroundColor: '#ffffff',
                        border: '1px dashed #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.6875rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace'
                      }}>
                        <strong>Supporting Evidence Excerpt:</strong>
                        <div style={{ marginTop: '2px', color: '#0f172a' }}>{detailed.evidenceSnippet}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : viewerTab === 'raw_text' ? (
          /* TAB 3: Raw Extracted Text */
          <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Raw Text Stream Extracted via PDF.js Parser
            </h4>
            {document.extracted_fields?.rawExtractedText ? (
              <pre style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '0.75rem',
                color: '#334155',
                whiteSpace: 'pre-wrap',
                maxHeight: '480px',
                overflowY: 'auto'
              }}>
                {document.extracted_fields.rawExtractedText}
              </pre>
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                No embedded text stream was found in this file (scanned image / raster PDF).
              </p>
            )}
          </div>
        ) : (
          /* TAB 4: Authority Verification Connector */
          <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '6px' }}>
            <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                Third-Party Issuing Authority Verification
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Simulated National Regulatory Gateway Adapter for testing issuing authority cross-checks.
              </p>
            </div>

            {authorityResult ? (
              <div style={{
                border: `1px solid ${authorityResult.status === 'Verified by Source' ? '#a7f3d0' : '#fecaca'}`,
                backgroundColor: authorityResult.status === 'Verified by Source' ? '#f0fdf4' : '#fef2f2',
                borderRadius: '6px',
                padding: '14px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: authorityResult.status === 'Verified by Source' ? '#065f46' : '#991b1b' }}>
                    Status: {authorityResult.status}
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '0.625rem' }}>SIMULATED GATEWAY</span>
                </div>
                <p style={{ fontSize: '0.8125rem', margin: '0 0 8px 0', color: '#1f2937' }}>
                  {authorityResult.responseSummary}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Provider: <strong>{authorityResult.providerName}</strong> | Reference: <code>{authorityResult.referenceNumber}</code>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 12px', border: '1px dashed var(--border-subtle)', borderRadius: '6px', marginBottom: '14px' }}>
                <Shield size={32} style={{ opacity: 0.5, marginBottom: '8px' }} />
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  No live query has been dispatched to the state/municipal registry for this document slot yet.
                </p>
                {onTriggerAuthorityVerification && (
                  <button
                    onClick={() => onTriggerAuthorityVerification(document.document_type)}
                    className="btn btn-primary btn-sm"
                  >
                    Query Issuing Authority Registry (Simulated)
                  </button>
                )}
              </div>
            )}

            <div style={{ fontSize: '0.6875rem', color: '#92400e', backgroundColor: '#fffbeb', border: '1px solid #fde68a', padding: '8px 12px', borderRadius: '4px' }}>
              <strong>Notice:</strong> This connector runs against deterministic synthetic registry test cases for the SIH prototype. Live production statutory gateways require official state API credentials.
            </div>
          </div>
        )}
      </div>

      {/* Document Metadata Footer */}
      <div style={{
        background: '#ffffff',
        borderTop: '1px solid var(--border-subtle)',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <span>File Size: {(document.file_size / 1024).toFixed(1)} KB | Format: {document.mime_type}</span>
        {document.checksum && (
          <span title={document.checksum}>
            SHA-256: <code>{document.checksum.substring(0, 16)}...</code>
          </span>
        )}
      </div>
    </div>
  );
};

