import { getAll, runSQL } from "../index";
import { BaseRepository } from "./base-repository";

export interface SimpleOrderItem {
  id: number;
  staff_id: string;
  timestamp: number;
  products: string; // JSON string containing products array
  products_total: number;
  misc: number;
  total_amount: number;
  discount: number;
  net_amount: number;
  net_received: number;
  change_amount: number;
  payment_reference: string;
  status: string;
  sync_status: string;
  is_override: number; // 0 or 1 (boolean as integer in SQLite)
  payment_method: string; // 'cash', 'octopus', 'credit_card'
  created_at: string;
  updated_at: string;
  synced_at: string | null;
}

export class SimpleOrderRepository extends BaseRepository<SimpleOrderItem> {
  constructor() {
    super("simple_orders");
  }

  /**
   * Create a new simple order
   */
  async create(
    data: Omit<
      SimpleOrderItem,
      "id" | "created_at" | "updated_at" | "synced_at"
    >
  ): Promise<number> {
    // Use explicit SQL to handle null values properly
    const sql = `INSERT INTO simple_orders (
      staff_id, timestamp, products, products_total, misc, total_amount, 
      discount, net_amount, net_received, change_amount, payment_reference, 
      status, sync_status, is_override, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      data.staff_id,
      data.timestamp,
      data.products,
      data.products_total,
      data.misc,
      data.total_amount,
      data.discount,
      data.net_amount,
      data.net_received,
      data.change_amount,
      data.payment_reference || "", // Use empty string if null/undefined/empty
      data.status,
      data.sync_status,
      data.is_override ?? 0, // Default to 0 (false) if not provided
      data.payment_method || "cash", // Default to 'cash' if not provided
    ];

    console.log("🔍 Creating simple order with SQL:", sql);
    console.log("🔍 Values:", values);
    console.log(
      "🔍 Values types:",
      values.map((v) => typeof v)
    );
    const result = await runSQL(sql, values);
    console.log("🔍 Insert result:", result);
    return result.lastInsertRowId;
  }

  /**
   * Update an existing simple order
   */
  async update(
    id: number,
    data: Partial<Omit<SimpleOrderItem, "id" | "created_at" | "synced_at">>
  ): Promise<void> {
    const { sql, values } = this.buildUpdateQuery({ ...data, id } as Record<
      string,
      unknown
    >);
    await runSQL(sql, values);
  }

  /**
   * Get orders by staff ID
   */
  async findByStaffId(staffId: string): Promise<SimpleOrderItem[]> {
    const sql =
      "SELECT * FROM simple_orders WHERE staff_id = ? ORDER BY created_at DESC";
    return getAll<SimpleOrderItem>(sql, [staffId]);
  }

  /**
   * Get orders with pagination
   * @param pageNumber 1-based page number
   * @param pageSize Number of items per page
   * @returns Object containing orders for the page and total count
   */
  async findByPage(
    pageNumber: number,
    pageSize: number
  ): Promise<{
    orders: SimpleOrderItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Calculate offset
    const offset = (pageNumber - 1) * pageSize;
    // Get total count
    const countResult = await getAll<{ count: number }>(
      "SELECT COUNT(*) as count FROM simple_orders"
    );
    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get orders for the current page
    const sql = `
      SELECT * FROM simple_orders 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const orders = await getAll<SimpleOrderItem>(sql, [pageSize, offset]);

    return {
      orders,
      totalCount,
      totalPages,
      currentPage: pageNumber,
    };
  }

  /**
   * Search orders with pagination
   * @param pageNumber 1-based page number
   * @param pageSize Number of items per page
   * @param searchTerm Search term to match against ID, staff_id, and other fields
   * @param startDate Optional start date timestamp (inclusive)
   * @param endDate Optional end date timestamp (inclusive)
   * @returns Object containing filtered orders and pagination info
   */
  async searchWithPagination(
    pageNumber: number,
    pageSize: number,
    searchTerm: string,
    startDate?: number,
    endDate?: number
  ): Promise<{
    orders: SimpleOrderItem[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    // Calculate offset
    const offset = (pageNumber - 1) * pageSize;
    
    // Build WHERE clause and parameters
    const whereConditions: string[] = [];
    const params: any[] = [];

    // Search term filter
    if (searchTerm && searchTerm.trim()) {
      const searchPattern = `%${searchTerm.trim()}%`;
      whereConditions.push(`(
        staff_id LIKE ? OR 
        CAST(id AS TEXT) LIKE ?
      )`);
      params.push(searchPattern, searchPattern);
    }

    // Date range filters
    if (startDate) {
      whereConditions.push("timestamp >= ?");
      params.push(startDate);
    }

    if (endDate) {
      whereConditions.push("timestamp <= ?");
      params.push(endDate);
    }

    // Build the WHERE clause
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM simple_orders ${whereClause}`;
    const countResult = await getAll<{ count: number }>(countSql, params);
    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get orders for the current page
    const sql = `
      SELECT * FROM simple_orders 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const orders = await getAll<SimpleOrderItem>(sql, [
      ...params,
      pageSize,
      offset,
    ]);

    return {
      orders,
      totalCount,
      totalPages,
      currentPage: pageNumber,
    };
  }

  async findByDateRange(
    startDate: number,
    endDate: number
  ): Promise<SimpleOrderItem[]> {
    const sql =
      "SELECT * FROM simple_orders WHERE timestamp BETWEEN ? AND ? ORDER BY created_at DESC";
    return getAll<SimpleOrderItem>(sql, [startDate, endDate]);
  }

  async findByStatus(status: string): Promise<SimpleOrderItem[]> {
    const sql =
      "SELECT * FROM simple_orders WHERE status = ? ORDER BY created_at DESC";
    return getAll<SimpleOrderItem>(sql, [status]);
  }

  /**
   * Get orders by sync status
   */
  async findBySyncStatus(syncStatus: string): Promise<SimpleOrderItem[]> {
    const sql =
      "SELECT * FROM simple_orders WHERE sync_status = ? ORDER BY created_at DESC";
    return getAll<SimpleOrderItem>(sql, [syncStatus]);
  }

  async updateSyncStatus(id: number, syncStatus: string): Promise<void> {
    const sql =
      "UPDATE simple_orders SET sync_status = ?, synced_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    await runSQL(sql, [syncStatus, id]);
  }

  async getTotalSales(startDate?: number, endDate?: number): Promise<number> {
    let sql =
      'SELECT SUM(total_amount) as total FROM simple_orders WHERE status = "completed"';
    const params: number[] = [];

    if (startDate && endDate) {
      sql += " AND timestamp BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    const result = await getAll<{ total: number | null }>(sql, params);
    return result[0]?.total ?? 0;
  }

  // Get order count for a period
  async getOrderCount(startDate?: number, endDate?: number): Promise<number> {
    let sql =
      'SELECT COUNT(*) as count FROM simple_orders WHERE status = "completed"';
    const params: number[] = [];

    if (startDate && endDate) {
      sql += " AND timestamp BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }

    const result = await getAll<{ count: number }>(sql, params);
    return result[0]?.count ?? 0;
  }
}

// Export singleton instance
export const simpleOrderRepository = new SimpleOrderRepository();
