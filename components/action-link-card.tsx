import type { Route } from "next";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { UrlObject } from "url";
import { cn } from "@/lib/utils";

interface ActionLinkCardProps {
  href: string | UrlObject;
  title: string;
  description: string;
  icon: LucideIcon;
  eyebrow?: string;
  cta?: string;
  className?: string;
  tone?: "sky" | "sage" | "amber" | "rose" | "slate";
}

const toneClasses: Record<NonNullable<ActionLinkCardProps["tone"]>, string> = {
  sky: "border-sky-100 bg-[linear-gradient(180deg,#f2fbff_0%,#ffffff_100%)]",
  sage: "border-emerald-100 bg-[linear-gradient(180deg,#f3fbf6_0%,#ffffff_100%)]",
  amber: "border-amber-100 bg-[linear-gradient(180deg,#fff8ee_0%,#ffffff_100%)]",
  rose: "border-rose-100 bg-[linear-gradient(180deg,#fff4f3_0%,#ffffff_100%)]",
  slate: "border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]"
};

export function ActionLinkCard({
  href,
  title,
  description,
  icon: Icon,
  eyebrow,
  cta = "Open",
  className,
  tone = "slate"
}: ActionLinkCardProps) {
  return (
    <Link
      href={href as Route | UrlObject}
      className={cn(
        "group flex h-full flex-col justify-between rounded-[32px] border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(23,33,37,0.08)]",
        toneClasses[tone],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p> : null}
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-white/90 text-slate-950 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <ArrowUpRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-900" />
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        <p className="mt-5 text-sm font-semibold text-slate-900">{cta}</p>
      </div>
    </Link>
  );
}
