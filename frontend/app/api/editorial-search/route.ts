import { NextRequest, NextResponse } from "next/server";
import { searchEditorialContent } from "../../../lib/queries";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ data: { news: [], blog: [] } });
  }

  try {
    const results = await searchEditorialContent(query, { cache: "no-store" });
    return NextResponse.json({ data: results.data });
  } catch {
    return NextResponse.json(
      { message: "Search is temporarily unavailable." },
      { status: 502 }
    );
  }
}
