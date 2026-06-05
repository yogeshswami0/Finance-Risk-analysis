# Finance Risk Analytics
### End-to-End Data Analytics Project | Power Query | Power BI | DAX

---

## Dashboard Preview

<img src="https://github.com/amolhatwar/Finance-Risk-Analytics/blob/1d459b5336969608385b2598e687512c7e8ee62a/Finance%20Risk%20Analytics%20-%20Executive%20Summary.png" width="600">

---
<img src="https://github.com/amolhatwar/Finance-Risk-Analytics/blob/1d459b5336969608385b2598e687512c7e8ee62a/Finance%20Risk%20Analytics%20-%20Risk%20Analysis.png" width="600">

---
<img src="https://github.com/amolhatwar/Finance-Risk-Analytics/blob/1d459b5336969608385b2598e687512c7e8ee62a/Finance%20Risk%20Analytics%20-%20Loan%20Details.png" width="600">

---


## Project Overview

A complete Finance Risk Analytics pipeline built from scratch — from raw quarterly CSV files to an interactive Power BI dashboard. This project simulates a real-world banking analytics use case where loan portfolio data is cleaned, transformed, analyzed, and visualized.

**Key Finding:** Bad Loan Rate = 37.5% (Industry benchmark: below 20%)

---

## Tech Stack

| Tool | Usage |
|------|-------|
| Power Query (M Language) | ETL — Extract, Transform, Load |
| Power BI Desktop | Dashboard & Visualization |
| DAX | KPI Measures & Calculations |
| Excel / CSV | Data Source |

---

## Project Architecture

```
Raw CSV Files (Q1, Q2, Q3)
        ↓
Phase 1: Data Cleaning (Power Query)
        ↓
Phase 2: Data Transformation (10 New Columns)
        ↓
Phase 3: Analysis Preparation (5 Summary Tables + 22 DAX Measures)
        ↓
Phase 4: Power BI Dashboard (3 Pages)
```

---

## Phase 1 — Data Cleaning

**What was done:**
- Appended 3 quarterly CSV files into one Master Table using Folder.Files()
- NULL handling: Average imputation for Loan_Amount, Interest_Rate, Credit_Score
- Interest Rate cleaning: Removed % symbol using SplitColumn, uniform decimal format
- Date locale fix: en-IN format for Issue_Date
- Text standardization: Text.Proper() for Customer_Name, Loan_Type, Region
- Removed hidden spaces with Text.Trim() and Text.Clean()

---

## Phase 2 — Data Transformation

**10 New Columns Added:**

| Column | Logic | Type |
|--------|-------|------|
| Quarter | Month-based Q1/Q2/Q3/Q4 | Text |
| Month_Name | Date.MonthName (en-IN) | Text |
| Month_Number | Date.Month | Int64 |
| Year | Date.Year | Int64 |
| Loan_Age_Days | Duration.Days from Issue_Date | Int64 |
| Risk_Category | Credit Score bands | Text |
| Is_Bad_Loan | Defaulted or NPA = Yes | Text |
| Loan_Amount_In_Lakhs | Amount / 100000 | Decimal |
| Risk_Score | Numeric 1-4 for sorting | Int64 |
| EMI | Standard EMI formula | Decimal |

**EMI Formula (M Language):**
```m
each
  let
    P = [Loan_Amount],
    r = [Interest_Rate_%] / 100 / 12,
    n = [Tenure_Months],
    EMI = Number.Round(P * r * Number.Power(1+r, n) / (Number.Power(1+r, n) - 1), 2)
  in EMI
```

---

## Phase 3 — Analysis Preparation

**5 Aggregation Tables (Table.Group):**
- Region_Summary
- LoanType_Summary
- Quarter_Summary
- Risk_Summary
- Status_Summary

**22 DAX Measures (COALESCE + DIVIDE pattern):**

```dax
Bad_Loan_Rate_% =
ROUND(DIVIDE([Bad_Loan_Count], [Total_Loans], 0) * 100, 2)

NPA_Amount =
COALESCE(CALCULATE(SUM(Row_Data[Loan_Amount]), Row_Data[Status] = "NPA"), 0)

Recovery_Rate_% =
ROUND(DIVIDE(COALESCE(COUNTROWS(FILTER(Row_Data, Row_Data[Status]="Closed")), 0), [Total_Loans], 0) * 100, 2)
```

---

## Phase 4 — Power BI Dashboard

**3 Pages:**

**Page 1 — Executive Summary**
- 5 KPI Cards: Total Portfolio, Total Loans, Bad Loan Rate %, Avg Credit Score, Recovery Rate %
- Donut Chart: Loan Type Distribution
- Bar Chart: Region Wise Portfolio
- Line Chart: Quarterly Trend
- Gauge: Bad Loan Rate % vs 20% target

**Page 2 — Risk Analysis**
- Risk KPI Cards: NPA Amount, Defaulted Amount, Very High Risk Count
- Stacked Bar: Risk Category Distribution
- Pie Chart: Status Distribution
- Bar Chart: Bad Loans by Region

**Page 3 — Loan Details**
- Full Data Table with Conditional Formatting
- Top 5 High Risk Customers
- Growth KPI Cards: Q1, Q2, Q3 Amounts + Growth %

---

## Key Insights

- Bad Loan Rate = 37.5% — significantly above 20% industry benchmark
- North region has highest portfolio exposure (2,790K)
- East region has highest bad loan concentration
- Personal Loans show highest default rate
- Q2 shows peak disbursement — Q3 slight decline

---

## Project Structure

```
Finance-Risk-Analytics/
│
├── Data/
│   ├── Loan_Data_Q1.csv
│   ├── Loan_Data_Q2.csv
│   └── Loan_Data_Q3.csv
│
├── Output/
│   └── Current_Working_Project.xlsx
│
├── Finance_Risk_Analytics.pbix
└── README.md
```

---

## Skills Demonstrated

- ETL pipeline design using Power Query M Language
- NULL handling strategies (average imputation)
- Advanced M Language: let...in inside each, Table.Group, List functions
- DAX Measures: COALESCE, DIVIDE, CALCULATE, FILTER, COUNTROWS
- Data Modeling: Star schema relationships
- Power BI Dashboard: Slicers, Conditional Formatting, Navigation, Sync Slicers
- Finance Domain: NPA, Bad Loan Rate, Recovery Rate, Credit Score Bands, EMI

---

## How to Run

1. Clone this repository
2. Open Finance_Risk_Analytics.pbix in Power BI Desktop
3. Update the folder path in Power Query (Transform Data → Source)
4. Click Refresh All
5. Dashboard will load with latest data

---

*Built as a portfolio project to demonstrate end-to-end Data Analytics skills.*
*Open to Data Analyst opportunities — connect with me on LinkedIn.*
