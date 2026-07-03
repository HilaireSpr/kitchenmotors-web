type BubbleItem = {
  item_name: string;
  groups: string[];
  quantity: number;
  revenue: number;
  x: number;
  y: number;

  radius: number;
  quadrant: "star" | "workhorse" | "puzzle" | "dog";

  average_price?: number | null;
  days_offered?: number;
  color?: string;
  opacity?: number;
  highlight?: boolean;
  show_label?: boolean;
};

type MatrixData = {
  average_quantity: number;
  average_revenue: number;
  quadrants: {
    star: number;
    workhorse: number;
    puzzle: number;
    dog: number;
  };
  bubbles: BubbleItem[];
};

type BubbleMatrixProps = {
  matrix: MatrixData;
};

const quadrantLabels = {
  star: "Stars",
  workhorse: "Hardlopers",
  puzzle: "Puzzels",
  dog: "Slapers",
};

const quadrantColors = {
  star: "#dcfce7",
  workhorse: "#fef9c3",
  puzzle: "#dbeafe",
  dog: "#fee2e2",
};


export default function BubbleMatrix({ matrix }: BubbleMatrixProps) {
  const width = 900;
  const height = 560;
  const padding = 70;

  const maxX = Math.max(...matrix.bubbles.map((item) => Math.log10(item.x + 1)), 1);
  const maxY = Math.max(...matrix.bubbles.map((item) => Math.log10(item.y + 1)), 1);

  function scaleX(value: number) {
    const logValue = Math.log10(value + 1);
    return padding + (logValue / maxX) * (width - padding * 2);
  }

  function scaleY(value: number) {
    const logValue = Math.log10(value + 1);
    return height - padding - (logValue / maxY) * (height - padding * 2);
  }

  const averageX = scaleX(matrix.average_quantity);
  const averageY = scaleY(matrix.average_revenue);

  return (
    <div className="card" style={{ padding: 22, boxShadow: "none" }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 6 }}>Menu Engineering Matrix</h3>
        <p style={{ color: "#666", margin: 0 }}>
          Populariteit op de horizontale as, omzet op de verticale as.
        </p>
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Menu Engineering Bubble Matrix"
          style={{
            width: "100%",
            minWidth: 760,
            border: "1px solid var(--border)",
            borderRadius: 18,
            background: "#fff",
          }}
        >
          <rect
            x={padding}
            y={padding}
            width={averageX - padding}
            height={averageY - padding}
            fill={quadrantColors.puzzle}
          />

          <rect
            x={averageX}
            y={padding}
            width={width - padding - averageX}
            height={averageY - padding}
            fill={quadrantColors.star}
          />

          <rect
            x={padding}
            y={averageY}
            width={averageX - padding}
            height={height - padding - averageY}
            fill={quadrantColors.dog}
          />

          <rect
            x={averageX}
            y={averageY}
            width={width - padding - averageX}
            height={height - padding - averageY}
            fill={quadrantColors.workhorse}
          />

          <line
            x1={averageX}
            y1={padding}
            x2={averageX}
            y2={height - padding}
            stroke="#111"
            strokeDasharray="6 6"
            strokeWidth={1.5}
          />

          <line
            x1={padding}
            y1={averageY}
            x2={width - padding}
            y2={averageY}
            stroke="#111"
            strokeDasharray="6 6"
            strokeWidth={1.5}
          />

          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#111"
            strokeWidth={2}
          />

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#111"
            strokeWidth={2}
          />

          <text x={width - padding} y={height - 24} textAnchor="end" fontSize={13} fontWeight={700}>
            Gem. verkoop per dag →
          </text>

          <text
            x={24}
            y={padding}
            textAnchor="start"
            fontSize={13}
            fontWeight={700}
            transform={`rotate(-90 24 ${padding})`}
          >
            Gem. dagomzet →
          </text>

          <text x={padding + 18} y={padding + 28} fontSize={16} fontWeight={900}>
            {quadrantLabels.puzzle}
          </text>

          <text x={averageX + 18} y={padding + 28} fontSize={16} fontWeight={900}>
            {quadrantLabels.star}
          </text>

          <text x={padding + 18} y={averageY + 30} fontSize={16} fontWeight={900}>
            {quadrantLabels.dog}
          </text>

          <text x={averageX + 18} y={averageY + 30} fontSize={16} fontWeight={900}>
            {quadrantLabels.workhorse}
          </text>

          {matrix.bubbles.map((bubble) => {
            const cx = scaleX(bubble.x);
            const cy = scaleY(bubble.y);
            const displayRadius = bubble.radius || 8;
            const bubbleColor = bubble.color || "#f59e0b";
            const bubbleOpacity = bubble.opacity ?? 0.75;
            const showLabel = bubble.show_label ?? bubble.highlight ?? false;

            return (
              <g key={`${bubble.item_name}-${bubble.groups.join("-")}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={displayRadius}
                  fill={bubbleColor}
                  opacity={bubbleOpacity}
                  stroke="#111"
                  strokeWidth={1}
                />

                {showLabel && (
                  <text
                    x={cx + displayRadius + 4}
                    y={cy - 4}
                    fontSize={10}
                    fontWeight={700}
                    fill="#111"
                  >
                    {bubble.item_name.length > 24
                      ? `${bubble.item_name.slice(0, 24)}…`
                      : bubble.item_name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <div className="card" style={{ padding: 14, boxShadow: "none" }}>
          <strong>Dagmenu</strong>
          <p style={{ margin: "6px 0 0", color: "#666" }}>
            {matrix.bubbles.filter((item) => item.groups.includes("Dagmenu")).length} gerechten
          </p>
        </div>

        <div className="card" style={{ padding: 14, boxShadow: "none" }}>
          <strong>Gezond Gerecht</strong>
          <p style={{ margin: "6px 0 0", color: "#666" }}>
            {matrix.bubbles.filter((item) => item.groups.includes("Gezond Gerecht")).length} gerechten
          </p>
        </div>

        <div className="card" style={{ padding: 14, boxShadow: "none" }}>
          <strong>Specialiteit Refter</strong>
          <p style={{ margin: "6px 0 0", color: "#666" }}>
            {matrix.bubbles.filter((item) => item.groups.includes("Specialiteit Refter")).length} gerechten
          </p>
        </div>

        <div className="card" style={{ padding: 14, boxShadow: "none" }}>
          <strong>Kwadranten</strong>
          <p style={{ margin: "6px 0 0", color: "#666" }}>
            Stars: {matrix.quadrants.star} · Hardlopers: {matrix.quadrants.workhorse} · Puzzels: {matrix.quadrants.puzzle} · Slapers: {matrix.quadrants.dog}
          </p>
        </div>
      </div>
    </div>
  );
}