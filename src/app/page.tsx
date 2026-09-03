'use client';

import { useEffect, useState } from 'react';
import {
  detectRevenueIncident,
  type RevenueIncidentDetectionResult,
} from '@/server/services/incident-detection-service';
import {
  getCanonicalWarRoomData,
  type WarRoomDetails,
} from '@/server/services/war-room-service';
import {
  generateRevenueForecast,
  type RevenueForecastResult,
} from '@/server/services/forecasting-service';

type ActiveView = 'command-center' | 'war-room' | 'detection' | 'forecasting';

const workflow = [
  'Scan',
  'Detect',
  'Diagnose',
  'Calculate',
  'Simulate',
  'Policy Check',
  'Risk Check',
  'Approve',
  'Execute',
  'Verify',
  'Learn',
];

const metrics = [
  { label: 'Revenue Processed', value: '₹24.8L', detail: '+8.4% this month', tone: 'plain' },
  { label: 'Revenue at Risk', value: '₹8.5L', detail: '2,950 open attempts', tone: 'warning' },
  { label: 'Revenue Rescued', value: '₹3.1L', detail: '1,100 recoveries', tone: 'success' },
  { label: 'Recovery Rate', value: '36.5%', detail: '+4.2 pts vs baseline', tone: 'teal' },
  { label: 'Prevented Loss', value: '₹1.4L', detail: 'Since last review', tone: 'plain' },
  { label: 'Recovery ROI', value: '4.8x', detail: 'After recovery costs', tone: 'teal' },
];

const scoreBreakdown = [
  { label: 'Payment Health', score: 94, note: 'Stable authorization coverage' },
  { label: 'Recovery Efficiency', score: 91, note: 'Retryable failures prioritized' },
  { label: 'Risk Management', score: 96, note: 'Policy gates are holding' },
  { label: 'Checkout Health', score: 87, note: 'Abandonment is the main drag' },
];

export default function HomePage() {
  const [activeView, setActiveView] = useState<ActiveView>('command-center');
  const [currentStep, setCurrentStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [flowState, setFlowState] = useState<'idle' | 'running' | 'complete'>('idle');
  const [refreshState, setRefreshState] = useState<'ready' | 'loading' | 'error'>('ready');

  // War Room & Incident State
  const [warRoom, setWarRoom] = useState<WarRoomDetails>(() => getCanonicalWarRoomData(false));
  const [detection] = useState<RevenueIncidentDetectionResult>(() => detectRevenueIncident());
  const [forecast] = useState<RevenueForecastResult>(() => generateRevenueForecast());
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setTimeout(() => {
      setCurrentStep((step) => {
        if (step >= workflow.length - 1) {
          setRunning(false);
          setFlowState('complete');
          return step;
        }
        return step + 1;
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [currentStep, running]);

  async function refreshLiveData() {
    setRefreshState('loading');
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) throw new Error('Service unavailable');
      setRefreshState('ready');
    } catch {
      setRefreshState('error');
    }
  }

  function startRescue() {
    setCurrentStep(0);
    setRunning(true);
    setFlowState('running');
  }

  function resetFlow() {
    setCurrentStep(-1);
    setRunning(false);
    setFlowState('idle');
  }

  function handleResolveIncident() {
    setIsResolving(true);
    setTimeout(() => {
      setWarRoom(getCanonicalWarRoomData(true, new Date().toISOString()));
      setIsResolving(false);
    }, 600);
  }

  function handleResetIncident() {
    setWarRoom(getCanonicalWarRoomData(false));
  }

  const statusMessage =
    flowState === 'running'
      ? `${workflow[currentStep]} in progress.`
      : flowState === 'complete'
        ? 'Demo workflow complete. No payment was executed.'
        : 'Ready to scan revenue risk.';

  return (
    <main className="command-center">
      <header className="topbar">
        <a className="brand" href="/" aria-label="RazorRecover AI home">
          <span className="brand-mark">R</span>
          <span>
            RazorRecover <em>AI</em>
          </span>
        </a>
        <div className="topbar-actions">
          <span className="mode-badge">
            <span className="mode-dot" /> DEMO MODE
          </span>
          <button
            className="quiet-button"
            type="button"
            onClick={refreshLiveData}
            disabled={refreshState === 'loading'}
          >
            {refreshState === 'loading' ? 'Checking...' : 'Refresh status'}
          </button>
          <span className="avatar" aria-label="Demo Owner">
            DO
          </span>
        </div>
      </header>

      <div className="dashboard-wrap">
        {/* Top View Switcher */}
        <nav className="view-nav" aria-label="Module navigation">
          <button
            type="button"
            className={`view-tab ${activeView === 'command-center' ? 'is-active' : ''}`}
            onClick={() => setActiveView('command-center')}
          >
            Command Center
          </button>
          <button
            type="button"
            className={`view-tab ${activeView === 'war-room' ? 'is-active' : ''}`}
            onClick={() => setActiveView('war-room')}
          >
            AI Revenue War Room
            {!warRoom.isResolved ? (
              <span className="tab-badge tab-badge-live">#1042 LIVE</span>
            ) : (
              <span className="tab-badge" style={{ background: '#d1fae5', color: '#065f46' }}>
                RESOLVED
              </span>
            )}
          </button>
          <button
            type="button"
            className={`view-tab ${activeView === 'detection' ? 'is-active' : ''}`}
            onClick={() => setActiveView('detection')}
          >
            Incident Detection
          </button>
          <button
            type="button"
            className={`view-tab ${activeView === 'forecasting' ? 'is-active' : ''}`}
            onClick={() => setActiveView('forecasting')}
          >
            Revenue Forecasting
            <span className="tab-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
              ESTIMATES
            </span>
          </button>
        </nav>

        {refreshState === 'error' && (
          <div className="inline-alert error-alert" role="alert">
            <strong>Live data unavailable.</strong> Showing the last known Demo Mode snapshot.{' '}
            <button type="button" onClick={refreshLiveData}>
              Try again
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: COMMAND CENTER                                                    */}
        {/* ========================================================================= */}
        {activeView === 'command-center' && (
          <>
            {/* Active Incident Alert Banner */}
            <article className="active-incident-card" aria-labelledby="active-incident-heading">
              <div className="active-incident-header">
                <div className="incident-badge-row">
                  <span className="badge-critical">CRITICAL INCIDENT</span>
                  <span className="badge-incident-id">REVENUE INCIDENT #1042</span>
                  <span className="status-pill status-running">
                    {warRoom.isResolved ? 'RESOLVED' : 'ACTIVE INVESTIGATION'}
                  </span>
                </div>
                <button
                  type="button"
                  className="war-room-cta-btn"
                  onClick={() => setActiveView('war-room')}
                >
                  ENTER AI REVENUE WAR ROOM ↗
                </button>
              </div>
              <div className="incident-grid-preview">
                <div>
                  <div className="preview-metric-label">Payment Success Drop</div>
                  <div className="preview-metric-value danger">
                    {warRoom.paymentSuccess.normal} → {warRoom.paymentSuccess.current}
                  </div>
                </div>
                <div>
                  <div className="preview-metric-label">Revenue at Risk</div>
                  <div className="preview-metric-value danger">{warRoom.revenueAtRisk}</div>
                </div>
                <div>
                  <div className="preview-metric-label">AI Confidence</div>
                  <div className="preview-metric-value teal">{warRoom.aiConfidenceDisplay}</div>
                </div>
                <div>
                  <div className="preview-metric-label">Affected Segment</div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      marginTop: '4px',
                    }}
                  >
                    {warRoom.affectedSegment}
                  </div>
                </div>
              </div>
            </article>

            <section className="hero-row" aria-labelledby="page-title">
              <div>
                <p className="eyebrow">AI REVENUE COMMAND CENTER</p>
                <h1 id="page-title">
                  Your revenue is
                  <br />
                  <span>being protected.</span>
                </h1>
                <p className="hero-copy">
                  A focused view of what is at risk, what can be rescued, and what needs your attention next.
                </p>
              </div>
              <div className="hero-score" aria-label="Revenue Recovery Score 92 out of 100">
                <div className="score-ring">
                  <strong>92</strong>
                  <span>/ 100</span>
                </div>
                <div>
                  <p className="score-label">Revenue Recovery Score</p>
                  <p className="score-caption">Strong protection posture</p>
                </div>
              </div>
            </section>

            <section className="metric-grid" aria-label="Revenue metrics">
              {metrics.map((metric) => (
                <article className={`metric metric-${metric.tone}`} key={metric.label}>
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                  <span>{metric.detail}</span>
                </article>
              ))}
            </section>

            <section className="attention-bar" aria-label="Revenue attention summary">
              <div>
                <span className="alert-count">2,950</span>
                <div>
                  <strong>payment attempts need attention</strong>
                  <span>DEMO PREDICTION · deterministic rules</span>
                </div>
              </div>
              <button
                className="primary-button"
                type="button"
                onClick={startRescue}
                disabled={running}
              >
                <span className="button-icon" aria-hidden="true">
                  ↗
                </span>
                {running ? 'Scanning revenue...' : 'RESCUE MY REVENUE'}
              </button>
            </section>

            <section className="lower-grid">
              <article
                className="workflow-panel"
                aria-labelledby="workflow-title"
                aria-busy={running}
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">CONTROLLED RECOVERY</p>
                    <h2 id="workflow-title">Rescue workflow</h2>
                  </div>
                  <span className={`status-pill status-${flowState}`}>
                    {flowState === 'running'
                      ? 'IN PROGRESS'
                      : flowState === 'complete'
                        ? 'COMPLETE'
                        : 'STANDBY'}
                  </span>
                </div>
                <div
                  className="workflow-track"
                  role="list"
                  aria-label="Recovery workflow progress"
                >
                  {workflow.map((step, index) => {
                    const active = index === currentStep && running;
                    const complete = index < currentStep || flowState === 'complete';
                    return (
                      <div
                        className={`workflow-step ${active ? 'is-active' : ''} ${complete ? 'is-complete' : ''}`}
                        role="listitem"
                        key={step}
                      >
                        <span className="step-marker">{complete ? '✓' : index + 1}</span>
                        <span>{step}</span>
                        {index < workflow.length - 1 && <i aria-hidden="true" />}
                      </div>
                    );
                  })}
                </div>
                <div className="workflow-status" role="status" aria-live="polite">
                  <span className={`status-orb ${running ? 'pulse' : ''}`} aria-hidden="true" />
                  {statusMessage}
                  {flowState === 'complete' && (
                    <button className="text-button" type="button" onClick={resetFlow}>
                      Run again
                    </button>
                  )}
                </div>
              </article>

              <article className="score-panel" aria-labelledby="breakdown-title">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">EXPLAINABILITY</p>
                    <h2 id="breakdown-title">Score breakdown</h2>
                  </div>
                  <span className="score-total">92</span>
                </div>
                <div className="breakdown-list">
                  {scoreBreakdown.map((item) => (
                    <div className="breakdown-row" key={item.label}>
                      <div className="breakdown-label">
                        <strong>{item.label}</strong>
                        <span>{item.note}</span>
                      </div>
                      <div
                        className="bar"
                        role="progressbar"
                        aria-label={`${item.label} score`}
                        aria-valuenow={item.score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <span style={{ width: `${item.score}%` }} />
                      </div>
                      <b>{item.score}</b>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="bottom-grid">
              <article className="attention-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">NEEDS YOUR ATTENTION</p>
                    <h2>Priority queue</h2>
                  </div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setActiveView('detection')}
                  >
                    View detection signals →
                  </button>
                </div>
                <div className="queue-item">
                  <span className="queue-severity critical">!</span>
                  <div>
                    <strong>REVENUE INCIDENT #1042 (High-Value Netbanking)</strong>
                    <span>₹6.4L · HDFC & ICICI Rail Degradation · AI Confidence 94%</span>
                  </div>
                  <b>CRITICAL</b>
                </div>
                <div className="queue-item">
                  <span className="queue-severity critical">!</span>
                  <div>
                    <strong>High-value abandonment cluster</strong>
                    <span>₹2.1L · 200 customers · recovery probability 48%</span>
                  </div>
                  <b>HIGH</b>
                </div>
                <div className="queue-item">
                  <span className="queue-severity warning">↻</span>
                  <div>
                    <strong>Retryable gateway failures</strong>
                    <span>₹1.8L · 700 attempts · recovery probability 72%</span>
                  </div>
                  <b>MEDIUM</b>
                </div>
              </article>

              {/* Active War Room Callout instead of empty panel */}
              <article className="empty-panel" style={{ background: '#fffcf7' }}>
                <div
                  className="empty-icon"
                  style={{
                    background: warRoom.isResolved ? '#d1fae5' : '#fae5df',
                    color: warRoom.isResolved ? '#065f46' : '#a83b2b',
                  }}
                  aria-hidden="true"
                >
                  {warRoom.isResolved ? '✓' : '!'}
                </div>
                <p className="eyebrow">
                  {warRoom.isResolved ? 'INCIDENT RESOLVED' : 'ACTIVE REVENUE INCIDENT'}
                </p>
                <h2>REVENUE INCIDENT #1042</h2>
                <p>
                  Payment Success: {warRoom.paymentSuccess.normal} → {warRoom.paymentSuccess.current}
                  <br />
                  Revenue at Risk: <strong>{warRoom.revenueAtRisk}</strong> · AI Confidence: <strong>94%</strong>
                </p>
                <div style={{ marginTop: '16px' }}>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => setActiveView('war-room')}
                  >
                    OPEN WAR ROOM ↗
                  </button>
                </div>
              </article>
            </section>
          </>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: AI REVENUE WAR ROOM                                               */}
        {/* ========================================================================= */}
        {activeView === 'war-room' && (
          <div className="war-room-container">
            {/* Header Banner */}
            <header
              className={`war-room-banner ${warRoom.isResolved ? 'resolved-theme' : ''}`}
            >
              <div className="war-room-title-area">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    className={`war-room-status-tag ${warRoom.isResolved ? 'tag-resolved' : 'tag-investigating'}`}
                  >
                    <span className="mode-dot" />
                    {warRoom.isResolved ? 'INCIDENT RESOLVED' : 'LIVE INVESTIGATION & MITIGATION'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#aab8b1' }}>DEMO SIMULATION</span>
                </div>
                <h2>AI REVENUE WAR ROOM</h2>
                <p style={{ margin: 0, color: '#c9d6cf', fontSize: '0.92rem' }}>
                  REVENUE INCIDENT #1042 · High-Value Netbanking & Recurring Subscription Degradation
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {!warRoom.isResolved ? (
                  <button
                    type="button"
                    className="primary-button"
                    style={{ background: '#74cfb8', color: '#16221f' }}
                    onClick={handleResolveIncident}
                    disabled={isResolving}
                  >
                    {isResolving ? 'Resolving incident...' : 'RESOLVE INCIDENT ✓'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="quiet-button"
                    onClick={handleResetIncident}
                  >
                    Reopen for Testing ↻
                  </button>
                )}
              </div>
            </header>

            {/* Resolved Summary Screen (Displayed when incident is resolved) */}
            {warRoom.isResolved && warRoom.resolution && (
              <section className="resolution-screen" aria-labelledby="resolved-title">
                <div className="resolution-header-row">
                  <h2 id="resolved-title" className="resolution-h2">
                    <span aria-hidden="true">✓</span> INCIDENT RESOLVED
                  </h2>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--muted)',
                      fontFamily: 'Space Grotesk, sans-serif',
                    }}
                  >
                    Resolved at {new Date(warRoom.resolution.resolvedAt).toLocaleTimeString()} · Verified by AI Safety Gate
                  </span>
                </div>

                <div className="resolution-stats-grid">
                  <div className="resolution-stat-card">
                    <div className="resolution-stat-label">Revenue Rescued</div>
                    <div className="resolution-stat-num rescued">
                      {warRoom.resolution.revenueRescued}
                    </div>
                  </div>
                  <div className="resolution-stat-card">
                    <div className="resolution-stat-label">Recovery Rate</div>
                    <div className="resolution-stat-num">
                      {warRoom.resolution.recoveryRate}
                    </div>
                  </div>
                  <div className="resolution-stat-card">
                    <div className="resolution-stat-label">Automatic Actions</div>
                    <div className="resolution-stat-num">
                      {warRoom.resolution.automaticActions}
                    </div>
                  </div>
                  <div className="resolution-stat-card">
                    <div className="resolution-stat-label">Human Escalations</div>
                    <div className="resolution-stat-num warning">
                      {warRoom.resolution.humanEscalations}
                    </div>
                  </div>
                  <div className="resolution-stat-card">
                    <div className="resolution-stat-label">Blocked Actions</div>
                    <div className="resolution-stat-num danger">
                      {warRoom.resolution.blockedActions}
                    </div>
                  </div>
                  <div className="resolution-stat-card">
                    <div className="resolution-stat-label">Unsafe Actions</div>
                    <div className="resolution-stat-num danger">
                      {warRoom.resolution.unsafeActions}
                    </div>
                  </div>
                </div>

                <div className="resolution-lists-grid">
                  <div className="resolution-list-box">
                    <h4>Automatic Actions ({warRoom.resolution.automaticActions})</h4>
                    <ul>
                      {warRoom.resolution.automaticActionsSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="resolution-list-box">
                    <h4>Human Escalations ({warRoom.resolution.humanEscalations})</h4>
                    <ul>
                      {warRoom.resolution.humanEscalationsSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="resolution-list-box">
                    <h4>Blocked Actions ({warRoom.resolution.blockedActions})</h4>
                    <ul>
                      {warRoom.resolution.blockedActionsSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="resolution-list-box">
                    <h4>Unsafe Actions ({warRoom.resolution.unsafeActions})</h4>
                    <ul>
                      {warRoom.resolution.unsafeActionsSummary.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Core Metrics Grid */}
            <section className="war-metrics-grid" aria-label="War room key indicators">
              <div className="war-metric-card">
                <span className="war-metric-title">Payment Success Rate</span>
                <div className="war-metric-val drop">
                  {warRoom.paymentSuccess.normal} → {warRoom.paymentSuccess.current}
                </div>
                <span className="war-metric-sub">
                  {warRoom.isResolved
                    ? 'Restored back to baseline (+17.7 pts recovery)'
                    : '18.3 percentage points drop below normal'}
                </span>
              </div>

              <div className="war-metric-card">
                <span className="war-metric-title">Revenue at Risk</span>
                <div className="war-metric-val impact">{warRoom.revenueAtRisk}</div>
                <span className="war-metric-sub">
                  Calculated from 412 active gateway drops & retry attempts
                </span>
              </div>

              <div className="war-metric-card">
                <span className="war-metric-title">AI Confidence</span>
                <div className="war-metric-val confidence">{warRoom.aiConfidenceDisplay}</div>
                <span className="war-metric-sub">
                  Statistical confidence based on 504 timeout clustering
                </span>
              </div>

              <div className="war-metric-card">
                <span className="war-metric-title">Failure Rate Spike</span>
                <div className="war-metric-val drop">
                  {warRoom.failureRate.normal} → {warRoom.failureRate.current}
                </div>
                <span className="war-metric-sub">
                  {warRoom.failureRate.surgeMultiplier} surge vs standard 3.6% baseline
                </span>
              </div>
            </section>

            {/* Root Cause Banner */}
            <section className="root-cause-banner" aria-label="Root cause diagnosis">
              <h3>
                <span aria-hidden="true">🔍</span> Root Cause Diagnosis
              </h3>
              <p className="root-cause-text">{warRoom.rootCause}</p>
            </section>

            {/* Live Investigation & Timeline Grid */}
            <section className="investigation-timeline-grid">
              {/* Live Investigation */}
              <article className="investigation-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">REAL-TIME TELEMETRY</p>
                    <h2>Live investigation</h2>
                  </div>
                  <span className="status-pill status-running">
                    {warRoom.isResolved ? 'STANDBY' : '3 AGENTS ACTIVE'}
                  </span>
                </div>

                <div className="telemetry-list">
                  {warRoom.liveInvestigation.telemetry.map((node) => (
                    <div className="telemetry-node-row" key={node.id}>
                      <div>
                        <span className="telemetry-node-name">{node.node}</span>
                        <span className="telemetry-finding">{node.finding}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          className={`action-pill ${
                            node.status === 'CRITICAL'
                              ? 'action-pill-blocked'
                              : node.status === 'DEGRADED'
                                ? 'action-pill-escalated'
                                : 'action-pill-executed'
                          }`}
                        >
                          {node.status}
                        </span>
                        <div
                          style={{
                            fontSize: '0.68rem',
                            color: 'var(--muted)',
                            marginTop: '2px',
                          }}
                        >
                          {node.latency}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="live-log-box" role="log" aria-label="Investigation stream">
                  {warRoom.liveInvestigation.logs.map((log) => (
                    <div key={log}>{log}</div>
                  ))}
                </div>
              </article>

              {/* Timeline */}
              <article className="timeline-panel">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">CHRONOLOGY</p>
                    <h2>Timeline</h2>
                  </div>
                  <span className="status-pill">
                    {warRoom.timeline.length} EVENTS RECORDED
                  </span>
                </div>

                <div className="timeline-list">
                  {warRoom.timeline.map((entry) => (
                    <div className="timeline-entry" key={entry.id}>
                      <div className="timeline-offset">{entry.timeOffset}</div>
                      <div className="timeline-entry-content">
                        <div className="timeline-entry-title">
                          {entry.title}
                          <span
                            style={{
                              marginLeft: '8px',
                              fontSize: '0.65rem',
                              color: 'var(--muted)',
                              fontWeight: 400,
                            }}
                          >
                            {entry.timestamp}
                          </span>
                        </div>
                        <p className="timeline-entry-desc">{entry.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            {/* Actions Trio: Recovery Actions, Blocked Actions, Human Escalations */}
            <section className="actions-trio-grid" aria-label="War room operational actions">
              {/* 1. Recovery Actions */}
              <article className="action-column-panel">
                <div className="action-column-header">
                  <h3>Recovery Actions</h3>
                  <span className="action-count-badge">
                    {warRoom.recoveryActions.length} Executed
                  </span>
                </div>

                {warRoom.recoveryActions.map((action) => (
                  <div className="action-item-card recovery-theme" key={action.id}>
                    <div className="action-card-top">
                      <span className="action-item-title">{action.title}</span>
                      <span className="action-pill action-pill-executed">{action.status}</span>
                    </div>
                    <p className="action-item-desc">{action.description}</p>
                    <div className="action-item-footer">
                      <span>{action.executedBy}</span>
                      <strong>{action.amount}</strong>
                    </div>
                  </div>
                ))}
              </article>

              {/* 2. Blocked Actions */}
              <article className="action-column-panel">
                <div className="action-column-header">
                  <h3>Blocked Actions</h3>
                  <span className="action-count-badge" style={{ color: 'var(--danger)' }}>
                    {warRoom.blockedActions.length} Blocked
                  </span>
                </div>

                {warRoom.blockedActions.map((action) => (
                  <div className="action-item-card blocked-theme" key={action.id}>
                    <div className="action-card-top">
                      <span className="action-item-title">{action.title}</span>
                      <span className="action-pill action-pill-blocked">BLOCKED</span>
                    </div>
                    <p className="action-item-desc">{action.description}</p>
                    <div
                      style={{
                        fontSize: '0.68rem',
                        color: 'var(--danger)',
                        fontWeight: 700,
                        marginTop: '4px',
                      }}
                    >
                      {action.reason}
                    </div>
                  </div>
                ))}
              </article>

              {/* 3. Human Escalations */}
              <article className="action-column-panel">
                <div className="action-column-header">
                  <h3>Human Escalations</h3>
                  <span className="action-count-badge" style={{ color: 'var(--amber)' }}>
                    {warRoom.humanEscalations.length} Active
                  </span>
                </div>

                {warRoom.humanEscalations.map((action) => (
                  <div className="action-item-card escalation-theme" key={action.id}>
                    <div className="action-card-top">
                      <span className="action-item-title">{action.title}</span>
                      <span className="action-pill action-pill-escalated">{action.status}</span>
                    </div>
                    <p className="action-item-desc">{action.description}</p>
                    <div className="action-item-footer">
                      <span>{action.executedBy}</span>
                      <span>{action.timestamp}</span>
                    </div>
                  </div>
                ))}
              </article>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: INCIDENT DETECTION                                                */}
        {/* ========================================================================= */}
        {activeView === 'detection' && (
          <section aria-labelledby="detection-heading">
            <div className="detection-hero-card">
              <p className="eyebrow">REVENUE INCIDENT DETECTION ENGINE</p>
              <h2 id="detection-heading" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                Anomaly Detection & Impact Assessment
              </h2>
              <p style={{ color: 'var(--muted)', maxWidth: '680px', margin: 0 }}>
                Continuous algorithmic surveillance monitors payment success rate deviations,
                failure-rate spikes, and customer-segment blast radius.
              </p>

              {/* Required Displays */}
              <div className="detection-metrics-row">
                <div className="detection-stat">
                  <div className="detection-stat-label">Normal Failure Rate</div>
                  <div className="detection-stat-value" style={{ color: 'var(--teal)' }}>
                    {detection.normalFailureRate}
                  </div>
                </div>

                <div className="detection-stat">
                  <div className="detection-stat-label">Current Failure Rate</div>
                  <div className="detection-stat-value" style={{ color: 'var(--danger)' }}>
                    {detection.currentFailureRate}
                  </div>
                </div>

                <div className="detection-stat">
                  <div className="detection-stat-label">Revenue Impact</div>
                  <div className="detection-stat-value" style={{ color: 'var(--accent)' }}>
                    {detection.revenueImpact}
                  </div>
                </div>

                <div className="detection-stat">
                  <div className="detection-stat-label">Affected Segment</div>
                  <div
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      marginTop: '4px',
                    }}
                  >
                    {detection.affectedSegment}
                  </div>
                </div>

                <div className="detection-stat">
                  <div className="detection-stat-label">AI Confidence</div>
                  <div className="detection-stat-value" style={{ color: 'var(--teal)' }}>
                    {detection.aiConfidenceDisplay}
                  </div>
                </div>

                <div className="detection-stat">
                  <div className="detection-stat-label">Detected Signals</div>
                  <div className="detection-stat-value" style={{ color: 'var(--danger)' }}>
                    {detection.detectedAnomaliesCount} Anomalies
                  </div>
                </div>
              </div>

              {/* Recommended Mitigation Panel */}
              <div className="mitigation-panel">
                <h3>Recommended Mitigation</h3>
                <p>{detection.recommendedMitigation}</p>
                <div style={{ marginTop: '14px' }}>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setActiveView('war-room')}
                  >
                    Open AI War Room to Execute Mitigations ↗
                  </button>
                </div>
              </div>
            </div>

            {/* Abnormal Signals Breakdown Grid */}
            <div className="signals-grid">
              {detection.abnormalSignals.map((signal) => (
                <article
                  key={signal.type}
                  className={`signal-card ${signal.severity === 'CRITICAL' ? 'critical-signal' : ''}`}
                >
                  <div className="signal-card-header">
                    <span className="signal-title">{signal.label}</span>
                    <span
                      className={`action-pill ${signal.severity === 'CRITICAL' ? 'action-pill-blocked' : 'action-pill-escalated'}`}
                    >
                      {signal.severity}
                    </span>
                  </div>
                  <div className="signal-metric">{signal.metric}</div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                    {signal.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: REVENUE FORECASTING                                               */}
        {/* ========================================================================= */}
        {activeView === 'forecasting' && (
          <section aria-labelledby="forecasting-heading">
            {/* Required prominent prediction / estimate disclaimer */}
            <div className="forecast-disclaimer-banner" role="alert">
              <span className="forecast-tag-pill">PREDICTION / ESTIMATE</span>
              <p className="forecast-disclaimer-text">
                <strong>Important Notice:</strong> Revenue forecasts are probabilistic estimates
                generated by the algorithmic forecasting service. Projections account for historical run
                rates, current incident degradation curves, and active recovery mitigations. All figures
                are clearly labeled as predictions/estimates.
              </p>
            </div>

            <div className="section-heading" style={{ marginBottom: '20px' }}>
              <div>
                <p className="eyebrow">REVENUE TRAJECTORY PROJECTIONS</p>
                <h2 id="forecasting-heading">Revenue Forecasting</h2>
              </div>
              <span className="status-pill">MODEL: revenue-forecast.v1</span>
            </div>

            {/* 4 Horizons Grid: 1h, 4h, 12h, 24h */}
            <div className="forecast-grid">
              {forecast.horizonsList.map((h) => (
                <article className="forecast-card" key={h.horizon}>
                  <div className="forecast-horizon-title">
                    <h3>{h.horizonLabel}</h3>
                    <span className="prediction-badge">{h.predictionLabel}</span>
                  </div>

                  <div className="forecast-metric-group">
                    <div className="forecast-row">
                      <span>Projected Gross</span>
                      <strong>{h.projectedGrossRevenue}</strong>
                    </div>
                    <div className="forecast-row">
                      <span>Projected at Risk</span>
                      <strong className="at-risk">{h.projectedRevenueAtRisk}</strong>
                    </div>
                    <div className="forecast-row">
                      <span>Expected Rescued</span>
                      <strong className="rescued">{h.expectedRevenueRescued}</strong>
                    </div>
                    <div className="forecast-row">
                      <span>Success (Unmitigated)</span>
                      <strong>{h.projectedSuccessRateUnmitigated}</strong>
                    </div>
                    <div className="forecast-row">
                      <span>Success (Mitigated)</span>
                      <strong style={{ color: 'var(--teal)' }}>
                        {h.projectedSuccessRateMitigated}
                      </strong>
                    </div>
                    <div className="forecast-row">
                      <span>AI Confidence</span>
                      <strong>{h.confidenceScoreDisplay}</strong>
                    </div>
                    <div className="forecast-row">
                      <span>Confidence Band</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        {h.confidenceInterval.lowerRescued} – {h.confidenceInterval.upperRescued}
                      </span>
                    </div>
                  </div>

                  <div className="forecast-assumptions">
                    <strong>Key Assumptions (Estimates):</strong>
                    <ul style={{ paddingLeft: '16px', margin: '4px 0 0' }}>
                      {h.assumptions.map((assump) => (
                        <li key={assump}>{assump}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>

            {/* Summary comparison card */}
            <article className="attention-panel" style={{ marginTop: '16px' }}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">24-HOUR AGGREGATE ESTIMATE</p>
                  <h2>Mitigated Trajectory vs Unmitigated Loss</h2>
                </div>
                <span className="status-pill status-complete">90.9% PROJECTED RECOVERY</span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.84rem' }}>
                With automated gateway traffic failover and jittered retry schedules active, the system
                estimates rescuing <strong>{forecast.summary24h.totalEstimatedRescue}</strong> out of{' '}
                <strong>{forecast.summary24h.totalRevenueAtRisk}</strong> total projected 24-hour risk
                exposure (Prediction / Estimate).
              </p>
            </article>
          </section>
        )}

        {/* Footer */}
        <footer className="dashboard-footer">
          <span>Last updated just now</span>
          <span>
            <span className="footer-dot" /> All systems operational
          </span>
          <span>DEMO MODE · Synthetic data</span>
        </footer>
      </div>
    </main>
  );
}
