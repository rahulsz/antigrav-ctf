import { createHighlighter, type Highlighter } from "shiki";

let highlighterInstance: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterInstance) {
    highlighterInstance = await createHighlighter({
      themes: ["github-dark-default"],
      langs: [
        "bash",
        "shell",
        "python",
        "javascript",
        "typescript",
        "powershell",
        "sql",
        "yaml",
        "json",
        "html",
        "css",
        "markdown",
        "plaintext",
        "ini",
        "xml",
        "ruby",
        "php",
        "c",
        "cpp",
      ],
    });
  }
  return highlighterInstance;
}

export async function highlightCode(
  code: string,
  lang: string = "plaintext"
): Promise<string> {
  const highlighter = await getHighlighter();

  // Fallback to plaintext if language not loaded
  const supportedLangs = highlighter.getLoadedLanguages();
  const resolvedLang = supportedLangs.includes(lang as never) ? lang : "plaintext";

  return highlighter.codeToHtml(code, {
    lang: resolvedLang,
    theme: "github-dark-default",
  });
}
