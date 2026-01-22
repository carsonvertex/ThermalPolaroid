# Road Show Product Sync Feature

Complete implementation for syncing road show products from backend MySQL to mobile SQLite.

## 🎯 What Was Created

### 1. **API Client** (`lib/api/endpoints/roadshow-products.ts`)
- Connects to backend REST API
- Endpoints: getAll, getById, getBySku, getByBarcode, search, create, update, delete
- Base URL: `/api/pos/roadshow-products`

### 2. **Database Repository** (`lib/database/repositories/roadshow-product-repository.ts`)
- Local SQLite operations
- Methods: getAll, getById, getBySku, insert, clearAll, syncFromBackend
- Handles data persistence on mobile device

### 3. **React Query Hook** (`lib/hooks/queries/use-roadshow-products.ts`)
- `useLocalRoadShowProducts()` - Query local SQLite data
- `useSyncRoadShowProducts()` - Sync from backend to local
- `useRoadShowProductCount()` - Get product count
- Auto-refetch after sync

### 4. **Product Master Screen** (`app/(tabs)/product-master.tsx`)
- Display all local products
- **🔄 Sync from Server** button
- Pull-to-refresh
- Product cards with details
- Empty state with instructions

---

## 🔄 How Sync Works

### User Flow:

```
User taps "🔄 Sync from Server"
    ↓
Confirmation dialog appears
    ↓
User confirms "Sync Now"
    ↓
1. Clear local SQLite table (DELETE FROM road_show_product)
    ↓
2. Fetch all products from backend (GET /api/pos/roadshow-products)
    ↓
3. Insert each product into local SQLite
    ↓
4. Refetch and display updated list
    ↓
Success message: "Successfully synced N products!"
```

### Technical Flow:

```typescript
useSyncRoadShowProducts() mutation:
  ↓
1. roadShowProductsApi.getAll()
   → Fetches from backend MySQL (pos_system.road_show_product)
  ↓
2. roadShowProductRepository.syncFromBackend(products)
   → Clears local SQLite
   → Inserts all products
  ↓
3. Query invalidation
   → Auto-refetches local products
   → UI updates automatically
```

---

## 📱 UI Features

### **Sync Button**
- ✅ Shows "Syncing..." with loading spinner during sync
- ✅ Disabled state while syncing (prevents double-click)
- ✅ Confirmation dialog before sync
- ✅ Success/error alerts
- ✅ Visual feedback (pressed state)

### **Product Cards**
- Product name (bold)
- Brand name + SKU
- Barcode (if available)
- Price (formatted as currency)
- Quantity

### **States Handled**
- ✅ Loading state (spinner)
- ✅ Empty state ("No products yet")
- ✅ Syncing state (button disabled + spinner)
- ✅ Error handling (alerts)
- ✅ Pull-to-refresh

---

## 🧪 Testing

### 1. **Start Backend**
```bash
cd C:\xampp\htdocs\RC-POS-Backends
mvn clean package -DskipTests
java -jar target/pos-backend-1.0.0.jar
```

Make sure you see:
```
==> New POS Backend is running on port 8080
```

### 2. **Add Test Data to MySQL**

```sql
-- Connect to MySQL
USE pos_system;

-- Insert test products
INSERT INTO road_show_product 
  (brand_name, sku, model_number, product_name, barcode, price, qty, created_by, updated_by) 
VALUES
  ('Samsung', 'SAM-TV-01', 'UN55AU8000', 'Samsung 55" 4K TV', '8806092263536', 599.99, 25, 1, 1),
  ('Apple', 'APP-IP-15', 'A2848', 'iPhone 15 Pro', '194253097709', 999.00, 50, 1, 1),
  ('LG', 'LG-TV-65', 'OLED65C1', 'LG 65" OLED TV', '195174024027', 1499.99, 15, 1, 1);

-- Verify
SELECT COUNT(*) FROM road_show_product;
```

### 3. **Test Backend API**

```bash
# Test if backend returns products
curl http://localhost:8080/api/pos/roadshow-products

# Or with your EC2 server
curl http://54.255.118.185:8080/api/pos/roadshow-products
```

Should return JSON with your products.

### 4. **Test Mobile App**

1. Open the app on Android/iOS
2. Navigate to **Product Master** tab
3. Tap **"🔄 Sync from Server"**
4. Confirm sync
5. Watch the sync progress
6. See products appear!

---

## 📊 Data Flow

```
Backend MySQL (pos_system)
    ↓
GET /api/pos/roadshow-products
    ↓
[{productId: 1, brandName: "Samsung", ...}, ...]
    ↓
Mobile App (JavaScript)
    ↓
roadShowProductRepository.syncFromBackend()
    ↓
1. DELETE FROM road_show_product
2. INSERT INTO road_show_product VALUES (...)
    ↓
Local SQLite Database
    ↓
useLocalRoadShowProducts() hook
    ↓
UI displays products
```

---

## 🔧 Customization

### Change Sync Behavior

Edit `roadshow-product-repository.ts`:

```typescript
async syncFromBackend(products: any[]) {
  // Option 1: Clear all and insert (current)
  await this.clearAll();
  
  // Option 2: Upsert (insert or update)
  // for (const product of products) {
  //   await this.upsert(product);
  // }
  
  // Option 3: Only insert new (keep existing)
  // for (const product of products) {
  //   const exists = await this.getBySku(product.sku);
  //   if (!exists) {
  //     await this.insert(product);
  //   }
  // }
}
```

### Add Filters/Search

Edit `product-master.tsx`:

```typescript
const [searchQuery, setSearchQuery] = useState('');

const filteredProducts = products?.filter(p => 
  p.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  p.brand_name?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

### Add Auto-Sync on App Start

Create `app/_layout.tsx`:

```typescript
useEffect(() => {
  // Auto-sync on app start
  syncMutation.mutate();
}, []);
```

---

## 🐛 Troubleshooting

### Sync Button Does Nothing
- Check if backend is running: `curl http://YOUR_SERVER:8080/api/pos/roadshow-products`
- Check network connection
- Check console logs for errors

### Products Not Showing After Sync
- Check SQLite table: `SELECT COUNT(*) FROM road_show_product`
- Check console for insert errors
- Verify backend returns data

### "Table doesn't exist" Error
- Run database initialization first
- Check if schema was created: `GET /api/database/schema`

---

## 📚 Files Created

```
Frontend:
├── lib/api/endpoints/
│   └── roadshow-products.ts          ← API client
├── lib/database/repositories/
│   └── roadshow-product-repository.ts ← SQLite operations
├── lib/hooks/queries/
│   └── use-roadshow-products.ts       ← React Query hook
└── app/(tabs)/
    └── product-master.tsx             ← UI screen (updated)
```

---

## ✨ Features

- ✅ One-tap sync from server
- ✅ Confirmation dialog (prevent accidental sync)
- ✅ Loading states and progress indicators
- ✅ Pull-to-refresh
- ✅ Product count display
- ✅ Beautiful product cards
- ✅ Empty state with instructions
- ✅ Error handling with alerts
- ✅ Automatic UI updates after sync
- ✅ Offline access after sync

---

## 🎉 Success!

You now have a complete road show product sync feature:
1. ✅ Backend MySQL database (pos_system.road_show_product)
2. ✅ REST API endpoints
3. ✅ Mobile SQLite table (for offline access)
4. ✅ Sync functionality (clear + download)
5. ✅ Beautiful UI with sync button
6. ✅ All error handling

**Try it out!** Add some products in MySQL, then tap the sync button in the app! 🚀

