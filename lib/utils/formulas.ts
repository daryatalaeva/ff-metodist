import katex from "katex";

export function renderWithFormulas(text: string): string {
  // Block formulas $$ ... $$ first
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: true, throwOnError: false });
    } catch {
      return formula;
    }
  });
  // Inline $ ... $
  text = text.replace(/\$(.+?)\$/g, (_, formula) => {
    try {
      return katex.renderToString(formula, { displayMode: false, throwOnError: false });
    } catch {
      return formula;
    }
  });
  return text;
}
