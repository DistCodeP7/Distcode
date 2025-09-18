// NeonLine.jsx
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
      className="neon-line  w-[2px] absolute  animate-pulse" // Use a consistent class name
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

export default function NeonLines({ count = 45 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <NeonLine key={i} index={i} total={count} />
      ))}
    </>
  );
}
