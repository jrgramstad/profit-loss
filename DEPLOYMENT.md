# Deployment Guide - P&L Transaction Manager

## Netlify Deployment (Recommended)

### Method 1: GitHub Integration (Automatic)

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"

2. **Connect GitHub**
   - Choose "Deploy with GitHub"
   - Select repository: `jrgramstad/profit-loss`
   - Choose branch: `claude/session-011CUZnzcXahcqsGiLe9wHXM`

3. **Build Settings** (These should auto-populate from netlify.toml)
   ```
   Base directory: pl-tracker/frontend
   Build command: (leave empty)
   Publish directory: . (dot means current directory)
   ```

4. **Deploy!**
   - Click "Deploy site"
   - Wait 30-60 seconds for deployment
   - Your site will be live at: `https://[random-name].netlify.app`

### Method 2: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to frontend directory
cd pl-tracker/frontend

# Deploy
netlify deploy --prod
```

### Method 3: Drag & Drop

1. Open https://app.netlify.com/drop
2. Drag the `pl-tracker/frontend` folder onto the page
3. Done! Site is live immediately

---

## Troubleshooting Deployment Issues

### Issue: "Page Not Found" or 404 Error

**Cause**: Netlify isn't using the correct base directory

**Solution**:
1. Go to Netlify Dashboard → Site Settings → Build & Deploy
2. Set these values:
   - Base directory: `pl-tracker/frontend`
   - Publish directory: `.`
3. Clear cache and redeploy

### Issue: Blank Page / White Screen

**Cause**: JavaScript not loading or Supabase connection issue

**Solution**:
1. Open browser console (F12) and check for errors
2. Common errors:
   - **CORS Error**: Normal - Supabase needs database schema applied first
   - **404 on files**: Check Base directory setting
   - **Supabase connection error**: Apply database schema (see below)

### Issue: "Supabase Error" or Data Not Loading

**Cause**: Database schema not applied yet

**Solution**:
1. Go to Supabase Dashboard: https://app.supabase.com/
2. Select your project
3. Go to SQL Editor
4. Copy entire contents of `pl-tracker/database/schema.sql`
5. Paste and click "Run"
6. Refresh your Netlify site

### Issue: Site Shows Old Version

**Solution**:
1. Go to Netlify Dashboard
2. Click "Deploys"
3. Click "Trigger deploy" → "Clear cache and deploy site"

---

## Verifying Deployment

### 1. Check Site is Live
- Visit your Netlify URL
- You should see: "P&L Transaction Manager" header
- Three navigation buttons: Import CSV, Property Assignment, All Transactions

### 2. Check Browser Console
- Press F12 to open developer tools
- Go to Console tab
- You should see: "Initializing application..."
- If you see errors about Supabase, that's normal until schema is applied

### 3. Test Database Connection

**Before applying schema**: You'll see errors like:
- "relation 'pl_transactions' does not exist"
- "relation 'properties' does not exist"

**After applying schema**:
- No errors in console
- "Loading transactions..." messages work
- Dropdowns populate with data

---

## Post-Deployment Setup

### Step 1: Apply Database Schema

```sql
-- Go to Supabase SQL Editor and run:
-- Copy all contents from pl-tracker/database/schema.sql
```

### Step 2: Add Sample Properties (if needed)

```sql
-- If you don't have properties table, create it:
CREATE TABLE properties (
  name TEXT PRIMARY KEY,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Add sample properties:
INSERT INTO properties (name, active, sort_order) VALUES
  ('Property A', true, 1),
  ('Property B', true, 2),
  ('Property C', true, 3);
```

### Step 3: Add Sample Categories (if needed)

```sql
-- If you don't have categories table, create it:
CREATE TABLE categories (
  name TEXT PRIMARY KEY,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Add sample categories:
INSERT INTO categories (name, active, sort_order) VALUES
  ('Rent', true, 1),
  ('Utilities', true, 2),
  ('Maintenance', true, 3),
  ('Insurance', true, 4);
```

### Step 4: Test CSV Import

1. Create a test CSV file:
```csv
id,date,description,amount,type,category,property,job,account,transactionType,source,created,modified
1,2024-01-15,Test Transaction,100.00,income,Rent,,,,business,test,2024-01-15,2024-01-15
```

2. Go to Import CSV screen
3. Upload the test file
4. Click Import
5. Verify import was successful

---

## Netlify Configuration Files

### netlify.toml (Root of repository)
Located at: `/netlify.toml`

This file tells Netlify:
- Where to find your app (`pl-tracker/frontend`)
- How to handle routing (SPA fallback)
- Security headers

### _redirects (Inside frontend folder)
Located at: `pl-tracker/frontend/_redirects`

Backup routing configuration for single-page app.

---

## Custom Domain Setup (Optional)

1. **In Netlify Dashboard**:
   - Go to Site Settings → Domain Management
   - Click "Add custom domain"
   - Enter your domain (e.g., `pl-manager.yourdomain.com`)

2. **In Your DNS Provider**:
   - Add CNAME record:
     - Name: `pl-manager` (or `@` for root domain)
     - Value: `[your-site-name].netlify.app`

3. **Enable HTTPS**:
   - Netlify automatically provisions SSL certificate
   - Force HTTPS redirect (recommended)

---

## Continuous Deployment

Once GitHub is connected to Netlify:

✅ **Push to GitHub** → Automatic deployment
✅ **New commits** → Auto-rebuild
✅ **Preview URLs** → Each branch gets its own URL

To trigger manual deploy:
1. Netlify Dashboard → Deploys
2. "Trigger deploy" → "Deploy site"

---

## Monitoring

### Check Deployment Logs
1. Netlify Dashboard → Deploys
2. Click on latest deploy
3. View deploy log for any errors

### Check Function Logs
1. Netlify Dashboard → Functions
2. (Not applicable - this is static site)

### Check Analytics
1. Netlify Dashboard → Analytics
2. Enable Netlify Analytics (paid) for detailed stats

---

## Need Help?

### Common Questions:

**Q: Site shows blank page**
A: Check browser console (F12). Apply database schema in Supabase.

**Q: "Page Not Found" on refresh**
A: _redirects file handles this. Make sure it's in frontend folder.

**Q: Can't import CSV**
A: Database schema must be applied first.

**Q: Properties dropdown is empty**
A: Add properties to Supabase using SQL in "Post-Deployment Setup" above.

**Q: How do I update the site?**
A: Just push changes to GitHub - Netlify auto-deploys!

---

## Deployment Checklist

Before going live:

- [ ] Database schema applied in Supabase
- [ ] Properties table populated
- [ ] Categories table populated
- [ ] Test CSV import works
- [ ] Test property assignment works
- [ ] Test export CSV works
- [ ] All filters working
- [ ] Site accessible from Netlify URL
- [ ] No errors in browser console
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Netlify deploy logs
3. Verify Supabase schema is applied
4. Check this troubleshooting guide

Your app should now be live at: `https://[your-site].netlify.app`
