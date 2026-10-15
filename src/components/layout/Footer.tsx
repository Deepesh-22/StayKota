import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-white font-bold">S</div>
              <span className="text-lg font-bold text-white">StayKota</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">Honest hostel and PG discovery for students in Kota. Real photos, clear rent breakup, direct owner contact.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/explore?locality=Talwandi" className="hover:text-teal-400">Hostels in Talwandi</Link></li>
              <li><Link to="/explore?category=girls" className="hover:text-teal-400">Girls hostels</Link></li>
              <li><Link to="/explore?maxBudget=6000" className="hover:text-teal-400">Budget under ₹6k</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/how-it-works" className="hover:text-teal-400">How it works</Link></li>
              <li><Link to="/login?role=owner" className="hover:text-teal-400">List your property</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} StayKota · Made for students in Kota</p>
          <p>Rent shown monthly · Deposit & extras listed separately</p>
        </div>
      </div>
    </footer>
  );
}
