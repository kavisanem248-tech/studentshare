import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-slate-900">StudentShare</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Find. Share. Learn. The peer-to-peer university academic material sharing network built for high-performing engineering students.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Academic Subjects</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/materials?subject=Data+Structures" className="hover:text-indigo-600">Data Structures</Link></li>
              <li><Link to="/materials?subject=DBMS" className="hover:text-indigo-600">Database Management (DBMS)</Link></li>
              <li><Link to="/materials?subject=Operating+Systems" className="hover:text-indigo-600">Operating Systems</Link></li>
              <li><Link to="/materials?subject=Computer+Networks" className="hover:text-indigo-600">Computer Networks</Link></li>
              <li><Link to="/materials?subject=Cyber+Security" className="hover:text-indigo-600">Cyber Security & Crypto</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Platform Features</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/materials" className="hover:text-indigo-600">Study Materials Library</Link></li>
              <li><Link to="/circles" className="hover:text-indigo-600">Private Friend Circles</Link></li>
              <li><Link to="/upload" className="hover:text-indigo-600">Upload & Share Notes</Link></li>
              <li><Link to="/saved-materials" className="hover:text-indigo-600">Saved Bookmarks</Link></li>
              <li><Link to="/download-history" className="hover:text-indigo-600">Download History</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Academic Integrity</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              All shared lecture notes, question banks, and lab manuals are peer-reviewed. Violations or copyrighted files can be reported directly.
            </p>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="text-xs text-slate-400">© {new Date().getFullYear()} StudentShare Inc.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
