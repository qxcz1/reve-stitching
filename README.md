🧵 Reve Stitching — Official Website
Reve Stitching
Made with Astro
TailwindCSS
Supabase
Vercel

🌐 Live Website
revestitching.com

🏭 About Reve Stitching
Reve Stitching (Pvt.) Ltd. is a leading 100% export-oriented knitted garment manufacturer strategically located in Faisalabad, Pakistan — the heart of the textile industry.

✨ Key Highlights
Metric	Value
🏭 Monthly Capacity	300,000+ garments
⚙️ Modern Machines	150+ units
📅 Established	2019
✅ Compliance	SEDEX Certified
🎯 Quality Standards	AQL 1.5 – 4.0
🌍 Market Focus	100% Export (UK, EU)
🎖️ Major Clients	Boohoo, Pull&Bear, Yours Clothing
🛠️ Tech Stack
Technology	Purpose
Astro 5	Static site generator with SSR support
Tailwind CSS	Utility-first CSS framework
GSAP	Professional-grade animations
Lenis	Smooth scroll library
Supabase	PostgreSQL database + file storage
Resend	Transactional email service
GitHub Models	AI-powered features (GPT-4o)
Vercel	Hosting & deployment
Discord	Real-time notifications
✨ Features
🎯 For Buyers
Instant Price Calculator — Get rough estimates in seconds (USD/GBP)
Smart Quote Wizard — 5-step guided quote request with AI analysis
AI Tech Pack Analysis — Upload images, AI extracts product specs
Live Chat Widget — AI-powered bot with human handoff
WhatsApp Integration — Click-to-chat for instant contact
Product Catalog — Browse 8 product categories with detailed specs
Fabric Portfolio — View all available fabric types and GSM ranges
🔧 For Admin Team
Admin Dashboard — Real-time stats and quote management
Quote Management — View, filter, assign, and track all inquiries
AI Insights — Auto-generated price estimates and action items
Live Chat Management — Handle customer conversations in real-time
Contact Management — Track all form submissions
File Downloads — Access tech packs and reference images
WhatsApp Quick Reply — Message buyers directly from admin panel
🤖 AI-Powered
Price Estimation — AI analyzes specs and suggests pricing
Tech Pack Analysis — Extracts product details from uploaded files
Missing Info Detection — Flags incomplete quote requests
Action Items Generation — Creates tasks for sales team
Chatbot — Answers common questions 24/7
📁 Project Structure
text

reve-stitching/
├── public/
│   ├── favicon.svg
│   └── images/
│       ├── products/
│       ├── team/
│       ├── clients/
│       └── certifications/
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ChatWidget.astro          # Live chat widget
│   │   ├── QuoteWizard.astro         # 5-step quote form
│   │   ├── PriceCalculator.astro     # Instant price calculator
│   │   ├── WhatsAppWidget.astro      # WhatsApp click-to-chat
│   │   ├── StatsBar.astro
│   │   ├── BentoGrid.astro
│   │   ├── ProcessSteps.astro
│   │   ├── ProductCard.astro
│   │   ├── TimelineItem.astro
│   │   ├── FAQ.astro
│   │   └── admin/
│   │       └── WhatsAppContactButton.astro
│   ├── layouts/
│   │   ├── Layout.astro              # Main layout
│   │   └── AdminLayout.astro         # Admin panel layout
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client
│   │   ├── pricing.ts                # Price calculation engine
│   │   ├── notifications.ts          # Email + Discord helpers
│   │   ├── types/
│   │   │   └── quote.ts              # TypeScript types
│   │   └── services/
│   │       ├── storage.ts            # File upload helpers
│   │       ├── ai-summary.ts         # AI price estimation
│   │       ├── techpack-analyzer.ts  # AI tech pack analysis
│   │       └── whatsapp-links.ts     # WhatsApp URL builders
│   ├── pages/
│   │   ├── index.astro               # Homepage
│   │   ├── about.astro               # Company info
│   │   ├── products.astro            # Product catalog
│   │   ├── clients.astro             # Client portfolio
│   │   ├── contact.astro             # Contact page
│   │   ├── quote.astro               # Quote request page
│   │   ├── admin/
│   │   │   ├── index.astro           # Dashboard
│   │   │   ├── login.astro           # Admin login
│   │   │   ├── logout.ts             # Logout handler
│   │   │   ├── quotes/
│   │   │   │   ├── index.astro       # Quote list
│   │   │   │   └── [id].astro        # Quote detail
│   │   │   └── chat/
│   │   │       └── [id].astro        # Live chat admin view
│   │   └── api/
│   │       ├── contact.ts
│   │       ├── quote/
│   │       │   └── submit.ts         # Quote submission endpoint
│   │       ├── chat/
│   │       │   ├── bot.ts            # AI chatbot
│   │       │   ├── session.ts        # Chat session management
│   │       │   ├── send.ts           # Send message
│   │       │   ├── poll.ts           # Poll for new messages
│   │       │   ├── heartbeat.ts      # Keep session alive
│   │       │   └── close.ts          # End session
│   │       ├── auth/
│   │       │   ├── login.ts          # Admin login
│   │       │   └── logout.ts         # Admin logout
│   │       └── admin/
│   │           ├── contact-status.ts # Update contact status
│   │           └── dashboard-stats.ts # Dashboard metrics
│   ├── scripts/
│   │   └── animations.js             # GSAP animations
│   └── styles/
│       └── global.css                # Global styles
├── astro.config.mjs                  # Astro configuration
├── tailwind.config.mjs               # Tailwind configuration
├── package.json
└── README.md
🚀 Quick Start
Prerequisites
Node.js 18+
npm or yarn
Supabase account (for database)
Resend account (optional, for emails)
GitHub account (for AI features)
Installation
Bash

# Clone the repository
git clone https://github.com/qxcz1/reve-stitching.git

# Navigate to project directory
cd reve-stitching

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Start development server
npm run dev
Available Commands
Command	Action
npm run dev	Start local dev server at localhost:4321
npm run build	Build production site to ./dist/
npm run preview	Preview build locally before deploying
🔐 Environment Variables
Create a .env file in the root directory:

env

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SUPABASE (Database & Storage)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ADMIN AUTHENTICATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADMIN_JWT_SECRET=your-secret-key-min-32-chars

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# AI (GitHub Models)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GITHUB_TOKEN=ghp_your_github_token

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# EMAIL NOTIFICATIONS (Resend)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESEND_API_KEY=re_your_api_key

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# DISCORD NOTIFICATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WHATSAPP (Click-to-Chat Only)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PUBLIC_WHATSAPP_NUMBER=923329555786
WHATSAPP_BUSINESS_NUMBER=923329555786
WHATSAPP_DISPLAY_NAME=Reve Stitching Sales
📊 Database Setup
Supabase Tables
1. quote_requests — Quote submissions
SQL

CREATE TABLE quote_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  product_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  fabric_type TEXT,
  gsm INTEGER,
  sizes TEXT[],
  color_count INTEGER,
  customizations TEXT[],
  destination TEXT,
  target_date DATE,
  has_sample BOOLEAN,
  is_rush BOOLEAN,
  notes TEXT,
  tech_pack_url TEXT,
  reference_images TEXT[],
  ai_summary TEXT,
  estimated_price_range TEXT,
  suggested_moq INTEGER,
  ai_flags TEXT,
  ai_extracted_data JSONB,
  ai_confidence_score DECIMAL(3,2),
  ai_missing_fields TEXT[],
  action_items JSONB,
  status TEXT DEFAULT 'new',
  assigned_to TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
2. chat_sessions — Live chat data
SQL

CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  visitor_name TEXT,
  visitor_email TEXT,
  messages JSONB DEFAULT '[]'::JSONB,
  status TEXT DEFAULT 'active',
  assigned_admin TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW()
);
3. contact_submissions — Contact form entries
SQL

CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  product TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
📦 Products We Manufacture
Premium Cotton T-Shirts — 100% combed cotton, SGS certified, MOQ 500
Corporate Polo Shirts — Pique cotton, embroidery-ready, MOQ 300
Premium Hoodies — Terry fleece, brushed interior, MOQ 250
Athletic Joggers — Moisture management fabric, MOQ 400
Sweatshirts Collection — Double jersey, fleece options, MOQ 350
Ladies' Wear — Modal blends, lycra rib, MOQ 300
Kids' Wear — Skin-friendly, certified safe dyes, MOQ 500
Specialized Fabrics — Lurex, burnout, metallic blends, MOQ 200
💰 Pricing Features
Instant Price Calculator
7 Product Categories — T-shirts, Polos, Hoodies, Joggers, etc.
Volume Discounts — Up to 42% savings at 5,000+ pieces
Dual Currency — Auto-detects UK visitors (shows GBP), others see USD
Currency Toggle — 🇺🇸 USD / 🇬🇧 GBP switcher
Real-Time Updates — Prices recalculate as user changes options
Lead Time Display — 25-50 days depending on quantity
Customization Costs — Screen print, embroidery, DTG, custom labels
Example Calculation:
Product: Premium Hoodies
Quantity: 1,000 pieces
Fabric: Terry Fleece (320 GSM)
Customization: Embroidery + Custom Labels
Result: $13,500 - $21,500 (£10,665 - £16,985)
Lead Time: 35-40 days
🏆 Certifications & Compliance
<p align="center"> <img src="https://img.shields.io/badge/SEDEX-Compliant-166534?style=flat-square" alt="SEDEX" /> <img src="https://img.shields.io/badge/SGS-Trained-166534?style=flat-square" alt="SGS" /> <img src="https://img.shields.io/badge/BCI-Member-166534?style=flat-square" alt="BCI" /> <img src="https://img.shields.io/badge/GOTS-Certified-166534?style=flat-square" alt="GOTS" /> <img src="https://img.shields.io/badge/ISO%209001-2015-166534?style=flat-square" alt="ISO" /> <img src="https://img.shields.io/badge/GRS-Certified-166534?style=flat-square" alt="GRS" /> </p>
🚢 Deployment
Vercel (Current)
Bash

# Automatic deployment on git push
git add .
git commit -m "Your commit message"
git push

# Vercel auto-builds and deploys
Live URL: revestitching.com
Environment Variables: Configured in Vercel Dashboard
📈 Performance
Lighthouse Score: 95+ (Desktop), 90+ (Mobile)
First Contentful Paint: < 1.5s
Time to Interactive: < 3s
SEO Score: 100
Accessibility Score: 95+
📞 Contact & Support
Reve Stitching (Pvt.) Ltd.
📍 Address: Chak No. 196/R.B, Ghona Road, Faisalabad (38000), Pakistan
📧 Email: info@revestitching.com
📞 Phone: +92 41 8548041
💬 WhatsApp: +92 332 9555786
🌐 Website: revestitching.com
📄 License
© 2026 Reve Stitching (Pvt.) Ltd. All rights reserved.

Website designed & developed with ❤️ using AI-assisted development.

🛣️ Development Roadmap
✅ Completed (Phase 1)
✅ Modern responsive website with animations
✅ Product catalog with detailed specifications
✅ Contact form with email notifications
✅ Admin panel with authentication
✅ Live chat widget with AI bot
✅ Quote wizard with file uploads
✅ AI-powered price estimation
✅ AI tech pack analysis
✅ WhatsApp integration (click-to-chat)
✅ Price calculator with dual currency
✅ Auto-currency detection for UK visitors
🔄 In Progress (Phase 2)
🔄 Quote Wizard pre-fill from Price Calculator
🔄 Enhanced admin analytics dashboard
🔄 Email template customization
🔄 Multi-language support (Urdu)
🔮 Planned (Phase 3)
🔮 Client portal (order tracking)
🔮 Automated follow-up emails
🔮 Sample request system
🔮 Production timeline tracker
🔮 Invoice generation
🔮 Inventory management integration
<p align="center"> <strong>🌿 Committed to Sustainable & Ethical Manufacturing 🌿</strong> </p><p align="center"> <sub>Built with Astro • Powered by AI • Deployed on Vercel</sub> </p>