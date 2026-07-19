import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
}

export function MetricCard({ label, value, subValue }: MetricCardProps): React.ReactElement {
  return (
    <div className="metric-card">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {subValue && <div className="sub-value">{subValue}</div>}
    </div>
  );
}
