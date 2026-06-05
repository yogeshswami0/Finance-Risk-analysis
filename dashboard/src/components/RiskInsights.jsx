import React from 'react';
import { Lightbulb, ShieldCheck, AlertCircle, Coins, ArrowRight, TrendingUp } from 'lucide-react';

export default function RiskInsights({ records }) {
  
  // Calculate automated insights dynamically from the active records
  const totalLoans = records.length;
  if (totalLoans === 0) return null;

  const badLoans = records.filter(r => r.Is_Bad_Loan === 'Yes');
  const goodLoans = records.filter(r => r.Is_Bad_Loan === 'No');

  // Find the exact "Risk-Free Credit Score Threshold"
  // This is the lowest credit score above which there are absolutely 0 defaults.
  let riskFreeThreshold = 500;
  const badScores = badLoans.map(r => r.Credit_Score).filter(s => s !== null);
  
  if (badScores.length > 0) {
    const maxBadScore = Math.max(...badScores);
    // Find the next increment score (scores are usually in 5s/10s, let's add 5 to be safe)
    riskFreeThreshold = maxBadScore + 5;
  }

  // Calculate simulated impact of applying this risk-free threshold
  const approvedLoansUnderLimit = records.filter(r => r.Credit_Score !== null && r.Credit_Score >= riskFreeThreshold);
  const rejectedLoans = records.filter(r => r.Credit_Score !== null && r.Credit_Score < riskFreeThreshold);
  
  const rejectedGoodLoans = rejectedLoans.filter(r => r.Is_Bad_Loan === 'No');
  const rejectedBadLoans = rejectedLoans.filter(r => r.Is_Bad_Loan === 'Yes');
  
  const totalSavedNpa = rejectedBadLoans.reduce((sum, r) => sum + (r.Loan_Amount || 0), 0);
  const totalOpportunityCost = rejectedGoodLoans.reduce((sum, r) => sum + (r.Loan_Amount || 0), 0);

  // Identify the highest-default product segment
  const segmentStats = {};
  records.forEach(r => {
    const key = `${r.Loan_Type} in ${r.Region}`;
    if (!segmentStats[key]) {
      segmentStats[key] = { name: key, total: 0, bad: 0 };
    }
    segmentStats[key].total += 1;
    if (r.Is_Bad_Loan === 'Yes') {
      segmentStats[key].bad += 1;
    }
  });

  const segmentsList = Object.values(segmentStats);
  const highRiskSegment = segmentsList.reduce((max, s) => {
    const rate = s.total > 0 ? (s.bad / s.total) : 0;
    const maxRate = max ? (max.bad / max.total) : -1;
    return rate > maxRate ? s : max;
  }, null);

  // Helper to format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-blue)' }} id="risk-insights-container">
      <div className="chart-title">
        <span>
          <Lightbulb size={18} className="brand-icon" style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent-blue)' }} />
          Risk-Free Portfolio Insights & Optimization
        </span>
        <span className="chart-subtitle">Automated risk-mitigation advisories</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* Diagnostic 1: Risk-Free Credit Policy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-active-text)' }}>
            <ShieldCheck size={18} />
            0% Default Threshold Policy
          </h4>
          <p className="etl-step-desc" style={{ fontSize: '0.82rem' }}>
            By raising your credit cutoff score, you can theoretically eliminate defaults entirely. Based on your active filters, the optimal threshold is:
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '4px 0' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-active-text)' }}>
              {riskFreeThreshold}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Minimum Credit Score</span>
          </div>
          
          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Prevented NPA/Default Capital:</span>
              <strong style={{ color: 'var(--color-active-text)' }}>+{formatCurrency(totalSavedNpa)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Opportunity Cost (Good Loans Rejected):</span>
              <strong style={{ color: 'var(--color-npa-text)' }}>-{formatCurrency(totalOpportunityCost)}</strong>
            </div>
          </div>
        </div>

        {/* Diagnostic 2: Actionable Risk Advisories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
            <AlertCircle size={18} style={{ color: 'var(--color-defaulted-text)' }} />
            Category-Specific Risk Policy
          </h4>
          
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {/* Advisory 1: Segment concentration */}
            {highRiskSegment && highRiskSegment.bad > 0 && (
              <li style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--color-npa-text)' }}>
                <strong>Restrict Segment Exposure:</strong><br />
                {highRiskSegment.name} accounts show a default rate of <strong>{((highRiskSegment.bad / highRiskSegment.total) * 100).toFixed(0)}%</strong>. Consider restricting new lending in this category or raising credit requirements for this specific segment to <strong>700+</strong>.
              </li>
            )}

            {/* Advisory 2: Risk-Premium Pricing */}
            <li style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--color-defaulted-text)' }}>
              <strong>Under-Prime Interest Premium:</strong><br />
              Loans below credit score 660 hold <strong>{badLoans.filter(r => r.Credit_Score < 660).length} defaults</strong> out of <strong>{records.filter(r => r.Credit_Score < 660).length}</strong> total accounts. Implement a **+1.75% Risk Premium Markup** on all loans with scores between 600 and 659 to hedge credit risk.
            </li>

            {/* Advisory 3: Amortization Strategy */}
            <li style={{ background: 'var(--bg-app)', padding: '10px', borderRadius: '4px', borderLeft: '3px solid var(--color-closed-text)' }}>
              <strong>Structured Tenure Limits:</strong><br />
              Reduce maximum tenure for Personal Loans from 36 months to <strong>24 months</strong> for applicants with credit scores under 680 to accelerate principal recovery.
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
