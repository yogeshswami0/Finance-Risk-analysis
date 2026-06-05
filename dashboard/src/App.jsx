import React, { useState, useMemo, useEffect } from 'react';
import { rawQ1, rawQ2, rawQ3 } from './data/rawDatasets';
import { processData } from './utils/etlProcessor';
import EtlSimulator from './components/EtlSimulator';
import RiskSimulator from './components/RiskSimulator';
import RiskInsights from './components/RiskInsights';
import DashboardCharts from './components/DashboardCharts';
import CustomerLedger from './components/CustomerLedger';
import { 
  Briefcase, TrendingUp, Users, Shield, Percent, RotateCcw, 
  Filter, Database, BarChart3, HelpCircle, Sun, Moon, X 
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'etl'
  
  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Raw data dataset states (to support custom additions in the pipeline)
  const [rawQ3State, setRawQ3State] = useState(rawQ3);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    loanAmount: '',
    loanType: 'Personal Loan',
    interestRate: '',
    status: 'Active',
    issueDate: '',
    region: 'North',
    creditScore: ''
  });

  // Date conversion YYYY-MM-DD -> DD-MM-YYYY
  const convertDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };
  
  // ETL Configuration Toggles
  const [etlConfig, setEtlConfig] = useState({
    cleanRates: true,
    imputeAmounts: true,
    imputeScores: true,
    standardizeText: true,
    addCalculated: true
  });

  // What-If Simulator Parameters
  const [simParams, setSimParams] = useState({
    minCreditScore: 500,
    interestMarkup: 0,
    restrictHomeLoans: false
  });

  // Filter Slicers State
  const [regionFilter, setRegionFilter] = useState('All');
  const [loanTypeFilter, setLoanTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Step 1: Run data through ETL Processor based on configs
  const etlResult = useMemo(() => {
    return processData(rawQ1, rawQ2, rawQ3State, etlConfig);
  }, [etlConfig, rawQ3State]);

  const handleAddLoanSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName) {
      alert('Please enter a customer name.');
      return;
    }
    
    const nextNum = etlResult.records.length + 1;
    const nextId = `L-ADD-${nextNum}`;
    const formattedDate = convertDate(formData.issueDate) || '15-09-2024';
    
    const cleanName = formData.customerName.replace(/\|/g, '');
    const cleanAmount = formData.loanAmount ? formData.loanAmount.toString().trim() : 'NULL';
    const cleanRate = formData.interestRate ? formData.interestRate.toString().trim().replace('%', '') + '%' : 'NULL';
    const cleanScore = formData.creditScore ? formData.creditScore.toString().trim() : 'NULL';

    const newRow = `| ${nextId} | ${cleanName} | ${cleanAmount} | ${formData.loanType} | ${cleanRate} | ${formData.status} | ${formattedDate} | ${formData.region} | ${cleanScore} |`;
    
    setRawQ3State(prev => prev.trim() + "\n" + newRow);
    setShowAddForm(false);
    
    setFormData({
      customerName: '',
      loanAmount: '',
      loanType: 'Personal Loan',
      interestRate: '',
      status: 'Active',
      issueDate: '',
      region: 'North',
      creditScore: ''
    });
  };

  // Step 2: Apply Dashboard Slicer Filters
  const filteredRecords = useMemo(() => {
    return etlResult.records.filter(r => {
      // Region filter
      if (regionFilter !== 'All') {
        const region = r.Region ? r.Region.trim() : '';
        if (region.toLowerCase() !== regionFilter.toLowerCase()) return false;
      }
      // Loan Type filter
      if (loanTypeFilter !== 'All') {
        const type = r.Loan_Type ? r.Loan_Type.trim() : '';
        if (type.toLowerCase() !== loanTypeFilter.toLowerCase()) return false;
      }
      // Status filter
      if (statusFilter !== 'All') {
        const status = r.Status ? r.Status.trim() : '';
        if (status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [etlResult.records, regionFilter, loanTypeFilter, statusFilter]);

  // Step 3: Run the What-If simulation rules on top of filtered records
  const simulatedRecords = useMemo(() => {
    return filteredRecords.filter(r => {
      // Rule 1: Min Credit Score Cutoff
      if (r.Credit_Score !== null && r.Credit_Score < simParams.minCreditScore) {
        return false;
      }
      // Rule 2: Restrict Home Loans to scores >= 700
      if (simParams.restrictHomeLoans) {
        const type = (r.Loan_Type || '').toLowerCase();
        if (type.includes('home') && r.Credit_Score !== null && r.Credit_Score < 700) {
          return false;
        }
      }
      return true;
    }).map(r => {
      // Apply interest rate markup and adjust EMI
      const simulatedRate = r.Interest_Rate !== null ? Math.max(0, r.Interest_Rate + simParams.interestMarkup) : null;
      let simulatedEmi = r.EMI;
      
      if (simulatedRate !== null && r.Loan_Amount !== null && r.Tenure_Months) {
        const P = r.Loan_Amount;
        const rateDecimal = (simulatedRate / 100) / 12;
        const n = r.Tenure_Months;
        
        if (rateDecimal > 0) {
          simulatedEmi = Math.round((P * rateDecimal * Math.pow(1 + rateDecimal, n)) / (Math.pow(1 + rateDecimal, n) - 1) * 100) / 100;
        } else {
          simulatedEmi = Math.round((P / n) * 100) / 100;
        }
      }
      
      return {
        ...r,
        Interest_Rate: simulatedRate,
        EMI: simulatedEmi
      };
    });
  }, [filteredRecords, simParams]);

  // Helper to calculate statistics
  const calculateMetrics = (recordsList) => {
    const totalLoans = recordsList.length;
    
    // Sum loan amount
    const totalPortfolio = recordsList.reduce((sum, r) => sum + (parseFloat(r.Loan_Amount) || 0), 0);
    
    // Count Bad Loans (Status = Defaulted or NPA)
    const badLoansList = recordsList.filter(r => r.Is_Bad_Loan === 'Yes');
    const badLoanCount = badLoansList.length;
    const badLoanRate = totalLoans > 0 ? (badLoanCount / totalLoans) * 100 : 0;
    
    // NPA Amount
    const npaAmount = recordsList
      .filter(r => {
        const status = (r.Status || '').toLowerCase();
        return status === 'npa' || status === 'defaulted';
      })
      .reduce((sum, r) => sum + (parseFloat(r.Loan_Amount) || 0), 0);
      
    // Avg Credit Score
    const scoredLoans = recordsList.filter(r => r.Credit_Score !== null && !isNaN(r.Credit_Score));
    const avgCreditScore = scoredLoans.length > 0 ? scoredLoans.reduce((sum, r) => sum + r.Credit_Score, 0) / scoredLoans.length : 0;
    
    // Recovery Rate (Closed Loans count / Total Loans)
    const closedCount = recordsList.filter(r => (r.Status || '').toLowerCase() === 'closed').length;
    const recoveryRate = totalLoans > 0 ? (closedCount / totalLoans) * 100 : 0;

    // Simulated Monthly Interest Revenue
    const simulatedRevenue = recordsList.reduce((sum, r) => {
      if (r.Loan_Amount !== null && r.Interest_Rate !== null) {
        return sum + ((r.Interest_Rate / 100) * r.Loan_Amount / 12);
      }
      return sum;
    }, 0);

    return {
      totalLoans,
      totalPortfolio,
      badLoanCount,
      badLoanRate,
      npaAmount,
      avgCreditScore,
      recoveryRate,
      simulatedRevenue
    };
  };

  // Memoize baseline and simulated metrics
  const baselineMetrics = useMemo(() => calculateMetrics(filteredRecords), [filteredRecords]);
  const simulatedMetrics = useMemo(() => calculateMetrics(simulatedRecords), [simulatedRecords]);

  // Reset Slicer filters
  const resetFilters = () => {
    setRegionFilter('All');
    setLoanTypeFilter('All');
    setStatusFilter('All');
    setSimParams({
      minCreditScore: 500,
      interestMarkup: 0,
      restrictHomeLoans: false
    });
  };

  // Formatting helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="app-container">
      {/* Header navbar */}
      <header className="app-header">
        <div className="brand">
          <Briefcase size={28} className="brand-icon" />
          <div>
            <h1>RiskGuard Analytics</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Credit & Portfolio Risk Intelligence Dashboard</p>
          </div>
          <span className="brand-tag">v2.1</span>
        </div>

        <nav className="nav-tabs" aria-label="Main Navigation">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            id="nav-btn-dashboard"
          >
            <BarChart3 size={16} className="btn-icon" />
            Executive Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'etl' ? 'active' : ''}`}
            onClick={() => setActiveTab('etl')}
            id="nav-btn-etl"
          >
            <Database size={16} className="btn-icon" />
            ETL Simulator
          </button>
          <button 
            className="theme-toggle-btn" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            id="btn-theme-toggle"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'dark' ? <Sun size={15} className="theme-icon" /> : <Moon size={15} className="theme-icon" />}
          </button>
        </nav>
      </header>

      {/* Main KPI metric cards (Top) */}
      <section className="kpi-grid" aria-label="Key Performance Indicators">
        {/* KPI 1: Portfolio Value */}
        <div className="glass-card kpi-card cyan">
          <div className="kpi-header">
            <span className="kpi-label">Active Portfolio</span>
            <Briefcase size={18} className="kpi-icon" />
          </div>
          <div className="kpi-value" id="kpi-portfolio-val">{formatCurrency(baselineMetrics.totalPortfolio)}</div>
          <span className="kpi-subtext">Total disbursed loan capital</span>
        </div>

        {/* KPI 2: Total Loans */}
        <div className="glass-card kpi-card purple">
          <div className="kpi-header">
            <span className="kpi-label">Total Loans</span>
            <Users size={18} className="kpi-icon" />
          </div>
          <div className="kpi-value" id="kpi-loans-count">{baselineMetrics.totalLoans}</div>
          <span className="kpi-subtext">Aggregated account portfolio</span>
        </div>

        {/* KPI 3: Bad Loan Rate */}
        <div className="glass-card kpi-card red">
          <div className="kpi-header">
            <span className="kpi-label">Bad Loan Rate</span>
            <Shield size={18} className="kpi-icon" />
          </div>
          <div className="kpi-value" id="kpi-bad-loan-rate" style={{ color: baselineMetrics.badLoanRate > 20 ? 'var(--color-npa)' : 'var(--color-active)' }}>
            {baselineMetrics.badLoanRate.toFixed(1)}%
          </div>
          <span className="kpi-subtext" style={{ color: baselineMetrics.badLoanRate > 20 ? 'var(--color-npa)' : 'var(--color-active)' }}>
            {baselineMetrics.badLoanRate > 20 ? 'Exceeds benchmark target (20%)' : 'Within safe parameters'}
          </span>
        </div>

        {/* KPI 4: Avg Credit Score */}
        <div className="glass-card kpi-card orange">
          <div className="kpi-header">
            <span className="kpi-label">Avg Credit Score</span>
            <Percent size={18} className="kpi-icon" />
          </div>
          <div className="kpi-value" id="kpi-avg-score">{Math.round(baselineMetrics.avgCreditScore) || 'N/A'}</div>
          <span className="kpi-subtext">Portfolio credit quality</span>
        </div>

        {/* KPI 5: Recovery Rate */}
        <div className="glass-card kpi-card green">
          <div className="kpi-header">
            <span className="kpi-label">Recovery Rate</span>
            <RotateCcw size={18} className="kpi-icon" />
          </div>
          <div className="kpi-value" id="kpi-recovery-rate">{baselineMetrics.recoveryRate.toFixed(1)}%</div>
          <span className="kpi-subtext">Percentage of accounts closed</span>
        </div>
      </section>

      {/* Main View Area */}
      {activeTab === 'dashboard' ? (
        <main className="main-dashboard-grid" id="main-dashboard-section">
          {/* Left Column: What-If + Charts + Ledger */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. What-If Simulator */}
            <RiskSimulator 
              records={filteredRecords}
              simulatedMetrics={simulatedMetrics}
              setSimParams={setSimParams}
              simParams={simParams}
              baselineMetrics={baselineMetrics}
            />

            {/* 1b. Automated Risk-Free Insights */}
            <RiskInsights records={filteredRecords} />

            {/* 2. Charts */}
            <DashboardCharts records={filteredRecords} />

            {/* 3. Ledger Table */}
            <CustomerLedger records={filteredRecords} onOpenAddForm={() => setShowAddForm(true)} />
          </div>

          {/* Right Column: Slicer Sidebar */}
          <aside className="sidebar-panel" aria-label="Dashboard Slicers">
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Sidebar Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <span style={{ fontFamily: 'var(--font-title)', fontWeight: 600, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={16} className="brand-icon" />
                  Interactive Slicers
                </span>
                <button 
                  className="btn-secondary" 
                  onClick={resetFilters} 
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  id="btn-reset-filters"
                >
                  Reset All
                </button>
              </div>

              {/* Region Filter */}
              <div className="filter-section">
                <h3>Region Exposure</h3>
                <div className="chip-grid" id="filter-region-chips">
                  {['All', 'North', 'South', 'East', 'West'].map((region) => (
                    <button
                      key={region}
                      className={`chip-btn ${regionFilter === region ? 'active' : ''}`}
                      onClick={() => setRegionFilter(region)}
                      id={`chip-${region.toLowerCase()}`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loan Type Filter */}
              <div className="filter-section">
                <h3>Product Type</h3>
                <select 
                  className="select-input" 
                  value={loanTypeFilter}
                  onChange={(e) => setLoanTypeFilter(e.target.value)}
                  id="filter-loan-type-select"
                >
                  <option value="All">All Products</option>
                  <option value="Home Loan">Home Loan</option>
                  <option value="Auto Loan">Auto Loan</option>
                  <option value="Personal Loan">Personal Loan</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="filter-section">
                <h3>Loan Status</h3>
                <select 
                  className="select-input" 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  id="filter-status-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                  <option value="Defaulted">Defaulted</option>
                  <option value="NPA">NPA</option>
                </select>
              </div>

              {/* Summary Stats / Mini Help */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <HelpCircle size={14} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
                  <span>
                    Select filters to slide the dataset dynamically. Toggle the **ETL Simulator** tab to inspect how the cleaning operations affect the raw inputs before loading.
                  </span>
                </div>
              </div>

            </div>
          </aside>
        </main>
      ) : (
        <main>
          {/* ETL Simulator Section */}
          <EtlSimulator 
            rawQ1={rawQ1}
            rawQ2={rawQ2}
            rawQ3={rawQ3State}
            processedData={etlResult}
            etlConfig={etlConfig}
            setEtlConfig={setEtlConfig}
          />
        </main>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <div>
          RiskGuard Portfolio Intelligence Platform &copy; 2026. Built with React.
          Developed by: YOGESH SWAMI
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Domain: Risk Analytics</span>
          <a href="#etl-simulator-container">Documentation</a>
        </div>
      </footer>

      {/* Add Loan Sliding Side Panel */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)} id="add-loan-modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} id="add-loan-modal-content">
            <button className="close-modal-btn" onClick={() => setShowAddForm(false)} id="btn-close-add-modal">
              <X size={20} />
            </button>

            <div className="detail-header">
              <div className="detail-name">Add New Loan Account</div>
              <div className="detail-id" style={{ marginTop: '4px' }}>
                Enter record details below. Leaving numeric fields empty will test the dynamic ETL pipeline imputation!
              </div>
            </div>

            <form onSubmit={handleAddLoanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} id="add-loan-form">
              {/* Customer Name */}
              <div className="filter-section">
                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Customer Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="search-input"
                  style={{ paddingLeft: '12px' }}
                  id="input-customer-name"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Loan Amount */}
                <div className="filter-section">
                  <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Loan Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 500000" 
                    value={formData.loanAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, loanAmount: e.target.value }))}
                    className="search-input"
                    style={{ paddingLeft: '12px' }}
                    id="input-loan-amount"
                  />
                </div>

                {/* Credit Score */}
                <div className="filter-section">
                  <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Credit Score (300-850)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 720" 
                    min="300"
                    max="850"
                    value={formData.creditScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditScore: e.target.value }))}
                    className="search-input"
                    style={{ paddingLeft: '12px' }}
                    id="input-credit-score"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Interest Rate */}
                <div className="filter-section">
                  <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Interest Rate (% p.a.)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 9.5" 
                    value={formData.interestRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
                    className="search-input"
                    style={{ paddingLeft: '12px' }}
                    id="input-interest-rate"
                  />
                </div>

                {/* Issue Date */}
                <div className="filter-section">
                  <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Issue Date</label>
                  <input 
                    type="date" 
                    value={formData.issueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                    className="search-input"
                    style={{ paddingLeft: '12px' }}
                    id="input-issue-date"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Loan Type */}
                <div className="filter-section">
                  <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Product Type</label>
                  <select 
                    className="select-input"
                    value={formData.loanType}
                    onChange={(e) => setFormData(prev => ({ ...prev, loanType: e.target.value }))}
                    id="input-loan-type"
                  >
                    <option value="Home Loan">Home Loan</option>
                    <option value="Auto Loan">Auto Loan</option>
                    <option value="Personal Loan">Personal Loan</option>
                  </select>
                </div>

                {/* Region */}
                <div className="filter-section">
                  <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Region</label>
                  <select 
                    className="select-input"
                    value={formData.region}
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    id="input-region"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="filter-section">
                <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Status</label>
                <select 
                  className="select-input"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  id="input-status"
                >
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                  <option value="Defaulted">Defaulted</option>
                  <option value="NPA">NPA</option>
                </select>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="nav-btn active" 
                style={{ width: '100%', padding: '10px', marginTop: '10px', justifyContent: 'center', background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderBottomColor: '#1d4ed8', color: '#ffffff' }}
                id="btn-submit-loan"
              >
                Compile & Analyze Loan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
