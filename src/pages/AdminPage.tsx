import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, LayoutGrid, Building2, Users, Flag, Settings,
  Clock, CheckCircle, XCircle, Search, Eye
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MOCK_USERS } from '../data/mockData';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { monthlyTotal } from '../lib/discovery';
import '../styles/workspaces.css';
import type { Hostel, ListingStatus } from '../types';

type Section = 'queue' | 'listings' | 'users' | 'reports' | 'settings';

type DemoReport = {
  id: string;
  hostelId: string;
  hostelName: string;
  reason: string;
  reporter: string;
  createdAt: string;
  status: 'open' | 'resolved';
};

const DEMO_REPORTS: DemoReport[] = [
  {
    id: 'rep1',
    hostelId: 'h6',
    hostelName: 'Allen View Boys PG',
    reason: 'Mess photos look different from rooms',
    reporter: 'Student',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'open',
  },
  {
    id: 'rep2',
    hostelId: 'h3',
    hostelName: 'The Student House',
    reason: 'Rent listed higher than quoted on visit',
    reporter: 'Student',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'open',
  },
];

export function AdminPage() {
  const { user, hostels, visits, updateHostelStatus } = useApp();

  const [section, setSection] = useState<Section>('queue');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ListingStatus | ''>('pending');
  const [page, setPage] = useState(1);
  const [reviewHostel, setReviewHostel] = useState<Hostel | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState('');
  const [reports, setReports] = useState<DemoReport[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('staykota_reports') || 'null');
      if (Array.isArray(value)) return value.filter((r): r is DemoReport => Boolean(r && typeof r.id === 'string' && typeof r.hostelId === 'string' && typeof r.hostelName === 'string' && typeof r.reason === 'string' && typeof r.reporter === 'string' && typeof r.createdAt === 'string' && ['open', 'resolved'].includes(r.status)));
    } catch { /* Use clearly labelled seed reports if storage is unavailable. */ }
    return DEMO_REPORTS;
  });
  const [history, setHistory] = useState<{ id: string; action: string; at: string }[]>([]);

  const [rejectError, setRejectError] = useState('');
  useEffect(() => {
    try { localStorage.setItem('staykota_reports', JSON.stringify(reports)); } catch { /* Keep the current session usable. */ }
  }, [reports]);
  const PAGE_SIZE = 8;

  if (!user || user.role !== 'admin') {
    return (
      <div className="workspace-gate animate-fade-in">
        <span className="workspace-gate-icon"><Shield className="w-7 h-7" /></span>
        <p className="workspace-eyebrow">Moderation workspace</p>
        <h1>Trust &amp; clarity for <em>every Kota stay.</em></h1>
        <p>Admin access only. No public signup.</p>
        <Link to="/login?role=admin" className="workspace-primary-link">Login as Admin</Link>
        <span className="workspace-fineprint">Use /login?role=admin for the demo login.</span>
      </div>
    );
  }

  const pending = hostels.filter(h => h.status === 'pending');
  const approved = hostels.filter(h => h.status === 'approved');
  const rejected = hostels.filter(h => h.status === 'rejected');
  const openReports = reports.filter(r => r.status === 'open');

  const ownerName = (ownerId: string) => {
    const o = MOCK_USERS.find(u => u.id === ownerId && u.role === 'owner');
    return o?.name || 'Owner';
  };

  const filtered = (() => {
    let list = [...hostels];
    if (statusFilter) list = list.filter(h => h.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(h =>
        h.name.toLowerCase().includes(q) ||
        h.locality.toLowerCase().includes(q) ||
        ownerName(h.ownerId).toLowerCase().includes(q)
      );
    }
    if (section === 'queue') {
      list.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.createdAt.localeCompare(b.createdAt));
    }
    return list;
  })();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pageItems = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const logAction = (action: string) => {
    setHistory(prev => [{ id: `h-${Date.now()}`, action, at: new Date().toISOString() }, ...prev].slice(0, 20));
  };

  const approve = (id: string, name: string) => {
    updateHostelStatus(id, 'approved');
    logAction(`Approved “${name}”`);
    showToast('Listing approved — now visible on Explore');
    setReviewHostel(null);
  };

  const confirmReject = () => {
    if (!rejectId) return;
    if (!rejectReason.trim()) { setRejectError('Please give the owner a reason for rejection.'); return; }
    const h = hostels.find(x => x.id === rejectId);
    updateHostelStatus(rejectId, 'rejected');
    logAction(`Rejected “${h?.name || rejectId}”${rejectReason ? `: ${rejectReason}` : ''}`);
    showToast('Listing rejected');
    setRejectId(null);
    setRejectReason('');
    setReviewHostel(null);
  };

  const suspend = (id: string, name: string) => {
    updateHostelStatus(id, 'rejected');
    logAction(`Suspended “${name}”`);
    showToast('Listing suspended (marked rejected in demo)');
    setReviewHostel(null);
  };

  const restore = (id: string, name: string) => {
    updateHostelStatus(id, 'approved');
    logAction(`Restored “${name}”`);
    showToast('Listing restored to published in this demo');
    setReviewHostel(null);
  };

  const statusBadge = (status: ListingStatus) => {
    const map: Record<ListingStatus, React.ReactNode> = {
      draft: <Badge>Draft</Badge>,
      pending: <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>,
      approved: <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Live</Badge>,
      rejected: <Badge variant="error"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>,
    };
    return map[status];
  };

  const menu: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'queue', label: 'Moderation queue', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'listings', label: 'All listings', icon: <Building2 className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <Flag className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const rentRange = (h: Hostel) => {
    const rents = h.roomTypes.map(monthlyTotal);
    if (!rents.length) return '—';
    const min = Math.min(...rents);
    const max = Math.max(...rents);
    return min === max
      ? `₹${(min / 1000).toFixed(min % 1000 === 0 ? 0 : 1)}k`
      : `₹${(min / 1000).toFixed(0)}k–₹${(max / 1000).toFixed(0)}k`;
  };

  return (
    <div className="workspace-shell admin-workspace animate-fade-in">
      <p className="workspace-local-note"><Shield size={15} /> Local moderation workspace · Sign-in and permissions are simulated in this frontend demo.</p>

      <div className="workspace-admin-inner">
        <div className="admin-hero-banner flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="workspace-eyebrow">Behind every good stay</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {section === 'queue' ? 'Review listings' :
               section === 'listings' ? 'All listings' :
               section === 'users' ? 'Users' :
               section === 'reports' ? 'Reports' : 'Settings'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {pending.length} awaiting review · {approved.length} published live · Publication approval is separate from property verification
            </p>
          </div>
          {section === 'queue' && (
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  aria-label="Search listings and owners" placeholder="Search listing, owner…"
                  className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <Button className="rounded-xl" onClick={() => { setStatusFilter('pending'); setSearch(''); setPage(1); }}>
                Review oldest first
              </Button>
            </div>
          )}
        </div>

        {toast && (
          <div role="status" className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800 animate-fade-in">{toast}</div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-56 flex-shrink-0 workspace-admin-sidebar">
            <Card className="p-3 sticky top-24">
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Admin menu</p>
              <nav className="space-y-0.5">
                {menu.map(m => (
                  <button
                    key={m.id}
                    aria-current={section === m.id ? 'page' : undefined}
                    type="button"
                    onClick={() => {
                      setSection(m.id);
                      setPage(1);
                      if (m.id === 'queue') setStatusFilter('pending');
                      if (m.id === 'listings') setStatusFilter('');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      section === m.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.icon}
                    <span className="flex-1 text-left">{m.label}</span>
                    {m.id === 'queue' && pending.length > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        section === m.id ? 'bg-white/20' : 'bg-amber-100 text-amber-800'
                      }`}>{pending.length}</span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="mt-4 mx-1 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium text-slate-700">Prototype only</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Real auth & audit log in Phase 2.</p>
              </div>
            </Card>
          </aside>

          <div className="flex-1 min-w-0 space-y-6">
            {(section === 'queue' || section === 'listings') && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Pending review', value: pending.length, icon: <Clock className="w-4 h-4 text-amber-600" /> },
                  { label: 'Approved (live)', value: approved.length, icon: <CheckCircle className="w-4 h-4 text-emerald-600" /> },
                  { label: 'Rejected', value: rejected.length, icon: <XCircle className="w-4 h-4 text-red-500" /> },
                  { label: 'Open reports', value: openReports.length, icon: <Flag className="w-4 h-4 text-slate-500" /> },
                ].map(s => (
                  <Card key={s.label} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">{s.icon}</div>
                    <div>
                      <p className="text-xl font-bold text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {(section === 'queue' || section === 'listings') && (
              <Card className="p-0 overflow-hidden">
                {section === 'listings' && (
                  <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} aria-label="Search all listings" placeholder="Search…"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm" />
                    </div>
                    <div className="min-w-[185px]">
                      <CustomSelect
                        ariaLabel="Filter listing status"
                        value={statusFilter}
                        options={[
                          { value: '', label: 'All statuses' },
                          { value: 'pending', label: 'Pending' },
                          { value: 'approved', label: 'Live' },
                          { value: 'draft', label: 'Draft' },
                          { value: 'rejected', label: 'Rejected' },
                        ]}
                        onChange={nextValue => { setStatusFilter(nextValue as ListingStatus | ''); setPage(1); }}
                      />
                    </div>
                  </div>
                )}

                {pageItems.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm">
                    {statusFilter === 'pending' ? 'Queue is empty — no listings awaiting review.' : 'No listings match.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          <th className="px-4 py-3 font-medium">Listing</th>
                          <th className="px-4 py-3 font-medium hidden sm:table-cell">Owner</th>
                          <th className="px-4 py-3 font-medium hidden md:table-cell">Updated</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pageItems.map(h => (
                          <tr key={h.id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img src={h.coverImage} alt="" className="w-14 h-11 rounded-lg object-cover bg-slate-100" />
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 truncate">{h.name}</p>
                                  <p className="text-xs text-slate-500">{h.locality} · {h.roomTypes.length} types · {rentRange(h)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{ownerName(h.ownerId)}</td>
                            <td className="px-4 py-3 text-slate-500 hidden md:table-cell whitespace-nowrap">{h.updatedAt}</td>
                            <td className="px-4 py-3">{statusBadge(h.status)}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap justify-end gap-1.5">
                                <Button size="sm" variant="outline" className="h-8 rounded-lg" onClick={() => setReviewHostel(h)}>
                                  <Eye className="w-3.5 h-3.5" /> Review
                                </Button>
                                {h.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700" onClick={() => approve(h.id, h.name)}>Approve</Button>
                                    <Button size="sm" variant="outline" className="h-8 rounded-lg text-red-600 border-red-200" onClick={() => { setRejectId(h.id); setRejectReason(''); setRejectError(''); }}>Reject</Button>
                                  </>
                                )}
                                {h.status === 'approved' && (
                                  <Button size="sm" variant="ghost" className="h-8 text-red-600" onClick={() => suspend(h.id, h.name)}>Suspend</Button>
                                )}
                                {h.status === 'rejected' && (
                                  <Button size="sm" variant="outline" className="h-8" onClick={() => restore(h.id, h.name)}>Restore</Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="p-4 border-t border-slate-100 flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} type="button" onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-full text-sm font-medium ${pageSafe === p ? 'bg-slate-900 text-white' : 'border border-slate-200'}`}>{p}</button>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {section === 'users' && (
              <Card className="p-5">
                <h2 className="font-semibold text-slate-900 mb-1">Users (mock)</h2>
                <p className="text-xs text-slate-400 mb-4">Read-only prototype list from seed data.</p>
                <ul className="divide-y divide-slate-100">
                  {MOCK_USERS.map(u => (
                    <li key={u.id} className="py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">{u.name.charAt(0)}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <Badge variant={u.role === 'admin' ? 'default' : u.role === 'owner' ? 'warning' : 'success'}>{u.role}</Badge>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-slate-400">
                  Visit requests saved in this demo: {visits.length}. A request does not confirm a visit or reserve a room.
                </p>
              </Card>
            )}

            {section === 'reports' && (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <Card className="p-10 text-center text-slate-500">No reports</Card>
                ) : (
                  reports.map(r => (
                    <Card key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                        <Flag className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">Report: “{r.reason}” — {r.hostelName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Reported by {r.reporter} · {r.status === 'open' ? 'Open' : 'Resolved'} · demo data</p>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/hostel/${r.hostelId}`}><Button size="sm" variant="outline">Open listing</Button></Link>
                        {r.status === 'open' && (
                          <Button size="sm" onClick={() => {
                            setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: 'resolved' } : x));
                            logAction(`Resolved report on “${r.hostelName}”`);
                            showToast('Report marked resolved (demo)');
                          }}>Resolve</Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {section === 'settings' && (
              <div className="space-y-4">
                <Card className="p-5">
                  <h2 className="font-semibold text-slate-900 mb-2">Settings</h2>
                  <p className="text-sm text-slate-500">
                    Platform settings, roles and audit export will ship in Phase 2 with real authentication.
                    This admin UI is a frontend prototype only.
                  </p>
                </Card>
                <Card className="p-5">
                  <h2 className="font-semibold text-slate-900 mb-3">Recent moderation (this session)</h2>
                  {history.length === 0 ? (
                    <p className="text-sm text-slate-500">No actions yet this session.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {history.map(h => (
                        <li key={h.id} className="flex justify-between gap-4 text-slate-600">
                          <span>{h.action}</span>
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(h.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={Boolean(reviewHostel)} onClose={() => setReviewHostel(null)} title="Review listing" wide>
        {reviewHostel && <div className="admin-review-content">
          <div className="workspace-section-heading"><div><h2>{reviewHostel.name}</h2><p className="workspace-muted">{reviewHostel.locality} · {ownerName(reviewHostel.ownerId)}</p></div>{statusBadge(reviewHostel.status)}</div>
          <img src={reviewHostel.coverImage} alt={reviewHostel.name} className="admin-review-cover" />
          <p className="workspace-muted">{reviewHostel.description}</p>
          <p className="workspace-muted"><strong>Address:</strong> {reviewHostel.address}</p>
          <div className="admin-review-rooms">{reviewHostel.roomTypes.map(room => <article key={room.id}>
            <div><strong>{room.name}</strong><span>{room.available ? 'Available · owner provided' : 'Unavailable'}</span></div>
            <dl><div><dt>Fixed monthly / student</dt><dd>₹{monthlyTotal(room).toLocaleString('en-IN')}</dd></div><div><dt>Deposit, separately</dt><dd>₹{room.deposit.toLocaleString('en-IN')}</dd></div></dl>
            <p>Rent ₹{room.rent.toLocaleString('en-IN')}{room.extraCharges.filter(c => !c.optional).map(c => ` + ${c.name} ₹${c.amount.toLocaleString('en-IN')}`).join('')}</p>
          </article>)}</div>
          <p className="workspace-muted"><strong>Electricity:</strong> {reviewHostel.electricityPolicy || 'Not provided — clarify before publishing.'}</p>
          <p className="workspace-muted"><strong>Amenities:</strong> {reviewHostel.amenities.join(', ')}</p>
          <div className="admin-review-note"><Shield size={20} /><div><strong>Approval is a publication decision.</strong><p>It does not claim owner identity, a site visit, or room availability has been independently verified. This demo has no verification service.</p></div></div>
          <div className="workspace-modal-actions">
            {reviewHostel.status === 'pending' && <><Button onClick={() => approve(reviewHostel.id, reviewHostel.name)}>Approve listing</Button><Button variant="outline" onClick={() => { setRejectId(reviewHostel.id); setRejectReason(''); setRejectError(''); }}>Reject with reason</Button></>}
            {reviewHostel.status === 'approved' && <><Button variant="outline" onClick={() => suspend(reviewHostel.id, reviewHostel.name)}>Hide listing</Button><Link className="workspace-inline-link" to={`/hostel/${reviewHostel.id}`}>Open public page</Link></>}
            {reviewHostel.status === 'rejected' && <Button onClick={() => restore(reviewHostel.id, reviewHostel.name)}>Restore to published</Button>}
          </div>
        </div>}
      </Modal>
      <Modal open={Boolean(rejectId)} onClose={() => setRejectId(null)} title="Reject listing">
        <p className="workspace-muted">Explain what needs to change. The reason is recorded in this session's local moderation history.</p>
        <label className="workspace-modal-label" htmlFor="reject-reason">Reason for rejection</label>
        <textarea id="reject-reason" className="workspace-modal-input" value={rejectReason} maxLength={600} onChange={e => { setRejectReason(e.target.value); setRejectError(''); }} rows={4} placeholder="For example: Please add the mandatory mess charge and clearer room photos." />
        {rejectError && <p role="alert" className="workspace-form-error">{rejectError}</p>}
        <div className="workspace-modal-actions"><Button variant="danger" onClick={confirmReject}>Reject listing</Button><Button variant="ghost" onClick={() => setRejectId(null)}>Keep reviewing</Button></div>
      </Modal>
    </div>
  );
}
