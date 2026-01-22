import { apiClient } from "@/lib/api/client";

export interface RoadShowProduct {
  productId?: number;
  brandName?: string;
  sku: string;
  modelNumber?: string;
  productName?: string;
  barcode?: string;
  price?: number;
  qty?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy: number;
  updatedBy: number;
}

const handleFetchError = (error: any) => {
  // Check if it's a network/connection error
  if (
    error.message?.includes("Failed to fetch") ||
    error.message?.includes("NetworkError") ||
    error.message?.includes("ERR_CONNECTION_REFUSED") ||
    (error.name === "TypeError" && error.message?.includes("fetch"))
  ) {
    throw new Error(
      "Server is unavailable. Please check your connection and ensure the backend is running."
    );
  }
  // For other errors, rethrow as is
  throw error;
};

export const roadShowProductsApi = {
  // Get
  async getAll(): Promise<RoadShowProduct[]> {
    try {
      console.log("📥 Fetching all roadshow products from backend...");

      interface RoadShowProductsResponse {
        success?: boolean;
        data?: RoadShowProduct[];
        message?: string;
      }

      const result = await apiClient.get<RoadShowProductsResponse>("/pos/roadshow-products");

      console.log(
        "📥 Response structure:",
        JSON.stringify(result).substring(0, 200)
      );

      // Backend returns {data: [...]} or {success: true, data: [...]} format
      if (result && typeof result === 'object') {
        if (Array.isArray(result)) {
          return result;
        }
        if ('data' in result && Array.isArray(result.data)) {
          return result.data;
        }
        if ('success' in result && result.success && 'data' in result && Array.isArray(result.data)) {
          return result.data;
        }
      }

      return [];
    } catch (error) {
      console.error("❌ Error fetching roadshow products:", error);
      handleFetchError(error);
      throw error;
    }
  },

  async getById(id: number): Promise<RoadShowProduct> {
    try {
      interface ProductResponse {
        success?: boolean;
        data?: RoadShowProduct;
        message?: string;
      }
      const result = await apiClient.get<ProductResponse>(`/pos/roadshow-products/${id}`);
      return result.data || result as RoadShowProduct;
    } catch (error: any) {
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        throw new Error("Product not found");
      }
      console.error("Error fetching product:", error);
      handleFetchError(error);
      throw error;
    }
  },

  async getBySku(sku: string): Promise<RoadShowProduct> {
    try {
      interface ProductResponse {
        success?: boolean;
        data?: RoadShowProduct;
        message?: string;
      }
      const result = await apiClient.get<ProductResponse>(`/pos/roadshow-products/sku/${sku}`);
      return result.data || result as RoadShowProduct;
    } catch (error: any) {
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        throw new Error("Product not found");
      }
      console.error("Error fetching product by SKU:", error);
      handleFetchError(error);
      throw error;
    }
  },

  async getByBarcode(barcode: string): Promise<RoadShowProduct> {
    try {
      interface ProductResponse {
        success?: boolean;
        data?: RoadShowProduct;
        message?: string;
      }
      const result = await apiClient.get<ProductResponse>(`/pos/roadshow-products/barcode/${barcode}`);
      return result.data || result as RoadShowProduct;
    } catch (error: any) {
      if (error?.message?.includes('404') || error?.message?.includes('not found')) {
        throw new Error("Product not found");
      }
      console.error("Error fetching product by barcode:", error);
      handleFetchError(error);
      throw error;
    }
  },

  async getLowStock(threshold: number = 10): Promise<RoadShowProduct[]> {
    try {
      interface ProductsResponse {
        success?: boolean;
        data?: RoadShowProduct[];
        message?: string;
      }
      const result = await apiClient.get<ProductsResponse>(`/pos/roadshow-products/low-stock?threshold=${threshold}`);
      if (Array.isArray(result)) return result;
      return result.data || [];
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      handleFetchError(error);
      throw error;
    }
  },

  //  Search
  async searchByBrand(name: string): Promise<RoadShowProduct[]> {
    try {
      interface ProductsResponse {
        success?: boolean;
        data?: RoadShowProduct[];
        message?: string;
      }
      const result = await apiClient.get<ProductsResponse>(`/pos/roadshow-products/search/brand?name=${encodeURIComponent(name)}`);
      if (Array.isArray(result)) return result;
      return result.data || [];
    } catch (error) {
      console.error("Error searching by brand:", error);
      handleFetchError(error);
      throw error;
    }
  },

  async searchByProduct(name: string): Promise<RoadShowProduct[]> {
    try {
      interface ProductsResponse {
        success?: boolean;
        data?: RoadShowProduct[];
        message?: string;
      }
      const result = await apiClient.get<ProductsResponse>(`/pos/roadshow-products/search/product?name=${encodeURIComponent(name)}`);
      if (Array.isArray(result)) return result;
      return result.data || [];
    } catch (error) {
      console.error("Error searching by product:", error);
      handleFetchError(error);
      throw error;
    }
  },

  //  Create
  async create(product: RoadShowProduct): Promise<RoadShowProduct> {
    try {
      interface ProductResponse {
        success?: boolean;
        data?: RoadShowProduct;
        message?: string;
      }
      const result = await apiClient.post<ProductResponse>("/pos/roadshow-products", product);
      console.log("✅ Product created successfully");
      return result.data || result as RoadShowProduct;
    } catch (error) {
      console.error("Error creating product:", error);
      handleFetchError(error);
      throw error;
    }
  },

  // Update
  async update(
    id: number,
    product: Partial<RoadShowProduct>
  ): Promise<RoadShowProduct> {
    try {
      interface ProductResponse {
        success?: boolean;
        data?: RoadShowProduct;
        message?: string;
      }
      const result = await apiClient.put<ProductResponse>(`/pos/roadshow-products/${id}`, product);
      console.log("✅ Product updated successfully");
      return result.data || result as RoadShowProduct;
    } catch (error) {
      console.error("Error updating product:", error);
      handleFetchError(error);
      throw error;
    }
  },

  async updateQuantity(
    id: number,
    qty: number,
    updatedBy: number
  ): Promise<RoadShowProduct> {
    try {
      interface ProductResponse {
        success?: boolean;
        data?: RoadShowProduct;
        message?: string;
      }
      const result = await apiClient.patch<ProductResponse>(`/pos/roadshow-products/${id}/quantity?qty=${qty}&updatedBy=${updatedBy}`, {});
      console.log("✅ Quantity updated successfully");
      return result.data || result as RoadShowProduct;
    } catch (error) {
      console.error("Error updating quantity:", error);
      handleFetchError(error);
      throw error;
    }
  },

  //  Delete
  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/pos/roadshow-products/${id}`);
      console.log("✅ Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      handleFetchError(error);
      throw error;
    }
  },
};
