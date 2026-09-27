import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, BookOpen, Users, Megaphone, Shield, ArrowRight } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const getIcon = (type: string) => {
    switch (type) {
      case 'MATERIAL_UPLOAD':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'CIRCLE_ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-purple-600" />;
      case 'CIRCLE_INVITE':
      case 'CIRCLE_REMOVAL':
        return <Users className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time activity alerts on material uploads, circle updates, and academic notices
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Bell className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700 text-sm">No notifications to display</p>
            <p>You're all caught up on academic activities.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 transition cursor-pointer ${
                !item.isRead ? 'bg-indigo-50/40' : ''
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex-shrink-0">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                {item.link && (
                  <Link
                    to={item.link}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:underline pt-1"
                  >
                    View details <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {!item.isRead && (
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
