# Task Breakdown: POS Core System

## Overview
This document breaks down the implementation plan into specific, actionable tasks organized by phase.

**Legend**:
- `[P]` - Can be executed in parallel with other `[P]` tasks
- `[D: TaskID]` - Depends on completion of TaskID
- `✅` - Completed
- 🔴 - Blocked
- 🟡 - In Progress

**Estimated Duration**: 10 weeks

---

## Phase 1: Foundation & Setup (Week 1)

### Task 1.1: Environment Setup
**Dependencies**: None  
**Estimated Time**: 4 hours

**Actions**:
- [ ] Install NativeWind: `npm install nativewind@^4.0.0 tailwindcss`
- [ ] Create `tailwind.config.js` with custom theme
- [ ] Create `global.css` and import Tailwind styles
- [ ] Update `babel.config.js` for NativeWind plugin
- [ ] Test basic styling works (create test component)

**Files**:
- `tailwind.config.js`
- `global.css`
- `babel.config.js`
- `app/_layout.tsx` (update for global CSS)

**Acceptance Criteria**:
- ✅ Tailwind classes work in components
- ✅ Custom colors from config available
- ✅ Hot reload works with style changes
- ✅ No console errors

---

### Task 1.2: SQLite Database Setup [P]
**Dependencies**: None  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Install expo-sqlite: `npx expo install expo-sqlite`
- [ ] Create database connection utility
- [ ] Create migration runner system
- [ ] Write initial SQL schema (all 7 tables)
- [ ] Create indexes for performance
- [ ] Test database opens and migrations run

**Files**:
- `lib/database/index.ts`
- `lib/database/schema.ts`
- `lib/database/migrations/001_initial.ts`

**SQL Tables to Create**:
- users
- products (with indexes on sku, barcode, name, category)
- transactions (with indexes on receipt_number, cashier_id, created_at, sync_status)
- transaction_items
- inventory_adjustments
- sync_queue
- audit_logs

**Acceptance Criteria**:
- ✅ Database creates successfully
- ✅ All 7 tables created with correct schema
- ✅ Indexes created
- ✅ Foreign keys enforced
- ✅ Migration system can roll forward/back
- ✅ No SQL errors

---

### Task 1.3: TanStack Query & State Setup [P]
**Dependencies**: None  
**Estimated Time**: 3 hours

**Actions**:
- [ ] Install TanStack Query: `npm install @tanstack/react-query`
- [ ] Install Zustand: `npm install zustand`
- [ ] Create QueryClient and provider in root layout
- [ ] Create base Zustand stores (auth, cart, ui, app)
- [ ] Test query/mutation basic flow

**Files**:
- `app/_layout.tsx` (add QueryClientProvider)
- `lib/stores/auth-store.ts`
- `lib/stores/cart-store.ts`
- `lib/stores/ui-store.ts`
- `lib/stores/app-store.ts`

**Acceptance Criteria**:
- ✅ TanStack Query provider wraps app
- ✅ React Query DevTools accessible
- ✅ Zustand stores created
- ✅ Basic query works
- ✅ Store state persists (for cart)

---

### Task 1.4: Repository Pattern Implementation [D: 1.2]
**Dependencies**: Task 1.2 (SQLite setup)  
**Estimated Time**: 8 hours

**Actions**:
- [ ] Create base repository class/interface
- [ ] Implement UserRepository (CRUD methods)
- [ ] Implement ProductRepository (CRUD + search)
- [ ] Implement TransactionRepository (create, findAll, findById)
- [ ] Implement InventoryRepository (adjust stock)
- [ ] Implement SyncQueueRepository (queue operations)
- [ ] Write unit tests for repositories

**Files**:
- `lib/database/repositories/base-repository.ts`
- `lib/database/repositories/user-repository.ts`
- `lib/database/repositories/product-repository.ts`
- `lib/database/repositories/transaction-repository.ts`
- `lib/database/repositories/inventory-repository.ts`
- `lib/database/repositories/sync-repository.ts`

**Repository Methods Required**:
- findAll, findById, create, update, delete
- Product: findBySKU, findByBarcode, search
- Transaction: createWithItems, findByReceiptNumber
- Inventory: adjustStock, getHistory

**Acceptance Criteria**:
- ✅ All repositories implement CRUD
- ✅ SQL queries use parameterized statements
- ✅ Results map to TypeScript types correctly
- ✅ Unit tests pass (80% coverage)
- ✅ No SQL injection vulnerabilities

---

### Task 1.5: Authentication System [D: 1.2, 1.3]
**Dependencies**: Tasks 1.2, 1.3  
**Estimated Time**: 8 hours

**Actions**:
- [ ] Install expo-secure-store: `npx expo install expo-secure-store`
- [ ] Create auth store (Zustand) with login/logout
- [ ] Build fetch API client with auth interceptors
- [ ] Implement token storage (secure-store)
- [ ] Create useAuth hook
- [ ] Implement auto token refresh
- [ ] Create login screen UI
- [ ] Add auth guard to protected routes
- [ ] Test offline auth (cached credentials)

**Files**:
- `lib/stores/auth-store.ts` (complete)
- `lib/api/client.ts`
- `lib/api/endpoints/auth.ts`
- `lib/hooks/use-auth.ts`
- `app/login.tsx`
- `app/(auth)/_layout.tsx` (auth guard)

**Acceptance Criteria**:
- ✅ User can login with email/password
- ✅ JWT tokens stored securely
- ✅ Session persists across app restarts
- ✅ Auto token refresh works
- ✅ Logout clears all auth data
- ✅ Offline login works with cached credentials
- ✅ Unauthenticated users redirect to login
- ✅ TypeScript strict mode (no `any`)

---

## Phase 2: Core UI Components (Week 2)

### Task 2.1: Base UI Component Library [D: 1.1]
**Dependencies**: Task 1.1 (NativeWind)  
**Estimated Time**: 12 hours

**Actions**:
- [ ] Install CVA: `npm install class-variance-authority`
- [ ] Create Button component with variants
- [ ] Create Input component (text, number, password)
- [ ] Create Card component
- [ ] Create Badge component
- [ ] Create Modal component
- [ ] Create Toast/Notification system
- [ ] Create Spinner/Loading component
- [ ] Create Avatar component
- [ ] Create Dropdown/Select component
- [ ] Write component documentation/Storybook

**Files**:
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/card.tsx`
- `components/ui/badge.tsx`
- `components/ui/modal.tsx`
- `components/ui/toast.tsx`
- `components/ui/spinner.tsx`
- `components/ui/avatar.tsx`
- `components/ui/dropdown.tsx`

**Button Variants**: primary, secondary, outline, ghost, danger  
**Button Sizes**: sm, md, lg

**Acceptance Criteria**:
- ✅ All components use NativeWind classes
- ✅ Variants work with CVA
- ✅ Accessibility labels included
- ✅ Touch targets ≥ 44x44pt
- ✅ Components are type-safe
- ✅ No `any` types
- ✅ Works on iOS and Android

---

### Task 2.2: Navigation & Layout Structure [D: 1.5, 2.1]
**Dependencies**: Tasks 1.5 (Auth), 2.1 (UI components)  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Create role-based layout structure
- [ ] Build cashier tabs layout (Sales, History)
- [ ] Build manager drawer/tabs (Dashboard, Products, Inventory, Transactions)
- [ ] Build admin drawer (Users, Settings)
- [ ] Create shared header with online/offline indicator
- [ ] Add sync status indicator
- [ ] Implement role-based route guards
- [ ] Test navigation flow for each role

**Files**:
- `app/(auth)/(cashier)/_layout.tsx`
- `app/(auth)/(manager)/_layout.tsx`
- `app/(auth)/(admin)/_layout.tsx`
- `components/shared/header.tsx`
- `components/shared/status-indicator.tsx`

**Acceptance Criteria**:
- ✅ Cashiers see only sales screens
- ✅ Managers see dashboard, products, etc.
- ✅ Admins see all screens
- ✅ Online/offline indicator visible
- ✅ Sync status shows pending count
- ✅ Navigation persists on app restart
- ✅ Back button works correctly

---

### Task 2.3: Shared Components [D: 2.1] [P]
**Dependencies**: Task 2.1  
**Estimated Time**: 4 hours

**Actions**:
- [ ] Create SearchBar component
- [ ] Create FilterBar component
- [ ] Create EmptyState component
- [ ] Create ErrorBoundary component
- [ ] Create LoadingSkeleton component
- [ ] Add accessibility labels

**Files**:
- `components/shared/search-bar.tsx`
- `components/shared/filter-bar.tsx`
- `components/shared/empty-state.tsx`
- `components/shared/error-boundary.tsx`
- `components/shared/loading-skeleton.tsx`

**Acceptance Criteria**:
- ✅ Components reusable across screens
- ✅ Proper TypeScript types
- ✅ Accessibility compliant
- ✅ Responsive design

---

## Phase 3: Product Management (Week 3)

### Task 3.1: Product TanStack Query Hooks [D: 1.4, 1.3]
**Dependencies**: Tasks 1.3, 1.4  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Create useProducts query hook
- [ ] Create useProduct query hook (single)
- [ ] Create useCreateProduct mutation
- [ ] Create useUpdateProduct mutation
- [ ] Create useDeleteProduct mutation
- [ ] Implement offline fallback logic
- [ ] Add optimistic updates
- [ ] Handle sync queue for offline mutations
- [ ] Write tests for hooks

**Files**:
- `lib/hooks/queries/use-products.ts`
- `lib/hooks/queries/use-product-mutations.ts`
- `lib/api/endpoints/products.ts`

**Acceptance Criteria**:
- ✅ Products fetch from SQLite when offline
- ✅ Products fetch/sync from API when online
- ✅ Search works with partial matching
- ✅ Filters work (category, lowStock)
- ✅ Mutations update SQLite immediately
- ✅ Offline mutations queue for sync
- ✅ Optimistic updates work
- ✅ Query invalidation works correctly

---

### Task 3.2: Product List Screen [D: 3.1, 2.1, 2.3]
**Dependencies**: Tasks 2.1, 2.3, 3.1  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Create product list screen layout
- [ ] Implement search functionality
- [ ] Add category filter
- [ ] Add low stock filter
- [ ] Create ProductCard component
- [ ] Implement FlatList with optimization
- [ ] Add pull-to-refresh
- [ ] Add FAB for new product
- [ ] Handle empty state

**Files**:
- `app/(auth)/(manager)/products/index.tsx`
- `components/products/product-card.tsx`

**Acceptance Criteria**:
- ✅ Products display in grid/list
- ✅ Search filters instantly
- ✅ Category filter works
- ✅ Low stock indicator shows
- ✅ FlatList scrolls at 60 FPS
- ✅ Pull to refresh works
- ✅ Empty state displays when no products
- ✅ Tap navigates to product detail
- ✅ Works on tablets (responsive)

---

### Task 3.3: Product Form & Detail Screen [D: 3.1, 2.1]
**Dependencies**: Tasks 2.1, 3.1  
**Estimated Time**: 8 hours

**Actions**:
- [ ] Install React Hook Form: `npm install react-hook-form`
- [ ] Install Zod: `npm install zod`
- [ ] Create product form schema (Zod)
- [ ] Build product form component
- [ ] Add image picker functionality
- [ ] Implement barcode scanner
- [ ] Create product detail screen
- [ ] Handle form validation
- [ ] Show validation errors
- [ ] Test save functionality (online/offline)

**Files**:
- `app/(auth)/(manager)/products/[id].tsx`
- `app/(auth)/(manager)/products/new.tsx`
- `components/products/product-form.tsx`
- `components/products/barcode-scanner.tsx`
- `lib/utils/validation.ts`

**Fields**: name, SKU, barcode, category, price, cost, taxRate, stockQuantity, lowStockThreshold, description, image, isActive

**Acceptance Criteria**:
- ✅ Form validates all fields
- ✅ Required fields enforced
- ✅ Price/cost validation (positive numbers)
- ✅ SKU uniqueness validated
- ✅ Image picker works
- ✅ Barcode scanner works
- ✅ Save works offline (queues for sync)
- ✅ Error messages display clearly
- ✅ TypeScript types correct

---

## Phase 4: Sales Transaction System (Week 4-5)

### Task 4.1: Cart Store Implementation [D: 1.3]
**Dependencies**: Task 1.3  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Complete cart store (Zustand)
- [ ] Implement addItem logic
- [ ] Implement updateQuantity logic
- [ ] Implement removeItem logic
- [ ] Calculate subtotal, tax, total
- [ ] Implement discount logic (fixed/percentage)
- [ ] Add cart persistence (AsyncStorage)
- [ ] Implement hold/clear cart
- [ ] Write unit tests for calculations

**Files**:
- `lib/stores/cart-store.ts` (complete)
- `lib/utils/calculations.ts`
- `lib/utils/currency.ts`

**Calculations**:
- Subtotal = Σ(unitPrice × quantity)
- Tax = Σ(unitPrice × quantity × taxRate)
- Discount = fixed OR (subtotal × percentage)
- Total = subtotal + tax - discount

**Acceptance Criteria**:
- ✅ Items add to cart correctly
- ✅ Quantities update properly
- ✅ Items remove from cart
- ✅ Subtotal calculates correctly
- ✅ Tax calculates correctly (per item tax rate)
- ✅ Discounts apply correctly
- ✅ Cart persists across app restarts
- ✅ Cart clears on logout
- ✅ 100% test coverage for calculations

---

### Task 4.2: Sales Screen UI (Split-Panel POS) [D: 3.1, 4.1, 2.1]
**Dependencies**: Tasks 2.1, 3.1, 4.1  
**Estimated Time**: 10 hours

**Actions**:
- [ ] Create split-panel layout (products 60% + cart 40%)
- [ ] Build product grid with search
- [ ] Create CartItem component
- [ ] Create CartSummary component
- [ ] Implement add to cart on product tap
- [ ] Add quantity adjustment controls
- [ ] Add remove item button
- [ ] Create discount modal
- [ ] Add hold/clear actions
- [ ] Implement checkout button
- [ ] Handle out of stock products
- [ ] Test on tablets

**Files**:
- `app/(auth)/(cashier)/sales.tsx`
- `components/sales/product-grid.tsx`
- `components/sales/product-card.tsx`
- `components/sales/cart-item.tsx`
- `components/sales/cart-summary.tsx`
- `components/sales/discount-modal.tsx`

**Acceptance Criteria**:
- ✅ Split-panel layout works on tablets
- ✅ Products display in 3-column grid
- ✅ Search filters products instantly (debounced)
- ✅ Tap product adds to cart
- ✅ Cart shows all items with quantities
- ✅ Quantities editable inline
- ✅ Items removable
- ✅ Summary shows correct totals
- ✅ Checkout button navigates
- ✅ Out of stock products disabled
- ✅ 60 FPS scrolling

---

### Task 4.3: Checkout Screen [D: 4.1, 2.1]
**Dependencies**: Tasks 2.1, 4.1  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Create checkout screen layout
- [ ] Build payment method selector (Cash, Card, Other)
- [ ] Implement cash payment with change calculation
- [ ] Create order summary (read-only)
- [ ] Add validation (sufficient amount for cash)
- [ ] Create complete sale button
- [ ] Handle transaction creation
- [ ] Navigate to receipt on success
- [ ] Show error toast on failure

**Files**:
- `app/(auth)/(cashier)/checkout.tsx`
- `components/sales/payment-methods.tsx`

**Acceptance Criteria**:
- ✅ Order summary displays correctly
- ✅ Payment method selection works
- ✅ Cash: calculates change due
- ✅ Cash: validates amount tendered ≥ total
- ✅ Card/Other: no amount tendered required
- ✅ Complete sale button disabled until valid
- ✅ Success navigates to receipt
- ✅ Error shows toast notification
- ✅ Total amount prominent and clear

---

### Task 4.4: Transaction Repository & Creation [D: 1.4, 4.1]
**Dependencies**: Tasks 1.4, 4.1  
**Estimated Time**: 8 hours

**Actions**:
- [ ] Implement createTransaction in repository
- [ ] Implement createTransactionItems
- [ ] Generate unique receipt number
- [ ] Create useCreateTransaction mutation hook
- [ ] Deduct inventory on sale
- [ ] Create inventory adjustment record
- [ ] Add to sync queue if offline
- [ ] Sync to API if online
- [ ] Write unit tests (100% coverage)

**Files**:
- `lib/database/repositories/transaction-repository.ts` (complete)
- `lib/hooks/queries/use-transactions.ts`
- `lib/utils/receipt-number.ts`

**Transaction Creation Flow**:
1. Generate receipt number
2. Calculate totals
3. Create transaction record
4. Create transaction items (with product snapshots)
5. Deduct inventory for each item
6. Create inventory adjustment records
7. Add to sync queue
8. If online, sync to API immediately

**Acceptance Criteria**:
- ✅ Transaction saves to SQLite
- ✅ Receipt number unique and sequential
- ✅ All items saved with product snapshots
- ✅ Inventory deducts correctly
- ✅ Inventory adjustments logged
- ✅ Sync queue updated
- ✅ Online: syncs immediately
- ✅ Offline: queues for later sync
- ✅ 100% test coverage
- ✅ Handles negative inventory (configurable)

---

### Task 4.5: Receipt Screen [D: 4.4, 2.1]
**Dependencies**: Tasks 2.1, 4.4  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Install expo-print: `npx expo install expo-print`
- [ ] Create receipt screen layout
- [ ] Build receipt template (HTML for printing)
- [ ] Implement print functionality
- [ ] Add email receipt option
- [ ] Add share receipt option
- [ ] Create "New Sale" button
- [ ] Display transaction details
- [ ] Show sync status

**Files**:
- `app/(auth)/(cashier)/receipt.tsx`
- `components/sales/receipt-template.tsx`
- `lib/utils/receipt-generator.ts`

**Receipt Content**:
- Store name/logo
- Receipt number
- Date/time
- Cashier name
- Line items (name, qty, price, total)
- Subtotal
- Tax
- Total
- Payment method
- Amount tendered / Change (if cash)
- Thank you message

**Acceptance Criteria**:
- ✅ Receipt displays all transaction details
- ✅ Print button works (if printer available)
- ✅ Email button opens email with receipt
- ✅ Share button opens share sheet
- ✅ New Sale clears cart and returns to sales screen
- ✅ Receipt formatted clearly
- ✅ Sync status displayed

---

## Phase 5: Offline Sync Engine (Week 6-7)

### Task 5.1: Sync Queue Repository [D: 1.4]
**Dependencies**: Task 1.4  
**Estimated Time**: 4 hours

**Actions**:
- [ ] Implement sync queue repository methods
- [ ] Create add() method
- [ ] Create getPending() method
- [ ] Create remove() method
- [ ] Create update() method (for retry count/errors)
- [ ] Add ordering by priority and created_at
- [ ] Write unit tests

**Files**:
- `lib/database/repositories/sync-repository.ts` (complete)

**Methods**:
- add(entityType, entityId, operation, data)
- getPending(limit?)
- remove(id)
- update(id, { retryCount, error, lastAttempt })
- getFailedCount()

**Acceptance Criteria**:
- ✅ Items add to queue correctly
- ✅ getPending returns oldest first
- ✅ Items remove after successful sync
- ✅ Retry count increments
- ✅ Failed items tracked

---

### Task 5.2: Sync Manager & Background Sync [D: 5.1]
**Dependencies**: Task 5.1  
**Estimated Time**: 12 hours

**Actions**:
- [ ] Create SyncManager class
- [ ] Implement startSync() method
- [ ] Implement batch syncing by entity type
- [ ] Add retry logic with exponential backoff
- [ ] Handle partial sync failures
- [ ] Create useBackgroundSync hook
- [ ] Implement auto-sync on network reconnect
- [ ] Add manual sync trigger
- [ ] Create sync status indicator
- [ ] Test sync with offline transactions

**Files**:
- `lib/sync/sync-manager.ts`
- `lib/sync/background-sync.ts`
- `lib/hooks/use-sync.ts`
- `components/shared/sync-indicator.tsx`

**Retry Delays**: 1s, 2s, 5s, 10s, 30s (max 5 retries)

**Sync Flow**:
1. Check if online
2. Get pending items from queue
3. Group by entity type
4. Sync each batch
5. On success: remove from queue
6. On failure: increment retry, add delay
7. Max retries: mark as failed, notify admin

**Acceptance Criteria**:
- ✅ Sync runs automatically when online
- ✅ Sync runs every 30 seconds
- ✅ Manual sync trigger works
- ✅ Retry logic works with backoff
- ✅ Partial failures don't block other syncs
- ✅ Sync status visible to user
- ✅ Failed syncs tracked
- ✅ Network reconnect triggers sync
- ✅ Sync doesn't block UI

---

### Task 5.3: Conflict Resolution [D: 5.2]
**Dependencies**: Task 5.2  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Create ConflictResolver class
- [ ] Implement last-write-wins strategy
- [ ] Handle product conflicts
- [ ] Handle transaction conflicts (rare)
- [ ] Log all conflicts to audit log
- [ ] Add conflict notification system
- [ ] Test concurrent edits scenario

**Files**:
- `lib/sync/conflict-resolver.ts`
- `lib/database/repositories/audit-log-repository.ts`

**Conflict Strategy**:
- Compare updatedAt timestamps
- Winner = most recent timestamp
- Log conflict details
- Apply winning version
- Notify admin for manual review (if critical)

**Acceptance Criteria**:
- ✅ Conflicts detected by timestamp
- ✅ Last-write-wins applied correctly
- ✅ All conflicts logged
- ✅ Product conflicts resolve automatically
- ✅ Transaction conflicts prefer local
- ✅ Conflict notifications sent
- ✅ No data loss

---

### Task 5.4: Online Status Detection [D: 1.3] [P]
**Dependencies**: Task 1.3  
**Estimated Time**: 2 hours

**Actions**:
- [ ] Install @react-native-community/netinfo: `npm install @react-native-community/netinfo`
- [ ] Create useOnlineStatus hook
- [ ] Update app store with online status
- [ ] Show online/offline indicator in header
- [ ] Test airplane mode scenario

**Files**:
- `lib/hooks/use-online-status.ts`
- `lib/stores/app-store.ts` (update)

**Acceptance Criteria**:
- ✅ Online status detects correctly
- ✅ Status updates immediately on change
- ✅ Indicator visible in header
- ✅ Green dot = online, red = offline
- ✅ Sync triggers on reconnect

---

## Phase 6: Dashboard & Reporting (Week 8)

### Task 6.1: Dashboard Repository [D: 1.4]
**Dependencies**: Task 1.4  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Create DashboardRepository class
- [ ] Implement getSalesSummary() with SQL aggregation
- [ ] Implement getSalesTrend() (daily breakdown)
- [ ] Implement getTopProducts()
- [ ] Implement getCategoryBreakdown()
- [ ] Implement getPaymentMethodBreakdown()
- [ ] Optimize queries with indexes
- [ ] Write unit tests

**Files**:
- `lib/database/repositories/dashboard-repository.ts`

**Queries**:
- Sales summary: COUNT, SUM(total), AVG(total)
- Sales trend: GROUP BY DATE, SUM(total)
- Top products: JOIN with items, GROUP BY product, ORDER BY revenue
- Category breakdown: JOIN with products, GROUP BY category

**Acceptance Criteria**:
- ✅ Queries return correct aggregations
- ✅ Date range filtering works
- ✅ Queries perform well (< 500ms)
- ✅ Indexes used effectively
- ✅ Results typed correctly

---

### Task 6.2: Dashboard TanStack Query Hooks [D: 6.1]
**Dependencies**: Task 6.1  
**Estimated Time**: 4 hours

**Actions**:
- [ ] Create useSalesSummary hook
- [ ] Create useSalesTrend hook
- [ ] Create useTopProducts hook
- [ ] Create useCategoryBreakdown hook
- [ ] Handle online/offline data sources
- [ ] Set appropriate stale times
- [ ] Add query invalidation triggers

**Files**:
- `lib/hooks/queries/use-dashboard.ts`

**Acceptance Criteria**:
- ✅ Hooks return correct data
- ✅ Online: fetch from API
- ✅ Offline: query SQLite
- ✅ Data caches appropriately
- ✅ Queries invalidate after new transactions

---

### Task 6.3: Dashboard Screen UI [D: 6.2, 2.1]
**Dependencies**: Tasks 2.1, 6.2  
**Estimated Time**: 10 hours

**Actions**:
- [ ] Install react-native-chart-kit: `npm install react-native-chart-kit react-native-svg`
- [ ] Create dashboard screen layout
- [ ] Build KPICard component
- [ ] Add date range picker
- [ ] Implement sales trend line chart
- [ ] Create category pie chart
- [ ] Build top products list
- [ ] Add export report button
- [ ] Implement PDF export functionality

**Files**:
- `app/(auth)/(manager)/dashboard.tsx`
- `components/dashboard/kpi-card.tsx`
- `components/dashboard/sales-chart.tsx`
- `components/dashboard/category-pie.tsx`
- `components/dashboard/date-range-picker.tsx`

**KPI Cards**:
- Total Sales (with trend %)
- Transaction Count (with trend %)
- Average Transaction (with trend %)
- Top Product

**Acceptance Criteria**:
- ✅ Dashboard loads quickly (< 2s)
- ✅ KPI cards display correct values
- ✅ Trend indicators show % change
- ✅ Line chart renders sales trend
- ✅ Pie chart shows category breakdown
- ✅ Top products list accurate
- ✅ Date range picker works
- ✅ Export generates PDF
- ✅ Works offline with local data
- ✅ Responsive on tablets

---

## Phase 7: Admin Panel (Week 9)

### Task 7.1: User Management System [D: 1.4, 2.1]
**Dependencies**: Tasks 1.4, 2.1  
**Estimated Time**: 10 hours

**Actions**:
- [ ] Create user list screen
- [ ] Build user search/filter
- [ ] Create UserCard component
- [ ] Build user form (create/edit)
- [ ] Implement role selection
- [ ] Add user activation/deactivation
- [ ] Create password reset functionality
- [ ] Add user activity log view
- [ ] Restrict to admin role only

**Files**:
- `app/(auth)/(admin)/users/index.tsx`
- `app/(auth)/(admin)/users/[id].tsx`
- `app/(auth)/(admin)/users/new.tsx`
- `components/admin/user-card.tsx`
- `components/admin/user-form.tsx`
- `lib/hooks/queries/use-users.ts`

**Acceptance Criteria**:
- ✅ User list displays all users
- ✅ Search filters by name/email
- ✅ Role filter works
- ✅ User cards show role badges
- ✅ Create user form validates
- ✅ Edit user updates correctly
- ✅ Activation/deactivation works
- ✅ Password reset sends notification
- ✅ Only admins can access
- ✅ Audit log tracks changes

---

### Task 7.2: System Settings [D: 2.1] [P]
**Dependencies**: Task 2.1  
**Estimated Time**: 8 hours

**Actions**:
- [ ] Create settings screen with tabs
- [ ] Build store settings form
- [ ] Add tax rate configuration UI
- [ ] Implement receipt customization
- [ ] Add sync settings configuration
- [ ] Create system info display
- [ ] Implement settings persistence (app_settings table)
- [ ] Add settings validation

**Files**:
- `app/(auth)/(admin)/settings/index.tsx`
- `components/admin/store-settings-form.tsx`
- `components/admin/tax-settings-form.tsx`
- `components/admin/receipt-settings-form.tsx`
- `components/admin/sync-settings-form.tsx`
- `components/admin/system-info.tsx`

**Settings Categories**:
- Store: name, address, tax ID, logo
- Tax: rates by category
- Receipt: header/footer text, logo
- Sync: frequency, conflict resolution
- System: app version, DB size, sync status

**Acceptance Criteria**:
- ✅ Settings tabs navigate correctly
- ✅ Store info saves and loads
- ✅ Tax rates configurable per category
- ✅ Receipt customization previews
- ✅ Sync settings apply
- ✅ System info displays correctly
- ✅ Settings persist across restarts
- ✅ Only admins can modify
- ✅ Validation works

---

### Task 7.3: Audit Logs [D: 1.4] [P]
**Dependencies**: Task 1.4  
**Estimated Time**: 4 hours

**Actions**:
- [ ] Complete AuditLogRepository
- [ ] Create audit log list screen
- [ ] Add filtering by user/action/date
- [ ] Display log details
- [ ] Format timestamps
- [ ] Add export logs functionality

**Files**:
- `app/(auth)/(admin)/audit-logs/index.tsx`
- `lib/database/repositories/audit-log-repository.ts`

**Logged Actions**:
- User login/logout
- Product create/update/delete
- Transaction void/refund
- Settings changes
- User management actions
- Sync conflicts

**Acceptance Criteria**:
- ✅ All logs display correctly
- ✅ Filters work
- ✅ Logs searchable
- ✅ Export works
- ✅ Timestamps formatted correctly
- ✅ User names displayed

---

## Phase 8: Polish & Testing (Week 10)

### Task 8.1: Error Handling [All Phases]
**Dependencies**: All previous tasks  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Add ErrorBoundary to all major screens
- [ ] Implement retry logic for failed operations
- [ ] Add timeout handling for API calls
- [ ] Validate all user inputs
- [ ] Create user-friendly error messages
- [ ] Add confirmation dialogs for destructive actions
- [ ] Handle app backgrounding during transactions
- [ ] Test all error scenarios

**Acceptance Criteria**:
- ✅ App doesn't crash on errors
- ✅ Error boundaries catch errors
- ✅ User sees helpful error messages
- ✅ Failed operations retryable
- ✅ Inputs validated
- ✅ Confirmations shown for deletes/voids
- ✅ Interrupted transactions recoverable

---

### Task 8.2: Performance Optimization
**Dependencies**: All previous tasks  
**Estimated Time**: 8 hours

**Actions**:
- [ ] Optimize database queries (verify indexes used)
- [ ] Add React.memo to expensive components
- [ ] Profile component renders
- [ ] Optimize images (compression, caching)
- [ ] Implement code splitting where beneficial
- [ ] Test on low-end device (3+ years old)
- [ ] Measure and meet performance benchmarks
- [ ] Fix any re-render issues

**Benchmarks to Meet**:
- Cold start < 3s
- Transaction processing < 2s
- Product search < 500ms
- Navigation < 300ms
- Scrolling 60 FPS
- Bundle size < 5MB

**Acceptance Criteria**:
- ✅ All benchmarks met
- ✅ No unnecessary re-renders
- ✅ FlatLists optimized (React.memo, keyExtractor, getItemLayout)
- ✅ Images optimized and cached
- ✅ Works smoothly on old devices

---

### Task 8.3: Unit & Integration Tests
**Dependencies**: All previous tasks  
**Estimated Time**: 12 hours

**Actions**:
- [ ] Write unit tests for calculation utilities (100% coverage)
- [ ] Write unit tests for currency formatting (100% coverage)
- [ ] Write unit tests for all repositories (90% coverage)
- [ ] Write integration tests for TanStack Query hooks (80%)
- [ ] Write component tests for UI components (70%)
- [ ] Test offline scenarios
- [ ] Test sync scenarios
- [ ] Verify overall 80% coverage

**Test Files**:
- `lib/utils/__tests__/calculations.test.ts`
- `lib/utils/__tests__/currency.test.ts`
- `lib/database/repositories/__tests__/*.test.ts`
- `lib/hooks/queries/__tests__/*.test.ts`
- `components/__tests__/*.test.tsx`

**Critical Paths (100% Coverage)**:
- Transaction calculation
- Payment processing
- Inventory deduction
- Tax calculation
- Currency formatting
- Sync conflict resolution

**Acceptance Criteria**:
- ✅ 80% overall coverage achieved
- ✅ 100% coverage for critical paths
- ✅ All tests pass
- ✅ Tests run in CI
- ✅ No flaky tests

---

### Task 8.4: Accessibility Review
**Dependencies**: All UI tasks  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Audit all screens with VoiceOver (iOS)
- [ ] Audit all screens with TalkBack (Android)
- [ ] Verify all interactive elements have labels
- [ ] Check touch target sizes (≥ 44x44pt)
- [ ] Verify color contrast (WCAG AA: 4.5:1)
- [ ] Test with larger text sizes
- [ ] Test with "Reduce Motion" enabled
- [ ] Fix any accessibility issues

**Acceptance Criteria**:
- ✅ All interactive elements have accessibilityLabel
- ✅ Touch targets meet minimum size
- ✅ Color contrast meets WCAG AA
- ✅ Screen readers announce correctly
- ✅ Works with large text (200% scale)
- ✅ Respects "Reduce Motion"
- ✅ Focus order logical

---

### Task 8.5: Cross-Platform Testing
**Dependencies**: All previous tasks  
**Estimated Time**: 6 hours

**Actions**:
- [ ] Test all screens on iOS simulator
- [ ] Test all screens on Android emulator
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Test on different screen sizes (small phone, large phone, tablet)
- [ ] Test on older OS versions (iOS 13, Android 8)
- [ ] Fix any platform-specific issues
- [ ] Document any known limitations

**Test Devices**:
- iOS: iPhone SE, iPhone 14, iPad
- Android: Small phone, Large phone, Tablet

**Acceptance Criteria**:
- ✅ Works on iOS 13+
- ✅ Works on Android 8.0+
- ✅ Responsive on all screen sizes
- ✅ No platform-specific crashes
- ✅ Platform conventions respected
- ✅ Looks good on all devices

---

## Checkpoint Validation

After completing all tasks, verify:

### Functionality
- [ ] Complete sale transaction offline
- [ ] Sync transactions when back online
- [ ] Manage products (CRUD)
- [ ] View dashboard with charts
- [ ] Manage users (admin)
- [ ] Configure settings (admin)
- [ ] View audit logs

### Code Quality
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings
- [ ] No `any` types used
- [ ] All files follow naming conventions
- [ ] Code properly documented

### Testing
- [ ] 80% overall test coverage
- [ ] 100% coverage for critical paths
- [ ] All tests pass
- [ ] No flaky tests

### Performance
- [ ] Cold start < 3 seconds
- [ ] Transaction processing < 2 seconds
- [ ] Product search < 500ms
- [ ] Navigation < 300ms
- [ ] Scrolling 60 FPS
- [ ] Bundle size < 5MB

### Accessibility
- [ ] WCAG 2.1 Level AA compliance
- [ ] All interactive elements labeled
- [ ] Touch targets ≥ 44x44pt
- [ ] Color contrast ≥ 4.5:1
- [ ] Screen reader tested

### Platform Support
- [ ] Works on iOS 13+
- [ ] Works on Android 8.0+
- [ ] Tested on tablets
- [ ] Platform-specific UI implemented

---

## Summary

**Total Tasks**: 40 tasks across 8 phases  
**Estimated Duration**: 10 weeks  
**Critical Path**: Foundation → Product → Sales → Sync → Dashboard → Admin → Polish

**Key Dependencies**:
- Phase 1 (Foundation) blocks everything
- SQLite setup blocks all data operations
- Auth blocks protected screens
- UI components block most screens
- Product management needed for sales
- Sales needed for dashboard
- Everything needed before polish/testing

**Parallel Opportunities**:
- UI components can be built in parallel
- Different screens can be built simultaneously once foundation ready
- Testing can happen throughout

---

**Ready to implement?** Start with Phase 1, Task 1.1!

For questions or clarifications, refer back to `plan.md` or `spec.md`.

