// app/components/common/CommandBar.tsx
'use client';

import {
  Action,
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarResults,
  KBarSearch,
  useMatches,
} from 'kbar';
import React from 'react';

/**
 * Renders a single result item in the command bar list.
 * @param item The action or string to render.
 * @param active Whether the item is currently highlighted.
 */
const ResultItem = React.forwardRef(
  (
    {
      item,
      active,
    }: {
      item: Action | string;
      active: boolean;
    },
    ref: React.Ref<HTMLDivElement>
  ) => {
    if (typeof item === 'string') {
      return <div className="px-4 pt-4 pb-2 text-xs font-medium text-text-muted">{item}</div>;
    }

    return (
      <div
        ref={ref}
        className={`flex items-center justify-between px-4 py-3 transition-colors cursor-pointer ${
          active ? 'bg-bg-tertiary' : 'bg-transparent'
        }`}
      >
        <div className="flex gap-3 items-center">
          {item.icon && <div className="text-text-secondary">{item.icon}</div>}
          <div className="flex flex-col">
            <span className="text-base text-text-primary">{item.name}</span>
            {item.subtitle && <span className="text-xs text-text-tertiary">{item.subtitle}</span>}
          </div>
        </div>
        {item.shortcut?.length ? (
          <div className="flex gap-2 items-center">
            {item.shortcut.map(sc => (
              <kbd
                key={sc}
                className="px-2 py-1 text-xs font-medium rounded-md text-text-tertiary bg-bg-tertiary"
              >
                {sc}
              </kbd>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

ResultItem.displayName = 'ResultItem';

/**
 * Renders the list of matching results.
 */
function RenderResults() {
  const { results } = useMatches();

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) => <ResultItem item={item} active={active} />}
    />
  );
}

/**
 * CommandBar component that provides the main UI for kbar.
 */
export default function CommandBar() {
  return (
    <KBarPortal>
      <KBarPositioner className="z-50 p-4 backdrop-blur-sm bg-bg-primary/60">
        <KBarAnimator className="overflow-hidden w-full max-w-xl rounded-xl border shadow-2xl bg-bg-primary border-border-primary">
          <KBarSearch
            defaultPlaceholder="Type a command or search..."
            className="px-4 py-3 w-full text-lg bg-transparent border-b text-text-primary border-border-primary focus:outline-none"
          />
          <RenderResults />
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  );
}
