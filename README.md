# 🌱 VentureRoot — Rural & Micro-Enterprise Intelligence Platform

> **Smart India Hackathon (SIH) 2026 Project**  
> An AI-powered decision-support and financial intelligence platform that empowers aspiring rural entrepreneurs to model enterprises, evaluate hyper-local market feasibility, discover government credit schemes (PMEGP, MUDRA), and generate bankable project reports.

[![Live Deployment](https://img.shields.io/badge/Live-Deployment-success?style=for-the-badge&logo=vercel)](https://venture-root-sih-project-2026.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20AI-orange?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌐 Live Production URL

🚀 **Deployed on Vercel:**  
[**https://venture-root-sih-project-2026.vercel.app**](https://venture-root-sih-project-2026.vercel.app)

---

## 📌 Problem Statement & Vision

In rural and semi-urban India, millions of aspiring micro-entrepreneurs face three critical barriers when starting a business:
1. **Information Asymmetry**: Lack of hyper-local demand data, competitor density insights, and pricing dynamics.
2. **Credit & Scheme Complexity**: Inability to navigate government subsidy programs (PMEGP, MUDRA, Stand-Up India) or compute statutory debt-service ratios.
3. **Unbankable Business Plans**: Failure to produce standardized, credible Detailed Project Reports (DPRs) required by rural banks and NBFCs.

**VentureRoot** solves this by combining **deterministic mathematical financial modeling** with **Google Gemini Flash AI** to provide an end-to-end venture readiness workspace tailored for Indian rural realities.

---

## ⚡ Core Capabilities & Features

### 1. 📋 Guided 6-Step Enterprise Modeling Wizard
- Models district, block, village, and regional cluster hierarchies.
- Supports pre-defined rural industries (Agri-Processing, Handloom, Pottery, Animal Husbandry) alongside **custom sector write-in inputs**.
- Collects margin equity, expected revenue, unit economics, land, and equipment availability.

### 2. 🧠 AI Market Feasibility Engine (Powered by Gemini Flash)
- **Demand Opportunity & Unmet Needs**: Evaluates local block absorption capacity and consumer spending habits.
- **Competitor Density & Positioning**: Identifies local unorganized vendors vs. regional wholesale channels.
- **Dynamic SWOT Matrix**: Evaluates internal equity strengths against external seasonal supply threats.
- **Pricing Corridors**: Calculates viable local pricing ranges and unit economics.

### 3. 💰 Deterministic Financial & Statutory Scheme Engine
- **Strict Mathematical Accuracy**: Financial values (EMI, Total Interest, Loan Ratios) are calculated deterministically via code—never hallucinated by AI.
- **Auto-Routed Government Schemes**:
  - **PMEGP (Prime Minister's Employment Generation Programme)**: Up to 90% debt funding with 15%–35% capital subsidy.
  - **MUDRA (Shishu / Kishore / Tarun)**: Collateral-free micro-enterprise financing.
- **Interactive What-If Simulator**: Real-time recalculation of monthly margins, net profit, and break-even timelines.
- **Complete Amortization Schedule**: Full month-by-month principal, interest, and remaining balance schedule.

### 4. 📊 Enterprise Benchmark Comparison
- Side-by-side visual and tabular benchmarking of user ventures against rural micro-enterprise archetypes (Dairy Chilling, Kirana Retail, Handloom Weaving, Mini Oil Expeller, Poultry).
- Visual radar chart comparing Feasibility, Market Demand, Competition, Investment, Risk, and Local Opportunity.
- Gemini AI comparative evaluation highlighting trade-offs and competitive moats.

### 5. 📄 Bankable Detailed Project Reports (DPR)
- Dynamic generation of institutional-grade project reports matching the user's venture inputs.
- Multi-section breakdown: Executive Summary, Market & Positioning, SWOT & Risk Matrix, Capital & Funding Allocation, and Action Verdict.
- Print-ready and downloadable PDF formatting for rural bank loan officers.

### 6. 🤖 Multilingual AI Entrepreneur Advisor
- Interactive conversational AI assistant tailored for rural enterprise guidance.
- Multilingual interface supporting **English, Hindi (हिंदी), Marathi (मराठी), Telugu (తెలుగు), and Bengali (বাংলা)**.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack |
| **UI Library & Components** | [React 19](https://react.dev/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) |
| **Styling & Design System** | [Tailwind CSS](https://tailwindcss.com/), Custom Organic HSL Palette, Accessible Typography |
| **Data Visualizations** | [Recharts](https://recharts.org/), Custom SVG Radar & Area Charts |
| **Artificial Intelligence** | [Google Gemini 1.5 Flash API](https://ai.google.dev/) via secure server-side routes |
| **State & Persistence** | [Zustand](https://github.com/pmndrs/zustand), Prototype Storage Layer with local event bus & GitHub Contents API sync |
| **Validation** | [Zod](https://zod.dev/), [React Hook Form](https://react-hook-form.com/) |
| **Deployment** | [Vercel Edge Network](https://vercel.com/) |

---

## 📁 Project Architecture

```text
frontend/
├── src/
│   ├── app/                               # Next.js App Router (40+ routes)
│   │   ├── (auth)/                        # Authentication (login, register)
│   │   ├── (dashboard)/                   # Authenticated Entrepreneur Workspace
│   │   │   ├── advisor/                   # AI Entrepreneur Advisor
│   │   │   ├── business/
│   │   │   │   ├── [id]/                  # My Business detail view
│   │   │   │   │   ├── feasibility/       # AI Market Feasibility engine
│   │   │   │   │   ├── finance/           # Deterministic Financial & Scheme engine
│   │   │   │   │   └── roadmap/           # 4-Phase execution milestones
│   │   │   │   ├── compare/               # Side-by-side enterprise comparison
│   │   │   │   └── create/                # 6-step enterprise creation wizard
│   │   │   ├── dashboard/                 # Central KPI command center & briefing
│   │   │   └── reports/                   # Bankable project reports list & detail
│   │   └── api/v1/                        # Server-side REST & AI Route Handlers
│   │       ├── ai/                        # Gemini AI endpoints (advisor, compare, briefing)
│   │       ├── auth/                      # Authentication endpoints
│   │       ├── businesses/                # Business enterprise CRUD & persistence
│   │       └── reports/                   # Report generation endpoints
│   ├── components/                        # Shared UI components, charts, and navigation
│   ├── features/                          # Feature modules (business, finance, feasibility, reports, i18n)
│   ├── lib/                               # Data providers, server-side JSON database & storage adapters
│   └── locales/                           # i18n translation bundles (en, hi, mr, te, bn)
├── package.json
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abhisri-j14/VentureRoot---SIH-project-2026.git
   cd VentureRoot---SIH-project-2026/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root of `frontend/`:
   ```env
   # Operational mode ('json' runs the standalone prototype DB)
   NEXT_PUBLIC_DATA_SOURCE=json

   # Google Gemini Flash API Key (for live AI features)
   GEMINI_API_KEY=your_google_gemini_api_key_here

   # Optional GitHub API persistence
   GITHUB_TOKEN=your_personal_access_token_here
   GITHUB_REPO=abhisri-j14/VentureRoot---SIH-project-2026
   GITHUB_BRANCH=main
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🇮🇳 Alignment with National Initiatives

- **Aatmanirbhar Bharat**: Catalyzing self-reliance at the village level.
- **PMEGP & Stand-Up India**: Demystifying statutory capital subsidies and bridging credit gaps for women and underprivileged entrepreneurs.
- **Vocal for Local**: Transforming traditional village crafts, agriculture, and micro-manufacturing into viable commercial enterprises.

---

## 👥 Contributors & SIH 2026 Team

Developed with ❤️ for **Smart India Hackathon (SIH) 2026**.  
