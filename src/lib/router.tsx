import React, { createContext, useContext, useEffect, useState } from "react";

export type RoutePath = "/" | "/add" | "/settings" | "/transactions" | "/wallets" | "/privacy" | "/terms";

function normalizePath(hash: string): RoutePath {
  if (!hash || hash === "#/") return "/";
  if (hash.startsWith("#/add")) return "/add";
  if (hash.startsWith("#/settings")) return "/settings";
  if (hash.startsWith("#/transactions")) return "/transactions";
  if (hash.startsWith("#/wallets")) return "/wallets";
  if (hash.startsWith("#/privacy")) return "/privacy";
  if (hash.startsWith("#/terms")) return "/terms";
  return "/";
}

interface RouterContextType {
  path: RoutePath;
  navigate: (to: RoutePath) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState<RoutePath>(() => normalizePath(window.location.hash));

  const navigate = (to: RoutePath) => {
    window.location.hash = "#" + to;
  };

  useEffect(() => {
    const handleHashChange = () => {
      setPath(normalizePath(window.location.hash));
    };

    window.addEventListener("hashchange", handleHashChange);
    // Set default hash if not present
    if (!window.location.hash) {
      window.location.hash = "#/";
    }
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return {
    invalidate: () => {},
  };
}

export function useRouterState() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useRouterState must be used within a RouterProvider");
  return {
    location: {
      pathname: context.path,
    },
  };
}

export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) throw new Error("useNavigate must be used within a RouterProvider");
  return (options: { to: RoutePath }) => {
    context.navigate(options.to);
  };
}

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: RoutePath;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  key?: React.Key;
}

export function Link({ to, children, className, style, onClick, ...props }: LinkProps) {
  const context = useContext(RouterContext);
  if (!context) throw new Error("Link must be used within a RouterProvider");

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }
    if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      context.navigate(to);
    }
  };

  const isActive = context.path === to;

  return (
    <a
      href={`#${to}`}
      className={className}
      style={style}
      onClick={handleClick}
      data-active={isActive ? "true" : undefined}
      {...props}
    >
      {children}
    </a>
  );
}
