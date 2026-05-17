import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "uniconnect-event-subscriptions";

function loadSubscriptions(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveSubscriptions(categories: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

export function useEventSubscription() {
  const [subscribedCategories, setSubscribedCategories] = useState<string[]>(loadSubscriptions);

  useEffect(() => {
    saveSubscriptions(subscribedCategories);
  }, [subscribedCategories]);

  const isSubscribed = useCallback(
    (category: string) => subscribedCategories.includes(category),
    [subscribedCategories],
  );

  const toggle = useCallback((category: string) => {
    setSubscribedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  }, []);

  const subscribe = useCallback((category: string) => {
    setSubscribedCategories((prev) =>
      prev.includes(category) ? prev : [...prev, category],
    );
  }, []);

  const unsubscribe = useCallback((category: string) => {
    setSubscribedCategories((prev) => prev.filter((c) => c !== category));
  }, []);

  return {
    subscribedCategories,
    isSubscribed,
    toggle,
    subscribe,
    unsubscribe,
  };
}
