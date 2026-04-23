type RouteHandler = (params?: Record<string, string>) => Promise<void>;

const routes: Map<string, RouteHandler> = new Map();

function normalizePath(path: string): string {
  let p = path.trim();
  if (p.startsWith("#")) p = p.slice(1);
  if (p.startsWith("/")) p = p.slice(1);
  p = p.replace(/\/$/, ""); // strip trailing /
  return p;
}

export function register(path: string, handler: RouteHandler) {
  const key = normalizePath(path);
  routes.set(key, handler);
  if (key === "") {
    routes.set("/", handler); // alias
  }
}

export function navigate(path: string) {
  const hashPath = path.startsWith("#") ? path : "#" + path;
  window.location.hash = normalizePath(hashPath) === "" ? "#/" : hashPath;
}

function getHashPath(): string {
  let hash = window.location.hash;
  // handle plain "#" without path
  if (hash === "#") return "/";
  return normalizePath(hash);
}

export function initRouter() {
  const run = async () => {
    const path = getHashPath();

    const main = document.getElementById("main");
    if (!main) return;
    main.innerHTML = "";

    let handler = routes.get(path);
    let params: Record<string, string> | undefined;

    if (!handler) {
      const userMatch = path.match(/^user\/(.+)$/);
      if (userMatch) {
        handler = routes.get("user");
        params = { userId: userMatch[1] };
      }
    }

    if (!handler) {
      const gameMatch = path.match(/^([A-Za-z0-9_-]+)$/);
      if (gameMatch) {
        handler = routes.get("game");
        params = { gameId: gameMatch[1] };
      }
    }

    // Try exact match with trailing slash as fallback
    if (!handler) {
      handler = routes.get(path + "/");
    }

    if (!handler) {
      main.innerHTML = `
        <div class="container">
          <h1>404</h1>
          <p>Page not found!</p>
          <button onclick="window.location.hash='/'">Back home</button>
        </div>
      `;
      return;
    }

    try {
      await handler(params);
    } catch (e) {
      console.error("Route error:", e);
      main.innerHTML = `
        <div class="container">
          <h1>Error</h1>
          <p>Something went wrong.</p>
        </div>
      `;
    }
  };

  window.addEventListener("hashchange", run);

  // Intercept all internal link clicks
  document.addEventListener("click", (e) => {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href) return;
    // Only intercept hash-internal links: "#/" or "/#"
    if (href.startsWith("/#") || href.startsWith("#/")) {
      e.preventDefault();
      const hashPart = href.startsWith("/#") ? href.slice(1) : href; // "/#" -> "#", "#/abc" -> "#/abc"
      window.location.hash = normalizePath(hashPart) === "" ? "/" : hashPart.slice(1);
    }
  });

  run();
}