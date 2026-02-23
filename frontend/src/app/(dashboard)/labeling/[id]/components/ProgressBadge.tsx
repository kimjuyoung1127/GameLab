/** File progress badge used in file list rows. */
type ProgressBadgeProps = {
  status: string;
};

export default function ProgressBadge({ status }: ProgressBadgeProps) {
  const map: Record<string, { label: string; cls: string }> = {
    wip: { label: "WIP", cls: "bg-warning/20 text-warning" },
    pending: { label: "PENDING", cls: "bg-primary/20 text-primary-light" },
    done: { label: "DONE", cls: "bg-accent/20 text-accent" },
  };
  const info = map[status] ?? map.pending;
  return (
    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${info.cls}`}>
      {info.label}
    </span>
  );
}
