import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Env } from "../challenge";

// --- Shared Helpers ---

const EnvList = ({
  envs,
  onChange,
  compact,
}: {
  envs: Env[];
  onChange: (e: Env[]) => void;
  compact?: boolean;
}) => {
  const update = (i: number, k: keyof Env, v: string) => {
    const n = [...envs];
    n[i] = { ...n[i], [k]: v };
    onChange(n);
  };
  const remove = (i: number) => onChange(envs.filter((_, idx) => idx !== i));
  const add = () => onChange([...envs, { key: "", value: "", id: nanoid() }]);

  return (
    <div className="space-y-2">
      {envs.map((env, i) => (
        <div key={env.id} className="flex gap-2 group">
          <Input
            placeholder="KEY"
            className={`font-mono uppercase ${compact ? "h-7 text-xs px-2" : "h-9 text-xs"}`}
            value={env.key}
            onChange={(e) => update(i, "key", e.target.value)}
          />
          <Input
            placeholder="VAL"
            className={`font-mono ${compact ? "h-7 text-xs px-2" : "h-9 text-xs"}`}
            value={env.value}
            onChange={(e) => update(i, "value", e.target.value)}
          />
          <Button
            size="icon"
            variant="ghost"
            className={`${compact ? "h-7 w-7" : "h-9 w-9"} text-muted-foreground hover:text-destructive`}
            onClick={() => remove(i)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={add}
        className={`w-full border-dashed text-muted-foreground hover:text-foreground hover:border-primary ${compact ? "h-7 text-xs" : ""}`}
      >
        <Plus size={14} className="mr-2" /> Add Env
      </Button>
    </div>
  );
};

export default EnvList;
