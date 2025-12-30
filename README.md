# 🍁 MapleACB - Canadian Stock Tax Calculator

A modern, web-based tool for calculating **Adjusted Cost Base (ACB)** for Canadian stock traders. Built specifically to work with Interactive Brokers (IBKR) transaction exports, MapleACB helps you accurately track your cost basis, capital gains, and tax obligations across multiple currencies.

**Live Demo:** [https://kc-time.github.io/ACB-planner/](https://kc-time.github.io/ACB-planner/)

## ✨ Features

- 📊 **Dashboard View** - Visual overview of your positions, gains/losses, and tax summaries
- 📝 **Transaction Log** - Complete audit trail of all your trades with ACB calculations
- 🎯 **Tax-Loss Planner** - Simulate "what-if" scenarios to optimize your tax strategy
- 🔍 **Audit Trail** - Detailed breakdown of ACB calculations for each transaction
- 💱 **Multi-Currency Support** - Handles CAD, USD, and other currencies with automatic FX conversion
- 📁 **CSV Import** - Direct import from IBKR Flex Query reports
- ✏️ **Manual Entry** - Add transactions manually when needed
- 💾 **Local Storage** - All data stored locally in your browser (privacy-first)

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kc-time/ACB-planner.git
   cd ACB-planner
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

## 📖 How to Use

### Importing IBKR Transactions

1. **Set up your IBKR Flex Query:**
   - Log into Interactive Brokers
   - Go to Performance & Reports → Flex Queries
   - Create a new Flex Query with these sections:
     - **Trades (Execution)**: CurrencyPrimary, FXRateToBase, Symbol, DateTime, Quantity, TradePrice, IBCommission, IBCommissionCurrency
     - **Corporate Actions (Detail)**: CurrencyPrimary, Symbol, Report Date, Quantity, Description, Type
   - Export as CSV

2. **Import into MapleACB:**
   - Click "Import CSV" button
   - Select your exported CSV file
   - Your transactions will be automatically parsed and calculated

### Manual Transaction Entry

Click the "Manual" button to add transactions one at a time. Useful for:
- Transactions from other brokers
- Corporate actions not captured in IBKR reports
- Adjustments and corrections

## 🛠️ Tech Stack

- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful data visualizations
- **date-fns** - Date manipulation utilities
- **Lucide React** - Icon library

## 📝 Project Structure

```
ACB-planner/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── TransactionList.tsx
│   ├── WhatIfSimulator.tsx
│   ├── AuditTrail.tsx
│   └── ManualTransactionModal.tsx
├── acbLogic.ts         # Core ACB calculation logic
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
├── index.tsx           # Application entry point
└── vite.config.ts      # Vite configuration
```

## 🧮 How ACB Calculation Works

MapleACB implements the **Canadian tax method** for calculating Adjusted Cost Base:

- **Buy transactions**: Increase your ACB pool
- **Sell transactions**: Calculate capital gains/losses using average ACB
- **Stock splits**: Automatically adjust quantities and ACB
- **Multi-currency**: Converts all transactions to CAD using transaction-date FX rates

The tool maintains separate ACB pools for each stock symbol and currency combination.

## 🚢 Deployment

This project is configured for **GitHub Pages** deployment:

1. Push your code to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Your site will be available at `https://kc-time.github.io/ACB-planner/`

See `.github/workflows/deploy.yml` for the deployment configuration.

## ⚠️ Important Notes

- **Tax Advice**: This tool is for calculation purposes only. Always consult with a tax professional for official tax advice.
- **Data Privacy**: All data is stored locally in your browser. No data is sent to any server.
- **Accuracy**: While we strive for accuracy, always verify calculations with your broker statements and tax advisor.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is private and for personal use.

## 🙏 Acknowledgments

Built with ❤️ for Canadian investors navigating the complexities of stock tax calculations.

---

**Made with React, TypeScript, and lots of ☕**
