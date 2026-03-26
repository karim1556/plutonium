/**
 * Unified Notification System
 * Supports: Email, Push, SMS, WhatsApp
 * Open-source and pluggable architecture
 */

import nodemailer from "nodemailer";

// ============================================================================
// Types
// ============================================================================

export type NotificationChannel = "email" | "push" | "sms" | "whatsapp" | "in_app";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  metadata?: Record<string, any>;
  scheduleFor?: Date;
}

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  sentAt: string;
  error?: string;
}

// ============================================================================
// Email Service (Nodemailer - Open Source)
// ============================================================================

let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;

  const emailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  emailTransporter = nodemailer.createTransport(emailConfig);
  return emailTransporter;
}

async function sendEmailNotification(
  to: string,
  subject: string,
  content: string
): Promise<NotificationResult> {
  try {
    if (!process.env.SMTP_USER) {
      return {
        success: false,
        channel: "email",
        sentAt: new Date().toISOString(),
        error: "Email service not configured"
      };
    }

    const transporter = getEmailTransporter();

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${subject}</h2>
          <p style="color: #374151; line-height: 1.6;">${content}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated notification from MedAssist Pro.
          </p>
        </div>
      `
    });

    return {
      success: true,
      channel: "email",
      sentAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Email notification error:", error);
    return {
      success: false,
      channel: "email",
      sentAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// ============================================================================
// Push Notification Service (Pluggable)
// ============================================================================

async function sendPushNotification(
  token: string,
  title: string,
  body: string
): Promise<NotificationResult> {
  try {
    // Pluggable - can integrate Firebase, OneSignal, etc.
    // For now, return simulated success
    if (process.env.PUSH_SERVICE_ENABLED === "true") {
      // TODO: Integrate actual push service
      // Example: Firebase Cloud Messaging, OneSignal, Pusher
      return {
        success: true,
        channel: "push",
        sentAt: new Date().toISOString()
      };
    }

    return {
      success: false,
      channel: "push",
      sentAt: new Date().toISOString(),
      error: "Push service not enabled"
    };
  } catch (error) {
    console.error("Push notification error:", error);
    return {
      success: false,
      channel: "push",
      sentAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// ============================================================================
// SMS Service (Pluggable)
// ============================================================================

async function sendSmsNotification(
  phone: string,
  message: string
): Promise<NotificationResult> {
  try {
    // Pluggable - can integrate Twilio, SNS, etc.
    if (process.env.SMS_SERVICE_ENABLED === "true") {
      // TODO: Integrate actual SMS service
      // Example with Twilio:
      // const twilio = require('twilio')(accountSid, authToken);
      // await twilio.messages.create({ body: message, to: phone, from: twilioNumber });

      return {
        success: true,
        channel: "sms",
        sentAt: new Date().toISOString()
      };
    }

    return {
      success: false,
      channel: "sms",
      sentAt: new Date().toISOString(),
      error: "SMS service not enabled"
    };
  } catch (error) {
    console.error("SMS notification error:", error);
    return {
      success: false,
      channel: "sms",
      sentAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// ============================================================================
// WhatsApp Service (Pluggable)
// ============================================================================

async function sendWhatsAppNotification(
  phone: string,
  message: string
): Promise<NotificationResult> {
  try {
    // Pluggable - can integrate Twilio WhatsApp, WhatsApp Business API
    if (process.env.WHATSAPP_SERVICE_ENABLED === "true") {
      // TODO: Integrate WhatsApp service
      return {
        success: true,
        channel: "whatsapp",
        sentAt: new Date().toISOString()
      };
    }

    return {
      success: false,
      channel: "whatsapp",
      sentAt: new Date().toISOString(),
      error: "WhatsApp service not enabled"
    };
  } catch (error) {
    console.error("WhatsApp notification error:", error);
    return {
      success: false,
      channel: "whatsapp",
      sentAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// ============================================================================
// Main Notification Dispatcher
// ============================================================================

export async function sendNotification(
  payload: NotificationPayload,
  userEmail?: string,
  userPhone?: string,
  pushToken?: string
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (const channel of payload.channels) {
    let result: NotificationResult;

    switch (channel) {
      case "email":
        if (userEmail) {
          result = await sendEmailNotification(userEmail, payload.title, payload.message);
          results.push(result);
        }
        break;

      case "push":
        if (pushToken) {
          result = await sendPushNotification(pushToken, payload.title, payload.message);
          results.push(result);
        }
        break;

      case "sms":
        if (userPhone) {
          result = await sendSmsNotification(userPhone, payload.message);
          results.push(result);
        }
        break;

      case "whatsapp":
        if (userPhone) {
          result = await sendWhatsAppNotification(userPhone, payload.message);
          results.push(result);
        }
        break;

      case "in_app":
        // Store in database for in-app display
        result = {
          success: true,
          channel: "in_app",
          sentAt: new Date().toISOString()
        };
        results.push(result);
        break;
    }
  }

  return results;
}

// ============================================================================
// Notification Templates
// ============================================================================

export const NotificationTemplates = {
  missedDose: (medicineName: string, time: string) => ({
    title: "Missed Dose Alert",
    message: `You missed your ${medicineName} dose scheduled for ${time}. Please take it now if within the safe window, or contact your caregiver.`
  }),

  upcomingDose: (medicineName: string, time: string) => ({
    title: "Upcoming Dose Reminder",
    message: `Your ${medicineName} dose is due at ${time}. Please prepare to take your medication.`
  }),

  refillWarning: (medicineName: string, remaining: number) => ({
    title: "Refill Required",
    message: `Your ${medicineName} is running low (${remaining} doses left). Please order a refill soon.`
  }),

  deviceOffline: () => ({
    title: "Device Offline",
    message: "Your medication dispenser is offline. Please check the device connection."
  }),

  caregiverAlert: (patientName: string, issue: string) => ({
    title: `Alert: ${patientName}`,
    message: `${patientName} needs attention: ${issue}`
  }),

  adherenceReport: (patientName: string, percentage: number) => ({
    title: "Weekly Adherence Report",
    message: `${patientName}'s adherence this week: ${percentage}%. ${percentage < 80 ? "Attention needed." : "Great progress!"}`
  })
};

// ============================================================================
// Notification Queue (For scheduled notifications)
// ============================================================================

interface QueuedNotification extends NotificationPayload {
  id: string;
  status: "pending" | "sent" | "failed";
  attempts: number;
  lastAttempt?: Date;
}

const notificationQueue: QueuedNotification[] = [];

export function queueNotification(payload: NotificationPayload): string {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  notificationQueue.push({
    ...payload,
    id,
    status: "pending",
    attempts: 0
  });

  return id;
}

export function getQueuedNotifications(): QueuedNotification[] {
  return [...notificationQueue];
}

// ============================================================================
// Helper Functions
// ============================================================================

export function sendMissedDoseAlert(
  userId: string,
  medicineName: string,
  time: string,
  userEmail?: string,
  userPhone?: string
) {
  const template = NotificationTemplates.missedDose(medicineName, time);

  return sendNotification(
    {
      userId,
      ...template,
      priority: "high",
      channels: ["email", "sms", "push", "in_app"]
    },
    userEmail,
    userPhone
  );
}

export function sendRefillAlert(
  userId: string,
  medicineName: string,
  remaining: number,
  userEmail?: string
) {
  const template = NotificationTemplates.refillWarning(medicineName, remaining);

  return sendNotification(
    {
      userId,
      ...template,
      priority: "normal",
      channels: ["email", "in_app"]
    },
    userEmail
  );
}

export function sendCaregiverAlert(
  caregiverId: string,
  patientName: string,
  issue: string,
  email?: string,
  phone?: string
) {
  const template = NotificationTemplates.caregiverAlert(patientName, issue);

  return sendNotification(
    {
      userId: caregiverId,
      ...template,
      priority: "urgent",
      channels: ["email", "sms", "push"]
    },
    email,
    phone
  );
}
