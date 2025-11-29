import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

type FooterNavProps = {
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
};

// 2. Footer
const FooterNav = ({ step, onNext, onPrev, onSubmit }: FooterNavProps) => (
  <div className="bg-secondary/30 px-8 py-4 border-t flex justify-between items-center mt-auto">
    {step > 1 ? (
      <Button variant="ghost" onClick={onPrev} className="gap-2">
        <ArrowLeft size={16} /> Back
      </Button>
    ) : (
      <div />
    )}
    {step < 4 ? (
      <Button onClick={onNext} size="lg" className="gap-2">
        Next Step <ArrowRight size={16} />
      </Button>
    ) : (
      <Button onClick={onSubmit} size="lg" className="gap-2">
        <CheckCircle2 size={16} /> Submit Challenge
      </Button>
    )}
  </div>
);

export default FooterNav;
