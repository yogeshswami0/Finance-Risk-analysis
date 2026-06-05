import React, { useState } from 'react';
import { Database, ToggleLeft, FileText, Code, CheckCircle, ArrowRight, Download, Terminal } from 'lucide-react';

export default function EtlSimulator({ rawQ1, rawQ2, rawQ3, processedData, etlConfig, setEtlConfig }) {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'raw', 'pipeline', 'json'
  
  const handleToggle = (key) => {
    setEtlConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Convert the processed data records to formatted JSON for display
  const jsonString = JSON.stringify(processedData.records, null, 2);

  // Download logic
  const downloadCleanedJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "finance_risk_cleaned_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const stepsInfo = [
    {
      key: 'union',
      title: 'Extract & Union',
      desc: 'Combines raw Q1, Q2, and Q3 pipe-delimited data files into a Master Data Table.',
      required: true
    },
    {
      key: 'cleanRates',
      title: 'Parse Interest Rates',
      desc: 'Removes "%" signs, trims spaces, converts rates to decimals, and imputes null values with average (10.25%).'
    },
    {
      key: 'imputeAmounts',
      title: 'Impute Loan Amounts',
      desc: 'Finds rows with missing loan amounts and imputes them with the portfolio average ($376,429).'
    },
    {
      key: 'imputeScores',
      title: 'Impute Credit Scores',
      desc: 'Fills missing credit scores using the average credit score (676).'
    },
    {
      key: 'standardizeText',
      title: 'Text Casing Standardization',
      desc: 'Proper-cases values in Region, Status, Loan Type, and Customer Name fields.'
    },
    {
      key: 'addCalculated',
      title: 'Calculate Derivations',
      desc: 'Derives Month Name, Quarter, Risk Band, Is_Bad_Loan flag, and calculates EMIs using loan variables.'
    }
  ];

  return (
    <div className="glass-card glow-cyan" id="etl-simulator-container">
      <div className="chart-title">
        <span>
          <Database size={18} className="brand-icon" style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          Interactive ETL Pipeline Simulator
        </span>
        <span className="chart-subtitle">Extract, Transform, & Load Live Simulator</span>
      </div>

      <div className="etl-view-grid">
        {/* ETL Control Steps (Left) */}
        <div className="etl-steps-panel">
          {stepsInfo.map((step) => {
            const isActive = step.required || etlConfig[step.key];
            return (
              <div 
                key={step.key} 
                className={`etl-step-card ${isActive ? 'active' : ''}`}
                onClick={() => !step.required && handleToggle(step.key)}
                id={`etl-step-${step.key}`}
              >
                <div className="etl-step-header">
                  <span className="etl-step-title">
                    {step.required ? (
                      <CheckCircle size={14} className="status-badge active" style={{ padding: 0, border: 'none', background: 'none' }} />
                    ) : (
                      <Database size={14} style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
                    )}
                    {step.title}
                  </span>
                  
                  {!step.required && (
                    <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isActive} 
                        onChange={() => handleToggle(step.key)}
                        id={`toggle-checkbox-${step.key}`}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  )}
                </div>
                <p className="etl-step-desc">{step.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Dynamic Data Code Viewer (Right) */}
        <div className="etl-data-viewer">
          <div className="viewer-header">
            <div className="nav-tabs">
              <button 
                className={`nav-btn ${activeTab === 'raw' ? 'active' : ''}`}
                onClick={() => setActiveTab('raw')}
                id="tab-btn-raw"
              >
                <FileText size={14} className="btn-icon" />
                Raw Source
              </button>
              <button 
                className={`nav-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('pipeline')}
                id="tab-btn-pipeline"
              >
                <Terminal size={14} className="btn-icon" />
                Pipeline Log
              </button>
              <button 
                className={`nav-btn ${activeTab === 'json' ? 'active' : ''}`}
                onClick={() => setActiveTab('json')}
                id="tab-btn-json"
              >
                <Code size={14} className="btn-icon" />
                Clean JSON Output
              </button>
            </div>

            {activeTab === 'json' && (
              <button 
                className="btn-secondary" 
                onClick={downloadCleanedJson}
                id="btn-download-json"
              >
                <Download size={14} />
                Export Cleaned JSON
              </button>
            )}
          </div>

          <div className="code-block-wrapper">
            {activeTab === 'raw' && (
              <div className="code-block" id="raw-source-display" style={{ color: 'var(--text-secondary)' }}>
                {`/* --- LOAN_DATA_Q1.CSV --- */\n${rawQ1}\n\n/* --- LOAN_DATA_Q2.CSV --- */\n${rawQ2}\n\n/* --- LOAN_DATA_Q3.CSV --- */\n${rawQ3}`}
              </div>
            )}

            {activeTab === 'pipeline' && (
              <div className="code-block" id="pipeline-log-display" style={{ color: 'var(--text-primary)' }}>
                <div style={{ color: 'var(--accent-cyan)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '12px' }}>
                  <span>$ npm run start-etl-pipeline</span>
                </div>
                {processedData.pipelineLog.map((log, index) => (
                  <div key={index} style={{ marginBottom: '10px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--color-active)', fontWeight: 'bold' }}>[OK]</span>
                    <div>
                      <div style={{ fontWeight: '600', fontFamily: 'var(--font-title)' }}>
                        Step {index + 1}: {log.step}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '2px' }}>
                        {log.desc} {log.count && `(${log.count} records loaded)`}
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ color: 'var(--accent-purple)', marginTop: '20px', borderTop: '1px solid hsla(217, 30%, 15%, 0.8)', paddingTop: '10px' }}>
                  <span>&gt; Pipeline executed successfully. Ready to feed metrics cards and charts.</span>
                </div>
              </div>
            )}

            {activeTab === 'json' && (
              <div className="code-block" id="json-output-display">
                {jsonString}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
