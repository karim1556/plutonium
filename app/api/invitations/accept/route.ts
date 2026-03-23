import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();
  const service = createServiceRoleSupabaseClient();

  if (!session || session.role !== "caregiver") {
    return NextResponse.json({ error: "Caregiver session required." }, { status: 401 });
  }

  if (!service) {
    return NextResponse.json(
      {
        error: "Supabase service role key is missing."
      },
      { status: 500 }
    );
  }

  const payload = (await request.json()) as {
    token?: string;
  };

  const token = payload.token?.trim().toUpperCase();

  if (!token) {
    return NextResponse.json(
      {
        error: "Invite token is required."
      },
      { status: 400 }
    );
  }

  const { data: invite, error: inviteError } = await service
    .from("caregiver_invitations")
    .select("id, patient_user_id, token, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json(
      {
        error: "Invite token not found."
      },
      { status: 404 }
    );
  }

  if (invite.status !== "pending") {
    return NextResponse.json(
      {
        error: "This invite is no longer active."
      },
      { status: 400 }
    );
  }

  if (new Date(invite.expires_at).getTime() < Date.now()) {
    await service
      .from("caregiver_invitations")
      .update({
        status: "expired"
      })
      .eq("id", invite.id);

    return NextResponse.json(
      {
        error: "This invite has expired."
      },
      { status: 400 }
    );
  }

  const { error: linkError } = await service.from("caregiver_links").upsert(
    {
      caregiver_user_id: session.id,
      patient_user_id: invite.patient_user_id
    },
    {
      onConflict: "caregiver_user_id,patient_user_id"
    }
  );

  if (linkError) {
    return NextResponse.json(
      {
        error: linkError.message
      },
      { status: 500 }
    );
  }

  await service
    .from("caregiver_invitations")
    .update({
      caregiver_user_id: session.id,
      status: "accepted",
      accepted_at: new Date().toISOString()
    })
    .eq("id", invite.id);

  const { data: patient } = await service
    .from("users")
    .select("id, name, role, phone, locale")
    .eq("id", invite.patient_user_id)
    .maybeSingle();

  return NextResponse.json({
    linked: true,
    patient
  });
}
