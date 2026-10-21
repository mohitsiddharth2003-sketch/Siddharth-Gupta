import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Shield,
  Circle,
  Clock,
  Laptop,
  Smartphone,
  ExternalLink,
  ChevronDown,
  X,
  UserCheck,
  Sparkles,
  RefreshCw,
  ArrowRightLeft,
} from 'lucide-react';
import { AuthSession, ActiveSessionInfo, TeamMemberInfo, UserRole } from '../types/auth';
import { PresenceService } from '../services/presenceService';
import { AuthService } from '../services/auth';

interface ActiveUsersPopoverProps {
  currentSession: AuthSession;
  onSwitchUser?: (session: AuthSession) => void;
  language?: 'en' | 'hi';
}

export const ActiveUsersPopover: React.FC<ActiveUsersPopoverProps> = ({
  currentSession,
  onSwitchUser,
  language = 'en',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ActiveSessionInfo[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'online' | 'all'>('online');
  const [isSwitching, setIsSwitching] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Subscribe to live presence changes
  useEffect(() => {
    const unsubscribe = PresenceService.subscribe((updatedSessions) => {
      setSessions(updatedSessions);
    });

    PresenceService.getTeamMembers(currentSession.companyId || 'comp_01').then((members) => {
      setTeamMembers(members);
    });

    return () => {
      unsubscribe();
    };
  }, [currentSession.companyId]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Online count
  const onlineCount = Math.max(1, sessions.filter((s) => s.isOnline).length);

  const getRoleBadgeColor = (role: UserRole | string) => {
    switch (role) {
      case 'Admin':
        return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'Senior Accountant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Tax Auditor':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleQuickSwitch = async (email: string) => {
    setIsSwitching(true);
    try {
      const res = await AuthService.quickDemoLogin(email);
      if (res.success && res.session) {
        onSwitchUser?.(res.session);
        setIsOpen(false);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Live Active Presence Trigger Button in Navbar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="View all users currently logged in and collaborating"
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
          isOpen
            ? 'bg-emerald-100/80 text-emerald-950 border-emerald-300 shadow-xs'
            : 'bg-emerald-50/90 hover:bg-emerald-100/70 text-emerald-900 border-emerald-200/90'
        }`}
      >
        {/* Pulsing Green Online Indicator */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>

        {/* User Avatars Stack (showing multiple logged in people) */}
        <div className="flex -space-x-1.5 overflow-hidden py-0.5">
          {sessions.slice(0, 3).map((s, idx) => (
            <div
              key={s.userId || idx}
              title={`${s.name} (${s.role})`}
              className="inline-block h-5 w-5 rounded-full ring-1.5 ring-white bg-linear-to-tr from-slate-700 to-slate-900 text-white text-[9px] font-bold flex items-center justify-center"
            >
              {getInitials(s.name)}
            </div>
          ))}
        </div>

        <span className="font-bold text-[11px] text-emerald-900">
          {onlineCount} {language === 'hi' ? 'सक्रिय' : onlineCount === 1 ? 'Online' : 'Online'}
        </span>
        <ChevronDown className={`w-3 h-3 text-emerald-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 bg-linear-to-r from-slate-900 to-slate-800 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">
                  {language === 'hi' ? 'सक्रिय सहकर्मी व उपयोगकर्ता' : 'Active Logged In Users'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center justify-between">
              <span>{currentSession.companyName}</span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {onlineCount} {onlineCount === 1 ? 'User' : 'Users'} Active
              </span>
            </p>

            {/* View Filter Tabs */}
            <div className="flex items-center space-x-1 mt-3 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('online')}
                className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors ${
                  activeTab === 'online'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'hi' ? `ऑनलाइन सत्र (${sessions.length})` : `Online Sessions (${sessions.length})`}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition-colors ${
                  activeTab === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {language === 'hi' ? `टीम सदस्य (${teamMembers.length})` : `Firm Team (${teamMembers.length})`}
              </button>
            </div>
          </div>

          {/* Content List */}
          <div className="max-h-80 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
            {activeTab === 'online' ? (
              sessions.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No other active sessions detected.
                </div>
              ) : (
                sessions.map((s) => {
                  const isCurrent = s.isCurrentDevice || s.userId === currentSession.userId;
                  return (
                    <div
                      key={s.sessionId || s.userId}
                      className={`pt-2 first:pt-0 flex items-start justify-between p-2 rounded-xl transition-colors ${
                        isCurrent ? 'bg-emerald-50/60 border border-emerald-200/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5 min-w-0">
                        {/* Avatar with Online Dot */}
                        <div className="relative shrink-0 mt-0.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {getInitials(s.name)}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                            <span className="font-bold text-slate-900 text-xs truncate max-w-[140px]">
                              {s.name}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {language === 'hi' ? 'आप (वर्तमान)' : 'You (This Device)'}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">{s.email}</div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-1">
                            <span className="flex items-center">
                              {s.deviceInfo?.includes('Mobile') ? (
                                <Smartphone className="w-3 h-3 mr-0.5" />
                              ) : (
                                <Laptop className="w-3 h-3 mr-0.5" />
                              )}
                              <span>{s.deviceInfo?.split('(')[0] || 'Desktop'}</span>
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">Online Now</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right ml-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeColor(
                            s.role
                          )}`}
                        >
                          {s.role}
                        </span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              // All Team Members View
              teamMembers.map((m) => {
                const isOnline = sessions.some((s) => s.email.toLowerCase() === m.email.toLowerCase());
                const isCurrent = m.email.toLowerCase() === currentSession.email.toLowerCase();

                return (
                  <div
                    key={m.id}
                    className="pt-2 first:pt-0 flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                          {getInitials(m.name)}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                            isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{m.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">{m.email}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <span className={isOnline ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                            {isOnline ? '🟢 Logged in' : '⚪ Offline'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeColor(
                          m.role
                        )}`}
                      >
                        {m.role}
                      </span>
                      {!isCurrent && onSwitchUser && (
                        <div>
                          <button
                            type="button"
                            onClick={() => handleQuickSwitch(m.email)}
                            disabled={isSwitching}
                            className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 underline flex items-center justify-end space-x-0.5 cursor-pointer ml-auto"
                          >
                            <ArrowRightLeft className="w-2.5 h-2.5 mr-0.5" />
                            <span>Switch</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Colleague Switcher Footer (Demo & Multi-User Testing) */}
          <div className="p-3 bg-slate-50 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{language === 'hi' ? 'त्वरित उपयोगकर्ता स्विच करें (मल्टी-यूज़र परीक्षण):' : 'Quick Switch Role (Test 2 Logins):'}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSwitch('ca.sharma@accountspro.in')}
                className={`p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                  currentSession.email === 'ca.sharma@accountspro.in'
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-semibold text-[11px] truncate">CA Rajesh Sharma</div>
                <div className="text-[10px] text-slate-400">Admin</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('priya.patel@patelenterprises.com')}
                className={`p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                  currentSession.email === 'priya.patel@patelenterprises.com'
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="font-semibold text-[11px] truncate">Priya Patel</div>
                <div className="text-[10px] text-slate-400">Senior Accountant</div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
