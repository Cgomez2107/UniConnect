import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { EventCategoryRow } from "@/types";

export function useEventCategories() {
  const [categories, setCategories] = useState<EventCategoryRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("event_categories")
      .select("*")
      .order("name")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setCategories(data as EventCategoryRow[]);
        }
      });
    return () => { cancelled = true; };
  }, []);

  return categories;
}
