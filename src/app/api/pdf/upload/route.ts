import { NextRequest, NextResponse } from "next/server";
import { extractText, extractFormulas } from "@/lib/pdf/parser";
import type { Formula, PageText } from "@/lib/pdf/parser";

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your_supabase_url";

async function getSessionUserId(req: NextRequest): Promise<string | null> {
  void req;
  if (!hasSupabase) return "anonymous";
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user.id ?? null;
  } catch {
    return null;
  }
}

export const runtime = "nodejs";

const MAX_FILE_SIZE = 50 * 1024 * 1024; 

interface UploadResponse {
  text: string;
  pages: PageText[];
  pageCount: number;
  formulas: Formula[];
  name: string;
  size: number;
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 415 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB` },
      { status: 413 }
    );
  }

  try {
    const parsed = await extractText(file);

    const formulas: Formula[] = [];
    for (const pageData of parsed.pages) {
      const pageFormulas = extractFormulas(pageData.text, pageData.page);
      formulas.push(...pageFormulas);
    }

    const response: UploadResponse = {
      text: parsed.text,
      pages: parsed.pages,
      pageCount: parsed.pageCount,
      formulas,
      name: file.name,
      size: file.size,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF parsing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
