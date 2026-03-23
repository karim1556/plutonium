import { redirect } from "next/navigation";
import { getOptionalSession, getDashboardPathForRole } from "@/lib/auth";

export default async function HomePage() {
  const session = await getOptionalSession();

  if (session) {
    redirect(getDashboardPathForRole(session.role));
  }

  redirect("/login");
}
