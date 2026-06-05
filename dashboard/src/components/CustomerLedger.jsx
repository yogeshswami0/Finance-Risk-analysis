import React, { useState } from 'react';
import { Search, ArrowUpDown, X, User, DollarSign, Calendar, MapPin, Activity, ShieldAlert, Download } from 'lucide-react';

export default function CustomerLedger({ records, onOpenAddForm }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('Loan_ID');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Search filter
  const filteredRecords = records.filter(r => {
    const searchLower = searchTerm.toLowerCase();
    const name = (r.Customer_Name || '').toLowerCase();
    const id = (r.Loan_ID || '').toLowerCase();
    const type = (r.Loan_Type || '').toLowerCase();
    const region = (r.Region || '').toLowerCase();
    
    return name.includes(searchLower) || id.includes(searchLower) || type.includes(searchLower) || region.includes(searchLower);
  });

  // Apply sorting
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // Handle nulls
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    // Convert strings to float if numeric for comparison
    if (sortField === 'Loan_Amount' || sortField === 'Interest_Rate' || sortField === 'Credit_Score' || sortField === 'EMI') {
      valA = parseFloat(valA);
      valB = parseFloat(valB);
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  // Format currency helpers
  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Export CSV
  const exportCsv = () => {
    if (filteredRecords.length === 0) return;
    
    // Headers
    const headers = ['Loan_ID', 'Customer_Name', 'Loan_Amount', 'Loan_Type', 'Interest_Rate', 'Status', 'Issue_Date', 'Region', 'Credit_Score', 'EMI', 'Risk_Category', 'Is_Bad_Loan'];
    
    // Rows
    const csvRows = [
      headers.join(','),
      ...filteredRecords.map(r => 
        headers.map(h => {
          const val = r[h] ?? '';
          // escape quotes
          return `"${val.toString().replace(/"/g, '""')}"`;
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "finance_risk_ledger.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Export JSON
  const exportJson = () => {
    if (filteredRecords.length === 0) return;
    const blob = new Blob([JSON.stringify(filteredRecords, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "finance_risk_ledger.json");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="glass-card" style={{ marginTop: '24px' }} id="customer-ledger-container">
      
      {/* Ledger Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} className="brand-icon" />
            Loan Ledger & Portfolio Records
          </h2>
          <p className="etl-step-desc">
            Showing {sortedRecords.length} records. Click any row for details.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div className="search-input-wrapper" style={{ width: '220px' }}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search customers, ID, type..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              id="ledger-search-input"
            />
          </div>

          {/* Export buttons */}
          <button className="btn-secondary" onClick={exportCsv} id="btn-export-csv" title="Export current search to CSV">
            <Download size={14} />
            CSV
          </button>
          <button className="btn-secondary" onClick={exportJson} id="btn-export-json" title="Export current search to JSON">
            <Download size={14} />
            JSON
          </button>
          <button 
            className="nav-btn active" 
            onClick={onOpenAddForm} 
            id="btn-open-add-form" 
            style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--accent-blue)', borderColor: 'var(--accent-blue)', borderBottomColor: '#1d4ed8', color: '#ffffff' }}
          >
            + Add Loan
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-wrapper">
        <table className="data-table" id="ledger-data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('Loan_ID')}>ID <ArrowUpDown size={12} style={{ marginLeft: '4px' }} /></th>
              <th onClick={() => handleSort('Customer_Name')}>Name <ArrowUpDown size={12} style={{ marginLeft: '4px' }} /></th>
              <th onClick={() => handleSort('Loan_Amount')}>Loan Amount <ArrowUpDown size={12} style={{ marginLeft: '4px' }} /></th>
              <th onClick={() => handleSort('Loan_Type')}>Type <ArrowUpDown size={12} style={{ marginLeft: '4px' }} /></th>
              <th onClick={() => handleSort('Interest_Rate')}>Rate <ArrowUpDown size={12} style={{ marginLeft: '4px' }} /></th>
              <th onClick={() => handleSort('Credit_Score')}>Credit Score <ArrowUpDown size={12} style={{ marginLeft: '4px' }} /></th>
              <th onClick={() => handleSort('EMI')}>Mo. EMI <ArrowUpDown size={12} style={{ marginLeft: '4px' }} /></th>
              <th onClick={() => handleSort('Status')}>Status <ArrowUpDown size={12} style={{ marginLeft: '4px' }} /></th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No matching loan records found. Try adjusting your search term.
                </td>
              </tr>
            ) : (
              sortedRecords.map((r) => {
                const statusClass = (r.Status || '').toLowerCase();
                
                // Risk color class
                let riskClass = 'low';
                if (r.Risk_Category?.includes('Medium')) riskClass = 'medium';
                if (r.Risk_Category?.includes('High Risk (Fair)')) riskClass = 'high';
                if (r.Risk_Category?.includes('Very High')) riskClass = 'very-high';

                return (
                  <tr 
                    key={r.Loan_ID} 
                    className={`clickable ${selectedRecord?.Loan_ID === r.Loan_ID ? 'selected' : ''}`}
                    onClick={() => setSelectedRecord(r)}
                    id={`ledger-row-${r.Loan_ID}`}
                  >
                    <td style={{ fontFamily: 'var(--font-code)', fontSize: '0.8rem', fontWeight: 600 }}>{r.Loan_ID}</td>
                    <td style={{ fontWeight: 500 }}>{r.Customer_Name || 'NULL'}</td>
                    <td>{formatCurrency(r.Loan_Amount)}</td>
                    <td style={{ fontSize: '0.85rem' }}>{r.Loan_Type || 'NULL'}</td>
                    <td>{r.Interest_Rate !== null && r.Interest_Rate !== undefined ? `${r.Interest_Rate}%` : 'NULL'}</td>
                    <td>
                      <span className={`risk-badge ${riskClass}`}>
                        {r.Credit_Score ?? 'NULL'}
                      </span>
                    </td>
                    <td>{formatCurrency(r.EMI)}</td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>
                        <span className="status-dot"></span>
                        {r.Status || 'NULL'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details Side Panel/Modal */}
      {selectedRecord && (
        <div className="modal-overlay" onClick={() => setSelectedRecord(null)} id="details-modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} id="details-modal-content">
            <button className="close-modal-btn" onClick={() => setSelectedRecord(null)} id="btn-close-modal">
              <X size={20} />
            </button>

            <div className="detail-header">
              <div className="detail-name">{selectedRecord.Customer_Name || 'NULL'}</div>
              <div className="detail-id">Loan Account: {selectedRecord.Loan_ID}</div>
            </div>

            {/* Profile Overview Card */}
            <div className="detail-grid">
              
              {/* Region */}
              <div className="detail-item">
                <span className="detail-label">
                  <MapPin size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Region
                </span>
                <span className="detail-value">{selectedRecord.Region || 'NULL'}</span>
              </div>

              {/* Status */}
              <div className="detail-item">
                <span className="detail-label">Loan Status</span>
                <div>
                  <span className={`status-badge ${(selectedRecord.Status || '').toLowerCase()}`} style={{ marginTop: '4px' }}>
                    <span className="status-dot"></span>
                    {selectedRecord.Status || 'NULL'}
                  </span>
                </div>
              </div>

              {/* Loan Amount */}
              <div className="detail-item">
                <span className="detail-label">Disbursed Amount</span>
                <span className="detail-value" style={{ color: 'var(--accent-cyan)' }}>
                  {formatCurrency(selectedRecord.Loan_Amount)}
                </span>
              </div>

              {/* EMI */}
              <div className="detail-item">
                <span className="detail-label">Monthly EMI</span>
                <span className="detail-value">
                  {formatCurrency(selectedRecord.EMI)}
                </span>
              </div>

              {/* Loan Type */}
              <div className="detail-item">
                <span className="detail-label">Loan Type</span>
                <span className="detail-value" style={{ fontSize: '1rem' }}>{selectedRecord.Loan_Type || 'NULL'}</span>
              </div>

              {/* Interest Rate */}
              <div className="detail-item">
                <span className="detail-label">Interest Rate (p.a)</span>
                <span className="detail-value">
                  {selectedRecord.Interest_Rate !== null ? `${selectedRecord.Interest_Rate}%` : 'NULL'}
                </span>
              </div>

              {/* Credit Score */}
              <div className="detail-item">
                <span className="detail-label">Credit Rating</span>
                <span className="detail-value" style={{ 
                  color: selectedRecord.Risk_Category?.includes('Low') ? 'var(--color-active)' :
                         selectedRecord.Risk_Category?.includes('Medium') ? 'var(--color-closed)' :
                         selectedRecord.Risk_Category?.includes('High Risk') ? 'var(--color-defaulted)' : 'var(--color-npa)'
                }}>
                  {selectedRecord.Credit_Score || 'NULL'}
                </span>
              </div>

              {/* Risk category */}
              <div className="detail-item">
                <span className="detail-label">Risk Profile</span>
                <span className="detail-value" style={{ fontSize: '0.9rem' }}>
                  {selectedRecord.Risk_Category || 'NULL'}
                </span>
              </div>

              {/* Issue Date */}
              <div className="detail-item">
                <span className="detail-label">
                  <Calendar size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Issue Date
                </span>
                <span className="detail-value" style={{ fontSize: '1rem' }}>{selectedRecord.Issue_Date || 'NULL'}</span>
              </div>

              {/* Days Outstanding */}
              <div className="detail-item">
                <span className="detail-label">Loan Age (Days)</span>
                <span className="detail-value">{selectedRecord.Loan_Age_Days || '0'} days</span>
              </div>
            </div>

            {/* Risk Assessment Flag */}
            {selectedRecord.Credit_Score !== null && selectedRecord.Credit_Score < 600 && (
              <div style={{ display: 'flex', gap: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: 'var(--radius-sm)', marginTop: '10px' }}>
                <ShieldAlert size={20} style={{ color: 'var(--color-npa)', flexShrink: 0 }} />
                <div>
                  <h5 style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '4px' }}>Under-Prime Portfolio Risk</h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    This customer's credit score is <strong>{selectedRecord.Credit_Score}</strong>, which falls into the <strong>Poor</strong> category. Outstanding principal of <strong>{formatCurrency(selectedRecord.Loan_Amount)}</strong> is at severe risk of default. Loan status is currently marked as <strong>{selectedRecord.Status}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Summary statistics explainer */}
            <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Amortization Period:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedRecord.Tenure_Months ? `${selectedRecord.Tenure_Months} Months` : '—'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Total Repayment Projection:</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {selectedRecord.EMI && selectedRecord.Tenure_Months ? formatCurrency(selectedRecord.EMI * selectedRecord.Tenure_Months) : '—'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Interest Charge Projection:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>
                  {selectedRecord.EMI && selectedRecord.Tenure_Months && selectedRecord.Loan_Amount ? 
                    formatCurrency((selectedRecord.EMI * selectedRecord.Tenure_Months) - selectedRecord.Loan_Amount) : '—'
                  }
                </strong>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
