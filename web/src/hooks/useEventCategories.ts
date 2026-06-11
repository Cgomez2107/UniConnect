import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { EventCategoryRow } from "@/types";

export function useEventCategories() {
  const [categories, setCategories] = useState<EventCategoryRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("event_categories")
          .select("*")
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (error) {
          console.warn("[useEventCategories] Error fetching categories:", error.message);
          return;
        }
        if (data) {
          setCategories(data as EventCategoryRow[]);
        }
      } catch (err: any) {
        console.warn("[useEventCategories] Exception fetching categories:", err.message);
      }
    };

    // Try fetching immediately
    fetchCategories();

    // Subscribe to auth state changes to refetch once session is established
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) {
        fetchCategories();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return categories;
}

