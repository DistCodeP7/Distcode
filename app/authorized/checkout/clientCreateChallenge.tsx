"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateChallengeForm } from "@/app/authorized/[id]/problemActions";
import FooterNav from "@/app/authorized/checkout/components/footer";
import Header from "@/app/authorized/checkout/components/header";
import StepFourSummary from "@/app/authorized/checkout/steps/stepFourSummary";
import StepOneDetails from "@/app/authorized/checkout/steps/stepOneDetails";
import StepThreeSubmission from "@/app/authorized/checkout/steps/stepThreeSubmission";
import StepTwoTestEnv from "@/app/authorized/checkout/steps/stepTwoTest";
import useCreateChallenge from "@/app/authorized/checkout/useCreateChallenge";
import NeonLines from "@/components/custom/neonLine";
import { Card, CardContent } from "@/components/ui/card";
import type { CheckoutFormState } from "@/types/challenge";
import type { ActionResult } from "@/types/problemTypes";

export default function ClientCreateChallenge({
  baseForm,
  exerciseId,
  currentSelected,
}: {
  baseForm: CheckoutFormState;
  exerciseId?: number;
  currentSelected: string[];
}) {
  const router = useRouter();
  const {
    form,
    setCurrentStep,
    nextStep,
    prevStep,
    updateDetails,
    updateTestConfig,
    updateSubmission,
  } = useCreateChallenge(baseForm, currentSelected);

  const onSubmit = async () => {
    if (!exerciseId) return;
    const result: ActionResult = await updateChallengeForm(exerciseId, form);
    if (result.success) {
      toast.success("Exercise submitted successfully!");
      router.push(`/authorized/`);
    } else
      toast.error(
        `Failed to save exercise form. ${
          result.error ? `Error: ${result.error}` : ""
        }`
      );
  };

  return (
    <div className="min-h-full bg-secondary/20 p-6 md:p-12 flex justify-center items-start">
      <div className="w-full max-w-5xl ">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <NeonLines count={80} />
        </div>
        <Header step={form.step} setCurrentStep={setCurrentStep} />

        <Card className="min-h-[600px] flex flex-col ">
          <CardContent className="flex-1 p-0">
            {form.step === 1 && (
              <StepOneDetails form={form.details} updateField={updateDetails} />
            )}
            {form.step === 2 && (
              <StepTwoTestEnv
                base={baseForm.testContainer}
                config={form.testContainer}
                update={updateTestConfig}
              />
            )}
            {form.step === 3 && (
              <StepThreeSubmission
                config={form.submission}
                update={updateSubmission}
              />
            )}
            {form.step === 4 && <StepFourSummary form={form} />}
          </CardContent>

          <FooterNav
            step={form.step}
            onNext={nextStep}
            onPrev={prevStep}
            onSubmit={onSubmit}
          />
        </Card>
      </div>
    </div>
  );
}
