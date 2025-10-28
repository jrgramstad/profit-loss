# P&L Transaction Manager - Phase 1A

A comprehensive profit and loss transaction management application built with Supabase, optimized for handling 7,600+ transactions with efficient data migration and property assignment workflows.

## Overview

This application provides three core features:
1. **JSON Import** - Bulk import transactions from backup files with batch processing and duplicate detection
2. **Property Assignment** - Efficiently assign properties to transactions with bulk operations (PRIMARY FOCUS)
3. **All Transactions View** - View, filter, and export transaction data

## Features

### JSON Import Screen
- Upload and preview JSON backup files
- Shows transaction count and sample data
- Automatic duplicate detection (matches on date + description + amount)
- Batch import processing (100 transactions at a time for performance)
- Progress tracking during import with percentage complete
- Results summary showing imported and skipped transactions
- Preserves original transaction IDs for data integrity
- Optimized for large datasets (7,600+ transactions)

**JSON Format:**
```json
{
  "transactions": [
    {
      "id": "import_1758909543969_4",
      "date": "2025-08-30T05:00:00.000Z",
      "description": "SHOPIFY* 411707955",
      "amount": 1.08,
      "type": "cash-flow",
      "category": "financing-activities",
      "property": "General/Corporate",
      "job": 57,
      "account": "",
      "transactionType": "business",
      "source": "import",
      "created": "2025-10-10T14:12:04.795Z",
      "modified": "2025-10-10T14:12:04.795Z"
    }
  ]
}
```

### Property Assignment Screen (Primary Workflow)
- **Default landing screen** - Opens directly on page load
- Progress indicator: "X of Y transactions need property assignment"
  - Example: "6,109 of 7,661 transactions need property assignment"
- **Unassigned Definition**: NULL, empty string, OR "General/Corporate"
- Filter transactions by:
  - Property (default: "Unassigned")
  - Category (loaded dynamically from transactions)
  - Date range (All Time, This Year, Last Year, Custom)
  - Account (loaded dynamically from transactions)
  - Transaction Type (Business/Personal)
- Bulk selection with "Select All Visible" (selects current page)
- One-click property assignment for multiple transactions
- Batch updates for performance (handles hundreds of selections)
- Real-time updates and confirmation dialogs
- Sortable columns (Date, Description, Amount, Category, Account, Property)
- Server-side pagination (50 rows per page)
- Selected count indicator
- Long descriptions truncated with hover tooltip

### All Transactions View
- Search functionality (searches descriptions)
- Multiple filter options:
  - Property (includes "Unassigned" option)
  - Category
  - Date range (default: This Year)
  - Transaction Type
- Sortable columns
- CSV export with current filters applied
- Server-side pagination (100 rows per page)
- Transaction count display
- Shows "Unassigned" for NULL/empty/General-Corporate properties

## Technology Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL database)
- **Deployment**: Netlify (configured with netlify.toml)
- **Authentication**: Supabase Row Level Security
- **Performance**: Server-side pagination, batch operations, debounced search

## Prerequisites

1. Supabase account and project
2. The following Supabase table must exist:
   - `properties` (with columns: name, active, sort_order)
3. Categories and accounts are loaded dynamically from `pl_transactions` table

## Installation

### 1. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Navigate to database directory
cd pl-tracker/database

# Copy the contents of schema.sql and run in Supabase SQL Editor
# Or use the Supabase CLI:
supabase db push
```

The schema creates:
- `pl_transactions` table with all necessary columns and indexes
- Support for 'income', 'expense', and 'cash-flow' transaction types
- Row Level Security (RLS) policies
- Indexes for performance optimization on large datasets

**Table Schema:**
```sql
CREATE TABLE pl_transactions (
  id SERIAL PRIMARY KEY,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL,  -- 'income', 'expense', 'cash-flow'
  category TEXT,
  property TEXT,
  job TEXT,
  account TEXT,
  transaction_type TEXT NOT NULL,  -- 'business' or 'personal'
  source TEXT,
  original_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Configure Supabase Connection

The application is pre-configured to use the AJ Real Estate System Supabase instance. If you need to use a different Supabase project:

1. Open `frontend/config.js`
2. Update the Supabase URL and anon key:

```javascript
const config = {
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

### 3. Deploy to Netlify

The app includes automatic Netlify configuration via `netlify.toml`.

#### Option A: Git Deployment (Recommended)
1. Push your code to a Git repository
2. Connect the repository to Netlify
3. Netlify will automatically detect `netlify.toml` settings:
   - **Base directory**: `pl-tracker/frontend`
   - **Build command**: (empty - static site)
   - **Publish directory**: `.`
4. Click "Deploy site"

#### Option B: Netlify CLI
```bash
cd pl-tracker/frontend
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

#### Option C: Drag and Drop
1. Go to https://app.netlify.com/drop
2. Drag the `pl-tracker/frontend` folder onto the page

### 4. Local Development

To run locally:

```bash
cd pl-tracker/frontend

# Option 1: Python
python -m http.server 8000

# Option 2: Node.js http-server
npx http-server -p 8000

# Option 3: PHP
php -S localhost:8000
```

Then open http://localhost:8000 in your browser.

## Usage Guide

### Initial Data Migration

1. **Export from your current system** to JSON format
2. **Navigate to Import JSON screen**
3. Click "Choose JSON File" and select your backup file
4. Review the preview showing:
   - Total transaction count
   - Sample transaction structure
   - First 10 transactions in table format
5. Click "Import Transactions"
6. Confirm the import
7. Wait for batch processing to complete (shows progress percentage)
8. Review results: "X transactions imported, Y duplicates skipped"

**Performance Note**: 7,661 transactions import in approximately 2-3 minutes with batch processing.

### Assigning Properties (Primary Workflow)

The app opens directly to the Property Assignment screen showing:
- **Progress**: "6,109 of 7,661 transactions need property assignment"

**Workflow:**
1. **Filter** to find specific transactions:
   - Default shows "Unassigned" (NULL, empty, or General/Corporate)
   - Add category filter (e.g., "property-utilities")
   - Add date range or account filters as needed

2. **Select** transactions to assign:
   - Check individual transaction checkboxes, OR
   - Click "Select All Visible" to select all 50 on current page
   - Status shows: "X transactions selected"

3. **Assign** property:
   - Choose property from "Assign selected to:" dropdown
   - Click "Assign Property" button (large, green, prominent)
   - Confirm: "Assign X transactions to [Property Name]?"
   - Click "Confirm"

4. **Repeat** for remaining transactions:
   - Progress updates automatically
   - Selections clear after assignment
   - Table refreshes to show updated data

**Tips for Efficiency:**
- Work through one category at a time
- Use "Select All Visible" for bulk operations
- Watch the progress indicator to track completion
- All 50 visible transactions can be assigned at once

### Viewing and Exporting Transactions

1. **Navigate to "All Transactions" screen**
2. **Apply filters:**
   - Search by description (debounced for performance)
   - Filter by property (includes "Unassigned" option)
   - Filter by category, type, or date range
   - Default shows "This Year" transactions
3. **Sort** by clicking column headers
4. **Export** current filtered view:
   - Click "Export CSV" button
   - All matching transactions export (not just current page)
   - File downloads as `pl-transactions-YYYY-MM-DD.csv`

## Performance Optimizations

This app is optimized for handling 7,600+ transactions:

1. **Server-Side Pagination**: Only loads 50-100 transactions at a time
2. **Batch Imports**: Processes 100 transactions per batch during import
3. **Batch Updates**: Updates multiple transactions in a single database call
4. **Debounced Search**: Delays search queries until user stops typing
5. **Indexed Queries**: Database indexes on date, property, category, type
6. **Progress Indicators**: Shows loading states during long operations
7. **Efficient Queries**: Uses Supabase query optimization

## Database Schema

### pl_transactions Table

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | SERIAL | No | Primary key |
| transaction_date | DATE | No | Transaction date |
| description | TEXT | No | Transaction description |
| amount | NUMERIC(10,2) | No | Transaction amount |
| type | TEXT | No | 'income', 'expense', or 'cash-flow' |
| category | TEXT | Yes | Transaction category |
| property | TEXT | Yes | Assigned property |
| job | TEXT | Yes | Legacy field from migration |
| account | TEXT | Yes | Account name |
| transaction_type | TEXT | No | 'business' or 'personal' |
| source | TEXT | Yes | Data source |
| original_id | TEXT | Yes | Original ID from backup |
| created_at | TIMESTAMP | No | Record creation time |
| modified_at | TIMESTAMP | No | Last modification time |

**Indexes:**
- `idx_pl_transactions_date` - On transaction_date
- `idx_pl_transactions_property` - On property
- `idx_pl_transactions_category` - On category
- `idx_pl_transactions_type` - On transaction_type

## Unassigned Transaction Logic

"Unassigned" transactions are defined as those where property:
- IS NULL, OR
- Equals empty string '', OR
- Equals 'General/Corporate'

This definition is used consistently across:
- Property Assignment screen filters
- All Transactions view filters
- Progress indicator calculations
- Property display (shows "Unassigned" label)

## Security

The application uses Supabase Row Level Security (RLS). The default policy allows all operations for authenticated users.

**To customize security:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Modify the `pl_transactions` table policies
3. Create user roles and permissions as needed

## Troubleshooting

### Import Issues

**Problem:** "Invalid JSON format: missing 'transactions' array"
- **Solution:** Ensure JSON has `{"transactions": [...]}` structure
- Check file is valid JSON (use a JSON validator)

**Problem:** Import is slow or times out
- **Solution:** This is normal for 7,600+ transactions
- Batch processing shows progress (100 transactions per batch)
- Expected time: 2-3 minutes for 7,661 transactions
- Don't close browser during import

**Problem:** High duplicate count
- **Solution:** This is normal if re-importing the same data
- Duplicates are skipped automatically based on date + description + amount
- Check `original_id` field to verify successful imports

### Property Assignment Issues

**Problem:** No transactions show in Property Assignment screen
- **Solution:** Check that you've imported transactions first
- Try changing filters (date range, transaction type)
- Check browser console for errors

**Problem:** "Unassigned" filter shows 0 transactions
- **Solution:** All transactions may already be assigned
- Check progress indicator
- Try "All" property filter to see all transactions

**Problem:** Bulk assignment button is disabled
- **Solution:**
  1. Select at least one transaction (checkbox)
  2. Choose a property from "Assign selected to:" dropdown
  - Both are required to enable button

### Performance Issues

**Problem:** App is slow or unresponsive
- **Solution:** Check number of transactions in database
- App is optimized for 7,600+ but may slow with 50,000+
- Clear browser cache
- Check Supabase performance in dashboard

**Problem:** Categories or accounts not loading
- **Solution:** Ensure transactions exist in database
- Categories/accounts load from transaction data
- Check browser console for errors
- Verify Supabase connection

## Data Migration Workflow

Recommended workflow for migrating from existing system:

1. **Export from current system** to JSON format
   - Structure: `{"transactions": [...]}`
   - Include all fields: id, date, description, amount, type, category, property, etc.

2. **Import to application**
   - Use Import JSON screen
   - Review preview before importing
   - Monitor progress bar
   - Note: 7,600+ transactions take 2-3 minutes

3. **Assign properties**
   - App lands on Property Assignment screen
   - Shows: "6,109 of 7,661 need assignment" (example)
   - Filter by category to group similar transactions
   - Use bulk selection for efficiency
   - Work through categories systematically

4. **Verify data**
   - Use All Transactions view
   - Check property assignments
   - Export to CSV for verification
   - Compare counts with original data

## Limitations (Phase 1A)

This is Phase 1A focusing on import and assignment. The following features are NOT included:

- ❌ Manual transaction entry form
- ❌ Editing existing transactions
- ❌ Deleting transactions
- ❌ P&L reports and analytics
- ❌ User authentication UI
- ❌ Multi-user access control
- ❌ Job field usage (kept for data migration only)

## Project Structure

```
pl-tracker/
├── database/
│   └── schema.sql          # Database schema with indexes
├── frontend/
│   ├── index.html          # 3-screen app structure
│   ├── styles.css          # Professional UI design
│   ├── app.js              # Application logic (1,270+ lines)
│   ├── config.js           # Supabase configuration
│   └── _redirects          # Netlify SPA routing
├── netlify.toml            # Netlify configuration
├── DEPLOYMENT.md           # Deployment troubleshooting guide
└── README.md               # This file
```

## Success Criteria

✅ Import 7,661 transactions from JSON backup without data loss
✅ See "6,109 of 7,661 need property assignment" on landing
✅ Filter to transactions with blank/unassigned property field
✅ Bulk select 50 transactions, assign to property efficiently
✅ Track progress as assignments are made
✅ View and filter all 7,661 transactions
✅ Export filtered data to CSV
✅ Handle 7,600+ transactions with smooth performance

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review DEPLOYMENT.md for deployment issues
3. Check Supabase logs in dashboard
4. Check browser console for JavaScript errors
5. Verify database schema is correctly applied

## Future Enhancements (Not in Phase 1A)

- Transaction editing and deletion
- P&L reports by property
- Income/expense analytics by category
- Budget tracking
- Recurring transaction templates
- Multi-user collaboration
- Mobile app
- Dashboard with charts

## Version

Phase 1A - Initial Release
**Focus**: JSON Import, Property Assignment, Transaction Viewing
**Optimized for**: 7,600+ transactions with batch processing and server-side pagination
**Default Screen**: Property Assignment (primary workflow)

## License

Proprietary - AJ Real Estate System
