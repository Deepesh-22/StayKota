import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { ListingStatus } from '../types';

export function OwnerDashboard() {
  const { user, hostels, visits } = useApp();
  if (!user || user.role !== 'owner') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-600">Please login as a hostel owner.</p>
        <Link to="/login?role=owner" className="mt-4 inline-block text-teal-600 font-medium">Login as Owner</Link>
      </div>
    );
  }
  const myHostels = hostels.filter(h => h.ownerId === user.id || user.id.startsWith('demo-owner'));
  const myVisits = visits.filter(v => myHostels.some(h => h.id === v.hostelId));
  const statusBadge = (status: ListingStatus) => {
    const map = {
      draft: <Badge>Draft</Badge>,
      pending: <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>,
      approved: <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>,
      rejected: <Badge variant="error"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>,
    };
    return map[status];
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Owner Dashboard</h1>
      <p className="text-slate-500 mb-8">Manage your listings and student visit requests</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="p-4"><p className="text-sm text-slate-500">Total listings</p><p className="text-2xl font-bold mt-1">{myHostels.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Approved</p><p className="text-2xl font-bold text-emerald-600 mt-1">{myHostels.filter(h => h.status === 'approved').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{myHostels.filter(h => h.status === 'pending').length}</p></Card>
        <Card className="p-4"><p className="text-sm text-slate-500">Visit requests</p><p className="text-2xl font-bold text-teal-600 mt-1">{myVisits.length}</p></Card>
      </div>
      <h2 className="text-lg font-semibold mb-4">Your listings</h2>
      {myHostels.length === 0 ? (
        <Card className="p-10 text-center"><Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500">No listings yet</p></Card>
      ) : (
        <div className="space-y-4 mb-12">
          {myHostels.map(h => (
            <Card key={h.id} className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-4">
                  <img src={h.coverImage} alt="" className="w-20 h-16 rounded-xl object-cover bg-slate-100" />
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-semibold">{h.name}</h3>{statusBadge(h.status)}</div>
                    <p className="text-sm text-slate-500">{h.locality} · {h.roomTypes.length} room types</p>
                  </div>
                </div>
                {h.status === 'approved' && <Link to={`/hostel/${h.id}`}><Button variant="outline" size="sm"><Eye className="w-4 h-4" /> View</Button></Link>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <h2 className="text-lg font-semibold mb-4">Recent visit requests</h2>
      {myVisits.length === 0 ? <Card className="p-8 text-center text-slate-500">No visit requests yet</Card> : (
        <div className="space-y-3">
          {myVisits.slice(0, 10).map(v => (
            <Card key={v.id} className="p-4 flex items-center justify-between">
              <div><p className="font-medium">{v.studentName}</p><p className="text-sm text-slate-500">{v.hostelName} · {v.visitDate}</p></div>
              <Badge variant="success">Confirmed</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
