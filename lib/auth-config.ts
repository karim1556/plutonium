import type { AppRole } from "@/types/auth";

export const protectedPaths = [
  "/patient",
  "/caregiver",
  "/dashboard",
  "/connections",
  "/upload",
  "/schedule",
  "/analytics",
  "/chat",
  "/device"
];

export const caregiverOnlyPaths = ["/caregiver", "/upload", "/schedule", "/analytics"];
export const patientOnlyPaths = ["/patient"];

export function getDashboardPathForRole(role: AppRole) {
  return role === "patient" ? "/patient" : "/caregiver";
}
