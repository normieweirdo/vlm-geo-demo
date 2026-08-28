import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, ListFilter } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNextListIndex } from "@shared/animated-list";

type AnimatedListProps = {
  items: string[];
  onItemSelect?: (item: string, index: number) => void;
  showGradients?: boolean;
  enableArrowNavigation?: boolean;
  displayScrollbar?: boolean;
  className?: string;
};

export default function AnimatedList({
  items,
  onItemSelect,
  showGradients = false,
  enableArrowNavigation = false,
  displayScrollbar = false,
  className,
}: AnimatedListProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function updateScrollState() {
    const element = listRef.current;
    if (!element) return;
    setCanScrollUp(element.scrollTop > 1);
    setCanScrollDown(element.scrollTop + element.clientHeight < element.scrollHeight - 1);
  }

  useEffect(() => {
    updateScrollState();
    const element = listRef.current;
    if (!element) return;
    element.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [items.length]);

  function selectItem(index: number) {
    const nextIndex = Math.min(Math.max(index, 0), items.length - 1);
    if (nextIndex < 0) return;
    setSelectedIndex(nextIndex);
    onItemSelect?.(items[nextIndex], nextIndex);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!enableArrowNavigation || items.length === 0) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const nextIndex = getNextListIndex(selectedIndex, event.key === "ArrowDown" ? "down" : "up", items.length);
    selectItem(nextIndex);
    requestAnimationFrame(() => itemRefs.current[nextIndex]?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
  }

  return (
    <div className={cn("relative", className)}>
      {showGradients && canScrollUp ? <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-10 h-9 bg-gradient-to-b from-[#071820] to-transparent" /> : null}
      {showGradients && canScrollDown ? <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-[#071820] to-transparent" /> : null}
      <div
        ref={listRef}
        role="listbox"
        aria-label="Selectable items"
        tabIndex={enableArrowNavigation ? 0 : -1}
        onKeyDown={handleKeyDown}
        className={cn(
          "max-h-52 space-y-2 overflow-y-auto pr-1 outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#071820]",
          displayScrollbar ? "[scrollbar-color:rgba(156,232,219,.38)_transparent] [scrollbar-width:thin]" : "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {items.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 px-3 py-3 text-xs text-white/40"><ListFilter size={14} />No items yet</div>
        ) : items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return <button
            ref={(element) => { itemRefs.current[index] = element; }}
            key={`${item}-${index}`}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => selectItem(index)}
            className={cn(
              "group flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs leading-5 text-white/55 opacity-0 [animation:fade-up_.32s_cubic-bezier(.23,1,.32,1)_forwards] hover:border-cyan-200/35 hover:bg-cyan-200/[.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70",
              isSelected ? "border-cyan-200/55 bg-cyan-200/[.12] text-cyan-50" : "border-white/10 bg-white/[.025]",
            )}
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <span className="pr-3">{item}</span>
            {isSelected ? <span className="flex shrink-0 items-center gap-1 text-[9px] font-bold uppercase tracking-[.15em] text-cyan-200">Selected</span> : null}
          </button>;
        })}
      </div>
      {enableArrowNavigation && items.length > 0 ? <div className="mt-2 flex items-center justify-end gap-1 text-[9px] uppercase tracking-[.16em] text-white/30"><ChevronUp size={12} /> <ChevronDown size={12} /> <span>navigate</span></div> : null}
    </div>
  );
}
