# 🌍 EcoTracker - AI-Powered Carbon Footprint Monitor

EcoTracker is a comprehensive carbon footprint tracking application that combines AI-powered analysis, social features, and gamification to help users monitor and reduce their environmental impact. Built with modern web technologies and powered by advanced AI models, it provides accurate EPA-based carbon calculations and personalized sustainability insights.

---

## 🔗 Live Demo

🚀 **Try it now**: [carbon-tracker-delta.vercel.app](https://carbon-tracker-delta.vercel.app/)

This deployed version showcases EcoTracker's full functionality including AI-powered activity logging, dashboard visualizations, personalized insights, and carbon offset marketplace — all in a smooth, responsive interface. You can explore the app in **demo mode** or sign up for full access.

---

## 🏗️ Technical Architecture

### 🖥️ Frontend

- **Next.js 14** with App Router
- **React 18** with Server Components
- **TypeScript** – Type-safe development
- **Tailwind CSS** – Utility-first styling
- **shadcn/ui** – Component library

### 🗄️ Backend & Database

- **Supabase (PostgreSQL)** – Real-time database
- **Row Level Security (RLS)** – Secure user data
- **Database Triggers** – Auto calculations
- **Live Subscriptions** – Real-time updates

### 🤖 AI Integration

Powered by the **Groq AI Platform** with multiple LLMs:
- `Llama 3.3 70B Versatile` – Complex analysis
- `Llama 3.1 8B Instant` – Fast lightweight tasks
- `Gemma2 9B IT` – General purpose operations

---

## 🔐 Authentication & Security

- Supabase Auth (Email/Password)
- JWT tokens for session control
- CORS and HTTP security headers
- Environment variables for sensitive keys

---

## 📱 Feature Overview

- **Authentication**: Sign in / up, secure demo mode
- **Dashboard**: Daily/monthly emissions, eco points, charts
- **Activity Tracker**: 4 categories, smart inputs, real-time CO₂
- **AI Green Scanner**: Scan or describe items for AI analysis
- **AI Coach**: Personalized sustainability insights and weekly reports
- **Social Challenges**: Individual and community-based goals
- **Carbon Offset Marketplace**: Verified environmental projects
- **Leaderboard**: Live eco-points ranking
- **Achievements & Rewards**: Streaks, goals, certificates
- **Goal Management**: AI-recommended sustainability goals

---

## 🧠 AI Insight Flow Example

```ts
// Emission Calculation
const calculateEmissions = (type, activity, amount, unit) => {
  const factor = getEmissionFactor(type, activity)
  const converted = convertUnits(amount, unit)
  return converted * factor
}
````

```ts
// Insight Generation Prompt
`You are an environmental coach. Based on:
User Stats: ${stats}
Activity Logs: ${logs}
Give 3-5 insights with:
- Behavioral patterns
- Actionable tips
- Reinforcement`
```

---

## 🚀 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/ecotracker.git
cd ecotracker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
AI_API_KEY=your_groq_or_llm_key
```

### 4. Run the App

```bash
npm run dev
```

---

## 🛠️ Tech Stack

* **Next.js**, **React**, **TypeScript**
* **Supabase**, **PostgreSQL**
* **Tailwind CSS**, **shadcn/ui**
* **Groq AI / Llama / Gemma Models**
* **Recharts**, **Lucide Icons**

---

## 🙌 Contributions

We welcome contributions to improve EcoTracker! Fork the repo, make your changes, and submit a PR.

---

## 📄 License

[MIT License](LICENSE)

---

## 📬 Contact

For questions or collaborations:
**Anandhu Biju** – [LinkedIn](https://www.linkedin.com/in/anandhubiju)

---


