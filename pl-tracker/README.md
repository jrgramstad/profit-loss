# P&L Transaction Manager - Phase 1A

A comprehensive profit and loss transaction management application built with Supabase and designed for efficient data migration and property assignment workflows.

## Overview

This application provides three core features:
1. **CSV Import** - Bulk import transactions with duplicate detection
2. **Property Assignment** - Efficiently assign properties to transactions with bulk operations
3. **All Transactions View** - View, filter, and export transaction data

## Features

### CSV Import Screen
- Upload and preview CSV files
- Automatic duplicate detection (matches on date + description + amount)
- Progress tracking during import
- Results summary showing imported and skipped transactions
- Preserves original Google Sheets IDs for data integrity

### Property Assignment Screen
- Filter transactions by property, category, date range, account, and type
- Progress indicator showing assignment status
- Bulk selection with "Select All Visible"
- One-click property assignment for multiple transactions
- Real-time updates and confirmation dialogs
- Sortable columns
- Pagination (50 rows per page)

### All Transactions View
- Search functionality for descriptions
- Multiple filter options (property, category, date range, transaction type)
- Sortable columns
- CSV export with current filters applied
- Pagination (100 rows per page)
- Transaction count display

## Technology Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Supabase (PostgreSQL database)
- **Deployment**: Netlify-ready static site
- **Authentication**: Supabase Row Level Security

## Prerequisites

1. Supabase account and project
2. The following Supabase tables must exist:
   - `properties` (with columns: name, active, sort_order)
   - `categories` (with columns: name, active, sort_order)

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
- Row Level Security (RLS) policies
- Indexes for performance optimization

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

#### Option A: Drag and Drop
1. Build the site: Copy the `frontend` folder contents
2. Go to [Netlify](https://app.netlify.com/)
3. Drag and drop the `frontend` folder onto Netlify

#### Option B: Git Deployment
1. Push your code to a Git repository
2. Connect the repository to Netlify
3. Set the build settings:
   - **Base directory**: `pl-tracker/frontend`
   - **Build command**: (leave empty - static site)
   - **Publish directory**: `.`

#### Option C: Netlify CLI
```bash
cd pl-tracker/frontend
npm install -g netlify-cli
netlify deploy --prod
```

### 4. Local Development

To run locally, you can use any static file server:

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

### Importing Transactions

1. Navigate to the **Import CSV** screen
2. Click "Choose CSV File" and select your CSV file
3. Review the preview (first 10 rows)
4. Click "Import Transactions"
5. Confirm the import
6. Review the results summary

**Expected CSV Format:**
```
id,date,description,amount,type,category,property,job,account,transactionType,source,created,modified
```

**Duplicate Detection:**
- Transactions are considered duplicates if they match on: date + description + amount
- Duplicates are automatically skipped during import

### Assigning Properties

1. Navigate to the **Property Assignment** screen
2. Use filters to find transactions needing assignment:
   - Default filter shows "Unassigned" transactions
   - Filter by category, date range, account, or transaction type
3. Select transactions:
   - Check individual rows, or
   - Use "Select All Visible" for bulk selection
4. Choose a property from the "Assign selected to:" dropdown
5. Click "Assign Property"
6. Confirm the assignment

**Tips:**
- Focus on one property at a time for efficiency
- Use category filters to group similar transactions
- The progress indicator shows how many transactions still need assignment

### Viewing and Exporting Transactions

1. Navigate to the **All Transactions** screen
2. Use filters to find specific transactions:
   - Search by description
   - Filter by property, category, type, or date range
3. Click column headers to sort
4. Export filtered results by clicking "Export CSV"

## Database Schema

### pl_transactions Table

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| transaction_date | DATE | Transaction date |
| description | TEXT | Transaction description |
| amount | NUMERIC(10,2) | Transaction amount |
| type | TEXT | 'income' or 'expense' |
| category | TEXT | Transaction category |
| property | TEXT | Assigned property |
| job | TEXT | Legacy field from migration |
| account | TEXT | Account name |
| transaction_type | TEXT | 'business' or 'personal' |
| source | TEXT | Data source |
| original_id | TEXT | Original ID from Google Sheets |
| created_at | TIMESTAMP | Record creation time |
| modified_at | TIMESTAMP | Last modification time |

**Indexes:**
- `idx_pl_transactions_date` - On transaction_date
- `idx_pl_transactions_property` - On property
- `idx_pl_transactions_category` - On category
- `idx_pl_transactions_type` - On transaction_type

## Security

The application uses Supabase Row Level Security (RLS). The default policy allows all operations for authenticated users.

**To customize security:**
1. Go to Supabase Dashboard > Authentication > Policies
2. Modify the `pl_transactions` table policies
3. Create user roles and permissions as needed

## Troubleshooting

### Import Issues

**Problem:** "No data found in CSV file"
- **Solution:** Check CSV format matches expected columns
- Ensure file is UTF-8 encoded
- Check for blank rows at the end of the file

**Problem:** High duplicate count
- **Solution:** This is normal if re-importing the same data
- Duplicates are skipped automatically
- Check original_id field to verify imports

### Connection Issues

**Problem:** "Error loading properties/categories"
- **Solution:** Verify Supabase connection in config.js
- Check that properties and categories tables exist
- Verify RLS policies allow read access

### Performance Issues

**Problem:** Slow import with large CSV files
- **Solution:** Import processes sequentially for data integrity
- Consider breaking large files into smaller batches
- Expected speed: ~100-200 transactions per second

## Data Migration Workflow

Recommended workflow for migrating from Google Sheets:

1. **Export from Google Sheets**
   - File > Download > Comma-separated values (.csv)

2. **Import to Application**
   - Use the Import CSV screen
   - Import in batches if file is very large (>10,000 rows)

3. **Assign Properties**
   - Start with most common properties
   - Use category filters to group similar transactions
   - Bulk assign to save time

4. **Verify Data**
   - Use All Transactions view to spot-check
   - Export to CSV and compare row counts
   - Check for unassigned transactions

## Limitations (Phase 1A)

This is Phase 1A focusing on import and assignment. The following features are NOT included:

- Manual transaction entry
- Editing existing transactions
- Deleting transactions
- P&L reports and analytics
- User authentication UI
- Multi-user access control

## Project Structure

```
pl-tracker/
├── database/
│   └── schema.sql          # Database schema and indexes
├── frontend/
│   ├── index.html          # Main HTML structure
│   ├── styles.css          # Professional UI styles
│   ├── app.js              # Application logic
│   └── config.js           # Supabase configuration
└── README.md               # This file
```

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Supabase logs in the dashboard
3. Check browser console for JavaScript errors
4. Verify database schema is correctly applied

## Future Enhancements (Not in Phase 1A)

- Transaction editing and deletion
- P&L reports by property
- Income/expense analytics
- Budget tracking
- Recurring transaction templates
- Multi-user collaboration
- Mobile app

## License

Proprietary - AJ Real Estate System

## Version

Phase 1A - Initial Release
Focus: CSV Import, Property Assignment, Transaction Viewing
