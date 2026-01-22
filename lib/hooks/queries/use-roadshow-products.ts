import { roadShowProductsApi } from '@/endpoints/pos-system/roadshow-products';
import {
  RoadShowProductLocal,
  roadShowProductRepository
} from '@/endpoints/sqlite/repositories/roadshow-product-repository';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

/**
 * Paginated result type
 */
export interface PaginatedProductResult {
  products: RoadShowProductLocal[];
  totalPages: number;
  totalCount: number;
}

/**
 * Query key factory
 */
export const roadShowProductKeys = {
  all: ['roadShowProducts'] as const,
  lists: () => [...roadShowProductKeys.all, 'list'] as const,
  list: (filters: string) => [...roadShowProductKeys.lists(), { filters }] as const,
  details: () => [...roadShowProductKeys.all, 'detail'] as const,
  detail: (id: number) => [...roadShowProductKeys.details(), id] as const,
};

/**
 * Hook to get all road show products from local SQLite
 */
export const useLocalRoadShowProducts = () => {
  return useQuery({
    queryKey: roadShowProductKeys.lists(),
    queryFn: async () => {
      if (Platform.OS === 'web') {
        throw new Error('SQLite not available on web');
      }
      return await roadShowProductRepository.getAll();
    },
    enabled: Platform.OS !== 'web',
  });
};

/**
 * Hook to get paginated road show products from local SQLite
 */
export const useLocalRoadShowProductsPaginated = (page: number = 1, pageSize: number = 20) => {
  return useQuery<PaginatedProductResult>({
    queryKey: [...roadShowProductKeys.lists(), 'paginated', page, pageSize],
    queryFn: async () => {
      if (Platform.OS === 'web') {
        throw new Error('SQLite not available on web');
      }
      return await roadShowProductRepository.findByPage(page, pageSize);
    },
    enabled: Platform.OS !== 'web',
  });
};

/**
 * Hook to search road show products with pagination
 */
export const useSearchRoadShowProducts = (
  page: number = 1, 
  pageSize: number = 20, 
  searchTerm: string = ''
) => {
  return useQuery<PaginatedProductResult>({
    queryKey: [...roadShowProductKeys.lists(), 'search', page, pageSize, searchTerm],
    queryFn: async () => {
      if (Platform.OS === 'web') {
        throw new Error('SQLite not available on web');
      }
      if (!searchTerm) {
        return await roadShowProductRepository.findByPage(page, pageSize);
      }
      return await roadShowProductRepository.searchWithPagination(page, pageSize, searchTerm);
    },
    enabled: Platform.OS !== 'web',
  });
};

/**
 * Hook to sync road show products from backend to local SQLite
 */
export const useSyncRoadShowProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      
      try {
        // Step 1: Fetch all products from backend
        const products = await roadShowProductsApi.getAll();

        // Step 2: Sync to local SQLite
        if (Platform.OS !== 'web') {
          const result = await roadShowProductRepository.syncFromBackend(products);
          console.log(`✅ Sync result:`, result);
          return result;
        }

        return {
          success: true,
          inserted: products.length,
          message: 'Web platform - no local sync needed',
        };
      } catch (error) {
        console.error('❌ Sync failed with error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('✅ Sync completed successfully:', data);
      // Invalidate and refetch ALL product queries (lists, paginated, search, count, etc.)
      queryClient.invalidateQueries({ queryKey: roadShowProductKeys.all });
      // Also explicitly invalidate specific query types to ensure they refresh
      queryClient.invalidateQueries({ queryKey: roadShowProductKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...roadShowProductKeys.all, 'count'] });
    },
    onError: (error) => {
      console.error('❌ Sync mutation error:', error);
    },
  });
};

/**
 * Hook to get product count
 */
export const useRoadShowProductCount = () => {
  return useQuery({
    queryKey: [...roadShowProductKeys.all, 'count'],
    queryFn: async () => {
      if (Platform.OS === 'web') {
        return 0;
      }
      return await roadShowProductRepository.getCount();
    },
    enabled: Platform.OS !== 'web',
  });
};

/**
 * Hook to clear all road show products from local database
 */
export const useClearRoadShowProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      console.log('🗑️ Clearing all local roadshow products...');
      
      if (Platform.OS === 'web') {
        throw new Error('Clear not available on web platform');
      }

      await roadShowProductRepository.clearAll();
      console.log('✅ All products cleared from local database');

      return {
        success: true,
        message: 'All products cleared successfully',
      };
    },
    onSuccess: () => {
      console.log('✅ Clear completed successfully');
      // Invalidate and refetch local products and count
      queryClient.invalidateQueries({ queryKey: roadShowProductKeys.lists() });
      queryClient.invalidateQueries({ queryKey: [...roadShowProductKeys.all, 'count'] });
    },
    onError: (error) => {
      console.error('❌ Clear failed:', error);
    },
  });
};

