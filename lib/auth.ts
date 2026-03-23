import { redirect } from "next/navigation";
import { caregiverOnlyPaths, getDashboardPathForRole, patientOnlyPaths, protectedPaths } from "@/lib/auth-config";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { AppRole, SessionUser } from "@/types/auth";

export { caregiverOnlyPaths, getDashboardPathForRole, patientOnlyPaths, protectedPaths };

function mapProfileRow(row: {
  id: string;
  auth_user_id: string | null;
  name: string;
  role: AppRole;
  phone: string | null;
  locale: string;
}): SessionUser {
  return {
    id: row.id,
    authUserId: row.auth_user_id ?? "",
    name: row.name,
    role: row.role,
    phone: row.phone,
    locale: row.locale
  };
}

export async function getCurrentSessionUser() {
  const supabase = createServerSupabaseClient();
  const service = createServiceRoleSupabaseClient();

  if (!supabase || !service) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await service
    .from("users")
    .select("id, auth_user_id, name, role, phone, locale")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfileRow(data);
}

export async function getOptionalSession() {
  return getCurrentSessionUser();
}

export async function requireSession(allowedRoles?: AppRole[]) {
  const user = await getCurrentSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(getDashboardPathForRole(user.role));
  }

  return user;
}

export async function getLinkedPatients(caregiverUserId: string) {
  const service = createServiceRoleSupabaseClient();

  if (!service) {
    return [];
  }

  const { data, error } = await service
    .from("caregiver_links")
    .select(
      `
        patient_user_id,
        users:patient_user_id (
          id,
          auth_user_id,
          name,
          role,
          phone,
          locale
        )
      `
    )
    .eq("caregiver_user_id", caregiverUserId);

  if (error || !data) {
    return [];
  }

  return data
    .map((entry) => entry.users)
    .filter(Boolean)
    .map((profile) => mapProfileRow(profile as never));
}

export async function getLinkedCaregivers(patientUserId: string) {
  const service = createServiceRoleSupabaseClient();

  if (!service) {
    return [];
  }

  const { data, error } = await service
    .from("caregiver_links")
    .select(
      `
        caregiver_user_id,
        users:caregiver_user_id (
          id,
          auth_user_id,
          name,
          role,
          phone,
          locale
        )
      `
    )
    .eq("patient_user_id", patientUserId);

  if (error || !data) {
    return [];
  }

  return data
    .map((entry) => entry.users)
    .filter(Boolean)
    .map((profile) => mapProfileRow(profile as never));
}
