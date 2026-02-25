/** File status badge for the labeling left panel list. */
import { useTranslations } from "next-intl";

type ProgressBadgeProps = {
  status: string;
};

export default function ProgressBadge({ status }: ProgressBadgeProps) {
  const t = useTranslations("labeling");
  const map: Record<string, { label: string; cls: string }> = {
    wip: { label: t("statusWip"), cls: "bg-warning/20 text-warning" },
    pending: { label: t("statusPending"), cls: "bg-primary/20 text-primary-light" },
    done: { label: t("statusDone"), cls: "bg-accent/20 text-accent" },
  };
  const info = map[status] ?? map.pending;
  return <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${info.cls}`}>{info.label}</span>;
}
