import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/auth";
import {
  sendNotification,
  NotificationTemplates,
  type NotificationChannel,
  type NotificationPriority
} from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  try {
    const payload = await request.json();

    const {
      type,
      channels = ["email", "in_app"],
      priority = "normal",
      recipientEmail,
      recipientPhone,
      metadata = {}
    } = payload as {
      type: "missed_dose" | "upcoming_dose" | "refill_warning" | "device_offline" | "caregiver_alert" | "custom";
      channels?: NotificationChannel[];
      priority?: NotificationPriority;
      recipientEmail?: string;
      recipientPhone?: string;
      metadata?: Record<string, string>;
    };

    let title = "";
    let message = "";

    switch (type) {
      case "missed_dose":
        const missedTemplate = NotificationTemplates.missedDose(
          metadata.medicineName || "medication",
          metadata.time || "scheduled time"
        );
        title = missedTemplate.title;
        message = missedTemplate.message;
        break;

      case "upcoming_dose":
        const upcomingTemplate = NotificationTemplates.upcomingDose(
          metadata.medicineName || "medication",
          metadata.time || "soon"
        );
        title = upcomingTemplate.title;
        message = upcomingTemplate.message;
        break;

      case "refill_warning":
        const refillTemplate = NotificationTemplates.refillWarning(
          metadata.medicineName || "medication",
          parseInt(metadata.remaining || "5")
        );
        title = refillTemplate.title;
        message = refillTemplate.message;
        break;

      case "device_offline":
        const offlineTemplate = NotificationTemplates.deviceOffline();
        title = offlineTemplate.title;
        message = offlineTemplate.message;
        break;

      case "caregiver_alert":
        const alertTemplate = NotificationTemplates.caregiverAlert(
          metadata.patientName || "Patient",
          metadata.issue || "needs attention"
        );
        title = alertTemplate.title;
        message = alertTemplate.message;
        break;

      case "custom":
        title = metadata.title || "Notification";
        message = metadata.message || "You have a new notification.";
        break;

      default:
        return NextResponse.json(
          { error: "Invalid notification type", code: "INVALID_TYPE" },
          { status: 400 }
        );
    }

    const results = await sendNotification(
      {
        userId: session.id,
        title,
        message,
        priority,
        channels,
        metadata
      },
      recipientEmail,
      recipientPhone
    );

    return NextResponse.json({
      success: true,
      results,
      sentAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Notification API error:", error);
    return NextResponse.json(
      {
        error: "Failed to send notification",
        code: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
