import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  CheckSquare,
  Video,
  ExternalLink,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  LogOut,
  Clock,
  Sparkles,
  FileText,
  UserCheck,
  ShieldAlert,
  Search,
  Edit2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import { WorkspaceService, subscribeWorkspaceAuth } from '../services/workspaceService';
import { User } from 'firebase/auth';

interface WorkspaceModuleProps {
  companyName: string;
}

interface AccountingTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
  notes?: string;
  updated?: string;
}

const DEFAULT_ACCOUNTING_TASKS: AccountingTask[] = [
  {
    id: 'task_gstr1',
    title: 'File GSTR-1 for April 2026',
    notes: 'Outward supplies statement (B2B invoices, credit notes) due on 11th of succeeding month.',
    due: new Date(new Date().getFullYear(), new Date().getMonth(), 11).toISOString(),
    status: 'needsAction',
  },
  {
    id: 'task_tds_pay',
    title: 'Pay TDS (Challan ITNS 281)',
    notes: 'Deposit tax deducted at source u/s 194C, 194J, 194I due on 7th of the month.',
    due: new Date(new Date().getFullYear(), new Date().getMonth(), 7).toISOString(),
    status: 'needsAction',
  },
  {
    id: 'task_gstr3b',
    title: 'File GSTR-3B Summary Return',
    notes: 'Discharge net tax liability after adjusting eligible ITC before 20th.',
    due: new Date(new Date().getFullYear(), new Date().getMonth(), 20).toISOString(),
    status: 'needsAction',
  },
  {
    id: 'task_bank_recon',
    title: 'Reconcile Bank Statements with Cash/Bank Ledgers',
    notes: 'Match HDFC Current Account transactions with posted sales and purchase bills.',
    due: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'completed',
  },
];

export const WorkspaceModule: React.FC<WorkspaceModuleProps> = ({ companyName }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(WorkspaceService.getCurrentUser());
  const [token, setToken] = useState<string | null>(WorkspaceService.getCachedToken());
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'tasks' | 'gmail' | 'meet'>('tasks');

  // Feedback Toast
  const [taskToast, setTaskToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setTaskToast({ message, type });
    setTimeout(() => setTaskToast(null), 3500);
  };

  // Gmail State
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [pendingEmailConfirm, setPendingEmailConfirm] = useState<boolean>(false);

  // Google Tasks State
  const [tasks, setTasks] = useState<AccountingTask[]>(() => {
    const saved = localStorage.getItem('accountspro_workspace_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_ACCOUNTING_TASKS;
      }
    }
    return DEFAULT_ACCOUNTING_TASKS;
  });
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskDeleteConfirmId, setTaskDeleteConfirmId] = useState<string | null>(null);
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('All');

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<AccountingTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Google Meet State
  const [createdSpaces, setCreatedSpaces] = useState<
    { id: string; topic: string; uri: string; code: string; createdAt: string }[]
  >([]);
  const [meetTopic, setMeetTopic] = useState('Client GST & Accounting Review');
  const [isCreatingMeet, setIsCreatingMeet] = useState(false);
  const [copiedMeetUri, setCopiedMeetUri] = useState<string | null>(null);

  // Save tasks to local cache
  useEffect(() => {
    localStorage.setItem('accountspro_workspace_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Listen to Workspace Auth State
  useEffect(() => {
    const unsubscribe = subscribeWorkspaceAuth((user, accessToken) => {
      setCurrentUser(user);
      setToken(accessToken);
    });
    return () => unsubscribe();
  }, []);

  // Fetch initial data when authenticated
  useEffect(() => {
    if (token) {
      if (activeTab === 'gmail') loadEmails();
      if (activeTab === 'tasks') loadTasks();
    }
  }, [token, activeTab]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await WorkspaceService.signInWithGoogle();
      showToast('Connected to Google Workspace successfully!', 'success');
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to connect Google Workspace.');
      showToast(err?.message || 'Failed to connect Google Workspace', 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDisconnect = async () => {
    await WorkspaceService.disconnect();
    setEmails([]);
    showToast('Disconnected from Google Workspace.', 'info');
  };

  // Gmail handlers
  const loadEmails = async () => {
    setIsLoadingEmails(true);
    try {
      const msgs = await WorkspaceService.listGmailMessages(12, emailSearch);
      setEmails(msgs);
    } catch (err: any) {
      console.warn('Failed to fetch emails:', err);
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const handleConfirmSendEmail = async () => {
    if (!composeTo || !composeSubject) return;
    setIsSendingEmail(true);
    try {
      await WorkspaceService.sendGmailMessage(composeTo, composeSubject, composeBody);
      setEmailStatus('Email sent successfully via Gmail!');
      setShowEmailCompose(false);
      setPendingEmailConfirm(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setTimeout(() => setEmailStatus(null), 4000);
      showToast('Email sent successfully via Gmail!', 'success');
      loadEmails();
    } catch (err: any) {
      alert(`Send Error: ${err.message}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Tasks handlers
  const loadTasks = async () => {
    if (!token) return;
    setIsLoadingTasks(true);
    try {
      const items = await WorkspaceService.getTasks('@default');
      if (items && Array.isArray(items)) {
        setTasks(
          items.map((i: any) => ({
            id: i.id,
            title: i.title || '(Untitled Task)',
            status: i.status || 'needsAction',
            due: i.due,
            notes: i.notes,
            updated: i.updated,
          }))
        );
      }
    } catch (err: any) {
      console.warn('Failed to load tasks from Google Tasks:', err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsCreatingTask(true);
    try {
      if (token) {
        await WorkspaceService.createTask('@default', {
          title: newTaskTitle.trim(),
          notes: newTaskNotes.trim(),
          due: newTaskDue || undefined,
        });
        await loadTasks();
        showToast(`Task "${newTaskTitle.trim()}" added to Google Tasks!`, 'success');
      } else {
        const localTask: AccountingTask = {
          id: `task_${Date.now()}`,
          title: newTaskTitle.trim(),
          notes: newTaskNotes.trim(),
          due: newTaskDue ? new Date(newTaskDue).toISOString() : undefined,
          status: 'needsAction',
          updated: new Date().toISOString(),
        };
        setTasks((prev) => [localTask, ...prev]);
        showToast(`Task created! Sign in with Google to sync live.`, 'info');
      }
      setNewTaskTitle('');
      setNewTaskDue('');
      setNewTaskNotes('');
    } catch (err: any) {
      alert(`Task Error: ${err.message}`);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleToggleTask = async (task: AccountingTask) => {
    const nextCompleted = task.status !== 'completed';
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextCompleted ? 'completed' : 'needsAction' } : t))
    );

    if (token) {
      try {
        await WorkspaceService.updateTaskStatus('@default', task.id, nextCompleted);
      } catch (err: any) {
        alert(`Update Error: ${err.message}`);
        loadTasks();
      }
    }
  };

  const handleStartEdit = (task: AccountingTask) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setEditDue(task.due ? task.due.substring(0, 10) : '');
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !editTitle.trim()) return;
    setIsSavingEdit(true);
    try {
      if (token) {
        await WorkspaceService.updateTask('@default', editingTask.id, {
          title: editTitle.trim(),
          notes: editNotes.trim(),
          due: editDue || undefined,
        });
        await loadTasks();
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id
              ? {
                  ...t,
                  title: editTitle.trim(),
                  notes: editNotes.trim(),
                  due: editDue ? new Date(editDue).toISOString() : undefined,
                }
              : t
          )
        );
      }
      setEditingTask(null);
      showToast('Task updated successfully.', 'success');
    } catch (err: any) {
      alert(`Save Error: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      if (token) {
        await WorkspaceService.deleteTask('@default', taskId);
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setTaskDeleteConfirmId(null);
      showToast('Task removed.', 'info');
    } catch (err: any) {
      alert(`Delete Error: ${err.message}`);
    }
  };

  // Statutory quick template actions
  const handleAddPresetTask = async (title: string, notes: string, daysAhead: number) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysAhead);
    const dueStr = dueDate.toISOString().split('T')[0];

    if (token) {
      try {
        await WorkspaceService.createTask('@default', {
          title,
          notes,
          due: dueStr,
        });
        await loadTasks();
        showToast(`Added "${title}" to Google Tasks!`, 'success');
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      const localTask: AccountingTask = {
        id: `task_${Date.now()}`,
        title,
        notes,
        due: new Date(dueStr).toISOString(),
        status: 'needsAction',
        updated: new Date().toISOString(),
      };
      setTasks((prev) => [localTask, ...prev]);
      showToast(`Added "${title}"! Connect Google account to sync live.`, 'info');
    }
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
        (task.notes && task.notes.toLowerCase().includes(taskSearchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (taskStatusFilter === 'Pending') return task.status === 'needsAction';
      if (taskStatusFilter === 'Completed') return task.status === 'completed';
      return true;
    });
  }, [tasks, taskSearchQuery, taskStatusFilter]);

  // Task Stats
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  // Meet handler
  const handleCreateMeet = async () => {
    setIsCreatingMeet(true);
    try {
      const space = await WorkspaceService.createMeetingSpace(meetTopic);
      const newSpaceRecord = {
        id: `meet_${Date.now()}`,
        topic: meetTopic,
        uri: space.meetingUri,
        code: space.meetingCode,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setCreatedSpaces([newSpaceRecord, ...createdSpaces]);
      showToast('Google Meet space created!', 'success');
    } catch (err: any) {
      alert(`Meet Error: ${err.message}`);
    } finally {
      setIsCreatingMeet(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Connection Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Google Workspace Hub
                </h2>
                <span className="text-[11px] font-medium text-slate-500">
                  Google Tasks • Gmail • Google Meet Integration
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Seamlessly manage statutory due dates, client emails, and audit meetings directly in your Indian accounting system.
            </p>
          </div>

          {/* Official Google Sign-In Button / Connection State */}
          <div>
            {!token ? (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-900">
                    {currentUser?.email || 'Google Workspace Connected'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  title="Disconnect Workspace"
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{authError}</span>
          </div>
        )}

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Google Tasks (Accounting & Due Dates)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'tasks' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {taskStats.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'gmail'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Gmail (Client Invoices & Notices)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('meet')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'meet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Google Meet (Client Consultations)</span>
          </button>
        </div>
      </div>

      {/* Floating Action / Status Toast */}
      {taskToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-2.5 rounded-xl shadow-lg bg-slate-900 text-white text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          {taskToast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {taskToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {taskToast.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
          <span>{taskToast.message}</span>
        </div>
      )}

      {/* ======================= TAB 1: GOOGLE TASKS ======================= */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Create Task & Quick Statutory Templates (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Form to Add Custom Accounting Task */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-blue-600" />
                  New Accounting Task
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">Google Tasks API</span>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Task Title / Compliance Objective *
                  </label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g. File GSTR-1 for April 2026 or Pay TDS u/s 194C"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={newTaskDue}
                      onChange={(e) => setNewTaskDue(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Quick Due Presets
                    </label>
                    <div className="flex items-center gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 1);
                          setNewTaskDue(d.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-1 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                      >
                        +Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 7);
                          setNewTaskDue(d.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-1 text-[10px] font-medium bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                      >
                        +7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Next 11th for GSTR-1
                          const d = new Date();
                          d.setMonth(d.getMonth() + 1, 11);
                          setNewTaskDue(d.toISOString().split('T')[0]);
                        }}
                        className="px-2 py-1 text-[10px] font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg"
                      >
                        11th (GST)
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Notes / Challan & Voucher Details
                  </label>
                  <textarea
                    rows={2}
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    placeholder="Add party name, invoice reference, section code, or remarks..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingTask}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingTask ? 'Adding to Tasks...' : 'Add to Google Tasks'}</span>
                </button>
              </form>
            </div>

            {/* Curated Indian Accounting Task Templates */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                  Statutory Accounting Templates
                </span>
                <span className="text-[10px] text-slate-400">One-click creation</span>
              </div>

              <div className="space-y-2">
                {/* 1. File GSTR-1 */}
                <div className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        File GSTR-1
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Outward supplies statement (B2B & B2C invoices) due 11th of succeeding month.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetTask(
                          'File GSTR-1 Monthly Return',
                          'Verify sales invoices, credit notes, and upload B2B details on GST portal before 11th.',
                          11
                        )
                      }
                      title="Add to Google Tasks"
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                {/* 2. Pay TDS */}
                <div className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Pay TDS (Challan ITNS 281)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Deposit tax deducted at source u/s 194C, 194J, 194I due 7th of succeeding month.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetTask(
                          'Pay TDS (Challan ITNS 281)',
                          'Deposit tax deducted at source for contractors, professional fees, and rent by 7th.',
                          7
                        )
                      }
                      title="Add to Google Tasks"
                      className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                {/* 3. File GSTR-3B */}
                <div className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        File GSTR-3B Summary Return
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Reconcile ITC with GSTR-2B & discharge net tax payment by 20th of the month.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetTask(
                          'File GSTR-3B Summary Return & Pay GST',
                          'Check input tax credit in GSTR-2B, set off CGST/SGST/IGST, and pay cash ledger liability.',
                          20
                        )
                      }
                      title="Add to Google Tasks"
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                {/* 4. Pay Advance Tax */}
                <div className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        Pay Advance Tax (Challan 280)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Quarterly instalment (15% by 15th June, 45% by 15th Sept, 75% by 15th Dec, 100% by 15th March).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetTask(
                          'Pay Advance Tax Instalment (Challan 280)',
                          'Compute estimated annual net taxable income and deposit statutory advance income tax instalment.',
                          15
                        )
                      }
                      title="Add to Google Tasks"
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                {/* 5. Bank Reconciliation */}
                <div className="p-3 bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-all shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        Perform Bank Reconciliation
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Match monthly bank statement entries with Cash & Bank ledgers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetTask(
                          'Perform Monthly Bank Reconciliation',
                          'Verify unpresented cheques, direct debits, bank charges, and calculate reconciled balance.',
                          3
                        )
                      }
                      title="Add to Google Tasks"
                      className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Tasks View, Filter & Management (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Toolbar: Search, Status Filters & Refresh */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      Accounting Tasks in Google Tasks
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      {taskStats.pending} pending of {taskStats.total} total tasks
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Filters */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                    {(['All', 'Pending', 'Completed'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setTaskStatusFilter(st)}
                        className={`px-3 py-1 font-semibold rounded-lg transition-colors cursor-pointer ${
                          taskStatusFilter === st
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={loadTasks}
                    disabled={isLoadingTasks}
                    title="Refresh from Google Tasks"
                    className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingTasks ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder="Search tasks by title, section or keyword (e.g. GSTR, TDS, Bank)..."
                  className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden"
                />
              </div>
            </div>

            {/* Tasks Cards List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {!token && (
                <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between text-xs text-amber-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Interactive Workspace Mode. Sign in with Google to sync live to your Google Account.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignIn}
                    className="font-bold underline text-amber-900 cursor-pointer"
                  >
                    Connect
                  </button>
                </div>
              )}

              {isLoadingTasks ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 mx-auto text-blue-600 animate-spin" />
                  <p>Syncing tasks with Google Tasks API...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                  <CheckSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-700">No tasks match your criteria</p>
                  <p className="text-slate-400">
                    Use the form on the left or click a statutory preset to add a task.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const isDone = task.status === 'completed';
                    return (
                      <div
                        key={task.id}
                        className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                          isDone ? 'bg-slate-50/70' : 'hover:bg-slate-50/40'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTask(task)}
                            className="mt-1 h-4 w-4 rounded-md text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-semibold ${
                                  isDone
                                    ? 'line-through text-slate-400'
                                    : 'text-slate-900'
                                }`}
                              >
                                {task.title}
                              </span>
                              {isDone ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Done
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  Pending
                                </span>
                              )}
                            </div>

                            {task.notes && (
                              <p className="text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap">
                                {task.notes}
                              </p>
                            )}

                            {task.due && (
                              <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-semibold pt-0.5">
                                <Calendar className="w-3 h-3 text-amber-600" />
                                <span>Due: {new Date(task.due).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions: Edit & Delete */}
                        <div className="flex items-center gap-1 shrink-0 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(task)}
                            title="Edit task"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTaskDeleteConfirmId(task.id)}
                            title="Delete task"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: GMAIL ======================= */}
      {activeTab === 'gmail' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-800">Gmail Communications</h3>
                <span className="text-[11px] text-slate-500">Read & send accounting notices</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmailCompose(true)}
                disabled={!token}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Compose Email</span>
              </button>
              <button
                type="button"
                onClick={loadEmails}
                disabled={!token || isLoadingEmails}
                className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingEmails ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {!token ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <Mail className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Gmail Not Connected</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Sign in with your Google Workspace account to read customer communications, send tax invoices, and email payment reminders directly from AccountsPro.
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 cursor-pointer"
              >
                Connect Gmail Account
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Recent Messages ({emails.length})</span>
                <span className="text-[11px] text-slate-500 font-mono">Gmail API Synced</span>
              </div>
              {isLoadingEmails ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading messages from Gmail...</div>
              ) : emails.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No recent messages found.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {emails.map((msg) => (
                    <div key={msg.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-xs">{msg.sender}</span>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">{msg.date}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-900">{msg.subject}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">{msg.snippet}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 3: GOOGLE MEET ======================= */}
      {activeTab === 'meet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Schedule / Start Google Meet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Instantly generate a Google Meet conference link for client audit presentations, GST return verifications, or dispute resolutions.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Meeting Topic / Purpose</label>
              <input
                type="text"
                value={meetTopic}
                onChange={(e) => setMeetTopic(e.target.value)}
                placeholder="e.g. Q1 GST Audit Discussion"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateMeet}
              disabled={!token || isCreatingMeet}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Video className="w-4 h-4" />
              {isCreatingMeet ? 'Creating Space...' : 'Create Google Meet Link'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Active Meetings</span>
              <span className="text-xs text-slate-400 font-normal">{createdSpaces.length} created</span>
            </h3>

            {createdSpaces.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No active meeting spaces created in this session. Click Create above to generate one.
              </div>
            ) : (
              <div className="space-y-3">
                {createdSpaces.map((space) => (
                  <div key={space.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{space.topic}</span>
                      <span className="text-[10px] text-slate-400">{space.createdAt}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={space.uri}
                        className="flex-1 text-[11px] font-mono bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(space.uri);
                          setCopiedMeetUri(space.id);
                          setTimeout(() => setCopiedMeetUri(null), 2000);
                        }}
                        className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg text-slate-600"
                        title="Copy Link"
                      >
                        {copiedMeetUri === space.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={space.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs"
                        title="Join Meeting"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================= MODAL: EDIT TASK ======================= */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Accounting Task
              </h4>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Task Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Due Date</label>
                <input
                  type="date"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notes / Remarks</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: CONFIRM DELETE TASK ======================= */}
      {taskDeleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6" />
              <h4 className="font-bold text-sm text-slate-900">Confirm Task Deletion</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete this task from Google Tasks? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTask(taskDeleteConfirmId)}
                className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
              >
                Delete Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: COMPOSE EMAIL ======================= */}
      {showEmailCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-sm text-slate-900">Compose Email (Gmail)</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailCompose(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">To Recipient</label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="client@company.in"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Invoice or Statement of Accounts"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Message Body</label>
                <textarea
                  rows={5}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Dear Sir/Madam, please find attached details..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {pendingEmailConfirm ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Confirm Sending Email
                </div>
                <p className="text-[11px] text-amber-800">
                  Are you sure you want to send this email to <strong>{composeTo}</strong> from your authorized Gmail account?
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPendingEmailConfirm(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-white rounded-lg"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSendEmail}
                    disabled={isSendingEmail}
                    className="px-4 py-1 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-xs"
                  >
                    {isSendingEmail ? 'Sending...' : 'Confirm & Send'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmailCompose(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!composeTo || !composeSubject) {
                      alert('Please provide recipient email and subject.');
                      return;
                    }
                    setPendingEmailConfirm(true);
                  }}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Email
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
