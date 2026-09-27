import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Upload,
  Users,
  Bell,
  User as UserIcon,
  LogOut,
  Bookmark,
  History,
  FileText,
  Shield,
  Settings,
  ChevronDown,
  Menu,
  X,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/materials?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Tagline */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:bg-indigo-700 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
                StudentShare
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-indigo-600 uppercase tracking-wider ml-2 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Find. Share. Learn.
              </span>
            </div>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, subjects (e.g. Data Structures, OS, Java)..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-sm rounded-xl border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition outline-none"
              />
            </div>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <Link
              to="/materials"
              className={`px-3 py-2 rounded-lg transition ${
                location.pathname === '/materials'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Browse Materials
            </Link>
            <Link
              to="/circles"
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
                location.pathname.startsWith('/circles')
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-500" />
              Friend Circles
            </Link>
            <Link
              to="/upload"
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 shadow-sm shadow-indigo-200 transition ml-2"
            >
              <Upload className="w-4 h-4" />
              Upload Material
            </Link>
          </nav>

          {/* Right Action Icons (Auth / Notifications / Profile) */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifMenu(!showNotifMenu);
                      setShowUserMenu(false);
                    }}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-800">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-sm text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id);
                                if (notif.link) {
                                  navigate(notif.link);
                                  setShowNotifMenu(false);
                                }
                              }}
                              className={`p-3.5 hover:bg-slate-50 cursor-pointer transition flex items-start gap-3 ${
                                !notif.isRead ? 'bg-indigo-50/50' : ''
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                  !notif.isRead ? 'bg-indigo-600' : 'bg-transparent'
                                }`}
                              />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                                <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifMenu(false)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          View all notifications →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifMenu(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-indigo-200 object-cover"
                    />
                    <span className="hidden md:inline-block text-xs font-medium text-slate-800 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {user.role}
                        </span>
                      </div>

                      <div className="py-1 text-xs text-slate-700">
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
                        >
                          <BookOpen className="w-4 h-4 text-slate-400" />
                          Student Dashboard
                        </Link>
                        <Link
                          to="/my-uploads"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          My Uploads
                        </Link>
                        <Link
                          to="/saved-materials"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
                        >
                          <Bookmark className="w-4 h-4 text-slate-400" />
                          Saved Bookmarks
                        </Link>
                        <Link
                          to="/download-history"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
                        >
                          <History className="w-4 h-4 text-slate-400" />
                          Download History
                        </Link>
                        <Link
                          to="/circles"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
                        >
                          <Users className="w-4 h-4 text-slate-400" />
                          Friend Circles
                        </Link>

                        {/* Admin Link if role is ADMIN */}
                        {user.role === 'ADMIN' && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2.5 px-4 py-2 bg-indigo-50/70 text-indigo-700 font-semibold hover:bg-indigo-100/70"
                          >
                            <Shield className="w-4 h-4 text-indigo-600" />
                            Admin Console
                          </Link>
                        )}

                        <Link
                          to="/settings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Settings
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                >
                  Join Free
                </Link>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-3 space-y-2">
            <form onSubmit={handleSearch} className="px-2 pb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, subjects..."
                className="w-full px-3.5 py-2 bg-slate-100 text-sm rounded-lg"
              />
            </form>
            <Link
              to="/materials"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Browse Materials
            </Link>
            <Link
              to="/circles"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Friend Circles
            </Link>
            <Link
              to="/upload"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Upload Study Material
            </Link>
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-semibold text-indigo-700 bg-indigo-50"
              >
                Admin Console
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
