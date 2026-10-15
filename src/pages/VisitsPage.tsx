import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export function VisitsPage() {
  const { user, visits } = useApp();

  if (!user || user.role !== 'student') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-600">Please login as a student to view visits.</p>
        <Link to="/login?role=student" className="mt-4 inline-block text-teal-600 font-medium">Login</Link>
      </div>
    );
  }

  const myVisits = visits.filter(v => v.studentId === user.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">My Visits</h1>
      <p className="text-slate-500 mb-8">
        All visits are marked Confirmed in this prototype. Exact time is coordinated later with the owner.
      </p>

      {myVisits.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No visits scheduled yet</p>
          <Link to="/" className="mt-4 inline-block text-teal-600 font-medium hover:underline">
            Find a hostel
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myVisits.map(v => (
            <Card key={v.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
                    </Badge>
                  </div>
                  <Link to={`/hostel/${v.hostelId}`} className="font-semibold text-slate-900 hover:text-teal-700">
                    {v.hostelName}
                  </Link>
                  {v.roomTypeName && (
                    <p className="text-sm text-slate-500 mt-0.5">Room: {v.roomTypeName}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-600">
                    <Calendar className="w-3.5 h-3.5" />
                    Visit date: <strong>{new Date(v.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  </div>
                  {v.message && (
                    <p className="mt-2 text-sm text-slate-500 italic">"{v.message}"</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    Submitted {new Date(v.createdAt).toLocaleString('en-IN')} · Demo only — not a reservation
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
