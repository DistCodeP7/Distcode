"use client";

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import NeonLines from "@/components/custom/NeonLine";
import Header from "./components/Header";
import FooterNav from "./components/Footer";
import useCreateChallenge from "./useCreateChallenge";
import StepOneDetails from "./steps/StepOneDetails";
import StepFourSummary from "./steps/StepFourSummary";
import StepThreeSubmission from "./steps/StepThreeSubmission";
import StepTwoTestEnv from "./steps/StepTwoTest";

export default function CreateChallenge() {
  const {
    form,
    setCurrentStep,
    nextStep,
    prevStep,
    updateDetails,
    updateTestConfig,
    updateSubmission,
  } = useCreateChallenge();

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
              <StepOneDetails form={form} updateField={updateDetails} />
            )}
            {form.step === 2 && (
              <StepTwoTestEnv
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
            onSubmit={() => console.log("Final Config:", form)}
          />
        </Card>
      </div>
    </div>
  );
}
