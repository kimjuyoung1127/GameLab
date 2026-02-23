/** Summary pills for suggestion status counts in analysis header. */
type StatusPillsProps = {
  pendingCount: number;
  confirmedCount: number;
  fixedCount: number;
  styles: Record<string, string>;
};

export default function StatusPills({
  pendingCount,
  confirmedCount,
  fixedCount,
  styles,
}: StatusPillsProps) {
  return (
    <div className={styles.c102}>
      {pendingCount > 0 && <span className={styles.c103}>{pendingCount} pending</span>}
      {confirmedCount > 0 && <span className={styles.c104}>{confirmedCount} ok</span>}
      {fixedCount > 0 && <span className={styles.c105}>{fixedCount} fixed</span>}
    </div>
  );
}
