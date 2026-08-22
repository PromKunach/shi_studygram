export const THEME_STORAGE_KEY = "theme";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

/** Runs before paint so the first frame already matches the saved theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var stored=localStorage.getItem("${THEME_STORAGE_KEY}");var system=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";var resolved=stored==="dark"||stored==="light"?stored:system;var root=document.documentElement;root.classList.remove("light","dark");root.classList.add(resolved);root.style.colorScheme=resolved;}catch(e){}})();`;
