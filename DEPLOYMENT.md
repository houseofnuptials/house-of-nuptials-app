# House of Nuptials — Web App
## Complete Deployment Guide

---

## What you have

A full React web app with:
- User sign up, login, and password reset
- Personalised countdown dashboard
- Interactive phase-by-phase planning checklist
- Budget tracker with category breakdown
- Supplier tracker with status filtering
- Profile screen with upgrade flow
- Stripe subscription payments (monthly, annual, lifetime)
- Supabase backend with user accounts and saved data
- Free vs Premium feature gating

---

## Step 1 — Set up Supabase (15 minutes)

**Supabase is your database and user account system. It's free.**

1. Go to **supabase.com** and click "Start your project"
2. Sign up and create a new organisation
3. Click "New project"
4. Give it a name: `house-of-nuptials`
5. Choose a database password (save this somewhere safe)
6. Choose region: **Europe West** (Ireland) for UK users
7. Click "Create new project" and wait ~2 minutes for it to provision

**Run the database schema:**
1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click "New query"
3. Open the file `supabase-schema.sql` from this project folder
4. Copy the entire contents and paste into the SQL editor
5. Click **Run** (or press Cmd+Enter)
6. You should see "Success. No rows returned" — this means it worked

**Get your API keys:**
1. In Supabase, go to **Settings → API**
2. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Copy the **anon / public** key (long string starting with `eyJ...`)
4. Keep these — you'll need them in Step 3

---

## Step 2 — Set up Stripe (20 minutes)

**Stripe handles your subscription payments. Free to set up.**

1. Go to **stripe.com** and create an account
2. Complete your business profile (House of Nuptials, UK)

**Create your products:**
1. Go to **Products** in your Stripe dashboard
2. Click "Add product" and create three products:

| Product Name | Price | Type |
|---|---|---|
| House of Nuptials Premium — Monthly | £12.99 | Recurring monthly |
| House of Nuptials Premium — Annual | £79.99 | Recurring yearly |
| House of Nuptials — Lifetime Access | £149.00 | One time |

3. After creating each product, click into it and copy the **Price ID**
   (looks like `price_1234AbCdEfGh...`)
4. Save all three Price IDs — you'll need them in Step 3

**Get your API keys:**
1. Go to **Developers → API Keys**
2. Copy the **Publishable key** (starts with `pk_test_` for test mode)
3. Copy the **Secret key** (starts with `sk_test_`) — keep this secret

> Start with test keys. You'll switch to live keys (`pk_live_`, `sk_live_`) 
> only when you're ready to take real payments.

---

## Step 3 — Configure environment variables (5 minutes)

1. In the project folder, find the file called `.env.example`
2. Make a copy of it and rename the copy to `.env.local`
3. Open `.env.local` and fill in all the values:

```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...your-anon-key...
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_STRIPE_PRICE_MONTHLY=price_...
REACT_APP_STRIPE_PRICE_ANNUAL=price_...
REACT_APP_STRIPE_PRICE_LIFETIME=price_...
REACT_APP_URL=http://localhost:3000
```

> `.env.local` is listed in `.gitignore` so it will never be 
> accidentally uploaded to GitHub. Never share these keys publicly.

---

## Step 4 — Run the app locally (5 minutes)

You need Node.js installed. Download it free from **nodejs.org** 
(click the "LTS" version).

Once Node is installed, open **Terminal** (Mac) or **Command Prompt** (Windows):

```bash
# Navigate to the project folder
cd path/to/hon-app

# Install dependencies (only needed once)
npm install

# Start the app
npm start
```

Your browser will open automatically at `http://localhost:3000`

You should see the onboarding screen. Sign up with a test email and 
go through the full flow to check everything works.

**To stop the app:** press `Ctrl + C` in the terminal.

---

## Step 5 — Deploy to Vercel (10 minutes)

**Vercel hosts your app online for free. No server management needed.**

**First, put your code on GitHub:**
1. Go to **github.com** and create a free account if you don't have one
2. Create a new repository called `house-of-nuptials-app`
3. Set it to **Private**
4. In your terminal, from the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/house-of-nuptials-app.git
git push -u origin main
```

**Then deploy on Vercel:**
1. Go to **vercel.com** and sign up with your GitHub account
2. Click "Add New Project"
3. Import your `house-of-nuptials-app` repository
4. Vercel auto-detects it as a React app — no configuration needed
5. Before clicking Deploy, click **"Environment Variables"**
6. Add all the same variables from your `.env.local` file
   (but change `REACT_APP_URL` to your Vercel URL, e.g. `https://house-of-nuptials-app.vercel.app`)
7. Click **Deploy**

After ~2 minutes, your app is live at a Vercel URL.

---

## Step 6 — Deploy Supabase Edge Functions (15 minutes)

The Edge Functions handle Stripe checkout and webhooks.

**Install Supabase CLI:**
```bash
npm install -g supabase
```

**Login and link your project:**
```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
```
(Your project ref is the part of your Supabase URL before `.supabase.co`)

**Set Edge Function secrets:**
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Deploy the functions:**
```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

**Set up the Stripe webhook:**
1. In Stripe Dashboard, go to **Developers → Webhooks**
2. Click "Add endpoint"
3. URL: `https://YOUR-PROJECT-REF.supabase.co/functions/v1/stripe-webhook`
4. Select events: `checkout.session.completed` and `customer.subscription.deleted`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_`)
7. Run: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here`
8. Redeploy: `supabase functions deploy stripe-webhook`

---

## Step 7 — Connect your custom domain (10 minutes)

**In Vercel:**
1. Go to your project → **Settings → Domains**
2. Add `app.houseofnuptials.co.uk`
3. Vercel shows you a CNAME record to add

**In your domain registrar** (wherever you bought houseofnuptials.co.uk):
1. Go to DNS settings
2. Add the CNAME record Vercel gave you
3. Wait 15–60 minutes for it to propagate
4. Vercel automatically adds an SSL certificate (the padlock)

**Update your environment variable:**
In Vercel project settings → Environment Variables, update:
```
REACT_APP_URL=https://app.houseofnuptials.co.uk
```
Then redeploy (Vercel → Deployments → click the three dots → Redeploy).

---

## Step 8 — Go live with real Stripe payments

When you're ready to accept real money:

1. In Stripe, click **"Activate your account"** and complete verification
2. Switch from test mode to live mode (toggle in top-left of Stripe dashboard)
3. Get your **live** API keys (`pk_live_...` and `sk_live_...`)
4. Update in Vercel environment variables:
   - `REACT_APP_STRIPE_PUBLISHABLE_KEY` → your `pk_live_...` key
5. Update Supabase Edge Function secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_your_key_here
   ```
6. Create a new webhook in Stripe (live mode) pointing to your same Edge Function URL
7. Update the webhook secret in Supabase secrets
8. Redeploy both Edge Functions

---

## Connecting to your Shopify store

Once the app is live, update these links on your Shopify site:

- All **"Start Free"** / **"Create Your Free Account"** buttons
  → `https://app.houseofnuptials.co.uk`
- **"Log in"** link for existing users
  → `https://app.houseofnuptials.co.uk/login`

---

## Update your Shopify waitlist page

Replace the coming-soon/waitlist page with a simple redirect or 
a page that links directly to `https://app.houseofnuptials.co.uk`

---

## Troubleshooting

**"Invalid API key" error on sign up**
→ Check your Supabase URL and anon key in `.env.local` are correct

**Tasks/budget not appearing after sign up**
→ Check the Supabase SQL Editor and make sure the schema ran without errors
→ Check the RLS policies are enabled on all tables

**Stripe checkout not working**
→ Make sure the Edge Functions are deployed
→ Check Supabase Edge Function logs: Dashboard → Edge Functions → Logs
→ Verify the STRIPE_SECRET_KEY secret is set correctly

**App not loading on custom domain**
→ Wait up to 1 hour for DNS propagation
→ Check the CNAME record matches exactly what Vercel showed you

**Premium not activating after payment**
→ Check the Stripe webhook is configured correctly
→ Check Edge Function logs for errors
→ Verify STRIPE_WEBHOOK_SECRET matches the signing secret in Stripe

---

## Monthly costs summary

| Service | Cost |
|---|---|
| Vercel (Hobby plan) | Free |
| Supabase (Free tier) | Free until 50,000 monthly active users |
| Stripe | 1.4% + 20p per transaction |
| Custom domain | ~£10-15/year (already owned) |
| **Total** | **~£0/month** until significant scale |

Covered by your first 3 Premium subscribers.

---

## File structure reference

```
hon-app/
├── public/
│   └── index.html              # App shell HTML
├── src/
│   ├── hooks/
│   │   └── useAuth.js          # Authentication context
│   ├── lib/
│   │   ├── supabase.js         # Database helpers
│   │   └── stripe.js           # Stripe helpers
│   ├── pages/
│   │   ├── Onboarding.jsx      # Sign up flow (3 steps)
│   │   ├── Login.jsx           # Login + password reset
│   │   ├── Dashboard.jsx       # Home screen with countdown
│   │   ├── Budget.jsx          # Budget tracker
│   │   ├── Suppliers.jsx       # Supplier tracker
│   │   └── Profile.jsx         # Profile + upgrade
│   ├── styles/
│   │   └── global.css          # All styling
│   ├── App.jsx                 # Routing + app shell
│   └── index.js                # Entry point
├── supabase/
│   └── functions/
│       ├── create-checkout/    # Stripe checkout session
│       └── stripe-webhook/     # Handle payment success
├── supabase-schema.sql         # Run this in Supabase SQL Editor
├── .env.example                # Copy to .env.local and fill in
├── package.json                # Dependencies
└── DEPLOYMENT.md               # This file
```

---

*House of Nuptials · houseofnuptials.co.uk*
*Built by a real bride, for every bride.*
