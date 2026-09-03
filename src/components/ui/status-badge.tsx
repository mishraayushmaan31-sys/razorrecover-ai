type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: 'success' | 'neutral' | 'warning';
};

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
