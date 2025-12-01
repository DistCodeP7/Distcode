import * as motion from "motion/react-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Header = ({
  step,
  setCurrentStep,
}: {
  step: number;
  setCurrentStep: (step: number) => void;
}) => (
  <div className="flex flex-col lg:flex-row justify-between md:items-center gap-4 my-6">
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-foreground text-center lg:text-left">
        Create Challenge
      </h1>
      <p className="text-muted-foreground text-center lg:text-left">
        Configure the environment details and containers.
      </p>
    </div>
    <Card className="px-4 py-2 rounded-full">
      <div className="flex items-center gap-2">
        <StepBadge
          step={1}
          current={step}
          setCurrentStep={setCurrentStep}
          label="Details"
        />
        <div className="w-8 h-[1px] bg-border" />
        <StepBadge
          step={2}
          current={step}
          setCurrentStep={setCurrentStep}
          label="Test Env"
        />
        <div className="w-8 h-[1px] bg-border" />
        <StepBadge
          step={3}
          current={step}
          setCurrentStep={setCurrentStep}
          label="Submission"
        />
        <div className="w-8 h-[1px] bg-border" />
        <StepBadge
          step={4}
          current={step}
          setCurrentStep={setCurrentStep}
          label="Review"
        />
      </div>
    </Card>
  </div>
);

const StepBadge = ({
  step,
  current,
  label,
  setCurrentStep,
}: {
  step: number;
  current: number;
  label: string;
  setCurrentStep: (step: number) => void;
}) => {
  const active = current >= step;
  return (
    <Button
      variant={"ghost"}
      onClick={() => setCurrentStep(step)}
      className={`flex items-center gap-2 ${active ? "text-foreground" : "text-muted-foreground"}`}
    >
      <motion.div
        initial={false}
        animate={{
          backgroundColor: active ? "var(--primary)" : "var(--muted)",
          color: active
            ? "var(--primary-foreground)"
            : "var(--muted-foreground)",
        }}
        className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
      >
        {step}
      </motion.div>
      <span className="text-sm font-medium hidden md:inline">{label}</span>
    </Button>
  );
};
export default Header;
