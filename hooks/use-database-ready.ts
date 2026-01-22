import { useEffect, useState } from "react";
import { isDatabaseInitialized } from "@/endpoints/sqlite";

export function useDatabaseReady() {
  const [isDbReady, setIsDbReady] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ready = await isDatabaseInitialized();
        if (mounted) setIsDbReady(ready);
      } catch {
        if (mounted) setIsDbReady(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return isDbReady;
}

