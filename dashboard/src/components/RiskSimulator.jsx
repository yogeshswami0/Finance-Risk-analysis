import React from 'react';
import { Sliders, ShieldCheck, Percent, TrendingUp, AlertTriangle } from 'lucide-react';

export default function RiskSimulator({ records, simulatedMetrics, setSimParams, simParams, baselineMetrics }) {
  
  const handleCreditScoreChange = (e) => {
    setSimParams(prev => ({
      ...prev,
      minCreditScore: parseInt(e.target.value, 10)
    }));
  };

  const handleInterestMarkupChange = (e) => {
    setSimParams(prev => ({
      ...prev,
      interestMarkup: parseFloat(e.target.value)
    }));
  };

  const handleHomeRestrictionToggle = (e) => {
    setSimParams(prev => ({
      ...prev,
      restrictHomeLoans: e.target.checked
    }));
  };

  // Helper to format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper to format percentage differences
  const formatDeltaPercent = (diff) => {
    if (Math.abs(diff) < 0.01) return '0.0%';
    const prefix = diff > 0 ? '+' : '';
    return `${prefix}${diff.toFixed(1)}%`;
  };

  // Helper to format currency differences
  const formatDeltaCurrency = (diff) => {
    if (Math.abs(diff) < 1) return '0';
    const prefix = diff > 0 ? '+' : '';
    return `${prefix}${formatCurrency(diff)}`;
  };

  // Helper to format general differences
  const formatDeltaNumber = (diff) => {
    if (Math.abs(diff) < 1) return '0';
    const prefix = diff > 0 ? '+' : '';
    return `${prefix}${Math.round(diff)}`;
  };

  const scoreCutoff = simParams.minCreditScore;
  const markup = simParams.interestMarkup;
  const restrictHome = simParams.restrictHomeLoans;

  // Calculate deltas
  const deltaLoans = simulatedMetrics.totalLoans - baselineMetrics.totalLoans;
  const deltaBadRate = simulatedMetrics.badLoanRate - baselineMetrics.badLoanRate;
  const deltaNpa = simulatedMetrics.npaAmount - baselineMetrics.npaAmount;
  const deltaRevenue = simulatedMetrics.simulatedRevenue - baselineMetrics.simulatedRevenue;

  return (
    <div className="glass-card glow-purple" id="risk-simulator-container">
      <div className="chart-title">
        <span>
          <Sliders size={18} className="brand-icon" style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-purple)' }} />
          What-If Risk Scenario & Yield Simulator
        </span>
        <span className="chart-subtitle">Simulate credit policies & interest rate adjustments</span>
      </div>

      <div className="scenario-grid">
        {/* Credit score cutoff slider */}
        <div className="scenario-card">
          <h4>
            <ShieldCheck size={16} style={{ color: 'var(--accent-cyan)' }} />
            Min. Credit Score Cutoff
          </h4>
          <p className="etl-step-desc">
            Filter out high-risk applicants. Loans with scores below this cutoff will be rejected in the simulated model.
          </p>
          <div className="range-slider-container">
            <div className="slider-labels">
              <span>Allow All (500)</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{scoreCutoff}</span>
              <span>Prime (800)</span>
            </div>
            <input 
              type="range" 
              min="500" 
              max="800" 
              step="10"
              value={scoreCutoff} 
              onChange={handleCreditScoreChange}
              className="range-slider"
              id="slider-credit-score"
            />
          </div>
        </div>

        {/* Interest rate markup slider */}
        <div className="scenario-card">
          <h4>
            <Percent size={16} style={{ color: 'var(--accent-purple)' }} />
            Interest Rate Adjustment
          </h4>
          <p className="etl-step-desc">
            Adjust interest rates across the entire portfolio to model competitive pricing vs yield impact.
          </p>
          <div className="range-slider-container">
            <div className="slider-labels">
              <span>-3.0%</span>
              <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{markup > 0 ? `+${markup.toFixed(2)}%` : `${markup.toFixed(2)}%`}</span>
              <span>+3.0%</span>
            </div>
            <input 
              type="range" 
              min="-3.0" 
              max="3.0" 
              step="0.25"
              value={markup} 
              onChange={handleInterestMarkupChange}
              className="range-slider"
              id="slider-interest-markup"
            />
          </div>
        </div>

        {/* Restriction rules */}
        <div className="scenario-card" style={{ justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h4 style={{ marginBottom: '4px' }}>
                <AlertTriangle size={16} style={{ color: 'var(--color-defaulted)' }} />
                Restrict Home Loans
              </h4>
              <p className="etl-step-desc" style={{ maxWidth: '170px' }}>
                Restrict Home Loans to Credit Scores &gt;= 700.
              </p>
            </div>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={restrictHome} 
                onChange={handleHomeRestrictionToggle}
                id="toggle-home-restriction"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Simulated Results metrics bar */}
      <div className="scenario-metrics-bar" id="simulator-results-bar">
        {/* Approved Loans */}
        <div className="simulated-kpi">
          <span className="simulated-label">Simulated Approvals</span>
          <div className="simulated-value">
            {simulatedMetrics.totalLoans}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ {baselineMetrics.totalLoans}</span>
          </div>
          {deltaLoans !== 0 && (
            <span className={`delta-badge ${deltaLoans > 0 ? 'positive' : 'negative'}`}>
              {formatDeltaNumber(deltaLoans)} loans
            </span>
          )}
        </div>

        {/* Bad Loan Rate */}
        <div className="simulated-kpi">
          <span className="simulated-label">Simulated Bad Loan Rate</span>
          <div className={`simulated-value ${simulatedMetrics.badLoanRate <= 20 ? 'highlight-cyan' : 'highlight-purple'}`} style={{ color: simulatedMetrics.badLoanRate > 20 ? 'var(--color-npa)' : 'var(--color-active)' }}>
            {simulatedMetrics.badLoanRate.toFixed(1)}%
          </div>
          {deltaBadRate !== 0 && (
            <span className={`delta-badge ${deltaBadRate < 0 ? 'positive' : 'negative'}`}>
              {formatDeltaPercent(deltaBadRate)}
            </span>
          )}
        </div>

        {/* Estimated Monthly Revenue */}
        <div className="simulated-kpi">
          <span className="simulated-label">Simulated Mo. Income</span>
          <div className="simulated-value highlight-cyan">
            {formatCurrency(simulatedMetrics.simulatedRevenue)}
          </div>
          {deltaRevenue !== 0 && (
            <span className={`delta-badge ${deltaRevenue > 0 ? 'positive' : 'negative'}`}>
              {formatDeltaCurrency(deltaRevenue)}/mo
            </span>
          )}
        </div>
      </div>

      {/* Simulator Explainer text */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <TrendingUp size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
        <span>
          {simulatedMetrics.badLoanRate <= 20 ? (
            <strong style={{ color: 'var(--color-active)' }}>Target Achieved!</strong>
          ) : (
            <strong style={{ color: 'var(--color-defaulted)' }}>Benchmark warning:</strong>
          )}{' '}
          Simulated bad loan rate is <strong>{simulatedMetrics.badLoanRate.toFixed(1)}%</strong> (industry benchmark target is <strong>&lt; 20%</strong>). By rejecting loans with credit scores below <strong>{scoreCutoff}</strong>, you reduce defaults by <strong>{formatCurrency(Math.abs(deltaNpa))}</strong> but reject <strong>{Math.abs(deltaLoans)}</strong> loans.
        </span>
      </div>
    </div>
  );
}
