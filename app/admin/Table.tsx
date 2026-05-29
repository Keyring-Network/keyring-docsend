import styles from "./admin.module.css";

export type Cell = { label: string; node: React.ReactNode };

export function Table({
  head,
  rows,
}: {
  head: string[];
  rows: Cell[][];
}): React.ReactNode {
  if (rows.length === 0) {
    return <p className={styles.empty}>Nothing here yet.</p>;
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} data-label={cell.label}>
                  {cell.node}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
