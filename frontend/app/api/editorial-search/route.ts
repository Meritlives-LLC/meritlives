import { NextRequest, NextResponse } from "next/server";
import { searchEditorialContent } from "../../../lib/queries";
import { ApiError } from "../../../lib/api";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ data: { news: [], blog: [] } });
  }

  try {
    const results = await searchEditorialContent(query, { cache: "no-store" });
    return NextResponse.json({ data: results.data });
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      return NextResponse.json(
        { message: "Too many search requests. Try again shortly." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { message: "Search is temporarily unavailable." },
      { status: 502 }
    );
  }
}
