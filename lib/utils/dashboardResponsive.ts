export function isMobileViewport(width: number): boolean {
  return width < 768;
}

export function getMobileDrawerAria(isMobileMenuOpen: boolean): {
  "aria-expanded": boolean;
  "aria-controls": string;
  "aria-label": string;
} {
  return {
    "aria-expanded": isMobileMenuOpen,
    "aria-controls": "dashboard-sidebar",
    "aria-label": isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu",
  };
}

export type DrawerAction = "open" | "close" | "toggle" | "route_change" | "escape";

export function reduceMobileDrawerState(isOpen: boolean, action: DrawerAction): boolean {
  switch (action) {
    case "open":
      return true;
    case "close":
    case "route_change":
    case "escape":
      return false;
    case "toggle":
      return !isOpen;
    default:
      return isOpen;
  }
}
