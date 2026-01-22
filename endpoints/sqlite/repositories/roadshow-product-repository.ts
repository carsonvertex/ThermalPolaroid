import { execSQL, getAll, runSQL } from '../index';

/**
 * Road Show Product (SQLite)
 */
export interface RoadShowProductLocal {
  product_id?: number;
  brand_name?: string;
  sku: string;
  model_number?: string;
  product_name?: string;
  barcode?: string;
  price?: number | null;
  qty?: number;
  created_at?: string;
  updated_at?: string;
  created_by: number;
  updated_by: number;
}

/**
 * Road Show Product Repository
 */
export const roadShowProductRepository = {
  /**
   * Get all road show products
   */
  async getAll(): Promise<RoadShowProductLocal[]> {
    const query = `
      SELECT * FROM road_show_product 
      ORDER BY product_id DESC
    `;
    return await getAll<RoadShowProductLocal>(query, []);
  },

  /**
   * Get product by ID
   */
  async getById(id: number): Promise<RoadShowProductLocal | null> {
    const query = `SELECT * FROM road_show_product WHERE product_id = ?`;
    const results = await getAll<RoadShowProductLocal>(query, [id]);
    return results.length > 0 ? results[0] : null;
  },

  /**
   * Get product by SKU
   */
  async getBySku(sku: string): Promise<RoadShowProductLocal | null> {
    const query = `SELECT * FROM road_show_product WHERE sku = ?`;
    const results = await getAll<RoadShowProductLocal>(query, [sku]);
    return results.length > 0 ? results[0] : null;
  },

  /**
   * Get product by barcode
   */
  async getByBarcode(barcode: string): Promise<RoadShowProductLocal | null> {
    const query = `SELECT * FROM road_show_product WHERE barcode = ?`;
    const results = await getAll<RoadShowProductLocal>(query, [barcode]);
    return results.length > 0 ? results[0] : null;
  },

  /**
   * Search by brand name
   */
  async searchByBrand(brandName: string): Promise<RoadShowProductLocal[]> {
    const query = `
      SELECT * FROM road_show_product 
      WHERE brand_name LIKE ? 
      ORDER BY product_name
    `;
    return await getAll<RoadShowProductLocal>(query, [`%${brandName}%`]);
  },

  /**
   * Insert product
   */
  async insert(product: RoadShowProductLocal): Promise<void> {
    const query = `
      INSERT INTO road_show_product (
        product_id, brand_name, sku, model_number, product_name, 
        barcode, price, qty, created_at, updated_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await runSQL(query, [
      product.product_id || null,
      product.brand_name || null,
      product.sku,
      product.model_number || null,
      product.product_name || null,
      product.barcode || null,
      product.price || null,
      product.qty || null,
      product.created_at || new Date().toISOString(),
      product.updated_at || new Date().toISOString(),
      product.created_by,
      product.updated_by,
    ]);
  },

  /**
   * Clear all road show products
   */
  async clearAll(): Promise<void> {
    await execSQL('DELETE FROM road_show_product');
  },

  /**
   * Get count of products
   */
  async getCount(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM road_show_product`;
    const results = await getAll<{ count: number }>(query, []);
    return results.length > 0 ? results[0].count : 0;
  },

  /**
   * Get products with pagination
   */
  async findByPage(page: number = 1, pageSize: number = 20): Promise<{
    products: RoadShowProductLocal[];
    totalPages: number;
    totalCount: number;
  }> {
    const offset = (page - 1) * pageSize;
    
    // Get total count
    const totalCount = await this.getCount();
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Get paginated products
    const query = `
      SELECT * FROM road_show_product 
      ORDER BY product_id DESC
      LIMIT ? OFFSET ?
    `;
    const products = await getAll<RoadShowProductLocal>(query, [pageSize, offset]);
    
    return {
      products,
      totalPages,
      totalCount,
    };
  },

  /**
   * Search products with pagination
   */
  async searchWithPagination(
    page: number = 1,
    pageSize: number = 20,
    searchTerm: string = ''
  ): Promise<{
    products: RoadShowProductLocal[];
    totalPages: number;
    totalCount: number;
  }> {
    const offset = (page - 1) * pageSize;
    const searchPattern = `%${searchTerm}%`;
    
    // Get total count for search
    const countQuery = `
      SELECT COUNT(*) as count FROM road_show_product
      WHERE product_name LIKE ? OR sku LIKE ? OR barcode LIKE ? OR brand_name LIKE ?
    `;
    const countResults = await getAll<{ count: number }>(countQuery, [
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
    ]);
    const totalCount = countResults.length > 0 ? countResults[0].count : 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Get paginated search results
    const query = `
      SELECT * FROM road_show_product
      WHERE product_name LIKE ? OR sku LIKE ? OR barcode LIKE ? OR brand_name LIKE ?
      ORDER BY product_id DESC
      LIMIT ? OFFSET ?
    `;
    const products = await getAll<RoadShowProductLocal>(query, [
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      pageSize,
      offset,
    ]);
    
    return {
      products,
      totalPages,
      totalCount,
    };
  },

  /**
   * Sync from backend: Clear local table and insert all products from backend
   */
  async syncFromBackend(products: any[]): Promise<{ 
    success: boolean; 
    inserted: number; 
    message: string 
  }> {
    try {
      console.log(`🔄 Starting sync: ${products.length} products to sync`);
      
      // Step 1: Clear existing data
      await this.clearAll();
      console.log('✅ Cleared existing road show products');

      // Step 2: Insert all products from backend
      let insertedCount = 0;
      for (const product of products) {
        try {
          await this.insert({
            product_id: product.productId,
            brand_name: product.brandName,
            sku: product.sku,
            model_number: product.modelNumber,
            product_name: product.productName,
            barcode: product.barcode,
            price: product.price ? parseFloat(product.price.toString()) : null,
            qty: product.qty,
            created_at: product.createdAt,
            updated_at: product.updatedAt,
            created_by: product.createdBy,
            updated_by: product.updatedBy,
          });
          insertedCount++;
        } catch (error) {
          console.error(`❌ Failed to insert product ${product.sku}:`, error);
        }
      }

      console.log(`✅ Sync complete: ${insertedCount} products inserted`);
      
      return {
        success: true,
        inserted: insertedCount,
        message: `Successfully synced ${insertedCount} products`,
      };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      return {
        success: false,
        inserted: 0,
        message: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  },
};

