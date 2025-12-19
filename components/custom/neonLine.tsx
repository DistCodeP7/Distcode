// NeonLine.tsx
interface NeonLineProps {
  index: number;
  total: number;
}

function NeonLine({ index, total }: NeonLineProps) {
  const top = (index * 37) % 100;
  const left = (index * 53) % 100;
  const length = 60 + ((index * 17) % 90);
  const angle = (360 / total) * index;
  const delay = (total / 40) * index;

  return (
    <div
      className="neon-line w-[2px] fixed animate-pulse"
      style={{
        "--initial-angle": `${angle}deg`,
        top: `${top}%`,
        left: `${left}%`,
        height: `${length}px`,
        animationDelay: `0s, -${delay}s`,
      }}
    />
  );
}

export default function NeonLines({ count = 40 }) {
  const lines = Array.from({ length: count }, (_, i) => ({
    index: i,
    key: `neon-${i}`,
  }));

  return (
    <>
      {lines.map((line) => (
        <NeonLine key={line.key} index={line.index} total={count} />
      ))}
    </>
  );
}
