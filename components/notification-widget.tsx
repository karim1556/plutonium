"use client";

import { useState } from "react";
import { Bell, BellRing, Mail, MessageSquare, Smartphone, Check, X, Settings } from "lucide-react";

interface NotificationChannel {
  id: string;
  name: string;
  icon: React.ElementType;
  enabled: boolean;
  description: string;
}

interface NotificationWidgetProps {
  patientId?: string;
  onSettingsChange?: (settings: Record<string, boolean>) => void;
}

export function NotificationWidget({ patientId, onSettingsChange }: NotificationWidgetProps) {
  const [channels, setChannels] = useState<NotificationChannel[]>([
    { id: "email", name: "Email", icon: Mail, enabled: true, description: "Receive daily summaries and alerts" },
    { id: "push", name: "Push", icon: BellRing, enabled: true, description: "Real-time browser notifications" },
    { id: "sms", name: "SMS", icon: Smartphone, enabled: false, description: "Text messages for urgent alerts" },
    { id: "whatsapp", name: "WhatsApp", icon: MessageSquare, enabled: false, description: "WhatsApp message alerts" }
  ]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentNotifications] = useState([
    { id: 1, message: "Medication reminder: Morning dose due in 15 min", time: "2 min ago", type: "reminder" },
    { id: 2, message: "Good job! Morning dose taken on time", time: "3 hours ago", type: "success" },
    { id: 3, message: "Refill alert: Metformin running low (5 pills left)", time: "Yesterday", type: "warning" }
  ]);

  const toggleChannel = (channelId: string) => {
    setChannels(prev => {
      const updated = prev.map(ch =>
        ch.id === channelId ? { ...ch, enabled: !ch.enabled } : ch
      );
      if (onSettingsChange) {
        const settings = Object.fromEntries(updated.map(ch => [ch.id, ch.enabled]));
        onSettingsChange(settings);
      }
      return updated;
    });
  };

  const requestPushPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            <p className="text-xs text-slate-500">{channels.filter(c => c.enabled).length} channels active</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Recent Notifications */}
      <div className="mt-4 space-y-2">
        {recentNotifications.slice(0, 2).map(notification => (
          <div
            key={notification.id}
            className={`rounded-xl p-3 text-sm ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800"
                : notification.type === "warning"
                  ? "bg-amber-50 text-amber-800"
                  : "bg-sky-50 text-sky-800"
            }`}
          >
            <p className="leading-relaxed">{notification.message}</p>
            <p className="mt-1 text-xs opacity-70">{notification.time}</p>
          </div>
        ))}
      </div>

      {/* Channel Settings (Expanded) */}
      {isExpanded && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notification Channels</p>
          {channels.map(channel => (
            <div
              key={channel.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
            >
              <div className="flex items-center gap-3">
                <channel.icon className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{channel.name}</p>
                  <p className="text-xs text-slate-400">{channel.description}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (channel.id === "push") requestPushPermission();
                  toggleChannel(channel.id);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                  channel.enabled
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {channel.enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
