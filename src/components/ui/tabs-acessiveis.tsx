"use client";

import { useRef, type KeyboardEvent } from "react";

export interface TabItem<K extends string> {
  id: K;
  label: string;
  count?: number;
}

interface TabsAcessiveisProps<K extends string> {
  tabs: ReadonlyArray<TabItem<K>>;
  activeTab: K;
  onChange: (tab: K) => void;
  ariaLabel: string;
}

export function TabsAcessiveis<K extends string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
}: TabsAcessiveisProps<K>) {
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex >= 0) {
      e.preventDefault();
      const target = tabs[nextIndex];
      if (!target) return;
      btnRefs.current[nextIndex]?.focus();
      onChange(target.id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="mb-5 flex items-center gap-1 overflow-x-auto border-b border-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              btnRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`relative inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-0 bg-transparent px-2.5 pt-2.5 pb-3 text-[13.5px] transition-colors duration-150 md:px-3.5 md:text-[14px] ${
              selected ? "font-semibold text-text" : "font-medium text-text-muted hover:text-text"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span
                className={`tabular-nums rounded-pill px-1.5 py-0.5 text-[11.5px] font-semibold ${
                  selected ? "bg-accent-tint text-accent" : "bg-surface-muted text-text-strong"
                }`}
              >
                {tab.count}
              </span>
            ) : null}
            {selected ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-0 bottom-0 left-0 h-[2px] bg-accent"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
