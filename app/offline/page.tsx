export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="max-w-xl rounded-[36px] border border-white/80 bg-white/92 p-8 text-center shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Offline</p>
        <h1 className="mt-4 font-serif text-4xl text-slate-950">MedAssist is offline right now</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The app shell is installed, but the latest patient data needs a network connection. Reconnect to sync schedules,
          logs, and device status.
        </p>
      </div>
    </main>
  );
}
