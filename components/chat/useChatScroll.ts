import { useEffect, useRef, useCallback, RefObject } from "react";

interface UseChatScrollOptions<T> {
  dependency: T;
  smooth?: boolean;
}

interface UseChatScrollResult {
  endRef: RefObject<HTMLDivElement | null>;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export function useChatScroll<T>({
  dependency,
  smooth = true,
}: UseChatScrollOptions<T>): UseChatScrollResult {
  const endRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = smooth ? "smooth" : "auto") => {
      endRef.current?.scrollIntoView({ behavior });
    },
    [smooth]
  );

  useEffect(() => {
    scrollToBottom();
  }, [dependency, scrollToBottom]);

  return {
    endRef,
    scrollToBottom,
  };
}
