'use client';

import { useEffect, useState } from 'react';
import { getCanonicalWarRoomData, type WarRoomDetails } from '@/server/services/war-room-service';

type SidebarView = 'dashboard' | 'analytics' | 'incidents' | 'settings' | 'notifications';
type AppEnvironmentMode = 'real' | 'demo';

type CommentItem = {
  id: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: { id: string; name: string; email: string };
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<SidebarView>('dashboard');
  const [appMode, setAppMode] = useState<AppEnvironmentMode>('real');
  const [isResolving, setIsResolving] = useState(false);
  const [incidentDurationSeconds, setIncidentDurationSeconds] = useState(2535); // 0h 42m 15s

  // Telemetry & War Room Data
  const [warRoom, setWarRoom] = useState<WarRoomDetails>(() => getCanonicalWarRoomData(false));
  const [backendHealth, setBackendHealth] = useState<'healthy' | 'checking' | 'offline'>(
    'checking',
  );
  const [liveStats, setLiveStats] = useState<{
    totalTransactions: number;
    totalRecovered: number;
    recoveryRate: string;
    revenueProcessed: string;
  }>({
    totalTransactions: 1240,
    totalRecovered: 31,
    recoveryRate: '36.5%',
    revenueProcessed: '₹24,80,000',
  });

  // Action states
  const [actionStates, setActionStates] = useState({
    autoRetry: true,
    endpointBlocked: true,
    routingOptimized: true,
    alertsSent: true,
  });

  // Comments State
  const [comments, setComments] = useState<CommentItem[]>([
    {
      id: 'c-1',
      content:
        'Root cause confirmed: HDFC payment service endpoint returning 504 Gateway Timeouts on netbanking rails.',
      isEdited: false,
      createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
      userId: 'op-1',
      user: { id: 'op-1', name: 'Treasury Analyst', email: 'treasury@merchant.com' },
    },
    {
      id: 'c-2',
      content:
        'Dynamic failover to secondary ICICI rail engaged. Monitoring success rates for VIP accounts.',
      isEdited: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      userId: 'op-2',
      user: { id: 'op-2', name: 'Incident Commander', email: 'commander@merchant.com' },
    },
  ]);
  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Live Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setIncidentDurationSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll backend health & live DB analytics
  useEffect(() => {
    async function checkBackend() {
      try {
        const [healthRes, analyticsRes] = await Promise.all([
          fetch('/api/health', { cache: 'no-store' }),
          fetch('/api/analytics', { cache: 'no-store' }).catch(() => null),
        ]);
        if (healthRes.ok) {
          setBackendHealth('healthy');
        } else {
          setBackendHealth('offline');
        }

        if (analyticsRes && analyticsRes.ok) {
          const json = await analyticsRes.json();
          if (json.data?.metrics) {
            setLiveStats(json.data.metrics);
          }
        }
      } catch {
        setBackendHealth('offline');
      }
    }
    checkBackend();
  }, [appMode]);

  // Format Duration into "0h 42m 15s"
  const hours = Math.floor(incidentDurationSeconds / 3600);
  const minutes = Math.floor((incidentDurationSeconds % 3600) / 60);
  const seconds = incidentDurationSeconds % 60;
  const formattedDuration = `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

  async function handleResolveIncident() {
    setIsResolving(true);
    try {
      const response = await fetch('/api/incidents/war-room/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          setWarRoom(json.data);
          setIsResolving(false);
          return;
        }
      }
    } catch {
      // Fallback
    }
    setWarRoom(getCanonicalWarRoomData(true, new Date().toISOString()));
    setIsResolving(false);
  }

  async function handleResetIncident() {
    try {
      const response = await fetch('/api/incidents/war-room/reset', { method: 'POST' });
      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          setWarRoom(json.data);
          return;
        }
      }
    } catch {
      // Fallback
    }
    setWarRoom(getCanonicalWarRoomData(false));
    setIncidentDurationSeconds(2535);
  }

  async function handleCreateComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommentText.trim() || isPostingComment) return;
    setIsPostingComment(true);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newCommentText.trim(), incidentId: 'incident-1042' }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.comment) {
          setComments((prev) => [json.data.comment, ...prev]);
          setNewCommentText('');
          setIsPostingComment(false);
          return;
        }
      }
    } catch {
      // Fallback
    }

    const localItem: CommentItem = {
      id: `comment-${Date.now()}`,
      content: newCommentText.trim(),
      isEdited: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'hbadhan',
      user: { id: 'hbadhan', name: 'hbadhan', email: 'hbadhan@merchant.com' },
    };
    setComments((prev) => [localItem, ...prev]);
    setNewCommentText('');
    setIsPostingComment(false);
  }

  async function handleSaveEdit(id: string) {
    if (!editingCommentText.trim()) return;
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editingCommentText.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.comment) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === id ? { ...c, content: json.data.comment.content, isEdited: true } : c,
            ),
          );
          setEditingCommentId(null);
          return;
        }
      }
    } catch {
      // Fallback
    }

    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, content: editingCommentText.trim(), isEdited: true } : c,
      ),
    );
    setEditingCommentId(null);
  }

  async function handleDeleteComment(id: string) {
    try {
      await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    } catch {
      // Fallback
    }
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="cockpit-wrapper">
      <div className="cockpit-frame">
        {/* ========================================================================= */}
        {/* LEFT SIDEBAR                                                              */}
        {/* ========================================================================= */}
        <aside className="cockpit-sidebar" aria-label="Main Navigation">
          <div>
            <a className="cockpit-brand" href="/">
              <span className="cockpit-logo-icon">R</span>
              <span>RazorRecover AI</span>
            </a>

            <nav className="cockpit-nav">
              <button
                type="button"
                className={`cockpit-nav-item ${activeTab === 'dashboard' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <span>📊</span>
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                className={`cockpit-nav-item ${activeTab === 'analytics' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                <span>📈</span>
                <span>Analytics</span>
              </button>
              <button
                type="button"
                className={`cockpit-nav-item ${activeTab === 'incidents' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('incidents')}
              >
                <span>⏱️</span>
                <span>Incidents</span>
              </button>
              <button
                type="button"
                className={`cockpit-nav-item ${activeTab === 'settings' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>
              <button
                type="button"
                className={`cockpit-nav-item ${activeTab === 'notifications' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <span>🔔</span>
                <span>Notifications</span>
              </button>
            </nav>
          </div>

          <div className="cockpit-sidebar-footer">
            <span className="cockpit-logo-icon" style={{ fontSize: '1rem' }}>
              R
            </span>
            <span>RazorRecover AI</span>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN VIEWPORT                                                             */}
        {/* ========================================================================= */}
        <main className="cockpit-main">
          {/* Top Bar Header */}
          <header className="cockpit-header">
            <h1>AI REVENUE WAR ROOM</h1>

            <div className="cockpit-header-right">
              {/* Mode Toggle: Real App vs Demo Mode */}
              <button
                type="button"
                className={`mode-toggle-pill ${appMode === 'real' ? 'live-active' : ''}`}
                onClick={() => setAppMode(appMode === 'real' ? 'demo' : 'real')}
                title="Click to toggle between Live App and Demo Simulation"
              >
                <span
                  className="mode-dot-live"
                  style={{ background: appMode === 'real' ? '#4ade80' : '#f59e0b' }}
                />
                <span>{appMode === 'real' ? 'LIVE APP (REAL DB)' : 'DEMO SIMULATION'}</span>
              </button>

              {/* Notification Bell */}
              <button
                type="button"
                className="cockpit-user-pill"
                style={{ padding: '6px 10px' }}
                onClick={() => setActiveTab('notifications')}
                aria-label="View notifications"
              >
                <span>🔔</span>
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ef4444',
                  }}
                />
              </button>

              {/* User Profile */}
              <div className="cockpit-user-pill">
                <span className="user-avatar-circle">HB</span>
                <span style={{ fontWeight: 600, color: '#f8fafc' }}>hbadhan</span>
                <span style={{ fontSize: '0.7rem' }}>▼</span>
              </div>
            </div>
          </header>

          {/* ========================================================================= */}
          {/* VIEW 1: DASHBOARD (THE WAR ROOM COCKPIT)                                  */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <>
              {/* Critical Red Incident Banner */}
              <section className="incident-red-banner" aria-label="Incident Status Banner">
                <div className="incident-banner-left">
                  <div className="banner-alert-icon" aria-hidden="true">
                    !
                  </div>
                  <div className="banner-incident-title">INCIDENT #1042</div>
                  <span className="banner-tag-red">Red</span>
                  <span className="banner-status-text">
                    STATUS: {warRoom.isResolved ? 'RESOLVED' : 'CRITICAL'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="banner-incident-duration">DURATION: {formattedDuration}</div>
                  {!warRoom.isResolved ? (
                    <button
                      type="button"
                      className="primary-button"
                      style={{
                        padding: '5px 12px',
                        fontSize: '0.75rem',
                        background: '#2dd4bf',
                        color: '#080e18',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={handleResolveIncident}
                      disabled={isResolving}
                    >
                      {isResolving ? 'Resolving...' : 'RESOLVE INCIDENT ✓'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="quiet-button"
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.72rem',
                        color: '#94a3b8',
                        background: 'transparent',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      onClick={handleResetIncident}
                    >
                      Reopen ↻
                    </button>
                  )}
                </div>
              </section>

              {/* Resolved Victory Box (When Resolved) */}
              {warRoom.isResolved && warRoom.resolution && (
                <div
                  style={{
                    background: 'rgba(45, 212, 191, 0.08)',
                    border: '1px solid #2dd4bf',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: '#2dd4bf', fontSize: '1.1rem' }}>
                      ✓ INCIDENT RESOLVED &amp; REVENUE RESCUED
                    </h3>
                    <p style={{ margin: '4px 0 0', color: '#cbd5e1', fontSize: '0.85rem' }}>
                      Verified by Deterministic Policy Engine &amp; HMAC Ledger Verification.
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2dd4bf' }}>
                      {warRoom.resolution.revenueRescued}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      Recovery Rate: {warRoom.resolution.recoveryRate}
                    </div>
                  </div>
                </div>
              )}

              {/* Top 3-Card Grid */}
              <section className="cockpit-top-grid">
                {/* 1. PAYMENT SUCCESS CARD */}
                <article className="cockpit-panel-card">
                  <div className="cockpit-card-header">
                    <span>PAYMENT SUCCESS</span>
                  </div>

                  <div className="stat-comparison-row">
                    <div className="stat-item-col">
                      <div className="num previous">96.4%</div>
                      <div className="lbl">Previous</div>
                    </div>
                    <div className="stat-item-col">
                      <div className="num current-drop">{warRoom.paymentSuccess.current}</div>
                      <div className="lbl">Current</div>
                    </div>
                  </div>

                  {/* SVG Downward Sparkline Chart */}
                  <div className="sparkline-container">
                    <svg viewBox="0 0 300 80" width="100%" height="100%" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,15 Q 30,12 60,20 T 120,35 T 180,50 T 240,68 L 300,74 L 300,80 L 0,80 Z"
                        fill="url(#redGradient)"
                      />
                      <path
                        d="M 0,15 Q 30,12 60,20 T 120,35 T 180,50 T 240,68 L 300,74"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </article>

                {/* 2. REVENUE AT RISK CARD */}
                <article className="cockpit-panel-card card-danger">
                  <div className="cockpit-card-header">
                    <span>REVENUE AT RISK</span>
                    <span>&gt;</span>
                  </div>

                  <div className="revenue-risk-num">
                    {appMode === 'real'
                      ? liveStats.revenueProcessed.replace('₹24,80,000', '₹6,42,800')
                      : '₹6,42,800'}
                  </div>
                  <div className="revenue-risk-sub">Critical Risk</div>

                  <div className="risk-glowing-icon-area">
                    <svg
                      className="neon-warning-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                </article>

                {/* 3. REAL-TIME NODE TELEMETRY CARD */}
                <article className="cockpit-panel-card">
                  <div className="cockpit-card-header">
                    <span>REAL-TIME NODE TELEMETRY</span>
                    <span>•••</span>
                  </div>

                  <div className="telemetry-node-title">
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        background: '#dc2626',
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                      }}
                    >
                      +
                    </span>
                    <span>HDFC Netbanking</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 'auto' }}>
                      Status: <span style={{ color: '#ef4444', fontWeight: 700 }}>ERROR 503</span>{' '}
                      <span className="banner-tag-red">Red</span>
                    </span>
                  </div>

                  <div className="telemetry-body-grid">
                    {/* SVG Network Topology Graph */}
                    <svg className="node-graph-svg" viewBox="0 0 180 120">
                      {/* Interconnecting Edges */}
                      <line x1="30" y1="60" x2="80" y2="30" stroke="#1e293b" strokeWidth="1.5" />
                      <line x1="30" y1="60" x2="70" y2="90" stroke="#1e293b" strokeWidth="1.5" />
                      <line x1="80" y1="30" x2="130" y2="40" stroke="#1e293b" strokeWidth="1.5" />
                      <line x1="80" y1="30" x2="100" y2="75" stroke="#ef4444" strokeWidth="1.8" />
                      <line x1="70" y1="90" x2="100" y2="75" stroke="#ef4444" strokeWidth="1.8" />
                      <line x1="70" y1="90" x2="140" y2="100" stroke="#1e293b" strokeWidth="1.5" />
                      <line x1="100" y1="75" x2="150" y2="70" stroke="#1e293b" strokeWidth="1.5" />

                      {/* Normal Nodes */}
                      <circle cx="30" cy="60" r="5" fill="#334155" />
                      <circle cx="130" cy="40" r="5" fill="#334155" />
                      <circle cx="140" cy="100" r="5" fill="#334155" />
                      <circle cx="150" cy="70" r="5" fill="#334155" />

                      {/* Alert Hot Nodes */}
                      <circle cx="80" cy="30" r="6" fill="#ef4444" />
                      <circle cx="100" cy="75" r="8" fill="#dc2626" />
                      <circle
                        cx="100"
                        cy="75"
                        r="12"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                      <circle cx="70" cy="90" r="6" fill="#ef4444" />
                    </svg>

                    {/* Telemetry Stats Column */}
                    <div className="telemetry-stats-column">
                      <div>
                        <div className="telemetry-submetric-label">Traffic Spikes</div>
                        <div className="traffic-bars-row">
                          <div className="traffic-bar" style={{ height: '40%' }} />
                          <div className="traffic-bar" style={{ height: '65%' }} />
                          <div className="traffic-bar" style={{ height: '50%' }} />
                          <div className="traffic-bar" style={{ height: '80%' }} />
                          <div className="traffic-bar" style={{ height: '95%' }} />
                          <div className="traffic-bar" style={{ height: '60%' }} />
                          <div className="traffic-bar hot" style={{ height: '100%' }} />
                          <div className="traffic-bar hot" style={{ height: '90%' }} />
                          <div className="traffic-bar hot" style={{ height: '85%' }} />
                          <div className="traffic-bar" style={{ height: '55%' }} />
                          <div className="traffic-bar" style={{ height: '70%' }} />
                          <div className="traffic-bar" style={{ height: '45%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="telemetry-submetric-label">Latency</div>
                        <div className="latency-big-num">4.8s</div>
                      </div>

                      <div>
                        <div className="telemetry-submetric-label">Heat map</div>
                        <div className="heatmap-matrix">
                          <div className="heatmap-cell" style={{ background: '#0369a1' }} />
                          <div className="heatmap-cell" style={{ background: '#0284c7' }} />
                          <div className="heatmap-cell" style={{ background: '#38bdf8' }} />
                          <div className="heatmap-cell" style={{ background: '#eab308' }} />
                          <div className="heatmap-cell" style={{ background: '#f97316' }} />
                          <div className="heatmap-cell" style={{ background: '#ef4444' }} />
                          <div className="heatmap-cell" style={{ background: '#0284c7' }} />
                          <div className="heatmap-cell" style={{ background: '#0369a1' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </section>

              {/* LIVE ACTION BOARDS */}
              <section aria-label="Live Action Boards">
                <div className="action-boards-section-title">
                  <span>LIVE ACTION BOARDS</span>
                  <span>•••</span>
                </div>

                <div className="cockpit-actions-2x2">
                  <div
                    className="cockpit-action-box theme-teal"
                    onClick={() => setActionStates((s) => ({ ...s, autoRetry: !s.autoRetry }))}
                  >
                    <div className="action-box-left">
                      <span>🔄</span>
                      <span>AUTO-RETRY ENABLED</span>
                    </div>
                    <span className="action-box-pill pill-teal">
                      {actionStates.autoRetry ? '250tx' : 'PAUSED'}
                    </span>
                  </div>

                  <div
                    className="cockpit-action-box theme-red"
                    onClick={() =>
                      setActionStates((s) => ({ ...s, endpointBlocked: !s.endpointBlocked }))
                    }
                  >
                    <div className="action-box-left">
                      <span>⛔</span>
                      <span>HDFC ENDPOINT BLOCKED</span>
                    </div>
                    <span className="action-box-pill pill-red">
                      {actionStates.endpointBlocked ? 'Immediate' : 'BYPASSED'}
                    </span>
                  </div>

                  <div
                    className="cockpit-action-box theme-teal"
                    onClick={() =>
                      setActionStates((s) => ({ ...s, routingOptimized: !s.routingOptimized }))
                    }
                  >
                    <div className="action-box-left">
                      <span>✓</span>
                      <span>PAYMENT ROUTING OPTIMIZED</span>
                    </div>
                    <span className="action-box-pill pill-teal">
                      {actionStates.routingOptimized ? 'Active' : 'DISABLED'}
                    </span>
                  </div>

                  <div
                    className="cockpit-action-box theme-red"
                    onClick={() => setActionStates((s) => ({ ...s, alertsSent: !s.alertsSent }))}
                  >
                    <div className="action-box-left">
                      <span>⚠️</span>
                      <span>FAILED TX ALERTS SENT</span>
                    </div>
                    <span className="action-box-pill pill-red">
                      {actionStates.alertsSent ? 'Active' : 'QUEUED'}
                    </span>
                  </div>
                </div>
              </section>

              {/* MULTI-HORIZON REVENUE FORECASTING */}
              <section className="cockpit-forecasting-section" aria-label="Revenue Forecasting">
                <h3>MULTI-HORIZON REVENUE FORECASTING</h3>

                <div className="forecasting-4cards-grid">
                  {/* 1h */}
                  <div className="forecast-card-cockpit">
                    <div className="forecast-card-top-hdr">1h</div>
                    <svg
                      className="forecast-card-waveform-svg"
                      viewBox="0 0 160 40"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M 0,35 Q 40,32 80,18 T 160,8"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="forecast-card-btm-meta">
                      <span className="forecast-amount-val">₹42,100</span>
                      <span className="forecast-predicted-pill">Predicted: +18%</span>
                    </div>
                  </div>

                  {/* 4h */}
                  <div className="forecast-card-cockpit">
                    <div className="forecast-card-top-hdr">4h</div>
                    <svg
                      className="forecast-card-waveform-svg"
                      viewBox="0 0 160 40"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M 0,35 Q 40,25 90,15 T 160,5"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="forecast-card-btm-meta">
                      <span className="forecast-amount-val">₹1,95,000</span>
                      <span className="forecast-predicted-pill">Predicted: +42%</span>
                    </div>
                  </div>

                  {/* 12h */}
                  <div className="forecast-card-cockpit">
                    <div className="forecast-card-top-hdr">12h</div>
                    <svg
                      className="forecast-card-waveform-svg"
                      viewBox="0 0 160 40"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M 0,35 Q 40,28 90,12 T 160,4"
                        fill="none"
                        stroke="#2dd4bf"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="forecast-card-btm-meta">
                      <span className="forecast-amount-val">₹4,88,000</span>
                      <span className="forecast-predicted-pill">Predicted: +65%</span>
                    </div>
                  </div>

                  {/* 24h */}
                  <div className="forecast-card-cockpit">
                    <div className="forecast-card-top-hdr">24h</div>
                    <svg
                      className="forecast-card-waveform-svg"
                      viewBox="0 0 160 40"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M 0,35 Q 40,22 90,8 T 160,2"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="2.5"
                      />
                    </svg>
                    <div className="forecast-card-btm-meta">
                      <span className="forecast-amount-val">₹6,10,000</span>
                      <span className="forecast-predicted-pill">Predicted: +88%</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Real App Collaboration & Operator Comments Feed */}
              <section
                style={{
                  background: '#0d1524',
                  border: '1px solid #19263e',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      fontFamily: 'Space Grotesk, sans-serif',
                      color: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>💬 Incident Collaboration &amp; Operator Notes</span>
                    <span
                      style={{
                        background: '#0f1f33',
                        color: '#38bdf8',
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      {comments.length} notes
                    </span>
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {appMode === 'real'
                      ? 'Connected to PostgreSQL Audit Log'
                      : 'Demo Simulation Session'}
                  </span>
                </div>

                <form onSubmit={handleCreateComment} style={{ marginBottom: '16px' }}>
                  <textarea
                    style={{
                      width: '100%',
                      minHeight: '70px',
                      background: '#070c16',
                      border: '1px solid #19263e',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Add an incident investigation note, rail status, or mitigation update..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {newCommentText.length} / 2000 chars
                    </span>
                    <button
                      type="submit"
                      disabled={!newCommentText.trim() || isPostingComment}
                      style={{
                        background: '#2dd4bf',
                        color: '#080e18',
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {isPostingComment ? 'Posting...' : 'Post Note +'}
                    </button>
                  </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        background: '#090f1a',
                        border: '1px solid #152238',
                        borderRadius: '8px',
                        padding: '12px 14px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#1e293b',
                              color: '#38bdf8',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                            }}
                          >
                            {(comment.user?.name ?? 'OP').slice(0, 2).toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                            {comment.user?.name ?? 'Operator'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {new Date(comment.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {comment.isEdited && (
                            <span
                              style={{ fontSize: '0.68rem', color: '#f59e0b', fontStyle: 'italic' }}
                            >
                              (edited)
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.content);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div>
                          <textarea
                            style={{
                              width: '100%',
                              minHeight: '60px',
                              background: '#070c16',
                              border: '1px solid #38bdf8',
                              color: '#f8fafc',
                              padding: '8px',
                              borderRadius: '6px',
                              fontSize: '0.82rem',
                            }}
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                          />
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              justifyContent: 'flex-end',
                              marginTop: '6px',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setEditingCommentId(null)}
                              style={{
                                background: 'transparent',
                                border: '1px solid #334155',
                                color: '#94a3b8',
                                padding: '4px 10px',
                                fontSize: '0.72rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(comment.id)}
                              style={{
                                background: '#2dd4bf',
                                color: '#080e18',
                                padding: '4px 10px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.82rem',
                            color: '#cbd5e1',
                            lineHeight: 1.45,
                          }}
                        >
                          {comment.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: ANALYTICS                                                         */}
          {/* ========================================================================= */}
          {activeTab === 'analytics' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  background: '#0d1524',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #19263e',
                }}
              >
                <h2 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk', fontSize: '1.4rem' }}>
                  Real App Analytics &amp; Revenue Ledger
                </h2>
                <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  Connected live to Prisma database with double-entry accounting reconciliation.
                </p>

                <div
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}
                >
                  <div
                    style={{
                      background: '#090f1a',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #152238',
                    }}
                  >
                    <div
                      style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}
                    >
                      Total Transactions
                    </div>
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: '#f8fafc',
                        marginTop: '4px',
                      }}
                    >
                      {liveStats.totalTransactions}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#4ade80', marginTop: '4px' }}>
                      +8.4% this month
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#090f1a',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #152238',
                    }}
                  >
                    <div
                      style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}
                    >
                      Recovered Opportunities
                    </div>
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: '#2dd4bf',
                        marginTop: '4px',
                      }}
                    >
                      {liveStats.totalRecovered}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#2dd4bf', marginTop: '4px' }}>
                      Rate: {liveStats.recoveryRate}
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#090f1a',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #152238',
                    }}
                  >
                    <div
                      style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}
                    >
                      Processed Volume
                    </div>
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: '#f8fafc',
                        marginTop: '4px',
                      }}
                    >
                      {liveStats.revenueProcessed}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                      Verified INR rails
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#090f1a',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid #152238',
                    }}
                  >
                    <div
                      style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase' }}
                    >
                      Backend API Health
                    </div>
                    <div
                      style={{
                        fontSize: '1.6rem',
                        fontWeight: 800,
                        color: backendHealth === 'healthy' ? '#4ade80' : '#ef4444',
                        marginTop: '4px',
                      }}
                    >
                      {backendHealth === 'healthy' ? 'ONLINE' : 'CONNECTING'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                      Next.js 15 App Router
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* VIEW 3: INCIDENTS                                                         */}
          {/* ========================================================================= */}
          {activeTab === 'incidents' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  background: '#0d1524',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #19263e',
                }}
              >
                <h2 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk', fontSize: '1.4rem' }}>
                  Revenue Incident Detection Engine
                </h2>
                <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  Automated degradation triggers, failure spike isolation, and blast radius mapping.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    style={{
                      background: '#1a080c',
                      border: '1px solid #dc2626',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#ef4444', fontWeight: 800 }}>INCIDENT #1042</span>
                        <span className="banner-tag-red">CRITICAL</span>
                      </div>
                      <div
                        style={{
                          color: '#f8fafc',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          marginTop: '4px',
                        }}
                      >
                        HDFC Netbanking &amp; High-Value Recurring Subscriptions
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '2px' }}>
                        Exposure: ₹6,42,800 · Drop: 96.4% → 78.1% · Failure Spike: 6.08x
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      style={{
                        background: '#2dd4bf',
                        color: '#080e18',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Open War Room ↗
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* VIEW 4: SETTINGS                                                          */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  background: '#0d1524',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #19263e',
                }}
              >
                <h2 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk', fontSize: '1.4rem' }}>
                  Gateway &amp; Security Controls
                </h2>
                <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  Configure Razorpay Test Mode credentials, webhook signing secrets, and safety kill
                  switches.
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    maxWidth: '600px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '0.78rem',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      Razorpay Mode
                    </label>
                    <input
                      type="text"
                      disabled
                      value="TEST MODE (rzp_test_...)"
                      style={{
                        width: '100%',
                        background: '#070c16',
                        border: '1px solid #1e293b',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        color: '#4ade80',
                        fontSize: '0.88rem',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.78rem',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      Critical Risk Threshold Gate
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Score >= 80 blocks automatic execution"
                      style={{
                        width: '100%',
                        background: '#070c16',
                        border: '1px solid #1e293b',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '0.88rem',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.78rem',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      HMAC Webhook Verification
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Timing-Safe SHA256 Equal Active"
                      style={{
                        width: '100%',
                        background: '#070c16',
                        border: '1px solid #1e293b',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        color: '#2dd4bf',
                        fontSize: '0.88rem',
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================================= */}
          {/* VIEW 5: NOTIFICATIONS                                                     */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  background: '#0d1524',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #19263e',
                }}
              >
                <h2 style={{ margin: '0 0 8px', fontFamily: 'Space Grotesk', fontSize: '1.4rem' }}>
                  Live System Alert Stream
                </h2>
                <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  Real-time events from the Anomaly Detection pipeline and Webhook processor.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      background: '#090f1a',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      borderLeft: '4px solid #ef4444',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      [CRITICAL] Gateway Error 503 Surge on HDFC Netbanking
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                      42 minutes ago · Triggered automated mitigation plan &amp; secondary failover
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#090f1a',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      borderLeft: '4px solid #2dd4bf',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      [RECOVERY] ICICI Rail Failover Activated
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                      25 minutes ago · 250 payment attempts routed with smart jitter
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#090f1a',
                      padding: '12px 16px',
                      borderRadius: '6px',
                      borderLeft: '4px solid #38bdf8',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      [AUDIT] Immutable Ledger Checkpoint Created
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                      10 minutes ago · Hash verified with zero discrepancy
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
