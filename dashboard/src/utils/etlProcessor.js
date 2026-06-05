// Helper to proper-case text (e.g. "Rahul sharma" -> "Rahul Sharma")
export function toProperCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Parse a single pipe-delimited raw CSV string into raw objects
export function parseRawCsv(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 3) return [];
  
  // Line 0 is headers
  // Line 1 is separator (e.g., |---------|---------|...)
  const headers = lines[0]
    .split('|')
    .map(h => h.trim())
    .filter(h => h.length > 0);
    
  const dataRows = [];
  
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = line
      .split('|')
      .map(c => c.trim())
      .filter((_, idx) => idx > 0 && idx <= headers.length); // skip leading/trailing empty cells from splitting |
      
    if (cells.length < headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      let val = cells[index];
      if (val === 'NULL' || val === 'null' || val === '') {
        row[header] = null;
      } else {
        row[header] = val;
      }
    });
    
    dataRows.push(row);
  }
  
  return dataRows;
}

// Convert DD-MM-YYYY or DD/MM/YYYY to JS Date object
export function parseDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = dateStr.replace(/\//g, '-').trim();
  const parts = cleaned.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const year = parseInt(parts[2], 10);
  
  return new Date(year, month, day);
}

// Process dataset based on selected configuration
export function processData(q1Text, q2Text, q3Text, config = {}) {
  // Step 1: Parse
  const q1Raw = parseRawCsv(q1Text);
  const q2Raw = parseRawCsv(q2Text);
  const q3Raw = parseRawCsv(q3Text);
  
  // Track step results for visualization
  const pipelineLog = [];
  pipelineLog.push({ step: 'Extract', desc: 'Extracted raw records from Q1, Q2, and Q3 sources.', count: q1Raw.length + q2Raw.length + q3Raw.length });

  // Append records (Union)
  let records = [...q1Raw, ...q2Raw, ...q3Raw].map(r => ({ ...r }));
  pipelineLog.push({ step: 'Union', desc: 'Appended quarterly tables into a single master table.', count: records.length });

  // Compute global averages for imputation
  // Calculate average of non-null loan amounts
  const validAmounts = records.map(r => parseFloat(r.Loan_Amount)).filter(v => !isNaN(v));
  const avgAmount = validAmounts.length > 0 ? validAmounts.reduce((s, v) => s + v, 0) / validAmounts.length : 350000;
  
  // Calculate average of non-null credit scores
  const validScores = records.map(r => parseInt(r.Credit_Score, 10)).filter(v => !isNaN(v));
  const avgScore = validScores.length > 0 ? validScores.reduce((s, v) => s + v, 0) / validScores.length : 680;

  // Calculate average of non-null interest rates
  const validRates = records.map(r => {
    if (!r.Interest_Rate) return NaN;
    const cleanRateStr = r.Interest_Rate.replace('%', '').trim();
    return parseFloat(cleanRateStr);
  }).filter(v => !isNaN(v));
  const avgRate = validRates.length > 0 ? validRates.reduce((s, v) => s + v, 0) / validRates.length : 10.5;

  // Process each record
  records = records.map(item => {
    const processed = { ...item };
    
    // Step 2: Clean Interest Rate
    if (config.cleanRates) {
      if (processed.Interest_Rate) {
        const cleanRateStr = processed.Interest_Rate.replace('%', '').trim();
        processed.Interest_Rate = parseFloat(cleanRateStr);
      } else if (config.imputeRates) {
        processed.Interest_Rate = Math.round(avgRate * 100) / 100;
      } else {
        processed.Interest_Rate = null;
      }
    } else {
      // Keep as string but trim
      processed.Interest_Rate = processed.Interest_Rate ? processed.Interest_Rate.trim() : null;
    }

    // Step 3: Impute Loan Amount
    if (processed.Loan_Amount !== null) {
      processed.Loan_Amount = parseFloat(processed.Loan_Amount);
    } else if (config.imputeAmounts) {
      processed.Loan_Amount = Math.round(avgAmount);
    } else {
      processed.Loan_Amount = null;
    }

    // Step 4: Impute Credit Score
    if (processed.Credit_Score !== null) {
      processed.Credit_Score = parseInt(processed.Credit_Score, 10);
    } else if (config.imputeScores) {
      processed.Credit_Score = Math.round(avgScore);
    } else {
      processed.Credit_Score = null;
    }

    // Step 5: Casing / Casing Standardizations
    if (config.standardizeText) {
      processed.Customer_Name = toProperCase(processed.Customer_Name);
      processed.Loan_Type = toProperCase(processed.Loan_Type);
      processed.Region = toProperCase(processed.Region);
      processed.Status = toProperCase(processed.Status);
    } else {
      // Raw values
      processed.Customer_Name = processed.Customer_Name ? processed.Customer_Name.trim() : '';
      processed.Loan_Type = processed.Loan_Type ? processed.Loan_Type.trim() : '';
      processed.Region = processed.Region ? processed.Region.trim() : '';
      processed.Status = processed.Status ? processed.Status.trim() : '';
    }

    // Step 6: Parse Date and Add Calculated Columns
    if (config.addCalculated) {
      // Parse issue date
      const dateObj = parseDate(processed.Issue_Date);
      if (dateObj) {
        processed.Parsed_Date = dateObj;
        processed.Year = dateObj.getFullYear();
        
        // Month name and number
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        processed.Month_Name = months[dateObj.getMonth()];
        processed.Month_Number = dateObj.getMonth() + 1;
        
        // Quarter
        const monthNum = dateObj.getMonth() + 1;
        if (monthNum <= 3) processed.Quarter = 'Q1';
        else if (monthNum <= 6) processed.Quarter = 'Q2';
        else if (monthNum <= 9) processed.Quarter = 'Q3';
        else processed.Quarter = 'Q4';

        // Calculate days age relative to Dec 31, 2024 (as simulated standard report date)
        const reportDate = new Date(2024, 11, 31);
        const diffTime = Math.abs(reportDate - dateObj);
        processed.Loan_Age_Days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        // Fallbacks
        processed.Quarter = processed.Loan_ID.startsWith('L-1') ? 'Q1' : processed.Loan_ID.startsWith('L-2') ? 'Q2' : 'Q3';
        processed.Month_Name = 'Unknown';
        processed.Month_Number = 0;
        processed.Year = 2024;
        processed.Loan_Age_Days = 0;
      }

      // Add Credit Score Bands / Risk Category
      // Standard bands: Excellent: 720+, Good: 660-719, Fair: 600-659, Poor: < 600
      if (processed.Credit_Score !== null) {
        const score = processed.Credit_Score;
        if (score >= 720) {
          processed.Risk_Category = 'Low Risk (Excellent)';
          processed.Risk_Score = 1;
        } else if (score >= 660) {
          processed.Risk_Category = 'Medium Risk (Good)';
          processed.Risk_Score = 2;
        } else if (score >= 600) {
          processed.Risk_Category = 'High Risk (Fair)';
          processed.Risk_Score = 3;
        } else {
          processed.Risk_Category = 'Very High Risk (Poor)';
          processed.Risk_Score = 4;
        }
      } else {
        processed.Risk_Category = 'Undetermined';
        processed.Risk_Score = 5;
      }

      // Is Bad Loan flag
      const statusLower = processed.Status.toLowerCase();
      processed.Is_Bad_Loan = (statusLower === 'defaulted' || statusLower === 'npa') ? 'Yes' : 'No';

      // EMI Calculation
      // Home Loan = 120 months, Auto Loan = 60 months, Personal Loan = 36 months.
      if (processed.Loan_Amount !== null && processed.Interest_Rate !== null) {
        const type = processed.Loan_Type.toLowerCase();
        let tenureMonths = 60; // default
        if (type.includes('home')) tenureMonths = 120;
        else if (type.includes('personal')) tenureMonths = 36;
        else if (type.includes('auto')) tenureMonths = 60;
        
        processed.Tenure_Months = tenureMonths;

        const P = processed.Loan_Amount;
        const annualRate = processed.Interest_Rate;
        const r = (annualRate / 100) / 12;
        const n = tenureMonths;
        
        if (r > 0) {
          processed.EMI = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) * 100) / 100;
        } else {
          processed.EMI = Math.round((P / n) * 100) / 100;
        }
      } else {
        processed.EMI = null;
        processed.Tenure_Months = null;
      }
    } else {
      // Keep fields flat
      processed.Quarter = processed.Loan_ID.startsWith('L-1') ? 'Q1' : processed.Loan_ID.startsWith('L-2') ? 'Q2' : 'Q3';
      processed.Month_Name = 'Unknown';
      processed.Month_Number = 0;
      processed.Year = 2024;
      processed.Risk_Category = 'Unknown';
      processed.Is_Bad_Loan = 'No';
      processed.EMI = null;
      processed.Tenure_Months = null;
    }

    return processed;
  });

  if (config.cleanRates) {
    pipelineLog.push({ step: 'Clean Rates', desc: 'Parsed percentage string into decimal interest rates and imputed nulls.' });
  }
  if (config.imputeAmounts) {
    pipelineLog.push({ step: 'Impute Amounts', desc: `Replaced missing loan amounts with average value ($${Math.round(avgAmount).toLocaleString()}).` });
  }
  if (config.imputeScores) {
    pipelineLog.push({ step: 'Impute Scores', desc: `Replaced missing credit scores with average value (${Math.round(avgScore)}).` });
  }
  if (config.standardizeText) {
    pipelineLog.push({ step: 'Standardize Casing', desc: 'Proper-cased customer names, regions, statuses, and loan types.' });
  }
  if (config.addCalculated) {
    pipelineLog.push({ step: 'Calculate Metrics', desc: 'Added EMI calculations, date dimensions (months/quarters), and risk categories.' });
  }

  return { records, pipelineLog };
}
