import { NextRequest, NextResponse } from "next/server";
import { clusters } from "@/config/clusters";
import { getArticles } from "@/lib/get-articles";

export const dynamic = "force-dynamic";

// Public JSON feed for a HubSpot custom module (as an alternative to iframing
// the page directly). No auth — this vertical, unlike trade-intel, is meant
// to be publicly readable Newsroom content.
export async function GET(request: NextRequest) {
  const vertical = request.nextUrl.searchParams.get("vertical");
  const limitParam = request.nextUrl.searchParams.get("limit");

  if (vertical && !clusters.some((c) => c.id === vertical)) {
    return NextResponse.json(
      { error: `Unknown vertical "${vertical}". Valid values: ${clusters.map((c) => c.id).join(", ")}` },
      { status: 400 }
    );
  }

  const limit = limitParam ? Math.min(Number(limitParam) || 60, 100) : 60;

  try {
    const articles = await getArticles({ vertical, limit });
    return NextResponse.json({ articles });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
