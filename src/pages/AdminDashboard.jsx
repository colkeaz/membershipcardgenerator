import React, { useEffect, useRef, useState } from 'react';
import {
  collection, getDocs, doc, updateDoc, writeBatch,
  query, orderBy, where, limit, startAfter,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import MembershipCard from '../components/MembershipCard';
import { exportCardAsPNG } from '../utils/cardExport';
import { parseCSV, exportToCSV } from '../utils/csvParser';
import { generateMembershipNumber, getCurrentSchoolYear, getCurrentSemester } from '../utils/memberNumber';
import {
  Users, CheckCircle, XCircle, Upload, Download,
  Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, X, AlertOctagon
} from 'lucide-react';
import QRCode from 'qrcode';
import { signCard, buildVerifyUrl } from '../utils/cardSigning';
import './AdminDashboard.css';

const PAGE_SIZE = 25;
const STATUS_OPTS   = ['all', 'pending', 'active', 'inactive'];
const YEAR_OPTS     = ['all', '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

export default function AdminDashboard() {
  const { member: self } = useAuth();
  const toast = useToast();

  // ── State ──
  const [members,      setMembers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter,   setYearFilter]   = useState('all');
  const [page,         setPage]         = useState(0);   // client-side page
  const [stats,        setStats]        = useState({ total:0, active:0, pending:0, inactive:0 });

  // CSV
  const [csvPreview,   setCsvPreview]   = useState(null);
  const [importing,    setImporting]    = useState(false);
  const fileInputRef   = useRef();

  // Card preview modal
  const [previewMember, setPreviewMember] = useState(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState('');
  const previewCardRef = useRef(null);

  // Deactivate All modal
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatingAll, setDeactivatingAll]         = useState(false);

  // Generate QR for preview card modal
  useEffect(() => {
    if (!previewMember) {
      setPreviewQrDataUrl('');
      return;
    }
    let cancelled = false;
    async function genPreviewQR() {
      try {
        const sig = await signCard(previewMember.membershipNumber, previewMember.id);
        const url = buildVerifyUrl(previewMember.membershipNumber, previewMember.id, sig);
        const dataUrl = await QRCode.toDataURL(url, {
          width: 180, margin: 1,
          color: { dark: '#1a0000', light: '#fff8f0' },
          errorCorrectionLevel: 'H',
        });
        if (!cancelled) setPreviewQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate preview QR:', err);
      }
    }
    genPreviewQR();
    return () => { cancelled = true; };
  }, [previewMember]);

  // ── Fetch all members (capped at 50k, paginated client-side) ──
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'members'), orderBy('createdAt', 'desc')));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembers(data);
      setStats({
        total:    data.length,
        active:   data.filter(m => m.status === 'active').length,
        pending:  data.filter(m => m.status === 'pending').length,
        inactive: data.filter(m => m.status === 'inactive').length,
      });
    } catch (err) {
      console.error(err);
      toast('Failed to load members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // ── Filtered + searched list ──
  const filtered = members.filter(m => {
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchYear   = yearFilter   === 'all' || m.yearLevel === yearFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || m.fullName?.toLowerCase().includes(q)
      || m.studentId?.toLowerCase().includes(q)
      || m.membershipNumber?.toLowerCase().includes(q)
      || (m.program || m.course)?.toLowerCase().includes(q);
    return matchStatus && matchYear && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [search, statusFilter, yearFilter]);

  // ── Actions ──
  const updateStatus = async (uid, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'active') {
        // Automatically renew/stamp current academic year & semester
        updates.schoolYear = getCurrentSchoolYear();
        updates.semester   = getCurrentSemester();
      }
      await updateDoc(doc(db, 'members', uid), updates);
      setMembers(prev => prev.map(m => m.id === uid ? { ...m, ...updates } : m));
      setStats(prev => {
        const old = members.find(m => m.id === uid)?.status;
        return {
          ...prev,
          [old]: Math.max(0, (prev[old] || 0) - 1),
          [newStatus]: (prev[newStatus] || 0) + 1,
        };
      });
      toast(`Member ${newStatus === 'active' ? 'approved & renewed for ' + updates.semester : 'deactivated'}.`, 'success');
    } catch { toast('Action failed. Please try again.', 'error'); }
  };

  // ── Deactivate All Members (for new semester renewal) ──
  const confirmDeactivateAll = async () => {
    setDeactivatingAll(true);
    try {
      const activeMembers = members.filter(m => m.status === 'active');
      if (activeMembers.length === 0) {
        setShowDeactivateModal(false);
        return;
      }

      const BATCH_SIZE = 499;
      for (let i = 0; i < activeMembers.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = activeMembers.slice(i, i + BATCH_SIZE);
        chunk.forEach((m) => {
          batch.update(doc(db, 'members', m.id), { status: 'inactive' });
        });
        await batch.commit();
      }

      setMembers(prev => prev.map(m => m.status === 'active' ? { ...m, status: 'inactive' } : m));
      setStats(prev => ({
        ...prev,
        active: 0,
        inactive: prev.inactive + activeMembers.length,
      }));

      toast(`All ${activeMembers.length} active members deactivated for the new semester.`, 'success');
      setShowDeactivateModal(false);
    } catch (err) {
      console.error(err);
      toast('Failed to deactivate members. Please try again.', 'error');
    } finally {
      setDeactivatingAll(false);
    }
  };

  // Fixed: MED-02 Client-side check preventing non-admin role escalation as per audit
  const updateRole = async (uid, newRole) => {
    if (self?.role !== 'admin') { toast('Only admins can change roles.', 'error'); return; }
    try {
      await updateDoc(doc(db, 'members', uid), { role: newRole });
      setMembers(prev => prev.map(m => m.id === uid ? { ...m, role: newRole } : m));
      toast('Role updated.', 'success');
    } catch { toast('Failed to update role.', 'error'); }
  };

  // ── CSV Import ──
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseCSV(file);
      setCsvPreview(parsed);
    } catch (err) {
      toast(`CSV parse error: ${err.message}`, 'error');
    }
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!csvPreview?.length) return;
    setImporting(true);

    try {
      // Get current counter
      const counterSnap = await getDocs(query(collection(db, 'org'), limit(1)));
      let seq = counterSnap.empty ? 0 : (counterSnap.docs[0].data().count || 0);

      // Batch writes (max 500 per batch)
      const BATCH_SIZE = 499;
      for (let i = 0; i < csvPreview.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const chunk = csvPreview.slice(i, i + BATCH_SIZE);
        chunk.forEach((row) => {
          seq++;
          const ref = doc(collection(db, 'members'));
          // Fixed: MED-03 Tracking imported member documents to avoid orphan records as per audit
          batch.set(ref, {
            ...row,
            importedBy: self?.uid || 'admin',
            importedAt: serverTimestamp(),
            membershipNumber: generateMembershipNumber(seq),
            schoolYear: getCurrentSchoolYear(),
            semester:   getCurrentSemester(),
            status:     'pending',
            role:       'member',
          });
        });
        // Update counter
        const counterRef = doc(db, 'org', 'memberCounter');
        batch.set(counterRef, { count: seq }, { merge: true });
        await batch.commit();
      }

      toast(`Imported ${csvPreview.length} members successfully!`, 'success');
      setCsvPreview(null);
      fetchMembers();
    } catch (err) {
      console.error(err);
      toast('Import failed. Check your CSV and try again.', 'error');
    } finally {
      setImporting(false);
    }
  };

  // ── Card preview export ──
  const handlePreviewExport = async () => {
    try {
      await exportCardAsPNG(previewCardRef, `SSC-AL_Card_${previewMember?.fullName?.replace(/\s+/g,'_')}.png`);
      toast('Card downloaded!', 'success');
    } catch { toast('Export failed.', 'error'); }
  };

  return (
    <main className="admin-page">
      <div className="admin-bg" aria-hidden="true" />
      <div className="container admin-container">

        {/* Header */}
        <div className="admin-header">
          <div>
            <h1 className="admin-title">
              <Users size={28} style={{ color: 'var(--color-gold)' }} />
              Member Dashboard
            </h1>
            <p className="admin-sub">Manage SSC-AL memberships · AY {getCurrentSchoolYear()}</p>
          </div>
          <div className="admin-header-actions">
            <button id="btn-refresh" className="btn btn-ghost btn-sm" onClick={fetchMembers} disabled={loading} aria-label="Refresh members">
              <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
            </button>
            <button id="btn-export-csv" className="btn btn-outline btn-sm" onClick={() => exportToCSV(filtered)}>
              <Download size={15} /> Export CSV
            </button>
            <button id="btn-import-csv" className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={15} /> Import CSV
            </button>
            {self?.role === 'admin' && (
              <button
                id="btn-deactivate-all"
                className="btn btn-outline-danger btn-sm"
                onClick={() => setShowDeactivateModal(true)}
                disabled={loading || stats.active === 0}
                title="Deactivate all active members when a new semester starts"
              >
                <AlertOctagon size={15} /> Deactivate All (New Term)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display:'none' }}
              onChange={handleFileChange}
              aria-label="Upload CSV file"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <StatCard label="Total Members" value={stats.total}    color="text" />
          <StatCard label="Active"         value={stats.active}   color="success" />
          <StatCard label="Pending"        value={stats.pending}  color="warning" />
          <StatCard label="Inactive"       value={stats.inactive} color="error" />
        </div>

        {/* Filters */}
        <div className="admin-filters glass">
          <div className="admin-search-wrap">
            <Search size={16} className="admin-search-icon" />
            <input
              id="admin-search"
              type="text"
              className="admin-search"
              placeholder="Search by name, student ID, membership no…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search members"
            />
          </div>
          <div className="admin-filter-group">
            <Filter size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
            <select
              id="filter-status"
              className="form-select admin-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              {STATUS_OPTS.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select
              id="filter-year"
              className="form-select admin-select"
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              aria-label="Filter by year level"
            >
              {YEAR_OPTS.map(y => <option key={y} value={y}>{y === 'all' ? 'All Years' : y}</option>)}
            </select>
          </div>
          <span className="admin-count">{filtered.length} results</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="admin-loading">
            <div className="spinner" />
            <span>Loading members…</span>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table aria-label="Members table">
                <thead>
                  <tr>
                    <th>Member No.</th>
                    <th>Full Name</th>
                    <th>SR-Code</th>
                    <th>Program</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th style={{ textAlign:'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign:'center', color:'var(--color-text-dim)', padding:'40px' }}>
                        No members found.
                      </td>
                    </tr>
                  ) : paginated.map(m => (
                    <tr key={m.id}>
                      <td>
                        <span style={{ fontFamily:'monospace', fontSize:'0.8rem', color:'var(--color-gold)' }}>
                          {m.membershipNumber}
                        </span>
                      </td>
                      <td style={{ fontWeight:600 }}>{m.fullName}</td>
                      <td style={{ fontFamily:'monospace', fontSize:'0.85rem' }}>{m.studentId}</td>
                      <td style={{ fontSize:'0.82rem', color:'var(--color-text-muted)', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {m.program || m.course}
                      </td>
                      <td style={{ fontSize:'0.85rem' }}>{m.yearLevel}</td>
                      <td>
                        <span className={`badge badge-${m.status}`}>{m.status}</span>
                      </td>
                      <td>
                        {self?.role === 'admin' ? (
                          <select
                            className="form-select"
                            style={{ padding:'4px 28px 4px 8px', fontSize:'0.78rem', width:'auto', minWidth:'90px' }}
                            value={m.role}
                            onChange={e => updateRole(m.id, e.target.value)}
                            aria-label={`Role for ${m.fullName}`}
                          >
                            <option value="member">Member</option>
                            <option value="officer">Officer</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span style={{ fontSize:'0.82rem', color:'var(--color-text-muted)' }}>{m.role}</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions">
                          {/* Preview card */}
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => setPreviewMember(m)}
                            title="Preview card"
                            aria-label={`Preview card for ${m.fullName}`}
                          >
                            <Eye size={15} />
                          </button>
                          {/* Approve */}
                          {m.status !== 'active' && (
                            <button
                              className="btn btn-sm"
                              style={{ background:'rgba(34,197,94,0.15)', color:'#4ade80', border:'1px solid rgba(34,197,94,0.2)' }}
                              onClick={() => updateStatus(m.id, 'active')}
                              title="Approve"
                              aria-label={`Approve ${m.fullName}`}
                            >
                              <CheckCircle size={14} /> Approve
                            </button>
                          )}
                          {/* Deactivate */}
                          {m.status === 'active' && (
                            <button
                              className="btn btn-sm"
                              style={{ background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)' }}
                              onClick={() => updateStatus(m.id, 'inactive')}
                              title="Deactivate"
                              aria-label={`Deactivate ${m.fullName}`}
                            >
                              <XCircle size={14} /> Deactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" role="navigation" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pg = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i;
                  return (
                    <button key={pg} className={pg === page ? 'active' : ''} onClick={() => setPage(pg)}>
                      {pg + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CSV Preview Modal ── */}
      {csvPreview && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="CSV Import Preview">
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ fontSize:'1.2rem' }}>Import Preview</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setCsvPreview(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize:'0.85rem', color:'var(--color-text-muted)', marginBottom:16 }}>
              {csvPreview.length} member{csvPreview.length !== 1 ? 's' : ''} found in CSV. All will be imported as <strong>pending</strong>.
            </p>
            <div className="csv-preview-list">
              {csvPreview.slice(0, 10).map((m, i) => (
                <div key={i} className="csv-preview-row">
                  <span style={{ fontWeight:600 }}>{m.fullName || '—'}</span>
                  <span style={{ fontSize:'0.8rem', color:'var(--color-text-muted)' }}>{m.studentId}</span>
                  <span style={{ fontSize:'0.8rem', color:'var(--color-text-dim)' }}>{m.course} · {m.yearLevel}</span>
                </div>
              ))}
              {csvPreview.length > 10 && (
                <p style={{ fontSize:'0.8rem', color:'var(--color-text-dim)', textAlign:'center', padding:'8px 0' }}>
                  …and {csvPreview.length - 10} more
                </p>
              )}
            </div>
            <div style={{ display:'flex', gap:12, marginTop:24, justifyContent:'flex-end' }}>
              <button id="btn-cancel-import" className="btn btn-outline" onClick={() => setCsvPreview(null)}>Cancel</button>
              <button id="btn-confirm-import" className="btn btn-primary" onClick={confirmImport} disabled={importing}>
                {importing ? <><span className="spinner spinner-sm" /> Importing…</> : `Import ${csvPreview.length} Members`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Card Preview Modal ── */}
      {previewMember && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Card Preview">
          <div className="modal" style={{ maxWidth:'520px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize:'1.1rem' }}>Card Preview — {previewMember.fullName}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setPreviewMember(null)} aria-label="Close preview">
                <X size={18} />
              </button>
            </div>
            <div style={{ display:'flex', justifyContent:'center', padding:'20px 0' }}>
              <MembershipCard ref={previewCardRef} member={previewMember} qrDataUrl={previewQrDataUrl} />
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setPreviewMember(null)}>Close</button>
              <button id="btn-download-preview-card" className="btn btn-gold btn-sm" onClick={handlePreviewExport}>
                <Download size={15} /> Download PNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate All Confirmation Modal ── */}
      {showDeactivateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm Deactivate All">
          <div className="modal" style={{ maxWidth:'480px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize:'1.15rem', color:'#f87171', display:'flex', alignItems:'center', gap:8 }}>
                <AlertOctagon size={20} /> Reset for New Semester
              </h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDeactivateModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div style={{ padding:'16px 0', display:'flex', flexDirection:'column', gap:12 }}>
              <p style={{ fontSize:'0.9rem', lineHeight:1.5, margin:0 }}>
                Are you sure you want to deactivate all <strong>{stats.active}</strong> currently active members?
              </p>
              <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'12px', fontSize:'0.82rem', color:'var(--color-text-muted)', lineHeight:1.4 }}>
                <strong style={{ color:'#f87171', display:'block', marginBottom:4 }}>What will happen:</strong>
                • Member cards will change to "Membership Inactive / Expired".<br/>
                • Students will see a "Renew Membership" button directing to payment.<br/>
                • Their SR-Code and Member Number are preserved permanently.<br/>
                • When an officer clicks "Approve" upon receiving proof of payment, their card immediately updates to the new semester!
              </div>
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:8 }}>
              <button className="btn btn-outline" onClick={() => setShowDeactivateModal(false)} disabled={deactivatingAll}>
                Cancel
              </button>
              <button
                id="btn-confirm-deactivate-all"
                className="btn btn-danger"
                onClick={confirmDeactivateAll}
                disabled={deactivatingAll}
              >
                {deactivatingAll ? <><span className="spinner spinner-sm" /> Deactivating…</> : `Deactivate All (${stats.active})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    text:    'var(--color-text)',
    success: '#4ade80',
    warning: '#fbbf24',
    error:   '#f87171',
  };
  return (
    <div className="stat-card glass">
      <span className="stat-value" style={{ color: colors[color] }}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
