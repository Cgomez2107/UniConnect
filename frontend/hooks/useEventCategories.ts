import { supabase } from "@/lib/supabase";
import type { EventCategoryRow } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function useEventCategories() {
  const [categories, setCategories] = useState<EventCategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data ?? []);
    } catch (err) {
      console.warn("[useEventCategories] Error loading categories:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Load immediately
    load();

    // Listen for session changes (e.g. after login/session recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) {
        load();
      }
    });

    return () => {
      cancelled = false;
      subscription.unsubscribe();
    };
  }, [load]);

  return { categories, isLoading, refresh: load };
}

