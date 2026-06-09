export interface PageText {
  page: number;
  text: string;
}

export interface Formula {
  formula: string;
  page: number;
  context: string;
  subject: "math" | "physics" | "chemistry" | "other";
}

export interface ParsedPDF {
  text: string;
  pages: PageText[];
  pageCount: number;
}

const MATH_PATTERNS = [
  /\$\$[\s\S]+?\$\$/g,          
  /\$[^$\n]+?\$/g,              
  /\\frac\{[^}]+\}\{[^}]+\}/g, 
  /\\sum(?:_\{[^}]+\})?(?:\^\{[^}]+\})?/g, 
  /\\int(?:_\{[^}]+\})?(?:\^\{[^}]+\})?/g, 
  /\\lim_\{[^}]+\}/g,           
  /\\sqrt\{[^}]+\}/g,           
  /\\(?:alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|omega|phi|psi)/g,
  /d\/dx\[[^\]]+\]/g,           
  /[a-zA-Z]\^\{?[\d]+\}?/g,    
  /\b(?:lim|sin|cos|tan|log|ln|exp)\s*[({]/g,
];

const PHYSICS_PATTERNS = [
  /[FMEV]\s*=\s*[a-zA-Z0-9+\-*/^().\s]+/g,  
  /\b(?:F|v|a|p|E|KE|PE|W|P)\s*=\s*/g,
  /\d+\s*(?:m\/s²?|N·m|kg·m|J\/s|kJ|kPa|MPa|m\/s)\b/g,
  /(?:Newton|Coulomb|Faraday|Ohm|Watt|Joule|Hertz)\s+law/gi,
];

const CHEMISTRY_PATTERNS = [
  /\b[A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)*\b(?:\s*[+→⇌]\s*\b[A-Z][a-z]?\d*(?:[A-Z][a-z]?\d*)*\b)+/g, 
  /\b(?:H2O|CO2|NaCl|H2SO4|NaOH|HCl|NH3|CH4|C6H6|C2H5OH)\b/g,
  /pH\s*=\s*[\d.]+/g,
  /\b(?:mol(?:ar)?|mmol|concentration|equilibrium)\b/gi,
];

function classifyFormula(formula: string): "math" | "physics" | "chemistry" | "other" {
  const f = formula.toLowerCase();
  if (CHEMISTRY_PATTERNS.some((p) => p.test(formula))) return "chemistry";
  if (
    f.includes("\\") ||
    f.includes("$") ||
    /\b(sin|cos|tan|log|ln|lim|sum|int|frac|sqrt)\b/.test(f)
  )
    return "math";
  if (/\b(force|velocity|acceleration|energy|power|momentum)\b/.test(f)) return "physics";
  if (/[FEMA]\s*=/.test(formula)) return "physics";
  return "other";
}

function extractContext(text: string, matchIndex: number, matchLength: number): string {
  const CONTEXT_CHARS = 80;
  const start = Math.max(0, matchIndex - CONTEXT_CHARS);
  const end = Math.min(text.length, matchIndex + matchLength + CONTEXT_CHARS);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

export function extractFormulas(text: string, page = 1): Formula[] {
  const formulas: Formula[] = [];
  const seen = new Set<string>();

  const allPatterns = [...MATH_PATTERNS, ...PHYSICS_PATTERNS, ...CHEMISTRY_PATTERNS];

  for (const pattern of allPatterns) {
    
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const raw = match[0].trim();
      if (raw.length < 3 || seen.has(raw)) continue;
      seen.add(raw);
      formulas.push({
        formula: raw,
        page,
        context: extractContext(text, match.index, raw.length),
        subject: classifyFormula(raw),
      });
    }
  }

  return formulas;
}

export async function extractText(file: File): Promise<ParsedPDF> {
  
  const pdfjsLib = await import("pdfjs-dist");

  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pages: PageText[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ page: pageNum, text: pageText });
  }

  const fullText = pages.map((p) => p.text).join("\n\n");

  return { text: fullText, pages, pageCount };
}
