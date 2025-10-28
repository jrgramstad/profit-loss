// ===== SUPABASE CLIENT INITIALIZATION =====
const supabaseClient = supabase.createClient(
    config.supabase.url,
    config.supabase.anonKey
);

// ===== GLOBAL STATE =====
const appState = {
    properties: [],
    categories: [],
    accounts: [],
    currentScreen: 'import',
    csvData: null,

    // Assignment Screen State
    assignFilters: {
        property: 'unassigned',
        category: 'all',
        dateRange: 'all',
        dateFrom: null,
        dateTo: null,
        account: 'all',
        transactionType: 'business'
    },
    assignSort: {
        field: 'transaction_date',
        direction: 'desc'
    },
    assignPage: 1,
    assignPageSize: 50,
    assignSelectedIds: new Set(),

    // View Screen State
    viewFilters: {
        search: '',
        property: 'all',
        category: 'all',
        dateRange: 'this-year',
        dateFrom: null,
        dateTo: null,
        transactionType: 'business'
    },
    viewSort: {
        field: 'transaction_date',
        direction: 'desc'
    },
    viewPage: 1,
    viewPageSize: 100
};

// ===== UTILITY FUNCTIONS =====
function showLoading(text = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    loadingText.textContent = text;
    overlay.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function showModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.classList.remove('hidden');

    const handleConfirm = () => {
        modal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        onConfirm();
    };

    const handleCancel = () => {
        modal.classList.add('hidden');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index].trim();
            });
            rows.push(row);
        }
    }

    return rows;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

function getDateRangeFilter(rangeType, customFrom = null, customTo = null) {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (rangeType) {
        case 'this-year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
        case 'last-year':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31);
            break;
        case 'custom':
            startDate = customFrom ? new Date(customFrom) : null;
            endDate = customTo ? new Date(customTo) : null;
            break;
        default:
            return { startDate: null, endDate: null };
    }

    return {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null
    };
}

// ===== DATA LOADING FUNCTIONS =====
async function loadProperties() {
    try {
        const { data, error } = await supabaseClient
            .from('properties')
            .select('name')
            .eq('active', true)
            .order('sort_order');

        if (error) throw error;

        appState.properties = data || [];
        populatePropertyDropdowns();
    } catch (error) {
        console.error('Error loading properties:', error);
        showToast('Error loading properties', 'error');
    }
}

async function loadCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('categories')
            .select('name')
            .eq('active', true)
            .order('sort_order');

        if (error) throw error;

        appState.categories = data || [];
        populateCategoryDropdowns();
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error loading categories', 'error');
    }
}

async function loadAccounts() {
    try {
        const { data, error } = await supabaseClient
            .from('pl_transactions')
            .select('account')
            .order('account');

        if (error) throw error;

        const uniqueAccounts = [...new Set(data.map(row => row.account))];
        appState.accounts = uniqueAccounts;
        populateAccountDropdowns();
    } catch (error) {
        console.error('Error loading accounts:', error);
        appState.accounts = [];
    }
}

function populatePropertyDropdowns() {
    // Filter property dropdown (assignment screen)
    const filterProperty = document.getElementById('filter-property');
    filterProperty.innerHTML = '<option value="unassigned">Unassigned</option>';
    appState.properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.name;
        option.textContent = prop.name;
        filterProperty.appendChild(option);
    });

    // Bulk property select
    const bulkProperty = document.getElementById('bulk-property-select');
    bulkProperty.innerHTML = '<option value="">Choose Property...</option>';
    appState.properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.name;
        option.textContent = prop.name;
        bulkProperty.appendChild(option);
    });

    // View screen property filter
    const viewProperty = document.getElementById('view-property');
    viewProperty.innerHTML = '<option value="all">All</option>';
    appState.properties.forEach(prop => {
        const option = document.createElement('option');
        option.value = prop.name;
        option.textContent = prop.name;
        viewProperty.appendChild(option);
    });
}

function populateCategoryDropdowns() {
    // Assignment screen category filter
    const filterCategory = document.getElementById('filter-category');
    filterCategory.innerHTML = '<option value="all">All</option>';
    appState.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        filterCategory.appendChild(option);
    });

    // View screen category filter
    const viewCategory = document.getElementById('view-category');
    viewCategory.innerHTML = '<option value="all">All</option>';
    appState.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        viewCategory.appendChild(option);
    });
}

function populateAccountDropdowns() {
    const filterAccount = document.getElementById('filter-account');
    filterAccount.innerHTML = '<option value="all">All</option>';
    appState.accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account;
        option.textContent = account;
        filterAccount.appendChild(option);
    });
}

// ===== NAVIGATION =====
function switchScreen(screenName) {
    // Update screen visibility
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(`${screenName}-screen`).classList.add('active');

    // Update navigation buttons
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

    appState.currentScreen = screenName;

    // Load data for the screen
    if (screenName === 'assign') {
        loadAssignmentScreen();
    } else if (screenName === 'view') {
        loadViewScreen();
    }
}

// ===== SCREEN 1: CSV IMPORT =====
function initImportScreen() {
    const fileInput = document.getElementById('csv-file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const importBtn = document.getElementById('import-btn');
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    const importAnotherBtn = document.getElementById('import-another-btn');

    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    importBtn.addEventListener('click', handleImport);
    cancelImportBtn.addEventListener('click', resetImportScreen);
    importAnotherBtn.addEventListener('click', resetImportScreen);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        appState.csvData = parseCSV(text);
        displayPreview();
    };
    reader.readAsText(file);
}

function displayPreview() {
    const previewSection = document.getElementById('preview-section');
    const previewHeader = document.getElementById('preview-header');
    const previewBody = document.getElementById('preview-body');

    if (!appState.csvData || appState.csvData.length === 0) {
        showToast('No data found in CSV file', 'error');
        return;
    }

    // Show first 10 rows
    const preview = appState.csvData.slice(0, 10);
    const headers = Object.keys(preview[0]);

    // Create header
    previewHeader.innerHTML = '';
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    previewHeader.appendChild(headerRow);

    // Create body
    previewBody.innerHTML = '';
    preview.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        previewBody.appendChild(tr);
    });

    previewSection.classList.remove('hidden');
}

async function handleImport() {
    if (!appState.csvData || appState.csvData.length === 0) {
        showToast('No data to import', 'error');
        return;
    }

    showModal(
        'Confirm Import',
        `Import ${appState.csvData.length} transactions from CSV?`,
        async () => {
            await performImport();
        }
    );
}

async function performImport() {
    showLoading(`Importing ${appState.csvData.length} transactions...`);

    let importedCount = 0;
    let skippedCount = 0;

    try {
        for (const row of appState.csvData) {
            // Check for duplicate
            const isDuplicate = await checkDuplicate(row.date, row.description, row.amount);

            if (isDuplicate) {
                skippedCount++;
                continue;
            }

            // Insert transaction
            const { error } = await supabaseClient
                .from('pl_transactions')
                .insert({
                    transaction_date: row.date,
                    description: row.description,
                    amount: parseFloat(row.amount),
                    type: row.type,
                    category: row.category || null,
                    property: row.property || null,
                    job: row.job || null,
                    account: row.account,
                    transaction_type: row.transactionType,
                    source: row.source || null,
                    original_id: row.id || null
                });

            if (error) {
                console.error('Error inserting transaction:', error);
            } else {
                importedCount++;
            }
        }

        hideLoading();
        displayImportResults(importedCount, skippedCount, appState.csvData.length);

        // Refresh accounts list
        await loadAccounts();

    } catch (error) {
        hideLoading();
        console.error('Import error:', error);
        showToast('Error during import: ' + error.message, 'error');
    }
}

async function checkDuplicate(date, description, amount) {
    try {
        const { data, error } = await supabaseClient
            .from('pl_transactions')
            .select('id')
            .eq('transaction_date', date)
            .eq('description', description)
            .eq('amount', parseFloat(amount))
            .limit(1);

        if (error) throw error;

        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking duplicate:', error);
        return false;
    }
}

function displayImportResults(imported, skipped, total) {
    document.getElementById('preview-section').classList.add('hidden');

    const resultsSection = document.getElementById('import-results');
    document.getElementById('imported-count').textContent = imported;
    document.getElementById('skipped-count').textContent = skipped;
    document.getElementById('total-count').textContent = total;

    resultsSection.classList.remove('hidden');

    if (imported > 0) {
        showToast(`Successfully imported ${imported} transactions`, 'success');
    }
}

function resetImportScreen() {
    document.getElementById('csv-file-input').value = '';
    document.getElementById('preview-section').classList.add('hidden');
    document.getElementById('import-results').classList.add('hidden');
    appState.csvData = null;
}

// ===== SCREEN 2: PROPERTY ASSIGNMENT =====
function initAssignmentScreen() {
    // Filter change handlers
    document.getElementById('filter-property').addEventListener('change', (e) => {
        appState.assignFilters.property = e.target.value;
        appState.assignPage = 1;
        loadAssignmentScreen();
    });

    document.getElementById('filter-category').addEventListener('change', (e) => {
        appState.assignFilters.category = e.target.value;
        appState.assignPage = 1;
        loadAssignmentScreen();
    });

    document.getElementById('filter-date-range').addEventListener('change', (e) => {
        const customRange = document.getElementById('custom-date-range');
        if (e.target.value === 'custom') {
            customRange.classList.remove('hidden');
        } else {
            customRange.classList.add('hidden');
            appState.assignFilters.dateRange = e.target.value;
            appState.assignPage = 1;
            loadAssignmentScreen();
        }
    });

    document.getElementById('apply-date-range').addEventListener('click', () => {
        appState.assignFilters.dateRange = 'custom';
        appState.assignFilters.dateFrom = document.getElementById('filter-date-from').value;
        appState.assignFilters.dateTo = document.getElementById('filter-date-to').value;
        appState.assignPage = 1;
        loadAssignmentScreen();
    });

    document.getElementById('filter-account').addEventListener('change', (e) => {
        appState.assignFilters.account = e.target.value;
        appState.assignPage = 1;
        loadAssignmentScreen();
    });

    document.getElementById('filter-transaction-type').addEventListener('change', (e) => {
        appState.assignFilters.transactionType = e.target.value;
        appState.assignPage = 1;
        loadAssignmentScreen();
    });

    // Select all checkbox
    document.getElementById('select-all-checkbox').addEventListener('change', handleSelectAll);

    // Bulk property select
    document.getElementById('bulk-property-select').addEventListener('change', updateAssignButton);

    // Assign property button
    document.getElementById('assign-property-btn').addEventListener('click', handleBulkAssignment);

    // Pagination
    document.getElementById('assign-prev-btn').addEventListener('click', () => {
        if (appState.assignPage > 1) {
            appState.assignPage--;
            loadAssignmentScreen();
        }
    });

    document.getElementById('assign-next-btn').addEventListener('click', () => {
        appState.assignPage++;
        loadAssignmentScreen();
    });

    // Sortable columns
    document.querySelectorAll('#assign-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const sortField = th.dataset.sort;
            if (appState.assignSort.field === sortField) {
                appState.assignSort.direction = appState.assignSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                appState.assignSort.field = sortField;
                appState.assignSort.direction = 'asc';
            }
            updateSortIcons('assign-table');
            loadAssignmentScreen();
        });
    });
}

async function loadAssignmentScreen() {
    showLoading('Loading transactions...');

    try {
        // Update progress indicator
        await updateProgressIndicator();

        // Build query
        let query = supabaseClient
            .from('pl_transactions')
            .select('*', { count: 'exact' });

        // Apply filters
        if (appState.assignFilters.property === 'unassigned') {
            query = query.is('property', null);
        } else if (appState.assignFilters.property !== 'all') {
            query = query.eq('property', appState.assignFilters.property);
        }

        if (appState.assignFilters.category !== 'all') {
            query = query.eq('category', appState.assignFilters.category);
        }

        if (appState.assignFilters.account !== 'all') {
            query = query.eq('account', appState.assignFilters.account);
        }

        if (appState.assignFilters.transactionType !== 'all') {
            query = query.eq('transaction_type', appState.assignFilters.transactionType);
        }

        // Date range filter
        const dateRange = getDateRangeFilter(
            appState.assignFilters.dateRange,
            appState.assignFilters.dateFrom,
            appState.assignFilters.dateTo
        );

        if (dateRange.startDate) {
            query = query.gte('transaction_date', dateRange.startDate);
        }
        if (dateRange.endDate) {
            query = query.lte('transaction_date', dateRange.endDate);
        }

        // Apply sorting
        query = query.order(appState.assignSort.field, { ascending: appState.assignSort.direction === 'asc' });

        // Apply pagination
        const from = (appState.assignPage - 1) * appState.assignPageSize;
        const to = from + appState.assignPageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        displayAssignmentTable(data || []);
        updateAssignmentPagination(count || 0);

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading transactions:', error);
        showToast('Error loading transactions: ' + error.message, 'error');
    }
}

async function updateProgressIndicator() {
    try {
        const { count, error } = await supabaseClient
            .from('pl_transactions')
            .select('*', { count: 'exact', head: true })
            .is('property', null);

        if (error) throw error;

        const unassignedCount = count || 0;

        const { count: totalCount } = await supabaseClient
            .from('pl_transactions')
            .select('*', { count: 'exact', head: true });

        const total = totalCount || 0;
        const assigned = total - unassignedCount;

        document.getElementById('progress-text').textContent =
            `${unassignedCount} of ${total} transactions need property assignment (${assigned} assigned)`;
    } catch (error) {
        console.error('Error updating progress:', error);
        document.getElementById('progress-text').textContent = 'Unable to load progress';
    }
}

function displayAssignmentTable(transactions) {
    const tbody = document.getElementById('assign-table-body');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No transactions found</td></tr>';
        return;
    }

    transactions.forEach(transaction => {
        const tr = document.createElement('tr');

        // Checkbox
        const tdCheck = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = transaction.id;
        checkbox.checked = appState.assignSelectedIds.has(transaction.id);
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                appState.assignSelectedIds.add(transaction.id);
            } else {
                appState.assignSelectedIds.delete(transaction.id);
            }
            updateSelectedCount();
            updateAssignButton();
        });
        tdCheck.appendChild(checkbox);
        tr.appendChild(tdCheck);

        // Date
        const tdDate = document.createElement('td');
        tdDate.textContent = formatDate(transaction.transaction_date);
        tr.appendChild(tdDate);

        // Description
        const tdDesc = document.createElement('td');
        tdDesc.textContent = transaction.description;
        tr.appendChild(tdDesc);

        // Amount
        const tdAmount = document.createElement('td');
        tdAmount.textContent = formatCurrency(transaction.amount);
        tdAmount.className = transaction.type === 'income' ? 'amount-positive' : 'amount-negative';
        tr.appendChild(tdAmount);

        // Category
        const tdCategory = document.createElement('td');
        tdCategory.textContent = transaction.category || '-';
        tr.appendChild(tdCategory);

        // Account
        const tdAccount = document.createElement('td');
        tdAccount.textContent = transaction.account;
        tr.appendChild(tdAccount);

        // Property
        const tdProperty = document.createElement('td');
        if (transaction.property) {
            tdProperty.textContent = transaction.property;
        } else {
            tdProperty.textContent = 'Unassigned';
            tdProperty.className = 'property-unassigned';
        }
        tr.appendChild(tdProperty);

        tbody.appendChild(tr);
    });
}

function updateAssignmentPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / appState.assignPageSize);
    const pageInfo = document.getElementById('assign-page-info');
    const prevBtn = document.getElementById('assign-prev-btn');
    const nextBtn = document.getElementById('assign-next-btn');

    pageInfo.textContent = `Page ${appState.assignPage} of ${totalPages || 1}`;
    prevBtn.disabled = appState.assignPage <= 1;
    nextBtn.disabled = appState.assignPage >= totalPages;
}

function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('#assign-table-body input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        const id = parseInt(checkbox.value);
        if (e.target.checked) {
            appState.assignSelectedIds.add(id);
        } else {
            appState.assignSelectedIds.delete(id);
        }
    });
    updateSelectedCount();
    updateAssignButton();
}

function updateSelectedCount() {
    document.getElementById('selected-count').textContent =
        `${appState.assignSelectedIds.size} transactions selected`;
}

function updateAssignButton() {
    const selectedProperty = document.getElementById('bulk-property-select').value;
    const assignBtn = document.getElementById('assign-property-btn');
    assignBtn.disabled = !selectedProperty || appState.assignSelectedIds.size === 0;
}

async function handleBulkAssignment() {
    const selectedProperty = document.getElementById('bulk-property-select').value;
    const selectedCount = appState.assignSelectedIds.size;

    if (!selectedProperty || selectedCount === 0) return;

    showModal(
        'Confirm Property Assignment',
        `Assign ${selectedCount} transactions to ${selectedProperty}?`,
        async () => {
            await performBulkAssignment(selectedProperty);
        }
    );
}

async function performBulkAssignment(propertyName) {
    showLoading('Assigning properties...');

    try {
        const ids = Array.from(appState.assignSelectedIds);

        const { error } = await supabaseClient
            .from('pl_transactions')
            .update({ property: propertyName })
            .in('id', ids);

        if (error) throw error;

        showToast(`Successfully assigned ${ids.length} transactions to ${propertyName}`, 'success');

        // Clear selections
        appState.assignSelectedIds.clear();
        document.getElementById('select-all-checkbox').checked = false;
        document.getElementById('bulk-property-select').value = '';
        updateSelectedCount();
        updateAssignButton();

        // Reload screen
        await loadAssignmentScreen();

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error assigning properties:', error);
        showToast('Error assigning properties: ' + error.message, 'error');
    }
}

// ===== SCREEN 3: ALL TRANSACTIONS VIEW =====
function initViewScreen() {
    // Search input
    document.getElementById('view-search').addEventListener('input', debounce(() => {
        appState.viewFilters.search = document.getElementById('view-search').value;
        appState.viewPage = 1;
        loadViewScreen();
    }, 500));

    // Filter change handlers
    document.getElementById('view-property').addEventListener('change', (e) => {
        appState.viewFilters.property = e.target.value;
        appState.viewPage = 1;
        loadViewScreen();
    });

    document.getElementById('view-category').addEventListener('change', (e) => {
        appState.viewFilters.category = e.target.value;
        appState.viewPage = 1;
        loadViewScreen();
    });

    document.getElementById('view-transaction-type').addEventListener('change', (e) => {
        appState.viewFilters.transactionType = e.target.value;
        appState.viewPage = 1;
        loadViewScreen();
    });

    document.getElementById('view-date-range').addEventListener('change', (e) => {
        const customRange = document.getElementById('view-custom-date-range');
        if (e.target.value === 'custom') {
            customRange.classList.remove('hidden');
        } else {
            customRange.classList.add('hidden');
            appState.viewFilters.dateRange = e.target.value;
            appState.viewPage = 1;
            loadViewScreen();
        }
    });

    document.getElementById('view-apply-date-range').addEventListener('click', () => {
        appState.viewFilters.dateRange = 'custom';
        appState.viewFilters.dateFrom = document.getElementById('view-date-from').value;
        appState.viewFilters.dateTo = document.getElementById('view-date-to').value;
        appState.viewPage = 1;
        loadViewScreen();
    });

    // Export CSV button
    document.getElementById('export-csv-btn').addEventListener('click', handleExportCSV);

    // Pagination
    document.getElementById('view-prev-btn').addEventListener('click', () => {
        if (appState.viewPage > 1) {
            appState.viewPage--;
            loadViewScreen();
        }
    });

    document.getElementById('view-next-btn').addEventListener('click', () => {
        appState.viewPage++;
        loadViewScreen();
    });

    // Sortable columns
    document.querySelectorAll('#view-table th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const sortField = th.dataset.sort;
            if (appState.viewSort.field === sortField) {
                appState.viewSort.direction = appState.viewSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                appState.viewSort.field = sortField;
                appState.viewSort.direction = 'asc';
            }
            updateSortIcons('view-table');
            loadViewScreen();
        });
    });
}

async function loadViewScreen() {
    showLoading('Loading transactions...');

    try {
        // Build query
        let query = supabaseClient
            .from('pl_transactions')
            .select('*', { count: 'exact' });

        // Apply filters
        if (appState.viewFilters.search) {
            query = query.ilike('description', `%${appState.viewFilters.search}%`);
        }

        if (appState.viewFilters.property !== 'all') {
            query = query.eq('property', appState.viewFilters.property);
        }

        if (appState.viewFilters.category !== 'all') {
            query = query.eq('category', appState.viewFilters.category);
        }

        if (appState.viewFilters.transactionType !== 'all') {
            query = query.eq('transaction_type', appState.viewFilters.transactionType);
        }

        // Date range filter
        const dateRange = getDateRangeFilter(
            appState.viewFilters.dateRange,
            appState.viewFilters.dateFrom,
            appState.viewFilters.dateTo
        );

        if (dateRange.startDate) {
            query = query.gte('transaction_date', dateRange.startDate);
        }
        if (dateRange.endDate) {
            query = query.lte('transaction_date', dateRange.endDate);
        }

        // Apply sorting
        query = query.order(appState.viewSort.field, { ascending: appState.viewSort.direction === 'asc' });

        // Apply pagination
        const from = (appState.viewPage - 1) * appState.viewPageSize;
        const to = from + appState.viewPageSize - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        displayViewTable(data || []);
        updateViewPagination(count || 0);
        document.getElementById('view-total-count').textContent = `Showing ${count || 0} transactions`;

        hideLoading();
    } catch (error) {
        hideLoading();
        console.error('Error loading transactions:', error);
        showToast('Error loading transactions: ' + error.message, 'error');
    }
}

function displayViewTable(transactions) {
    const tbody = document.getElementById('view-table-body');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No transactions found</td></tr>';
        return;
    }

    transactions.forEach(transaction => {
        const tr = document.createElement('tr');

        // Date
        const tdDate = document.createElement('td');
        tdDate.textContent = formatDate(transaction.transaction_date);
        tr.appendChild(tdDate);

        // Description
        const tdDesc = document.createElement('td');
        tdDesc.textContent = transaction.description;
        tr.appendChild(tdDesc);

        // Amount
        const tdAmount = document.createElement('td');
        tdAmount.textContent = formatCurrency(transaction.amount);
        tdAmount.className = transaction.type === 'income' ? 'amount-positive' : 'amount-negative';
        tr.appendChild(tdAmount);

        // Category
        const tdCategory = document.createElement('td');
        tdCategory.textContent = transaction.category || '-';
        tr.appendChild(tdCategory);

        // Property
        const tdProperty = document.createElement('td');
        tdProperty.textContent = transaction.property || 'Unassigned';
        if (!transaction.property) {
            tdProperty.className = 'property-unassigned';
        }
        tr.appendChild(tdProperty);

        // Account
        const tdAccount = document.createElement('td');
        tdAccount.textContent = transaction.account;
        tr.appendChild(tdAccount);

        // Transaction Type
        const tdType = document.createElement('td');
        tdType.textContent = transaction.transaction_type;
        tr.appendChild(tdType);

        tbody.appendChild(tr);
    });
}

function updateViewPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / appState.viewPageSize);
    const pageInfo = document.getElementById('view-page-info');
    const prevBtn = document.getElementById('view-prev-btn');
    const nextBtn = document.getElementById('view-next-btn');

    pageInfo.textContent = `Page ${appState.viewPage} of ${totalPages || 1}`;
    prevBtn.disabled = appState.viewPage <= 1;
    nextBtn.disabled = appState.viewPage >= totalPages;
}

async function handleExportCSV() {
    showLoading('Exporting to CSV...');

    try {
        // Build query without pagination to get all matching records
        let query = supabaseClient
            .from('pl_transactions')
            .select('*');

        // Apply same filters as view screen
        if (appState.viewFilters.search) {
            query = query.ilike('description', `%${appState.viewFilters.search}%`);
        }

        if (appState.viewFilters.property !== 'all') {
            query = query.eq('property', appState.viewFilters.property);
        }

        if (appState.viewFilters.category !== 'all') {
            query = query.eq('category', appState.viewFilters.category);
        }

        if (appState.viewFilters.transactionType !== 'all') {
            query = query.eq('transaction_type', appState.viewFilters.transactionType);
        }

        const dateRange = getDateRangeFilter(
            appState.viewFilters.dateRange,
            appState.viewFilters.dateFrom,
            appState.viewFilters.dateTo
        );

        if (dateRange.startDate) {
            query = query.gte('transaction_date', dateRange.startDate);
        }
        if (dateRange.endDate) {
            query = query.lte('transaction_date', dateRange.endDate);
        }

        query = query.order('transaction_date', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        // Generate CSV
        const csv = generateCSV(data);

        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pl-transactions-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        hideLoading();
        showToast('CSV exported successfully', 'success');
    } catch (error) {
        hideLoading();
        console.error('Error exporting CSV:', error);
        showToast('Error exporting CSV: ' + error.message, 'error');
    }
}

function generateCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Property', 'Account', 'Transaction Type'];
    const rows = data.map(row => [
        row.transaction_date,
        `"${row.description.replace(/"/g, '""')}"`,
        row.amount,
        row.type,
        row.category || '',
        row.property || '',
        row.account,
        row.transaction_type
    ]);

    return [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
}

// ===== UTILITY FUNCTIONS =====
function updateSortIcons(tableId) {
    const table = document.getElementById(tableId);
    const headers = table.querySelectorAll('th.sortable');

    headers.forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        const sortField = th.dataset.sort;
        const sortState = tableId === 'assign-table' ? appState.assignSort : appState.viewSort;

        if (sortState.field === sortField) {
            th.classList.add(`sorted-${sortState.direction}`);
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== INITIALIZATION =====
async function init() {
    showLoading('Initializing application...');

    // Load reference data
    await Promise.all([
        loadProperties(),
        loadCategories(),
        loadAccounts()
    ]);

    // Initialize screens
    initImportScreen();
    initAssignmentScreen();
    initViewScreen();

    // Setup navigation
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', () => {
            switchScreen(btn.dataset.screen);
        });
    });

    // Load default screen (Property Assignment)
    switchScreen('assign');

    hideLoading();
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
