import { NextRequest, NextResponse } from "next/server";
import { searchEditorialContent } from "../../../lib/queries";
import { ApiError } from "../../../lib/api";
import { editorialSearchGate } from "../../../lib/request-gate";

export async function GET(request: NextRequest) {
  if (request.nextUrl.search.length > 4096) {
    return NextResponse.json({ message: "Query string is too large." }, { status: 414 });
  }
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ data: { news: [], blog: [] } });
  }

  const slot = editorialSearchGate.enter();
  if ("retryAfter" in slot) {
    return NextResponse.json({ message: "Too many search requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(slot.retryAfter), "Cache-Control": "no-store" } });
  }
  try {
    const results = await searchEditorialContent(query, { cache: "no-store" });
    return NextResponse.json({ data: results.data });
  } catch (error) {
    if (error instanceof ApiError && [429, 503].includes(error.status)) {
      return NextResponse.json(
        { message: "Too many search requests. Try again shortly." },
        { status: error.status, headers: { "Retry-After": String(error.retryAfter ?? 1), "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { message: "Search is temporarily unavailable." },
      { status: 502 }
    );
  } finally { slot.release(); }
}
