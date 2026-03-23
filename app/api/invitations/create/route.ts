import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

function generateInviteToken() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
}

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();
  const service = createServiceRoleSupabaseClient();

  if (!session || session.role !== "patient") {
    return NextResponse.json({ error: "Patient session required." }, { status: 401 });
  }

  if (!service) {
    return NextResponse.json(
      {
        error: "Supabase service role key is missing."
      },
      { status: 500 }
    );
  }

  const token = generateInviteToken();
  const { data, error } = await service
    .from("caregiver_invitations")
    .insert({
      patient_user_id: session.id,
      token
    })
    .select("id, token, expires_at, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      {
        error: error?.message ?? "Failed to create invitation."
      },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const inviteUrl = `${url.origin}/signup?invite=${data.token}`;

  return NextResponse.json({
    invite: {
      id: data.id,
      token: data.token,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      inviteUrl
    }
  });
}
