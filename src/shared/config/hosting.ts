/** True when the app is built for GitHub Pages (static export, local data). */
export const isGitHubPages =
  process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

/** Local-only mode: no Supabase, data in browser storage. */
export const isLocalMode = isGitHubPages;

/** Repo project pages base path — must match next.config basePath. */
export const githubPagesBasePath = "/shelflog";

export const basePath = isGitHubPages ? githubPagesBasePath : "";
