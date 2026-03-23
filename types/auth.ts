export type AppRole = "patient" | "caregiver";

export interface SessionUser {
  id: string;
  authUserId: string;
  name: string;
  role: AppRole;
  phone?: string | null;
  locale: string;
  relationLabel?: string;
}

export interface CaregiverInvitation {
  id: string;
  token: string;
  patientUserId: string;
  caregiverUserId?: string | null;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string | null;
}
