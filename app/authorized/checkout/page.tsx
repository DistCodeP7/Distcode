"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import NeonLines from "@/components/custom/NeonLine";
import { Card, CardContent } from "@/components/ui/card";
import { updateChallengeForm } from "../[id]/problemActions";
import FooterNav from "./components/Footer";
import Header from "./components/Header";
import StepFourSummary from "./steps/StepFourSummary";
import StepOneDetails from "./steps/StepOneDetails";
import StepThreeSubmission from "./steps/StepThreeSubmission";
import StepTwoTestEnv from "./steps/StepTwoTest";
import useCreateChallenge from "./useCreateChallenge";

type ActionResult =
  | { success: true; message?: string; status?: number; id?: number }
  | { success: false; error?: string; status?: number };

export default function CreateChallenge() {
  const router = useRouter();
  const {
    baseForm,
    form,
    setCurrentStep,
    nextStep,
    prevStep,
    updateDetails,
    updateTestConfig,
    updateSubmission,
    exerciseId,
  } = useCreateChallenge();

  const onSubmit = async () => {
    if (!exerciseId) return;
    const result: ActionResult = await updateChallengeForm(exerciseId, form);
    if (result.success) {
      toast.success("Challenge form saved successfully!");
      router.push(`/authorized/`);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20 p-6 md:p-12 flex justify-center items-start">
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
