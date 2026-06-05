import React from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { PieChart as PieIcon, BarChart2, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DashboardCharts({ records }) {
  
  // 1. Group by Loan Type
  const loanTypeMap = {};
  records.forEach(r => {
    const type = r.Loan_Type || 'Unknown';
    if (!loanTypeMap[type]) {
      loanTypeMap[type] = { name: type, value: 0, count: 0 };
    }
    loanTypeMap[type].value += r.Loan_Amount || 0;
    loanTypeMap[type].count += 1;
  });
  const loanTypeData = Object.values(loanTypeMap);

  // Colors for product donut chart
  const PRODUCT_COLORS = [
    '#0284c7',  // Sky Blue for Home Loan
    '#6366f1',  // Indigo for Auto Loan
    '#0d9488'   // Teal for Personal Loan
  ];

  // 2. Group by Region
  const regionMap = {};
  records.forEach(r => {
    const region = r.Region || 'Unknown';
    if (!regionMap[region]) {
      regionMap[region] = { region, portfolio: 0, badLoans: 0 };
    }
    const amt = r.Loan_Amount || 0;
    regionMap[region].portfolio += amt;
    if (r.Is_Bad_Loan === 'Yes') {
      regionMap[region].badLoans += amt;
    }
  });
  const regionData = Object.values(regionMap);

  // 3. Group by Risk Category
  const riskMap = {
    'Low Risk (Excellent)': 0,
    'Medium Risk (Good)': 0,
    'High Risk (Fair)': 0,
    'Very High Risk (Poor)': 0
  };
  records.forEach(r => {
    if (riskMap[r.Risk_Category] !== undefined) {
      riskMap[r.Risk_Category] += 1;
    }
  });
  const riskData = Object.entries(riskMap).map(([name, count]) => ({
    name: name.split(' ')[0] + ' Risk', // Short name e.g. "Low Risk"
    count
  }));

  // Colors for risk bands
  const getRiskColor = (name) => {
    if (name.includes('Low')) return 'var(--color-active)';
    if (name.includes('Medium')) return 'var(--color-closed)';
    if (name.includes('Very')) return 'var(--color-npa)';
    return 'var(--color-defaulted)';
  };

  // 4. Group by Quarter
  const quarterMap = { 'Q1': 0, 'Q2': 0, 'Q3': 0 };
  records.forEach(r => {
    if (quarterMap[r.Quarter] !== undefined) {
      quarterMap[r.Quarter] += r.Loan_Amount || 0;
    }
  });
  const trendData = Object.entries(quarterMap).map(([quarter, amount]) => ({
    quarter,
    amount: amount / 1000 // In Thousands
  }));

  // Format currency for chart labels
  const formatYAxisCurrency = (tick) => {
    if (tick >= 1000) return `₹${(tick / 1000).toFixed(1)}M`;
    return `₹${tick}K`;
  };

  const formatTooltipCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="charts-grid" id="dashboard-charts-wrapper">
      
      {/* 1. Loan Product Distribution */}
      <div className="glass-card">
        <div className="chart-title">
          <span>
            <PieIcon size={16} className="brand-icon" style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Loan Type Allocation
          </span>
          <span className="chart-subtitle">Portfolio volume share by product</span>
        </div>
        <div className="chart-container" id="chart-product-allocation">
          {loanTypeData.length === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>No data to display</span>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={loanTypeData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {loanTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatTooltipCurrency(value), 'Disbursed Portfolio']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value, entry, index) => {
                    const item = loanTypeData[index];
                    return <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value} ({item ? item.count : 0} loans)</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Region wise Portfolio vs Bad Loans */}
      <div className="glass-card">
        <div className="chart-title">
          <span>
            <BarChart2 size={16} className="brand-icon" style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--accent-purple)' }} />
            Regional Portfolio & Bad Loans
          </span>
          <span className="chart-subtitle">Portfolio vs defaults by region</span>
        </div>
        <div className="chart-container" id="chart-regional-risk">
          {regionData.length === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>No data to display</span>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={regionData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="region" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={formatYAxisCurrency} />
                <Tooltip
                  formatter={(value, name) => [formatTooltipCurrency(value), name === 'portfolio' ? 'Total Portfolio' : 'Bad Loans Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Legend iconType="rect" formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value === 'portfolio' ? 'Total Portfolio' : 'Bad Loans'}</span>} />
                <Bar dataKey="portfolio" fill="#bae6fd" stroke="#0284c7" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="badLoans" fill="#fee2e2" stroke="#dc2626" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Credit Risk Categories */}
      <div className="glass-card">
        <div className="chart-title">
          <span>
            <AlertTriangle size={16} className="brand-icon" style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--color-defaulted)' }} />
            Credit Score Risk Profile
          </span>
          <span className="chart-subtitle">Count of loans in risk categories</span>
        </div>
        <div className="chart-container" id="chart-risk-profile">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              layout="vertical"
              data={riskData}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
              <Tooltip
                formatter={(value) => [value, 'Active Loans']}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                itemStyle={{ color: '#0f172a' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRiskColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Quarterly Trends */}
      <div className="glass-card">
        <div className="chart-title">
          <span>
            <TrendingUp size={16} className="brand-icon" style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--accent-cyan)' }} />
            Disbursement Trend
          </span>
          <span className="chart-subtitle">Disbursement volume trend by quarter (₹K)</span>
        </div>
        <div className="chart-container" id="chart-disbursement-trend">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="quarter" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickFormatter={(val) => `₹${val}K`} />
              <Tooltip
                formatter={(value) => [formatTooltipCurrency(value * 1000), 'Total Disbursed']}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                itemStyle={{ color: '#0f172a' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#0284c7" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
