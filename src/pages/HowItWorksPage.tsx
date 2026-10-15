import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, Calendar, Building2, Shield, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export function HowItWorksPage() {
  const steps = [
    { icon: <Search className="w-6 h-6" />, title: 'Search & filter', desc: 'Browse hostels by locality, budget and sharing type. Only admin-approved listings appear publicly.' },
    { icon: <Heart className="w-6 h-6" />, title: 'Save favourites', desc: 'Create a free student account to save hostels and compare options later.' },
    { icon: <Calendar className="w-6 h-6" />, title: 'Schedule a visit', desc: 'Pick a date (no time needed). Request is confirmed in this prototype; owner coordinates exact time later.' },
    { icon: <Building2 className="w-6 h-6" />, title: 'For owners', desc: 'List your hostel with multiple room types, transparent pricing and manage visit requests.' },
  ];

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-b from-teal-50 to-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-slate-900">How StayKota works</h1>
          <p className="mt-4 text-lg text-slate-600">Simple, transparent hostel discovery built for Kota students and owners.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((s, i) => (
            <Card key={i} className="p-6">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">{s.icon}</div>
              <h3 className="font-semibold text-slate-900 text-lg">{s.title}</h3>
              <p className="mt-2 text-slate-600 text-sm">{s.desc}</p>
            </Card>
          ))}
        </div>
        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900">Important notes (prototype)</h3>
              <ul className="mt-2 text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li>All data is simulated. No real emails or payments are sent.</li>
                <li>Visit requests are immediately marked Confirmed — not a room reservation.</li>
                <li>Listings require admin approval before appearing publicly.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center">
          <Link to="/"><Button size="lg">Browse hostels <ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
