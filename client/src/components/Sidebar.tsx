import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  Bookmark,
  History,
  FileText,
  Users,
  Bell,
  Settings,
  Shield,
  BarChart3,
  Flag,
  Folders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface SidebarProps {
  isAdminSection?: boolean;
}

interface SidebarLink {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isAdminSection = false }) => {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const studentLinks: SidebarLink[] = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/materials', label: 'Browse Materials', icon: BookOpen },
    { to: '/upload', label: 'Upload Material', icon: Upload },
    { to: '/my-uploads', label: 'My Uploads', icon: FileText },
    { to: '/saved-materials', label: 'Saved Materials', icon: Bookmark },
    { to: '/download-history', label: 'Download History', icon: History },
    { to: '/circles', label: 'Friend Circles', icon: Users },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { to: '/settings', label: 'Account Settings', icon: Settings },
  ];

  const adminLinks: SidebarLink[] = [
    { to: '/admin', label: 'Overview', icon: BarChart3, exact: true },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/materials', label: 'Course Materials', icon: BookOpen },
    { to: '/admin/reports', label: 'Reports Queue', icon: Flag },
    { to: '/admin/circles', label: 'Friend Circles', icon: Users },
    { to: '/admin/categories', label: 'Curriculum Categories', icon: Folders },
    { to: '/admin/statistics', label: 'Analytics & Insights', icon: BarChart3 },
  ];

  const links = isAdminSection ? adminLinks : studentLinks;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)] p-4">
      {isAdminSection && (
        <div className="mb-4 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-indigo-900 tracking-wide uppercase">Admin Console</span>
          </div>
          <NavLink to="/dashboard" className="text-[11px] text-indigo-600 hover:underline">
            Exit
          </NavLink>
        </div>
      )}

      <div className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </div>
              {link.badge !== undefined && link.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Switch to Admin if available and not in admin section */}
      {!isAdminSection && user?.role === 'ADMIN' && (
        <div className="mt-auto pt-4 border-t border-slate-100">
          <NavLink
            to="/admin"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
          >
            <Shield className="w-4 h-4" />
            <span>Admin Management</span>
          </NavLink>
        </div>
      )}
    </aside>
  );
};
