import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  collection, getDocs, doc, updateDoc, writeBatch, deleteDoc,
  query, orderBy, limit, where, getCountFromServer, startAfter,
  serverTimestamp, onSnapshot, runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ToastProvider';
import MembershipCard from '../components/MembershipCard';
import { parseCSV, exportToCSV } from '../utils/csvParser';
import { generateMembershipNumber, getCurrentSchoolYear, getCurrentSemester } from '../utils/memberNumber';
import { YEAR_LEVELS, DEPARTMENTS, computeRegistrationDiff } from '../utils/constants';
import { validateFullName, validateStudentId, sanitizeInput } from '../utils/validators';
import {
  Users, CheckCircle, XCircle, Upload, Download,
  Search, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, X,
  AlertOctagon, Trash2, Bell, Pencil, ArrowRight, AlertTriangle,
  UserCheck, Hash, BookOpen, GraduationCap
} from 'lucide-react';
import QRCode from 'qrcode';
import { buildVerifyUrl } from '../utils/cardSigning';
import './AdminDashboard.css';

const PAGE_SIZE = 20;
const STATUS_OPTS   = ['all', 'pending', 'active', 'inactive'];
const YEAR_OPTS     = ['all', ...YEAR_LEVELS];

export default function AdminDashboard() {
  const { member: self, user: authUser, refreshMember } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── State ──
  const [members,      setMembers]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter,   setYearFilter]   = useState('all');
  const [deptFilter,   setDeptFilter]   = useState('all');
  const [page,         setPage]         = useState(0);   
  const [cursors,      setCursors]      = useState([]);
  const [hasMore,      setHasMore]      = useState(true);
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

  // Delete All modal
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deletingAll, setDeletingAll]               = useState(false);

  // Delete Single User modal
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Correction Tickets modal & real-time state
  const [tickets, setTickets] = useState([]);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [ticketTab, setTicketTab] = useState('pending');
  const [processingTicketId, setProcessingTicketId] = useState(null);
  const [rejectNotesMap, setRejectNotesMap] = useState({});

  // Direct Admin/Officer Edit Member modal
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    studentId: '',
    department: '',
    program: '',
    yearLevel: '',
  });
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Open Tickets modal automatically when navigated via Navbar Bell (?tickets=1)
  useEffect(() => {
    if (searchParams.get('tickets') === '1') {
      setShowTicketsModal(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('tickets');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Subscribe to all correction tickets in real time
  useEffect(() => {
    const q = query(collection(db, 'tickets'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((t) => t.status !== 'cancelled')
          .sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tB - tA;
          });
        setTickets(list);
      },
      (err) => {
        console.error('Failed to subscribe to tickets:', err);
      }
    );
    return () => unsub();
  }, []);

  const pendingTickets  = tickets.filter((t) => t.status === 'pending');
  const resolvedTickets = tickets.filter((t) => t.status !== 'pending');

  // Generate QR for preview card modal
  useEffect(() => {
    if (!previewMember) {
      setPreviewQrDataUrl('');
      return;
    }
    let cancelled = false;
    async function genPreviewQR() {
      try {
        const url = buildVerifyUrl(previewMember.membershipNumber, previewMember.id);
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

  // ── Fetch Stats ──
  const fetchStats = async () => {
    try {
      const totalSnap = await getCountFromServer(collection(db, 'members'));
      const activeSnap = await getCountFromServer(query(collection(db, 'members'), where('status', '==', 'active')));
      const pendingSnap = await getCountFromServer(query(collection(db, 'members'), where('status', '==', 'pending')));
      const inactiveSnap = await getCountFromServer(query(collection(db, 'members'), where('status', '==', 'inactive')));
      
      setStats({
        total: totalSnap.data().count,
        active: activeSnap.data().count,
        pending: pendingSnap.data().count,
        inactive: inactiveSnap.data().count,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // ── Fetch Members Paginated or Searched ──
  const fetchMembers = async (targetPage = 0, forceSearchValue = null) => {
    setLoading(true);
    const searchValue = forceSearchValue !== null ? forceSearchValue : search;
    
    try {
      let q;
      if (searchValue.trim()) {
        q = query(collection(db, 'members'), where('studentId', '==', searchValue.trim()), limit(1));
      } else {
        let constraints = [];
        if (statusFilter !== 'all') constraints.push(where('status', '==', statusFilter));
        if (yearFilter !== 'all') constraints.push(where('yearLevel', '==', yearFilter));
        if (deptFilter !== 'all') constraints.push(where('department', '==', deptFilter));
        
        constraints.push(orderBy('createdAt', 'desc'));
        
        if (targetPage > 0 && cursors[targetPage - 1]) {
          constraints.push(startAfter(cursors[targetPage - 1]));
        }
        
        constraints.push(limit(PAGE_SIZE));
        q = query(collection(db, 'members'), ...constraints);
      }
      
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (!searchValue.trim()) {
        const newCursors = [...cursors];
        newCursors[targetPage] = snap.docs[snap.docs.length - 1];
        setCursors(newCursors);
        setHasMore(snap.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
      
      setMembers(data);
      setPage(targetPage);
    } catch (err) {
      console.error(err);
      toast('Failed to load members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    setCursors([]);
    setPage(0);
    fetchMembers(0, search);
  };

  const handleRefresh = () => {
    fetchStats();
    setCursors([]);
    setPage(0);
    fetchMembers(0, search);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (search === '') {
      setCursors([]);
      setPage(0);
      fetchMembers(0, '');
    }
  }, [statusFilter, yearFilter, deptFilter, search]);


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
      toast(`Member ${newStatus === 'active' ? 'approved & renewed for ' + updates.semester : 'deactivated'}.`, 'success');
      fetchStats(); // Update stats in background
    } catch { toast('Action failed. Please try again.', 'error'); }
  };

  // ── Approve Correction Ticket (Atomic Transaction + New Dept Membership Number if Dept Changed) ──
  const handleApproveTicket = async (ticket) => {
    setProcessingTicketId(ticket.id);
    try {
      const memberRef  = doc(db, 'members', ticket.uid);
      const ticketRef  = doc(db, 'tickets', ticket.id);
      const counterRef = doc(db, 'org', 'memberCounter');

      let assignedNewMembershipNumber = null;
      const proposed = ticket.proposedChanges || {};

      await runTransaction(db, async (tx) => {
        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists()) {
          throw new Error('Target member document no longer exists.');
        }
        const currentMember = memberSnap.data();
        const deptChanged =
          Boolean(proposed.department) &&
          proposed.department !== currentMember.department;

        const memberUpdates = {
          fullName:   sanitizeInput(proposed.fullName, 100),
          studentId:  sanitizeInput((proposed.studentId || '').replace(/[–—−]/g, '-').trim(), 20),
          department: proposed.department,
          program:    proposed.program,
          course:     proposed.program,
          yearLevel:  proposed.yearLevel,
          updatedAt:  serverTimestamp(),
        };

        if (deptChanged) {
          const counterSnap = await tx.get(counterRef);
          const currentCount =
            counterSnap.exists() && typeof counterSnap.data().count === 'number'
              ? counterSnap.data().count
              : 0;
          const nextSeq = currentCount + 1;
          assignedNewMembershipNumber = generateMembershipNumber(
            nextSeq,
            currentMember.role || 'member',
            proposed.department
          );
          tx.set(counterRef, { count: nextSeq }, { merge: true });
          memberUpdates.membershipNumber = assignedNewMembershipNumber;
        }

        tx.update(memberRef, memberUpdates);
        tx.update(ticketRef, {
          status:              'approved',
          reviewedBy:          authUser?.uid || self?.uid || 'officer',
          reviewedByName:      self?.fullName || authUser?.displayName || 'Officer',
          reviewedAt:          serverTimestamp(),
          newMembershipNumber: assignedNewMembershipNumber,
        });
      });

      // Update local table state if member is currently visible
      setMembers((prev) =>
        prev.map((m) =>
          m.id === ticket.uid
            ? {
                ...m,
                fullName:   proposed.fullName,
                studentId:  proposed.studentId,
                department: proposed.department,
                program:    proposed.program,
                course:     proposed.program,
                yearLevel:  proposed.yearLevel,
                ...(assignedNewMembershipNumber
                  ? { membershipNumber: assignedNewMembershipNumber }
                  : {}),
              }
            : m
        )
      );

      if (ticket.uid === authUser?.uid) {
        await refreshMember();
      }

      toast(
        assignedNewMembershipNumber
          ? `Ticket approved! Assigned new department ID: ${assignedNewMembershipNumber}`
          : 'Ticket approved and member details updated!',
        'success'
      );
    } catch (err) {
      console.error('Failed to approve ticket:', err);
      toast(err?.message || 'Failed to approve ticket.', 'error');
    } finally {
      setProcessingTicketId(null);
    }
  };

  // ── Reject Correction Ticket ──
  const handleRejectTicket = async (ticket) => {
    setProcessingTicketId(ticket.id);
    try {
      const notes = sanitizeInput(rejectNotesMap[ticket.id] || '', 300);
      await updateDoc(doc(db, 'tickets', ticket.id), {
        status:         'rejected',
        adminNotes:     notes || 'Declined by council officer.',
        reviewedBy:     authUser?.uid || self?.uid || 'officer',
        reviewedByName: self?.fullName || authUser?.displayName || 'Officer',
        reviewedAt:     serverTimestamp(),
      });
      toast('Correction ticket declined.', 'info');
    } catch (err) {
      console.error('Failed to reject ticket:', err);
      toast('Failed to decline ticket.', 'error');
    } finally {
      setProcessingTicketId(null);
    }
  };

  // ── Direct Admin/Officer Edit Member Details ──
  const openEditModal = (m) => {
    setEditingMember(m);
    setEditForm({
      fullName:   m.fullName || '',
      studentId:  m.studentId || '',
      department: m.department || '',
      program:    m.program || m.course || '',
      yearLevel:  m.yearLevel || '',
    });
    setEditErrors({});
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'department') {
      setEditForm((prev) => ({ ...prev, department: value, program: '' }));
      setEditErrors((prev) => ({ ...prev, department: '', program: '', general: '' }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
      setEditErrors((prev) => ({ ...prev, [name]: '', general: '' }));
    }
  };

  const handleSaveMemberEdit = async (e) => {
    e.preventDefault();
    if (!editingMember) return;

    const normalizedStudentId = (editForm.studentId || '').replace(/[–—−]/g, '-').trim();
    const errs = {};
    const nameErr = validateFullName(editForm.fullName);
    if (nameErr) errs.fullName = nameErr;

    const idErr = validateStudentId(normalizedStudentId);
    if (idErr) errs.studentId = idErr;

    if (!editForm.department) errs.department = 'Please select a department';
    if (!editForm.program)    errs.program    = 'Please select a program';
    if (!editForm.yearLevel)  errs.yearLevel  = 'Please select a year level';

    const diffs = computeRegistrationDiff(editingMember, {
      ...editForm,
      fullName: sanitizeInput(editForm.fullName, 100),
      studentId: sanitizeInput(normalizedStudentId, 20),
    });

    if (Object.keys(errs).length === 0 && diffs.length === 0) {
      errs.general = 'No changes were made to this member’s details.';
    }

    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    setSavingEdit(true);
    try {
      const cleanFullName  = sanitizeInput(editForm.fullName, 100);
      const cleanStudentId = sanitizeInput(normalizedStudentId, 20);
      const memberRef      = doc(db, 'members', editingMember.id);
      const counterRef     = doc(db, 'org', 'memberCounter');

      let assignedNewMembershipNumber = null;

      await runTransaction(db, async (tx) => {
        const memberSnap = await tx.get(memberRef);
        if (!memberSnap.exists()) {
          throw new Error('Member document not found.');
        }
        const currentData = memberSnap.data();
        const deptChanged =
          Boolean(editForm.department) &&
          editForm.department !== currentData.department;

        const updates = {
          fullName:   cleanFullName,
          studentId:  cleanStudentId,
          department: editForm.department,
          program:    editForm.program,
          course:     editForm.program,
          yearLevel:  editForm.yearLevel,
          updatedAt:  serverTimestamp(),
        };

        if (deptChanged) {
          const counterSnap = await tx.get(counterRef);
          const currentCount =
            counterSnap.exists() && typeof counterSnap.data().count === 'number'
              ? counterSnap.data().count
              : 0;
          const nextSeq = currentCount + 1;
          assignedNewMembershipNumber = generateMembershipNumber(
            nextSeq,
            currentData.role || 'member',
            editForm.department
          );
          tx.set(counterRef, { count: nextSeq }, { merge: true });
          updates.membershipNumber = assignedNewMembershipNumber;
        }

        tx.update(memberRef, updates);
      });

      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? {
                ...m,
                fullName:   cleanFullName,
                studentId:  cleanStudentId,
                department: editForm.department,
                program:    editForm.program,
                course:     editForm.program,
                yearLevel:  editForm.yearLevel,
                ...(assignedNewMembershipNumber
                  ? { membershipNumber: assignedNewMembershipNumber }
                  : {}),
              }
            : m
        )
      );

      if (editingMember.id === authUser?.uid) {
        await refreshMember();
      }

      toast(
        assignedNewMembershipNumber
          ? `Member details updated! New department ID assigned: ${assignedNewMembershipNumber}`
          : 'Member details updated successfully!',
        'success'
      );
      setEditingMember(null);
    } catch (err) {
      console.error('Failed to update member details:', err);
      setEditErrors({
        general: err?.message || 'Failed to update member details.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Deactivate All Members (for new semester renewal) ──
  const confirmDeactivateAll = async () => {
    setDeactivatingAll(true);
    try {
      if (stats.active === 0) {
        setShowDeactivateModal(false);
        return;
      }

      let processed = 0;
      while (true) {
        const snap = await getDocs(query(collection(db, 'members'), where('status', '==', 'active'), limit(500)));
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          batch.update(d.ref, { status: 'inactive' });
        });
        await batch.commit();
        processed += snap.docs.length;
      }

      toast(`All ${processed} active members deactivated for the new semester.`, 'success');
      setShowDeactivateModal(false);
      fetchStats();
      if (!search.trim()) fetchMembers(page);
    } catch (err) {
      console.error(err);
      toast('Failed to deactivate members. Please try again.', 'error');
    } finally {
      setDeactivatingAll(false);
    }
  };

  // ── Delete All Members (Danger Zone) ──
  const confirmDeleteAll = async () => {
    setDeletingAll(true);
    try {
      let processed = 0;
      while (true) {
        const snap = await getDocs(query(collection(db, 'members'), limit(500)));
        if (snap.empty) break;
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
        processed += snap.docs.length;
      }

      toast(`All ${processed} members deleted successfully.`, 'success');
      setShowDeleteAllModal(false);
      fetchStats();
      if (!search.trim()) {
        setCursors([]);
        fetchMembers(0);
      }
    } catch (err) {
      console.error(err);
      toast('Failed to delete members. Please try again.', 'error');
    } finally {
      setDeletingAll(false);
    }
  };

  // ── Delete Single User ──
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingUser(true);
    try {
      await deleteDoc(doc(db, 'members', userToDelete.id));
      setMembers(prev => prev.filter(m => m.id !== userToDelete.id));
      toast('Member deleted successfully.', 'success');
      setUserToDelete(null);
      fetchStats();
    } catch (err) {
      console.error(err);
      toast('Failed to delete member.', 'error');
    } finally {
      setDeletingUser(false);
    }
  };

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
          batch.set(ref, {
            ...row,
            importedBy: self?.uid || 'admin',
            importedAt: serverTimestamp(),
            membershipNumber: generateMembershipNumber(seq, 'member', row.department),
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
      handleRefresh();
    } catch (err) {
      console.error(err);
      toast('Import failed. Check your CSV and try again.', 'error');
    } finally {
      setImporting(false);
    }
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
            {/* Correction Tickets Button with Live Notification Badge */}
            <button
              id="btn-open-tickets"
              type="button"
              className={`btn btn-sm admin-tickets-btn ${pendingTickets.length > 0 ? 'has-pending' : 'btn-outline'}`}
              onClick={() => setShowTicketsModal(true)}
              aria-label={`Correction Tickets (${pendingTickets.length} pending)`}
            >
              <Bell size={15} />
              <span>Correction Tickets</span>
              {pendingTickets.length > 0 && (
                <span className="admin-tickets-badge">{pendingTickets.length}</span>
              )}
            </button>

            <button id="btn-refresh" className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={loading} aria-label="Refresh members">
              <RefreshCw size={15} className={loading ? 'spin-icon' : ''} /> Refresh
            </button>
            <button id="btn-export-csv" className="btn btn-outline btn-sm" onClick={() => {
              toast('Note: Export currently only exports visible/filtered data in the view or you may need to update the exporter.', 'warning');
              exportToCSV(members);
            }}>
              <Download size={15} /> Export CSV
            </button>
            <button id="btn-import-csv" className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
              <Upload size={15} /> Import CSV
            </button>
            {self?.role === 'admin' && (
              <>
                <button
                  id="btn-deactivate-all"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setShowDeactivateModal(true)}
                  disabled={loading || stats.active === 0}
                  title="Deactivate all active members when a new semester starts"
                >
                  <AlertOctagon size={15} /> Deactivate All (New Term)
                </button>
                <button
                  id="btn-delete-all"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setShowDeleteAllModal(true)}
                  disabled={loading || stats.total === 0}
                  title="Delete all members permanently"
                  style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                >
                  <XCircle size={15} /> Delete All Users
                </button>
              </>
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
          <div className="admin-search-wrap" style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
              <Search size={16} className="admin-search-icon" style={{ position: 'absolute', left: 10 }} />
              <input
                id="admin-search"
                type="text"
                className="admin-search"
                style={{ paddingLeft: '34px', width: '100%' }}
                placeholder="Search by exact SR-Code…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearchClick()}
                aria-label="Search members"
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSearchClick} disabled={loading}>
              Search
            </button>
          </div>
          <div className="admin-filter-group">
            <Filter size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
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
            <select
              id="filter-dept"
              className="form-select admin-select"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              aria-label="Filter by department"
            >
              <option value="all">All Depts</option>
              {Object.keys(DEPARTMENTS).map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
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
                    <th>Dept</th>
                    <th>Program</th>
                    <th>Year</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th style={{ textAlign:'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign:'center', color:'var(--color-text-tertiary)', padding:'40px' }}>
                        No members found.
                      </td>
                    </tr>
                  ) : members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <span style={{ fontFamily:'monospace', fontSize:'0.8rem', color:'var(--color-gold)' }}>
                          {m.membershipNumber}
                        </span>
                      </td>
                      <td style={{ fontWeight:600 }}>{m.fullName}</td>
                      <td style={{ fontFamily:'monospace', fontSize:'0.85rem' }}>{m.studentId || '-'}</td>
                      <td style={{ fontSize:'0.82rem', color:'var(--color-text-secondary)' }}>
                        {m.department || '-'}
                      </td>
                      <td style={{ fontSize:'0.82rem', color:'var(--color-text-secondary)', maxWidth:'160px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {m.program || m.course || '-'}
                      </td>
                      <td style={{ fontSize:'0.85rem' }}>{m.yearLevel || '-'}</td>
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
                            <option value="partner">Partner</option>
                          </select>
                        ) : (
                          <span style={{ fontSize:'0.82rem', color:'var(--color-text-secondary)' }}>{m.role}</span>
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
                          {/* Direct Edit Member Details */}
                          <button
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => openEditModal(m)}
                            title="Edit member details"
                            aria-label={`Edit details for ${m.fullName}`}
                          >
                            <Pencil size={15} />
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
                          {/* Delete single user */}
                          {self?.role === 'admin' && (
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{ color: '#f87171' }}
                              onClick={() => setUserToDelete(m)}
                              title="Delete User"
                              aria-label={`Delete ${m.fullName}`}
                            >
                              <Trash2 size={15} />
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
            {(!search.trim()) && (members.length > 0 || page > 0) && (
              <div className="pagination" role="navigation" aria-label="Pagination" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => fetchMembers(page - 1)}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span style={{ fontSize: '0.9rem', padding: '4px 12px', display: 'flex', alignItems: 'center' }}>
                  Page {page + 1}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => fetchMembers(page + 1)}
                  disabled={!hasMore}
                  aria-label="Next page"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Correction Tickets Review Modal ── */}
      {showTicketsModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Correction Tickets">
          <div className="modal admin-tickets-modal">
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bell size={18} style={{ color: 'var(--color-brand-gold)' }} />
                  Registration Correction Tickets
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  Review and approve student requests to fix registration details
                </p>
              </div>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setShowTicketsModal(false)}
                aria-label="Close tickets modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="admin-ticket-tabs">
              <button
                type="button"
                className={`admin-ticket-tab ${ticketTab === 'pending' ? 'active' : ''}`}
                onClick={() => setTicketTab('pending')}
              >
                Pending Review ({pendingTickets.length})
              </button>
              <button
                type="button"
                className={`admin-ticket-tab ${ticketTab === 'history' ? 'active' : ''}`}
                onClick={() => setTicketTab('history')}
              >
                Resolved History ({resolvedTickets.length})
              </button>
            </div>

            {/* Ticket List */}
            <div className="admin-ticket-list">
              {(ticketTab === 'pending' ? pendingTickets : resolvedTickets).length === 0 ? (
                <div className="admin-ticket-empty">
                  {ticketTab === 'pending'
                    ? 'No pending correction tickets right now.'
                    : 'No resolved tickets yet.'}
                </div>
              ) : (
                (ticketTab === 'pending' ? pendingTickets : resolvedTickets).map((t) => {
                  const diffs = computeRegistrationDiff(t.currentDetails, t.proposedChanges);
                  const deptChanged =
                    Boolean(t.proposedChanges?.department) &&
                    t.proposedChanges?.department !== t.currentDetails?.department;
                  const isBusy = processingTicketId === t.id;

                  return (
                    <div key={t.id} className="admin-ticket-card">
                      <div className="admin-ticket-card-top">
                        <div>
                          <span className="admin-ticket-name">
                            {t.currentDetails?.fullName || t.email}
                          </span>
                          <span className="admin-ticket-meta">
                            {t.membershipNumber} · SR-Code: {t.currentDetails?.studentId || '—'}
                          </span>
                        </div>
                        <span className={`badge badge-${t.status}`}>{t.status}</span>
                      </div>

                      <div className="admin-ticket-reason">
                        <strong>Reason for Submission:</strong> {t.reason}
                      </div>

                      {/* Diff across all modified fields */}
                      <div className="admin-ticket-diffs">
                        {diffs.map((d) => (
                          <div key={d.key} className="admin-ticket-diff-row">
                            <span className="admin-ticket-diff-label">{d.label}:</span>
                            <span className="admin-ticket-diff-old">{d.before}</span>
                            <ArrowRight size={12} style={{ color: 'var(--color-text-tertiary)' }} />
                            <span className="admin-ticket-diff-new">{d.after}</span>
                          </div>
                        ))}
                      </div>

                      {deptChanged && t.status === 'pending' && (
                        <div className="admin-ticket-dept-alert">
                          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>
                            <strong>Department Change:</strong> Approving this ticket will
                            generate a <strong>new Membership Number</strong> for{' '}
                            <em>{t.proposedChanges.department}</em>.
                          </span>
                        </div>
                      )}

                      {t.status === 'approved' && t.newMembershipNumber && (
                        <div className="admin-ticket-resolved-meta">
                          Assigned New Membership Number:{' '}
                          <strong style={{ color: 'var(--color-brand-gold)' }}>
                            {t.newMembershipNumber}
                          </strong>
                        </div>
                      )}

                      {t.status === 'rejected' && t.adminNotes && (
                        <div className="admin-ticket-resolved-meta">
                          Rejection Note: <em>{t.adminNotes}</em>
                        </div>
                      )}

                      {t.status === 'pending' && (
                        <div className="admin-ticket-actions">
                          <input
                            type="text"
                            className="form-input admin-ticket-note-input"
                            placeholder="Optional note if declining…"
                            value={rejectNotesMap[t.id] || ''}
                            onChange={(e) =>
                              setRejectNotesMap((prev) => ({
                                ...prev,
                                [t.id]: e.target.value,
                              }))
                            }
                            disabled={isBusy}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleRejectTicket(t)}
                              disabled={isBusy}
                            >
                              <XCircle size={14} /> Decline
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApproveTicket(t)}
                              disabled={isBusy}
                            >
                              <CheckCircle size={14} />{' '}
                              {isBusy ? 'Applying…' : 'Approve & Apply'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Direct Admin/Officer Edit Member Details Modal ── */}
      {editingMember && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Edit Member Details">
          <div className="modal" style={{ maxWidth: '560px', width: '100%' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.15rem', margin: 0 }}>
                  Edit Member Details
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                  {editingMember.membershipNumber} · {editingMember.email}
                </p>
              </div>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setEditingMember(null)}
                disabled={savingEdit}
                aria-label="Close edit modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMemberEdit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 1. Full Name */}
              <div className="form-group">
                <label htmlFor="admin-edit-fullName" className="form-label">
                  <UserCheck size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Full Name
                </label>
                <input
                  id="admin-edit-fullName"
                  name="fullName"
                  type="text"
                  className={`form-input ${editErrors.fullName ? 'input-error' : ''}`}
                  value={editForm.fullName}
                  onChange={handleEditFormChange}
                />
                {editErrors.fullName && <span className="field-error">{editErrors.fullName}</span>}
              </div>

              {/* 2. SR-Code */}
              <div className="form-group">
                <label htmlFor="admin-edit-studentId" className="form-label">
                  <Hash size={13} style={{ display: 'inline', marginRight: 4 }} />
                  SR-Code
                </label>
                <input
                  id="admin-edit-studentId"
                  name="studentId"
                  type="text"
                  className={`form-input ${editErrors.studentId ? 'input-error' : ''}`}
                  value={editForm.studentId}
                  onChange={handleEditFormChange}
                  placeholder="24-XXXXX"
                />
                {editErrors.studentId && <span className="field-error">{editErrors.studentId}</span>}
              </div>

              {/* 3. Department / College */}
              <div className="form-group">
                <label htmlFor="admin-edit-department" className="form-label">
                  <BookOpen size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Department / College
                </label>
                <select
                  id="admin-edit-department"
                  name="department"
                  className={`form-select ${editErrors.department ? 'input-error' : ''}`}
                  value={editForm.department}
                  onChange={handleEditFormChange}
                >
                  <option value="">Select department…</option>
                  {Object.keys(DEPARTMENTS).map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {editErrors.department && <span className="field-error">{editErrors.department}</span>}
              </div>

              {/* 4. Program */}
              <div className="form-group">
                <label htmlFor="admin-edit-program" className="form-label">
                  <BookOpen size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Program
                </label>
                <select
                  id="admin-edit-program"
                  name="program"
                  className={`form-select ${editErrors.program ? 'input-error' : ''}`}
                  value={editForm.program}
                  onChange={handleEditFormChange}
                  disabled={!editForm.department}
                >
                  <option value="">Select program…</option>
                  {editForm.department &&
                    (DEPARTMENTS[editForm.department] || []).map((prog) => (
                      <option key={prog} value={prog}>{prog}</option>
                    ))}
                </select>
                {editErrors.program && <span className="field-error">{editErrors.program}</span>}
              </div>

              {/* 5. Year Level */}
              <div className="form-group">
                <label htmlFor="admin-edit-yearLevel" className="form-label">
                  <GraduationCap size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Year Level
                </label>
                <select
                  id="admin-edit-yearLevel"
                  name="yearLevel"
                  className={`form-select ${editErrors.yearLevel ? 'input-error' : ''}`}
                  value={editForm.yearLevel}
                  onChange={handleEditFormChange}
                >
                  <option value="">Select year level…</option>
                  {YEAR_LEVELS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {editErrors.yearLevel && <span className="field-error">{editErrors.yearLevel}</span>}
              </div>

              {Boolean(editForm.department) && editForm.department !== editingMember.department && (
                <div className="admin-ticket-dept-alert">
                  <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>Department Changed:</strong> Saving will automatically generate a{' '}
                    <strong>new Membership Number</strong> corresponding to{' '}
                    <em>{editForm.department}</em>.
                  </span>
                </div>
              )}

              {editErrors.general && (
                <div style={{ color: '#f87171', fontSize: '0.82rem' }}>{editErrors.general}</div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingMember(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
            <p style={{ fontSize:'0.85rem', color:'var(--color-text-secondary)', marginBottom:16 }}>
              {csvPreview.length} member{csvPreview.length !== 1 ? 's' : ''} found in CSV. All will be imported as <strong>pending</strong>.
            </p>
            <div className="csv-preview-list">
              {csvPreview.slice(0, 10).map((m, i) => (
                <div key={i} className="csv-preview-row">
                  <span style={{ fontWeight:600 }}>{m.fullName || '—'}</span>
                  <span style={{ fontSize:'0.8rem', color:'var(--color-text-secondary)' }}>{m.studentId}</span>
                  <span style={{ fontSize:'0.8rem', color:'var(--color-text-tertiary)' }}>{m.program || m.course} · {m.yearLevel}</span>
                </div>
              ))}
              {csvPreview.length > 10 && (
                <p style={{ fontSize:'0.8rem', color:'var(--color-text-tertiary)', textAlign:'center', padding:'8px 0' }}>
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
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate All Confirmation Modal ── */}
      {showDeactivateModal && (
        <ConfirmModal
          title="Reset for New Semester"
          icon={AlertOctagon}
          isDanger={true}
          confirmText={`Deactivate All (${stats.active})`}
          onConfirm={confirmDeactivateAll}
          onCancel={() => setShowDeactivateModal(false)}
          loading={deactivatingAll}
        >
          <p style={{ fontSize:'0.9rem', lineHeight:1.5, margin:0 }}>
            Are you sure you want to deactivate all <strong>{stats.active}</strong> currently active members?
          </p>
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'12px', fontSize:'0.82rem', color:'var(--color-text-secondary)', lineHeight:1.4 }}>
            <strong style={{ color:'#f87171', display:'block', marginBottom:4 }}>What will happen:</strong>
            • Member cards will change to "Membership Inactive / Expired".<br/>
            • Students will see a "Renew Membership" button directing to payment.<br/>
            • Their SR-Code and Member Number are preserved permanently.<br/>
            • When an officer clicks "Approve" upon receiving proof of payment, their card immediately updates to the new semester!
          </div>
        </ConfirmModal>
      )}

      {/* ── Delete All Confirmation Modal ── */}
      {showDeleteAllModal && (
        <ConfirmModal
          title="Delete All Users"
          icon={AlertOctagon}
          isDanger={true}
          confirmText="Delete All Users"
          onConfirm={confirmDeleteAll}
          onCancel={() => setShowDeleteAllModal(false)}
          loading={deletingAll}
        >
          <p style={{ fontSize:'0.9rem', lineHeight:1.5, margin:0 }}>
            Are you absolutely sure you want to <strong>delete all {stats.total} members</strong>?
          </p>
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'12px', fontSize:'0.82rem', color:'var(--color-text-secondary)', lineHeight:1.4 }}>
            <strong style={{ color:'#f87171', display:'block', marginBottom:4 }}>WARNING: DANGER ZONE</strong>
            • This action cannot be undone.<br/>
            • All member data, IDs, and card histories will be permanently destroyed.<br/>
            • Users will need to register and pay again to get a new card.
          </div>
        </ConfirmModal>
      )}

      {/* ── Delete Single User Confirmation Modal ── */}
      {userToDelete && (
        <ConfirmModal
          title="Delete User"
          icon={Trash2}
          isDanger={true}
          confirmText="Delete User"
          onConfirm={confirmDeleteUser}
          onCancel={() => setUserToDelete(null)}
          loading={deletingUser}
        >
          <p style={{ fontSize:'0.9rem', lineHeight:1.5, margin:0 }}>
            Are you sure you want to permanently delete <strong>{userToDelete.fullName}</strong> ({userToDelete.studentId})?
          </p>
          <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px', padding:'12px', fontSize:'0.82rem', color:'var(--color-text-secondary)', lineHeight:1.4 }}>
            <strong style={{ color:'#f87171', display:'block', marginBottom:4 }}>WARNING:</strong>
            This action cannot be undone. All data for this user will be permanently destroyed.
          </div>
        </ConfirmModal>
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

function ConfirmModal({ title, icon: Icon, isDanger, children, confirmText, onConfirm, onCancel, loading }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.15rem', color: isDanger ? '#f87171' : 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            {Icon && <Icon size={20} />} {title}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onCancel}><X size={18} /></button>
        </div>
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading ? <><span className="spinner spinner-sm" /> Processing…</> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
