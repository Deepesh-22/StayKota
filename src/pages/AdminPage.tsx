import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { ListingStatus } from '../types';

export function AdminPage() {
  const { user, hostels, updateHostelStatus } = useApp();
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600">Admin access only. No public signup.</p>
        <Link to="/login?role=admin" className="mt-4 inline-block text-teal-600 font-medium">Login as Admin</Link>
      </div>
    );
  }
  const pending = hostels.filter(h => h.status === 'pending');
  const handleAction = (id: string, status: ListingStatus) => updateHostelStatus(id, status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Moderation</h1>
          <p className="text-slate-500 text-sm">Private prototype route · Review and approve listings</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-10">
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{pending.length}</p><p className="text-sm text-slate-500">Pending</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{hostels.filter(h => h.status === 'approved').length}</p><p className="text-sm text-slate-500">Approved</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{hostels.filter(h => h.status === 'rejected').length}</p><p className="text-sm text-slate-500">Rejected</p></Card>
      </div>
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Pending review</h2>
      {pending.length === 0 ? <Card className="p-8 text-center text-slate-500 mb-10">No listings awaiting review</Card> : (
        <div className="space-y-4 mb-10">
          {pending.map(h => (
            <Card key={h.id} className="p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <img src={h.coverImage} alt="" className="w-24 h-20 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold">{h.name}</h3>
                  <p className="text-sm text-slate-500">{h.locality} · {h.category}</p>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{h.description}</p>
                </div>
                <div className="flex sm:flex-col gap-2">
                  <Button size="sm" onClick={() => handleAction(h.id, 'approved')}><CheckCircle className="w-4 h-4" /> Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => handleAction(h.id, 'rejected')}><XCircle className="w-4 h-4" /> Reject</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <h2 className="text-lg font-semibold mb-4">All listings</h2>
      <div className="space-y-3">
        {hostels.map(h => (
          <Card key={h.id} className="p-4 flex items-center justify-between">
            <div><p className="font-medium">{h.name}</p><p className="text-sm text-slate-500">{h.locality}</p></div>
            <div className="flex items-center gap-3">
              {h.status === 'approved' && <Badge variant="success">Approved</Badge>}
              {h.status === 'pending' && <Badge variant="warning">Pending</Badge>}
              {h.status === 'rejected' && <Badge variant="error">Rejected</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
