import { apiClient } from "@/lib/api/client";
import { useDatabaseEnvironmentStore } from "@/lib/stores/database-environment-store";

export interface DatabaseEnvironmentResponse {
  success: boolean;
  environment: "dev" | "prd";
  message?: string;
  note?: string;
}

const handleFetchError = (error: any) => {
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
  throw error;
};

export const databaseEnvironmentApi = {
  /**
   * Get current database environment from the store
   * This reflects the environment that will be sent in the X-DB-Environment header
   */
  getCurrentEnvironment(): "dev" | "prd" {
    return useDatabaseEnvironmentStore.getState().environment;
  },

  /**
   * Get current database environment from backend
   * This returns what the backend sees based on the header sent
   */
  async getCurrentEnvironmentFromBackend(): Promise<"dev" | "prd"> {
    try {
      console.log("📥 Fetching current database environment from backend...");
      const result = await apiClient.get<DatabaseEnvironmentResponse>(
        "/config/database-environment"
      );

      if (result.success && result.environment) {
        console.log("✅ Current database environment from backend:", result.environment);
        return result.environment;
      }

      // Fallback to prd if response format is unexpected
      return "prd";
    } catch (error) {
      console.error("❌ Error fetching database environment:", error);
      handleFetchError(error);
      throw error;
    }
  },

  /**
   * Update database environment preference
   * This updates the local store, which will be sent as X-DB-Environment header in all future requests
   * No restart required - changes take effect immediately
   */
  setEnvironment(environment: "dev" | "prd"): void {
    console.log(`📤 Setting database environment preference to: ${environment}`);
    useDatabaseEnvironmentStore.getState().setEnvironment(environment);
    console.log("✅ Database environment preference updated. Changes take effect immediately.");
  },
};

