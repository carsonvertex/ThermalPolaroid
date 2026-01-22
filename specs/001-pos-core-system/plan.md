# Implementation Plan: POS Core System

## Overview
This document details the technical implementation approach for the POS Core System, using an offline-first architecture with SQLite for local storage, TanStack Query for server state management, and NativeWind (Tailwind CSS) for styling.

## Technology Stack

### Core Framework
- **React Native**: 0.74+
- **Expo**: SDK 51+ (with custom dev client for SQLite)
- **TypeScript**: 5.3+ (strict mode)
- **Expo Router**: File-based routing

### Styling
- **NativeWind**: v4 (Tailwind CSS for React Native)
- **Tailwind CSS**: v3.4+
- **Class Variance Authority (CVA)**: For component variants
- **Design Tokens**: Custom Tailwind config with POS-specific colors

### Data Management
- **Local Database**: `expo-sqlite` (native SQLite)
- **Migrations**: Custom migration system using expo-sqlite
- **Database Schema**: SQL DDL scripts with versioning
- **ORM Alternative**: Direct SQL queries with TypeScript helpers

### Server State Management
- **TanStack Query**: v5 (React Query)
- **HTTP Client**: Native `fetch` API
- **Request Interceptors**: Custom middleware for auth tokens
- **Mutation Queue**: For offline operations

### Global State Management
- **Zustand**: v4.4+ (minimal global state)
  - Auth state (user, tokens)
  - Cart state (current transaction)
  - App state (online status, sync status)
  - UI state (modals, toasts)

### Authentication
- **Storage**: `expo-secure-store` for tokens
- **Strategy**: JWT access + refresh tokens
- **Offline Auth**: Local credential verification

### Additional Libraries
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Charts**: react-native-chart-kit
- **Barcode**: expo-barcode-scanner
- **Printing**: expo-print
- **Image Picker**: expo-image-picker
- **Network Status**: expo-network
- **Camera**: expo-camera (for barcode scanning)
- **File System**: expo-file-system (for image caching)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native UI Layer                    │
│  (Expo Router Screens + NativeWind Components)              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼─────────┐          ┌─────────▼──────────┐
│  Zustand Stores  │          │  TanStack Query    │
│  (Global State)  │          │  (Server State)    │
└────────┬─────────┘          └─────────┬──────────┘
         │                               │
         │                    ┌──────────▼──────────┐
         │                    │  Fetch API Client   │
         │                    │  (with interceptors)│
         │                    └──────────┬──────────┘
         │                               │
┌────────▼─────────────────────┬────────▼────────┐
│   SQLite Database            │   Backend API   │
│   (expo-sqlite)              │   (REST/JSON)   │
│   - users                    │                 │
│   - products                 │                 │
│   - transactions             │                 │
│   - sync_queue               │                 │
└──────────────────────────────┴─────────────────┘
```

### Data Flow

#### Read Flow (Online)
1. Component requests data via TanStack Query hook
2. Query checks cache first
3. If stale/missing, fetch from API
4. On success, update SQLite local database
5. Return data to component

#### Read Flow (Offline)
1. Component requests data via TanStack Query hook
2. Query detects offline status
3. Query fallback to SQLite database
4. Return cached data to component

#### Write Flow (Online)
1. Component submits mutation via TanStack Query
2. Optimistic update to UI
3. Write to SQLite immediately
4. Send request to API
5. On success, mark as synced in SQLite
6. On failure, add to sync queue

#### Write Flow (Offline)
1. Component submits mutation
2. Optimistic update to UI
3. Write to SQLite immediately
4. Add to sync_queue table with 'pending' status
5. Show "pending sync" indicator
6. When online, process sync queue

### Directory Structure

```
react-native-pos/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Auth-protected layout
│   │   ├── _layout.tsx          # Auth guard + role check
│   │   ├── (cashier)/           # Cashier-only screens
│   │   │   ├── _layout.tsx      # Cashier layout (tabs)
│   │   │   ├── sales.tsx        # Main sales screen
│   │   │   ├── checkout.tsx     # Checkout screen
│   │   │   └── receipt.tsx      # Receipt screen
│   │   ├── (manager)/           # Manager screens
│   │   │   ├── _layout.tsx      # Manager layout
│   │   │   ├── dashboard.tsx    # Dashboard
│   │   │   ├── products/        # Product management
│   │   │   │   ├── index.tsx    # Product list
│   │   │   │   ├── [id].tsx     # Product detail
│   │   │   │   └── new.tsx      # New product
│   │   │   ├── inventory/       # Inventory management
│   │   │   │   └── index.tsx
│   │   │   └── transactions/    # Transaction history
│   │   │       ├── index.tsx
│   │   │       └── [id].tsx
│   │   └── (admin)/             # Admin screens
│   │       ├── _layout.tsx
│   │       ├── users/           # User management
│   │       │   ├── index.tsx
│   │       │   ├── [id].tsx
│   │       │   └── new.tsx
│   │       └── settings/        # System settings
│   │           └── index.tsx
│   ├── login.tsx                # Login screen
│   ├── _layout.tsx              # Root layout
│   └── +not-found.tsx           # 404 screen
├── components/                   # Reusable components
│   ├── ui/                      # Base UI components
│   │   ├── button.tsx           # Button with variants
│   │   ├── input.tsx            # Input field
│   │   ├── card.tsx             # Card container
│   │   ├── badge.tsx            # Badge/tag
│   │   ├── modal.tsx            # Modal dialog
│   │   ├── toast.tsx            # Toast notification
│   │   ├── spinner.tsx          # Loading spinner
│   │   └── ...
│   ├── sales/                   # Sales-specific components
│   │   ├── product-grid.tsx     # Product selection grid
│   │   ├── product-card.tsx     # Product card
│   │   ├── cart-item.tsx        # Cart line item
│   │   ├── cart-summary.tsx     # Cart totals
│   │   ├── payment-methods.tsx  # Payment selector
│   │   └── ...
│   ├── dashboard/               # Dashboard components
│   │   ├── kpi-card.tsx         # KPI display card
│   │   ├── sales-chart.tsx      # Sales trend chart
│   │   ├── category-pie.tsx     # Category breakdown
│   │   └── ...
│   └── shared/                  # Shared components
│       ├── search-bar.tsx       # Search input
│       ├── filter-bar.tsx       # Filter controls
│       ├── empty-state.tsx      # Empty state
│       ├── error-boundary.tsx   # Error boundary
│       └── ...
├── lib/                         # Core libraries
│   ├── database/                # SQLite database layer
│   │   ├── index.ts             # Database connection
│   │   ├── schema.ts            # Table definitions
│   │   ├── migrations/          # Migration files
│   │   │   ├── 001_initial.ts
│   │   │   ├── 002_add_sync_queue.ts
│   │   │   └── ...
│   │   ├── repositories/        # Data access layer
│   │   │   ├── user-repository.ts
│   │   │   ├── product-repository.ts
│   │   │   ├── transaction-repository.ts
│   │   │   ├── inventory-repository.ts
│   │   │   └── sync-repository.ts
│   │   └── utils.ts             # DB utility functions
│   ├── api/                     # API client layer
│   │   ├── client.ts            # Fetch client with interceptors
│   │   ├── endpoints/           # API endpoint definitions
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   ├── transactions.ts
│   │   │   ├── users.ts
│   │   │   └── sync.ts
│   │   └── types.ts             # API response types
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-auth.ts          # Authentication hook
│   │   ├── use-online-status.ts # Network status hook
│   │   ├── use-sync.ts          # Sync status hook
│   │   └── queries/             # TanStack Query hooks
│   │       ├── use-products.ts
│   │       ├── use-transactions.ts
│   │       ├── use-users.ts
│   │       └── ...
│   ├── stores/                  # Zustand stores
│   │   ├── auth-store.ts        # Auth state
│   │   ├── cart-store.ts        # Shopping cart
│   │   ├── ui-store.ts          # UI state (modals, toasts)
│   │   └── app-store.ts         # App-wide state
│   ├── sync/                    # Sync engine
│   │   ├── sync-manager.ts      # Main sync orchestrator
│   │   ├── sync-strategies/     # Sync strategies
│   │   │   ├── product-sync.ts
│   │   │   ├── transaction-sync.ts
│   │   │   └── ...
│   │   └── conflict-resolver.ts # Conflict resolution
│   ├── utils/                   # Utility functions
│   │   ├── currency.ts          # Currency formatting
│   │   ├── date.ts              # Date utilities
│   │   ├── validation.ts        # Validation helpers
│   │   ├── calculations.ts      # Tax/total calculations
│   │   └── ...
│   └── types/                   # TypeScript types
│       ├── database.ts          # Database types
│       ├── api.ts               # API types
│       └── domain.ts            # Domain models
├── constants/                   # Constants
│   ├── config.ts                # App configuration
│   ├── roles.ts                 # User roles
│   └── theme.ts                 # Theme colors (for Tailwind)
├── tailwind.config.js           # Tailwind configuration
├── global.css                   # Global styles
└── tsconfig.json                # TypeScript config
```

## Implementation Phases

### Phase 1: Foundation & Setup (Week 1)

#### 1.1: Project Setup
**Goal**: Configure development environment

**Tasks**:
1. Install NativeWind and configure Tailwind
2. Set up expo-sqlite and create database connection
3. Configure TanStack Query provider
4. Set up Zustand stores
5. Create base UI components with NativeWind
6. Configure TypeScript paths and imports

**Files**:
- `tailwind.config.js` - Tailwind configuration
- `global.css` - Global styles import
- `app/_layout.tsx` - Root layout with providers
- `lib/database/index.ts` - Database connection
- `components/ui/*` - Base components

**Acceptance Criteria**:
- NativeWind styling works
- SQLite database connects
- TanStack Query provider configured
- Base UI components render with Tailwind classes

#### 1.2: Database Schema & Migrations
**Goal**: Create database schema and migration system

**Tasks**:
1. Design SQL schema for all tables
2. Create migration runner
3. Write initial migration (001_initial.ts)
4. Create database repositories
5. Write database utility functions
6. Test migrations and rollback

**Files**:
- `lib/database/schema.ts` - Table definitions
- `lib/database/migrations/001_initial.ts` - Initial schema
- `lib/database/repositories/*.ts` - Data access layer
- `lib/database/utils.ts` - DB utilities

**SQL Schema**:
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier')),
  is_active INTEGER DEFAULT 1,
  store_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER
);

-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price INTEGER NOT NULL, -- in cents
  cost INTEGER, -- in cents
  tax_rate REAL NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  image_url TEXT,
  image_local_path TEXT,
  is_active INTEGER DEFAULT 1,
  store_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  synced_at INTEGER,
  last_modified_by TEXT
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);

-- Transactions table
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('completed', 'voided', 'refunded', 'pending')),
  subtotal INTEGER NOT NULL, -- in cents
  tax_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  amount_tendered INTEGER,
  change_due INTEGER,
  cashier_id TEXT NOT NULL,
  store_id TEXT,
  created_at INTEGER NOT NULL,
  voided_at INTEGER,
  voided_by TEXT,
  refunded_at INTEGER,
  refunded_by TEXT,
  sync_status TEXT DEFAULT 'pending' CHECK(sync_status IN ('synced', 'pending', 'failed')),
  synced_at INTEGER,
  sync_error TEXT,
  notes TEXT,
  FOREIGN KEY (cashier_id) REFERENCES users(id)
);

CREATE INDEX idx_transactions_receipt ON transactions(receipt_number);
CREATE INDEX idx_transactions_cashier ON transactions(cashier_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_transactions_sync ON transactions(sync_status);

-- Transaction Items table
CREATE TABLE transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL, -- snapshot
  product_sku TEXT NOT NULL, -- snapshot
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL, -- in cents, snapshot
  tax_rate REAL NOT NULL, -- snapshot
  subtotal INTEGER NOT NULL,
  tax_amount INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);

-- Inventory Adjustments table
CREATE TABLE inventory_adjustments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK(adjustment_type IN ('add', 'remove', 'set', 'sale', 'refund')),
  quantity_before INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  user_id TEXT NOT NULL,
  transaction_id TEXT,
  store_id TEXT,
  created_at INTEGER NOT NULL,
  sync_status TEXT DEFAULT 'pending',
  synced_at INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);

CREATE INDEX idx_inventory_product ON inventory_adjustments(product_id);
CREATE INDEX idx_inventory_created ON inventory_adjustments(created_at DESC);

-- Sync Queue table
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('create', 'update', 'delete')),
  data TEXT NOT NULL, -- JSON
  retry_count INTEGER DEFAULT 0,
  last_attempt INTEGER,
  error TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_sync_queue_created ON sync_queue(created_at ASC);

-- Audit Logs table
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata TEXT, -- JSON
  ip_address TEXT,
  device_info TEXT,
  store_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- App Settings table (key-value store)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
```

**Acceptance Criteria**:
- All tables created successfully
- Indexes created for performance
- Migration system runs forward/backward
- Repository methods work correctly
- Foreign key constraints enforced

#### 1.3: Authentication System
**Goal**: Implement user authentication

**Tasks**:
1. Create auth store (Zustand)
2. Build login screen UI
3. Implement login API call
4. Store tokens securely (expo-secure-store)
5. Create auth hook (useAuth)
6. Implement auto token refresh
7. Create logout functionality
8. Add offline authentication support

**Files**:
- `lib/stores/auth-store.ts` - Auth state
- `lib/api/endpoints/auth.ts` - Auth API calls
- `lib/hooks/use-auth.ts` - Auth hook
- `app/login.tsx` - Login screen
- `app/(auth)/_layout.tsx` - Auth guard

**Auth Flow**:
```typescript
// lib/stores/auth-store.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

// Login flow:
// 1. Call API with credentials
// 2. Store tokens in SecureStore
// 3. Store user in SQLite
// 4. Update Zustand state
// 5. Navigate to main app
```

**Acceptance Criteria**:
- User can login with valid credentials
- Tokens stored securely
- Session persists across app restarts
- Auto token refresh works
- Logout clears all auth data
- Offline login works with cached credentials

### Phase 2: Core UI Components & Design System (Week 2)

#### 2.1: Design System with NativeWind
**Goal**: Create comprehensive design system

**Tasks**:
1. Configure Tailwind with custom theme
2. Define color palette in tailwind.config.js
3. Create typography scale
4. Define spacing scale
5. Build base UI components library
6. Create component variants with CVA
7. Document design system

**Tailwind Config**:
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#6b7280',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['Courier'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
};
```

**Base Components**:
```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'rounded-lg font-semibold active:opacity-80',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white',
        secondary: 'bg-gray-200 text-gray-900',
        outline: 'border-2 border-primary-600 text-primary-600',
        ghost: 'bg-transparent text-gray-700',
        danger: 'bg-error text-white',
      },
      size: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-3 text-base',
        lg: 'px-6 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);
```

**Components to Build**:
- Button (with variants)
- Input (text, number, password)
- Card
- Badge
- Modal
- Toast/Notification
- Spinner/Loading
- Avatar
- Dropdown/Select
- Checkbox
- Radio
- Switch/Toggle
- Tabs
- Accordion

**Acceptance Criteria**:
- All base components use NativeWind
- Components have proper variants
- Accessibility labels included
- Touch targets meet 44x44pt minimum
- Components documented with examples

#### 2.2: Navigation & Layout Structure
**Goal**: Set up navigation and layout guards

**Tasks**:
1. Configure Expo Router layouts
2. Create auth guard for protected routes
3. Create role-based route guards
4. Build navigation tabs for cashier
5. Build drawer/tabs for manager/admin
6. Add online/offline status indicator
7. Create shared header component

**Files**:
- `app/_layout.tsx` - Root layout (providers)
- `app/(auth)/_layout.tsx` - Auth guard
- `app/(auth)/(cashier)/_layout.tsx` - Cashier tabs
- `app/(auth)/(manager)/_layout.tsx` - Manager navigation
- `app/(auth)/(admin)/_layout.tsx` - Admin navigation
- `components/shared/status-bar.tsx` - Status indicators

**Auth Guard Logic**:
```typescript
// app/(auth)/_layout.tsx
export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return null;

  // Role-based routing
  if (user?.role === 'cashier') {
    return <Redirect href="/(auth)/(cashier)/sales" />;
  }
  // ... other roles

  return <Slot />;
}
```

**Acceptance Criteria**:
- Unauthenticated users redirected to login
- Role-based navigation works
- Online/offline indicator visible
- Navigation persists across app restarts
- Back navigation works correctly

### Phase 3: Product Management (Week 3)

#### 3.1: Product Repository & Queries
**Goal**: Implement product data layer

**Tasks**:
1. Create product repository with CRUD methods
2. Build TanStack Query hooks for products
3. Implement product search with SQL FTS
4. Add product filtering logic
5. Create optimistic updates for mutations
6. Handle offline product creation
7. Add image caching logic

**Files**:
- `lib/database/repositories/product-repository.ts`
- `lib/api/endpoints/products.ts`
- `lib/hooks/queries/use-products.ts`
- `lib/hooks/queries/use-product-mutations.ts`

**Product Repository**:
```typescript
// lib/database/repositories/product-repository.ts
export class ProductRepository {
  constructor(private db: SQLiteDatabase) {}

  async findAll(filters?: ProductFilters): Promise<Product[]> {
    let query = 'SELECT * FROM products WHERE is_active = 1';
    const params: any[] = [];

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters?.search) {
      query += ' AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
      const search = `%${filters.search}%`;
      params.push(search, search, search);
    }

    if (filters?.lowStock) {
      query += ' AND stock_quantity <= low_stock_threshold';
    }

    query += ' ORDER BY name ASC';

    const result = await this.db.getAllAsync(query, params);
    return result.map(this.mapToProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const result = await this.db.getFirstAsync(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return result ? this.mapToProduct(result) : null;
  }

  async findBySKU(sku: string): Promise<Product | null> {
    const result = await this.db.getFirstAsync(
      'SELECT * FROM products WHERE sku = ?',
      [sku]
    );
    return result ? this.mapToProduct(result) : null;
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const id = crypto.randomUUID();
    const now = Date.now();

    await this.db.runAsync(
      `INSERT INTO products (
        id, sku, barcode, name, description, category,
        price, cost, tax_rate, stock_quantity, low_stock_threshold,
        image_url, is_active, store_id, created_at, updated_at, last_modified_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, product.sku, product.barcode, product.name, product.description,
        product.category, product.price, product.cost, product.taxRate,
        product.stockQuantity, product.lowStockThreshold, product.imageUrl,
        product.isActive ? 1 : 0, product.storeId, now, now, product.lastModifiedBy
      ]
    );

    return this.findById(id)!;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const now = Date.now();
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${this.toSnakeCase(key)} = ?`);
        values.push(value);
      }
    });

    fields.push('updated_at = ?');
    values.push(now, id);

    await this.db.runAsync(
      `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return this.findById(id)!;
  }

  async delete(id: string): Promise<void> {
    await this.db.runAsync(
      'UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?',
      [Date.now(), id]
    );
  }

  async updateStock(id: string, quantity: number): Promise<void> {
    await this.db.runAsync(
      'UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ?',
      [quantity, Date.now(), id]
    );
  }

  private mapToProduct(row: any): Product {
    return {
      id: row.id,
      sku: row.sku,
      barcode: row.barcode,
      name: row.name,
      description: row.description,
      category: row.category,
      price: row.price,
      cost: row.cost,
      taxRate: row.tax_rate,
      stockQuantity: row.stock_quantity,
      lowStockThreshold: row.low_stock_threshold,
      imageUrl: row.image_url,
      imageLocalPath: row.image_local_path,
      isActive: row.is_active === 1,
      storeId: row.store_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
      lastModifiedBy: row.last_modified_by,
    };
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}
```

**TanStack Query Hooks**:
```typescript
// lib/hooks/queries/use-products.ts
export function useProducts(filters?: ProductFilters) {
  const isOnline = useOnlineStatus();
  const productRepo = useProductRepository();

  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      if (isOnline) {
        // Fetch from API
        const products = await fetchProducts(filters);
        // Update local DB
        await syncProductsToLocal(products);
        return products;
      } else {
        // Fetch from SQLite
        return await productRepo.findAll(filters);
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProduct(id: string) {
  const isOnline = useOnlineStatus();
  const productRepo = useProductRepository();

  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (isOnline) {
        const product = await fetchProduct(id);
        await productRepo.update(id, product);
        return product;
      } else {
        return await productRepo.findById(id);
      }
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const productRepo = useProductRepository();
  const syncQueue = useSyncQueue();

  return useMutation({
    mutationFn: async (newProduct: CreateProductInput) => {
      // Always save to local DB first
      const product = await productRepo.create(newProduct);

      if (isOnline) {
        // Try to sync to server
        try {
          await createProductAPI(product);
          await productRepo.update(product.id, { syncedAt: new Date() });
        } catch (error) {
          // Add to sync queue if API fails
          await syncQueue.add('product', product.id, 'create', product);
        }
      } else {
        // Offline: add to sync queue
        await syncQueue.add('product', product.id, 'create', product);
      }

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const productRepo = useProductRepository();
  const syncQueue = useSyncQueue();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const product = await productRepo.update(id, updates);

      if (isOnline) {
        try {
          await updateProductAPI(id, updates);
          await productRepo.update(id, { syncedAt: new Date() });
        } catch (error) {
          await syncQueue.add('product', id, 'update', updates);
        }
      } else {
        await syncQueue.add('product', id, 'update', updates);
      }

      return product;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

**Acceptance Criteria**:
- Products query from SQLite when offline
- Products sync from API when online
- Search works with partial matching
- Filters work correctly
- Optimistic updates work
- Offline mutations queue for sync
- Images cache locally

#### 3.2: Product Management UI
**Goal**: Build product management screens

**Tasks**:
1. Create product list screen with search/filters
2. Build product card component
3. Create product detail/edit screen
4. Build product form with validation
5. Add image picker for product photos
6. Create barcode scanner component
7. Add low stock indicators
8. Build empty states

**Files**:
- `app/(auth)/(manager)/products/index.tsx` - Product list
- `app/(auth)/(manager)/products/[id].tsx` - Product detail
- `app/(auth)/(manager)/products/new.tsx` - New product
- `components/products/product-card.tsx`
- `components/products/product-form.tsx`
- `components/products/barcode-scanner.tsx`

**Product List Screen**:
```typescript
// app/(auth)/(manager)/products/index.tsx
export default function ProductsScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [showLowStock, setShowLowStock] = useState(false);

  const { data: products, isLoading } = useProducts({
    search,
    category,
    lowStock: showLowStock,
  });

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4  border-b border-gray-200">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search products..."
        />
        <FilterBar
          category={category}
          onCategoryChange={setCategory}
          showLowStock={showLowStock}
          onShowLowStockChange=      {setShowLowStock}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : products?.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Add your first product to get started"
          action={{ label: 'Add Product', onPress: () => router.push('/products/new') }}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductCard product={item} />}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4"
          ItemSeparatorComponent={() => <View className="h-3" />}
        />
      )}

      <FAB
        icon="plus"
        onPress={() => router.push('/products/new')}
        accessibilityLabel="Add new product"
      />
    </View>
  );
}
```

**Acceptance Criteria**:
- Product list displays with images
- Search filters products instantly
- Category filter works
- Low stock filter works
- Product cards show stock indicators
- Tap to view product details
- FAB navigates to new product form
- Empty state displays when no products

### Phase 4: Sales Transaction System (Week 4-5)

#### 4.1: Shopping Cart State Management
**Goal**: Build cart functionality with Zustand

**Tasks**:
1. Create cart store with Zustand
2. Implement add to cart logic
3. Add update quantity logic
4. Add remove item logic
5. Calculate subtotal, tax, total
6. Implement discount logic
7. Add hold/clear cart
8. Persist cart to local storage

**Cart Store**:
```typescript
// lib/stores/cart-store.ts
interface CartItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number; // in cents
  taxRate: number;
}

interface CartState {
  items: CartItem[];
  discountAmount: number; // in cents
  discountType: 'fixed' | 'percentage';
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (amount: number, type: 'fixed' | 'percentage') => void;
  clearCart: () => void;
  holdCart: () => void;
  loadCart: (cartId: string) => void;
  
  // Computed values
  subtotal: () => number;
  taxAmount: () => number;
  discountTotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discountAmount: 0,
      discountType: 'fixed',

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find(item => item.productId === product.id);

        if (existingItem) {
          set({
            items: items.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.id,
                productName: product.name,
                productSku: product.sku,
                quantity,
                unitPrice: product.price,
                taxRate: product.taxRate,
              },
            ],
          });
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.productId !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.productId === productId
              ? { ...item, quantity }
              : item
          ),
        });
      },

      setDiscount: (amount, type) => {
        set({ discountAmount: amount, discountType: type });
      },

      clearCart: () => {
        set({ items: [], discountAmount: 0, discountType: 'fixed' });
      },

      holdCart: () => {
        // Save cart to held_carts table
        // Implementation depends on your needs
      },

      loadCart: (cartId) => {
        // Load cart from held_carts table
      },

      subtotal: () => {
        return get().items.reduce((sum, item) => {
          return sum + (item.unitPrice * item.quantity);
        }, 0);
      },

      taxAmount: () => {
        return get().items.reduce((sum, item) => {
          const itemSubtotal = item.unitPrice * item.quantity;
          return sum + (itemSubtotal * item.taxRate);
        }, 0);
      },

      discountTotal: () => {
        const { discountAmount, discountType, subtotal } = get();
        if (discountType === 'fixed') {
          return Math.min(discountAmount, subtotal());
        } else {
          // Percentage discount
          return Math.floor((subtotal() * discountAmount) / 100);
        }
      },

      total: () => {
        const { subtotal, taxAmount, discountTotal } = get();
        return subtotal() + taxAmount() - discountTotal();
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

**Acceptance Criteria**:
- Items add to cart correctly
- Quantities update properly
- Items remove from cart
- Subtotal calculates correctly
- Tax calculates correctly
- Discounts apply correctly
- Cart persists across app restarts
- Cart clears on logout

#### 4.2: Sales Screen UI
**Goal**: Build main sales/POS screen

**Tasks**:
1. Create split-panel layout (products + cart)
2. Build product grid with search
3. Build cart items list
4. Create cart summary component
5. Add payment method selector
6. Build checkout button
7. Add hold/clear actions
8. Implement barcode scanning

**Sales Screen**:
```typescript
// app/(auth)/(cashier)/sales.tsx
export default function SalesScreen() {
  const [search, setSearch] = useState('');
  const { data: products } = useProducts({ search });
  const { items, addItem, removeItem, updateQuantity, subtotal, taxAmount, total, clearCart } =
    useCartStore();
  const router = useRouter();

  const handleProductSelect = (product: Product) => {
    if (product.stockQuantity > 0) {
      addItem(product);
    } else {
      Toast.show({ type: 'error', text1: 'Product out of stock' });
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Toast.show({ type: 'error', text1: 'Cart is empty' });
      return;
    }
    router.push('/(auth)/(cashier)/checkout');
  };

  return (
    <View className="flex-1 flex-row bg-gray-50">
      {/* Left Panel - Products (60%) */}
      <View className="flex-[3] border-r border-gray-300">
        <View className="p-4  border-b border-gray-200">
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Search or scan product..."
            rightIcon={
              <TouchableOpacity onPress={() => router.push('/scan-barcode')}>
                <Icon name="barcode-scan" size={24} />
              </TouchableOpacity>
            }
          />
        </View>

        <FlatList
          data={products}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleProductSelect(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerClassName="p-4"
          columnWrapperClassName="gap-3"
          ItemSeparatorComponent={() => <View className="h-3" />}
        />
      </View>

      {/* Right Panel - Cart (40%) */}
      <View className="flex-[2] ">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold">Current Sale</Text>
        </View>

        {items.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <Icon name="shopping-cart" size={64} className="text-gray-300 mb-4" />
            <Text className="text-gray-500 text-center">
              Cart is empty{'\n'}Add items to start a sale
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              renderItem={({ item }) => (
                <CartItem
                  item={item}
                  onQuantityChange={(qty) => updateQuantity(item.productId, qty)}
                  onRemove={() => removeItem(item.productId)}
                />
              )}
              keyExtractor={(item) => item.productId}
              className="flex-1"
              contentContainerClassName="p-4"
            />

            <View className="border-t border-gray-200 p-4">
              <CartSummary
                subtotal={subtotal()}
                taxAmount={taxAmount()}
                total={total()}
              />

              <View className="flex-row gap-2 mt-4">
                <Button
                  variant="outline"
                  size="md"
                  onPress={clearCart}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onPress={handleCheckout}
                  className="flex-[2]"
                >
                  Checkout
                </Button>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
```

**Acceptance Criteria**:
- Split-panel layout works on tablets
- Products display in grid
- Search filters products instantly
- Tap product adds to cart
- Cart shows all items
- Quantities can be changed
- Items can be removed
- Summary shows correct totals
- Checkout button navigates to checkout
- Clear button empties cart

#### 4.3: Checkout & Payment Processing
**Goal**: Complete transaction checkout flow

**Tasks**:
1. Create checkout screen UI
2. Build payment method selector
3. Add cash payment with change calculation
4. Create transaction repository
5. Implement transaction creation logic
6. Add inventory deduction logic
7. Create receipt generation
8. Handle offline transactions

**Checkout Screen**:
```typescript
// app/(auth)/(cashier)/checkout.tsx
export default function CheckoutScreen() {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuth();
  const createTransaction = useCreateTransaction();
  const router = useRouter();

  const totalAmount = total();
  const tenderedAmount = parseFloat(amountTendered) * 100 || 0;
  const changeDue = Math.max(0, tenderedAmount - totalAmount);

  const handleCompleteSale = async () => {
    if (paymentMethod === 'cash' && tenderedAmount < totalAmount) {
      Toast.show({ type: 'error', text1: 'Insufficient amount tendered' });
      return;
    }

    try {
      const transaction = await createTransaction.mutateAsync({
        items,
        paymentMethod,
        amountTendered: paymentMethod === 'cash' ? tenderedAmount : undefined,
        changeDue: paymentMethod === 'cash' ? changeDue : undefined,
        cashierId: user!.id,
      });

      clearCart();
      router.replace({
        pathname: '/(auth)/(cashier)/receipt',
        params: { transactionId: transaction.id },
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Transaction failed',
        text2: error.message,
      });
    }
  };

  return (
    <View className="flex-1 ">
      <View className="p-6">
        <Text className="text-2xl font-bold mb-6">Complete Payment</Text>

        {/* Order Summary */}
        <Card className="mb-6">
          <Text className="text-lg font-semibold mb-2">Order Summary</Text>
          {items.map((item) => (
            <View key={item.productId} className="flex-row justify-between py-2">
              <Text className="flex-1">{item.productName} x{item.quantity}</Text>
              <Text className="font-semibold">
                {formatCurrency((item.unitPrice * item.quantity) / 100)}
              </Text>
            </View>
          ))}
          <View className="border-t border-gray-200 mt-2 pt-2">
            <View className="flex-row justify-between">
              <Text className="text-xl font-bold">Total</Text>
              <Text className="text-xl font-bold text-primary-600">
                {formatCurrency(totalAmount / 100)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Payment Method */}
        <Text className="text-lg font-semibold mb-3">Payment Method</Text>
        <View className="flex-row gap-3 mb-6">
          <Button
            variant={paymentMethod === 'cash' ? 'primary' : 'outline'}
            onPress={() => setPaymentMethod('cash')}
            className="flex-1"
          >
            Cash
          </Button>
          <Button
            variant={paymentMethod === 'card' ? 'primary' : 'outline'}
            onPress={() => setPaymentMethod('card')}
            className="flex-1"
          >
            Card
          </Button>
          <Button
            variant={paymentMethod === 'other' ? 'primary' : 'outline'}
            onPress={() => setPaymentMethod('other')}
            className="flex-1"
          >
            Other
          </Button>
        </View>

        {/* Cash Payment Details */}
        {paymentMethod === 'cash' && (
          <View className="mb-6">
            <Text className="text-lg font-semibold mb-3">Amount Tendered</Text>
            <Input
              keyboardType="numeric"
              value={amountTendered}
              onChangeText={setAmountTendered}
              placeholder="0.00"
              className="text-2xl"
              autoFocus
            />

            {tenderedAmount >= totalAmount && (
              <Card className="mt-4 bg-success/10 border-success">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-semibold">Change Due</Text>
                  <Text className="text-2xl font-bold text-success">
                    {formatCurrency(changeDue / 100)}
                  </Text>
                </View>
              </Card>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-3">
          <Button
            variant="outline"
            size="lg"
            onPress={() => router.back()}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={handleCompleteSale}
            isLoading={createTransaction.isPending}
            disabled={paymentMethod === 'cash' && tenderedAmount < totalAmount}
            className="flex-[2]"
          >
            Complete Sale
          </Button>
        </View>
      </View>
    </View>
  );
}
```

**Transaction Creation**:
```typescript
// lib/hooks/queries/use-transactions.ts
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const transactionRepo = useTransactionRepository();
  const inventoryRepo = useInventoryRepository();
  const isOnline = useOnlineStatus();
  const syncQueue = useSyncQueue();

  return useMutation({
    mutationFn: async (data: CreateTransactionInput) => {
      const transactionId = crypto.randomUUID();
      const receiptNumber = await generateReceiptNumber();
      const now = Date.now();

      // Calculate totals
      const subtotal = data.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      const taxAmount = data.items.reduce((sum, item) => {
        const itemSubtotal = item.unitPrice * item.quantity;
        return sum + itemSubtotal * item.taxRate;
      }, 0);
      const total = subtotal + taxAmount;

      // Create transaction
      const transaction = await transactionRepo.create({
        id: transactionId,
        receiptNumber,
        status: 'completed',
        subtotal,
        taxAmount,
        discountAmount: 0,
        total,
        paymentMethod: data.paymentMethod,
        amountTendered: data.amountTendered,
        changeDue: data.changeDue,
        cashierId: data.cashierId,
        storeId: data.storeId,
        createdAt: now,
        syncStatus: isOnline ? 'synced' : 'pending',
      });

      // Create transaction items
      for (const item of data.items) {
        await transactionRepo.createItem({
          transactionId,
          ...item,
          subtotal: item.unitPrice * item.quantity,
          taxAmount: item.unitPrice * item.quantity * item.taxRate,
          total: item.unitPrice * item.quantity * (1 + item.taxRate),
        });

        // Deduct inventory
        const product = await inventoryRepo.findById(item.productId);
        if (product) {
          await inventoryRepo.adjustStock({
            productId: item.productId,
            adjustmentType: 'sale',
            quantityBefore: product.stockQuantity,
            quantityChange: -item.quantity,
            quantityAfter: product.stockQuantity - item.quantity,
            transactionId,
            userId: data.cashierId,
          });
        }
      }

      // Sync to server if online
      if (isOnline) {
        try {
          await createTransactionAPI(transaction);
          await transactionRepo.update(transactionId, {
            syncStatus: 'synced',
            syncedAt: Date.now(),
          });
        } catch (error) {
          await syncQueue.add('transaction', transactionId, 'create', transaction);
        }
      } else {
        await syncQueue.add('transaction', transactionId, 'create', transaction);
      }

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
```

**Acceptance Criteria**:
- Order summary displays correctly
- Payment method selection works
- Cash payment calculates change
- Card payment doesn't require amount tendered
- Transaction saves to database
- Inventory deducts correctly
- Receipt number generates
- Offline transactions queue for sync
- Navigation to receipt screen works

### Phase 5: Offline Sync Engine (Week 6-7)

#### 5.1: Sync Queue System
**Goal**: Build robust sync queue

**Tasks**:
1. Create sync queue repository
2. Build sync manager
3. Implement retry logic with exponential backoff
4. Add sync status tracking
5. Create conflict resolution logic
6. Build batch sync for efficiency
7. Add sync progress indicator
8. Handle partial sync failures

**Sync Manager**:
```typescript
// lib/sync/sync-manager.ts
export class SyncManager {
  private issyncing = false;
  private retryDelays = [1000, 2000, 5000, 10000, 30000]; // ms

  constructor(
    private syncQueueRepo: SyncQueueRepository,
    private apiClient: APIClient
  ) {}

  async startSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress' };
    }

    this.isSyncing = true;

    try {
      // Get pending sync items
      const pendingItems = await this.syncQueueRepo.getPending();

      if (pendingItems.length === 0) {
        return { success: true, synced: 0 };
      }

      // Group by entity type for batch processing
      const groups = this.groupByEntityType(pendingItems);

      let syncedCount = 0;
      const errors: SyncError[] = [];

      // Sync each group
      for (const [entityType, items] of Object.entries(groups)) {
        try {
          await this.syncBatch(entityType, items);
          syncedCount += items.length;
        } catch (error) {
          errors.push({ entityType, error: error.message });
        }
      }

      return {
        success: errors.length === 0,
        synced: syncedCount,
        failed: pendingItems.length - syncedCount,
        errors,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncBatch(entityType: string, items: SyncQueueItem[]): Promise<void> {
    const endpoint = this.getEndpoint(entityType);

    for (const item of items) {
      try {
        await this.syncItem(endpoint, item);
        await this.syncQueueRepo.remove(item.id);
      } catch (error) {
        await this.handleSyncError(item, error);
      }
    }
  }

  private async syncItem(endpoint: string, item: SyncQueueItem): Promise<void> {
    const data = JSON.parse(item.data);

    switch (item.operation) {
      case 'create':
        await this.apiClient.post(endpoint, data);
        break;
      case 'update':
        await this.apiClient.put(`${endpoint}/${item.entityId}`, data);
        break;
      case 'delete':
        await this.apiClient.delete(`${endpoint}/${item.entityId}`);
        break;
    }
  }

  private async handleSyncError(item: SyncQueueItem, error: Error): Promise<void> {
    const retryCount = item.retryCount + 1;

    if (retryCount >= this.retryDelays.length) {
      // Max retries reached, mark as failed
      await this.syncQueueRepo.update(item.id, {
        error: error.message,
        lastAttempt: Date.now(),
      });
    } else {
      // Schedule retry
      await this.syncQueueRepo.update(item.id, {
        retryCount,
        lastAttempt: Date.now(),
        error: error.message,
      });
    }
  }

  private groupByEntityType(items: SyncQueueItem[]): Record<string, SyncQueueItem[]> {
    return items.reduce((groups, item) => {
      const type = item.entityType;
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
      return groups;
    }, {} as Record<string, SyncQueueItem[]>);
  }

  private getEndpoint(entityType: string): string {
    const endpoints: Record<string, string> = {
      product: '/api/products',
      transaction: '/api/transactions',
      inventory: '/api/inventory-adjustments',
      user: '/api/users',
    };
    return endpoints[entityType] || '/api/sync';
  }
}
```

**Background Sync**:
```typescript
// lib/sync/background-sync.ts
export function useBackgroundSync() {
  const isOnline = useOnlineStatus();
  const syncManager = useSyncManager();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    if (!isOnline) return;

    // Start sync when coming online
    const syncInterval = setInterval(async () => {
      if (syncStatus === 'syncing') return;

      setSyncStatus('syncing');
      try {
        const result = await syncManager.startSync();
        setSyncStatus(result.success ? 'success' : 'error');
      } catch (error) {
        setSyncStatus('error');
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [isOnline, syncStatus]);

  const manualSync = async () => {
    setSyncStatus('syncing');
    try {
      const result = await syncManager.startSync();
      setSyncStatus(result.success ? 'success' : 'error');
      return result;
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  return { syncStatus, manualSync };
}
```

**Acceptance Criteria**:
- Sync queue stores pending operations
- Background sync runs automatically when online
- Retry logic works with exponential backoff
- Failed syncs tracked and retried
- Sync status visible to user
- Manual sync trigger works
- Batch syncing improves performance
- Partial failures don't block successful syncs

#### 5.2: Conflict Resolution
**Goal**: Handle sync conflicts intelligently

**Tasks**:
1. Detect conflicts (timestamp comparison)
2. Implement last-write-wins strategy
3. Log conflicts for audit
4. Handle concurrent edits
5. Resolve product conflicts
6. Resolve transaction conflicts (should be rare)
7. Add conflict notification system

**Conflict Resolver**:
```typescript
// lib/sync/conflict-resolver.ts
export class ConflictResolver {
  constructor(
    private auditLogRepo: AuditLogRepository
  ) {}

  async resolveProductConflict(
    local: Product,
    remote: Product
  ): Promise<Product> {
    // Last-write-wins based on updatedAt timestamp
    const winner = local.updatedAt > remote.updatedAt ? local : remote;

    // Log conflict
    await this.auditLogRepo.create({
      userId: 'system',
      action: 'conflict_resolved',
      entityType: 'product',
      entityId: local.id,
      metadata: {
        strategy: 'last-write-wins',
        localUpdatedAt: local.updatedAt,
        remoteUpdatedAt: remote.updatedAt,
        winner: winner.updatedAt === local.updatedAt ? 'local' : 'remote',
      },
    });

    return winner;
  }

  async resolveTransactionConflict(
    local: Transaction,
    remote: Transaction
  ): Promise<Transaction> {
    // Transactions should rarely conflict
    // If they do, prefer the local version (device of truth)
    // But log for admin review

    await this.auditLogRepo.create({
      userId: 'system',
      action: 'transaction_conflict',
      entityType: 'transaction',
      entityId: local.id,
      metadata: {
        localStatus: local.status,
        remoteStatus: remote.status,
        resolution: 'keep_local',
      },
    });

    return local;
  }
}
```

**Acceptance Criteria**:
- Conflicts detected by timestamp comparison
- Last-write-wins strategy applied
- All conflicts logged to audit trail
- Product conflicts resolve automatically
- Transaction conflicts prefer local version
- Conflict notifications sent to admins
- Conflict resolution doesn't lose data

### Phase 6: Dashboard & Reporting (Week 8)

#### 6.1: Dashboard Data Layer
**Goal**: Build dashboard queries and aggregations

**Tasks**:
1. Create dashboard repository with SQL aggregations
2. Build TanStack Query hooks for KPIs
3. Implement date range filtering
4. Calculate sales trends
5. Get top products
6. Calculate category breakdown
7. Cache dashboard data appropriately

**Dashboard Repository**:
```typescript
// lib/database/repositories/dashboard-repository.ts
export class DashboardRepository {
  async getSalesSummary(startDate: Date, endDate: Date): Promise<SalesSummary> {
    const start = startDate.getTime();
    const end = endDate.getTime();

    const result = await this.db.getFirstAsync(`
      SELECT
        COUNT(*) as transaction_count,
        SUM(total) as total_sales,
        AVG(total) as average_transaction
      FROM transactions
      WHERE status = 'completed'
        AND created_at BETWEEN ? AND ?
    `, [start, end]);

    return {
      transactionCount: result.transaction_count,
      totalSales: result.total_sales,
      averageTransaction: result.average_transaction,
    };
  }

  async getSalesTrend(days: number): Promise<SalesTrendData[]> {
    const endDate = Date.now();
    const startDate = endDate - (days * 24 * 60 * 60 * 1000);

    const results = await this.db.getAllAsync(`
      SELECT
        DATE(created_at / 1000, 'unixepoch') as date,
        SUM(total) as sales,
        COUNT(*) as transactions
      FROM transactions
      WHERE status = 'completed'
        AND created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at / 1000, 'unixepoch')
      ORDER BY date ASC
    `, [startDate, endDate]);

    return results.map(row => ({
      date: row.date,
      sales: row.sales,
      transactions: row.transactions,
    }));
  }

  async getTopProducts(limit: number, startDate: Date, endDate: Date): Promise<TopProduct[]> {
    const start = startDate.getTime();
    const end = endDate.getTime();

    const results = await this.db.getAllAsync(`
      SELECT
        ti.product_id,
        ti.product_name,
        SUM(ti.quantity) as total_quantity,
        SUM(ti.total) as total_revenue
      FROM transaction_items ti
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.status = 'completed'
        AND t.created_at BETWEEN ? AND ?
      GROUP BY ti.product_id
      ORDER BY total_revenue DESC
      LIMIT ?
    `, [start, end, limit]);

    return results;
  }

  async getCategoryBreakdown(startDate: Date, endDate: Date): Promise<CategorySales[]> {
    const start = startDate.getTime();
    const end = endDate.getTime();

    const results = await this.db.getAllAsync(`
      SELECT
        p.category,
        SUM(ti.total) as total_sales,
        COUNT(DISTINCT ti.transaction_id) as transaction_count
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE t.status = 'completed'
        AND t.created_at BETWEEN ? AND ?
      GROUP BY p.category
      ORDER BY total_sales DESC
    `, [start, end]);

    return results;
  }
}
```

**TanStack Query Hooks**:
```typescript
// lib/hooks/queries/use-dashboard.ts
export function useSalesSummary(dateRange: DateRange) {
  const dashboardRepo = useDashboardRepository();
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['dashboard', 'summary', dateRange],
    queryFn: async () => {
      if (isOnline) {
        // Fetch from API for up-to-date data from all devices
        const data = await fetchDashboardSummary(dateRange);
        return data;
      } else {
        // Fallback to local data
        return await dashboardRepo.getSalesSummary(
          dateRange.startDate,
          dateRange.endDate
        );
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useSalesTrend(days: number) {
  const dashboardRepo = useDashboardRepository();

  return useQuery({
    queryKey: ['dashboard', 'trend', days],
    queryFn: () => dashboardRepo.getSalesTrend(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

**Acceptance Criteria**:
- KPIs calculate correctly from local data
- Date range filtering works
- Sales trends aggregate by day
- Top products ranked by revenue
- Category breakdown calculates correctly
- Dashboard queries perform well (< 500ms)
- Data caches appropriately

#### 6.2: Dashboard UI with Charts
**Goal**: Build visual dashboard

**Tasks**:
1. Create dashboard screen layout
2. Build KPI card components
3. Implement sales trend line chart
4. Create category pie chart
5. Add payment method breakdown
6. Build top products list
7. Add date range picker
8. Implement export functionality

**Dashboard Screen**:
```typescript
// app/(auth)/(manager)/dashboard.tsx
export default function DashboardScreen() {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: startOfToday(),
    endDate: endOfToday(),
  });

  const { data: summary } = useSalesSummary(dateRange);
  const { data: trend } = useSalesTrend(7);
  const { data: topProducts } = useTopProducts(5, dateRange);
  const { data: categoryBreakdown } = useCategoryBreakdown(dateRange);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header with Date Range Picker */}
      <View className="p-4  border-b border-gray-200">
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          presets={['today', 'week', 'month']}
        />
      </View>

      {/* KPI Cards */}
      <View className="p-4 flex-row gap-3">
        <KPICard
          title="Total Sales"
          value={formatCurrency(summary?.totalSales / 100)}
          trend="+12%"
          icon="currency-usd"
          className="flex-1"
        />
        <KPICard
          title="Transactions"
          value={summary?.transactionCount.toString()}
          trend="+5%"
          icon="receipt"
          className="flex-1"
        />
        <KPICard
          title="Avg. Transaction"
          value={formatCurrency(summary?.averageTransaction / 100)}
          trend="-2%"
          icon="trending-up"
          className="flex-1"
        />
      </View>

      {/* Sales Trend Chart */}
      <Card className="mx-4 mb-4">
        <Text className="text-lg font-semibold mb-4">Sales Trend (7 days)</Text>
        <LineChart
          data={{
            labels: trend?.map(d => format(new Date(d.date), 'MM/dd')),
            datasets: [{
              data: trend?.map(d => d.sales / 100) || [],
            }],
          }}
          width={Dimensions.get('window').width - 64}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
          }}
        />
      </Card>

      {/* Category Breakdown */}
      <Card className="mx-4 mb-4">
        <Text className="text-lg font-semibold mb-4">Sales by Category</Text>
        <PieChart
          data={categoryBreakdown?.map((cat, index) => ({
            name: cat.category,
            population: cat.totalSales,
            color: COLORS[index % COLORS.length],
            legendFontColor: '#7F7F7F',
          }))}
          width={Dimensions.get('window').width - 64}
          height={220}
          chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
        />
      </Card>

      {/* Top Products */}
      <Card className="mx-4 mb-4">
        <Text className="text-lg font-semibold mb-4">Top Selling Products</Text>
        {topProducts?.map((product, index) => (
          <View key={product.productId} className="flex-row items-center py-3 border-b border-gray-100">
            <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center mr-3">
              <Text className="text-primary-600 font-bold">{index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold">{product.productName}</Text>
              <Text className="text-gray-500 text-sm">{product.totalQuantity} sold</Text>
            </View>
            <Text className="font-bold text-primary-600">
              {formatCurrency(product.totalRevenue / 100)}
            </Text>
          </View>
        ))}
      </Card>

      {/* Export Button */}
      <Button
        variant="outline"
        size="lg"
        onPress={() => exportReport(dateRange)}
        className="mx-4 mb-8"
      >
        Export Report (PDF)
      </Button>
    </ScrollView>
  );
}
```

**Acceptance Criteria**:
- Dashboard loads quickly (< 2 seconds)
- KPI cards display correct values
- Charts render correctly
- Date range picker works
- Top products list accurate
- Category breakdown visualized
- Export generates PDF report
- Works offline with local data

### Phase 7: Admin Panel (Week 9)

#### 7.1: User Management
**Goal**: Build user management system

**Tasks**:
1. Create user list screen
2. Build user form (create/edit)
3. Implement role selection
4. Add user activation/deactivation
5. Create password reset functionality
6. Build user activity log view
7. Add search/filter users

**User Management Screen**:
```typescript
// app/(auth)/(admin)/users/index.tsx
export default function UsersScreen() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();

  const { data: users } = useUsers({ search, role: roleFilter });
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4  border-b border-gray-200">
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search users..."
        />
        <View className="flex-row gap-2 mt-3">
          <FilterChip
            label="All"
            active={!roleFilter}
            onPress={() => setRoleFilter(undefined)}
          />
          <FilterChip
            label="Admin"
            active={roleFilter === 'admin'}
            onPress={() => setRoleFilter('admin')}
          />
          <FilterChip
            label="Manager"
            active={roleFilter === 'manager'}
            onPress={() => setRoleFilter('manager')}
          />
          <FilterChip
            label="Cashier"
            active={roleFilter === 'cashier'}
            onPress={() => setRoleFilter('cashier')}
          />
        </View>
      </View>

      <FlatList
        data={users}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onPress={() => router.push(`/users/${item.id}`)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4"
      />

      <FAB
        icon="plus"
        onPress={() => router.push('/users/new')}
        accessibilityLabel="Add new user"
      />
    </View>
  );
}
```

**Acceptance Criteria**:
- User list displays all users
- Search filters by name/email
- Role filter works
- User cards show role badges
- Create new user form works
- Edit user functionality works
- User activation/deactivation works
- Only admins can access
- Password reset sends notification

#### 7.2: System Settings
**Goal**: Build settings configuration

**Tasks**:
1. Create settings screen with tabs
2. Build store settings form
3. Add tax rate configuration
4. Implement receipt customization
5. Add sync settings
6. Create system info display
7. Implement settings persistence

**Settings Screen**:
```typescript
// app/(auth)/(admin)/settings/index.tsx
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState('store');

  return (
    <View className="flex-1 bg-gray-50">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="store" label="Store" />
        <Tab value="tax" label="Tax" />
        <Tab value="receipt" label="Receipt" />
        <Tab value="sync" label="Sync" />
        <Tab value="system" label="System" />
      </Tabs>

      <ScrollView className="flex-1">
        {activeTab === 'store' && <StoreSettingsForm />}
        {activeTab === 'tax' && <TaxSettingsForm />}
        {activeTab === 'receipt' && <ReceiptSettingsForm />}
        {activeTab === 'sync' && <SyncSettingsForm />}
        {activeTab === 'system' && <SystemInfo />}
      </ScrollView>
    </View>
  );
}
```

**Acceptance Criteria**:
- Settings tabs navigate correctly
- Store info saves properly
- Tax rates configurable
- Receipt customization works
- Sync settings apply
- System info displays correctly
- Settings persist across restarts
- Only admins can modify

### Phase 8: Polish & Testing (Week 10)

#### 8.1: Error Handling & Edge Cases
**Goal**: Handle all error scenarios

**Tasks**:
1. Add error boundaries to all screens
2. Implement retry logic for failed operations
3. Handle network timeouts gracefully
4. Add validation for all inputs
5. Handle empty states
6. Implement loading skeletons
7. Add confirmation dialogs for destructive actions
8. Handle app backgrounding during transaction

**Acceptance Criteria**:
- App doesn't crash on errors
- User sees helpful error messages
- Failed operations can be retried
- All inputs validated
- Empty states guide users
- Loading states show progress
- Destructive actions require confirmation
- Interrupted transactions recoverable

#### 8.2: Performance Optimization
**Goal**: Ensure app meets performance benchmarks

**Tasks**:
1. Optimize database queries with indexes
2. Implement React.memo for expensive components
3. Add virtualization for long lists
4. Optimize images (compression, caching)
5. Reduce bundle size (code splitting)
6. Profile and fix re-render issues
7. Optimize animations (use Reanimated)
8. Test on low-end devices

**Acceptance Criteria**:
- Cold start < 3 seconds
- Navigation < 300ms
- Scrolling 60 FPS
- Database queries < 100ms
- Bundle size < 5MB
- No unnecessary re-renders
- Works smoothly on 3-year-old devices

#### 8.3: Testing
**Goal**: Achieve test coverage requirements

**Tasks**:
1. Write unit tests for utilities (currency, calculations)
2. Write unit tests for repositories
3. Write integration tests for hooks
4. Write component tests for UI
5. Write E2E tests for critical flows
6. Test offline scenarios
7. Test sync scenarios
8. Test across devices

**Test Coverage Goals**:
- Utilities: 100%
- Calculations: 100%
- Repositories: 90%
- Hooks: 80%
- Components: 70%
- Overall: 80%

**Critical Paths (100% Coverage)**:
- Transaction calculation
- Payment processing
- Inventory deduction
- Tax calculation
- Currency formatting
- Sync conflict resolution

**Acceptance Criteria**:
- 80% overall test coverage achieved
- 100% coverage for critical paths
- All tests pass
- E2E tests cover main user flows
- Offline scenarios tested
- Cross-platform tested

## Dependencies

### External Dependencies
- Backend API must be available for online features
- API endpoints must match expected contracts
- Network connectivity for sync

### Internal Dependencies
- Constitution standards must be followed
- All quality gates must pass
- Design system must be complete before features

## Risks & Mitigation

### Risk 1: SQLite Performance with Large Datasets
**Mitigation**: Proper indexing, query optimization, pagination

### Risk 2: Sync Conflicts
**Mitigation**: Robust conflict resolution, audit logging, admin alerts

### Risk 3: Offline Data Corruption
**Mitigation**: Database transactions, regular backups, recovery mechanism

### Risk 4: Complex State Management
**Mitigation**: Clear separation (TanStack Query for server, Zustand for client)

### Risk 5: NativeWind Learning Curve
**Mitigation**: Good documentation, component library examples

## Success Metrics

### Technical Metrics
- ✅ 80% test coverage (100% critical paths)
- ✅ Zero TypeScript errors
- ✅ Zero ESLint warnings
- ✅ Cold start < 3 seconds
- ✅ Transaction processing < 2 seconds
- ✅ 99%+ sync success rate

### User Experience Metrics
- ✅ WCAG AA accessibility compliance
- ✅ 60 FPS scrolling
- ✅ Works offline indefinitely
- ✅ Intuitive navigation
- ✅ Clear error messages

## Next Steps

1. **Review this plan** with the team
2. **Generate tasks** using `/speckit.tasks`
3. **Set up development environment** (Week 1, Day 1)
4. **Begin Phase 1 implementation**
5. **Daily standups** to track progress
6. **Weekly demos** to stakeholders

---

**Plan Version**: 1.0  
**Created**: October 16, 2025  
**Status**: Ready for Implementation  
**Estimated Duration**: 10 weeks

