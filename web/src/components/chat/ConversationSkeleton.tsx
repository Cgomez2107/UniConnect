import React from "react";

interface ConversationSkeletonProps {
  count?: number;
}

/**
 * ConversationSkeleton component for loading state of conversations list
 */
export function ConversationSkeleton({ count = 3 }: ConversationSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
}

export default ConversationSkeleton;
