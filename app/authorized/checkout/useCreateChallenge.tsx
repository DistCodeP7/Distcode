"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import type {
  CheckoutFormState,
  DetailsConfig,
  SubmissionConfig,
  TestContainerConfig,
} from "@/types/challenge";

const useCreateChallenge = (
  baseFormParam: CheckoutFormState,
  current: string[]
) => {
  const baseForm = baseFormParam;
  const buildInitialForm = (): CheckoutFormState => {
    const base = baseFormParam;
    const baseTestFiles = { ...base.testContainer.testFiles };

    if (base.testContainer.testFiles?.["test/main_test.go"]) {
      baseTestFiles["test/main_test.go"] =
        base.testContainer.testFiles["test/main_test.go"];
    }
    Object.keys(baseTestFiles).forEach((f) => {
      if (f !== "test/main_test.go" && !current.includes(f)) {
        delete baseTestFiles[f];
      }
    });

    return {
      ...base,
      testContainer: { ...base.testContainer, testFiles: baseTestFiles },
    };
  };

  const [form, setForm] = useState<CheckoutFormState>(buildInitialForm);
  useLayoutEffect(() => {
    const saved = localStorage.getItem("challengeForm");
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch (err) {
        console.warn(
          "Invalid challengeForm in localStorage, clearing it:",
          err
        );
        localStorage.removeItem("challengeForm");
        setForm(baseForm);
      }
    } else {
      setForm(baseForm);
    }
  }, [baseForm]);

  useEffect(() => {
    localStorage.setItem("challengeForm", JSON.stringify(form));
  }, [form]);

  const setCurrentStep = (step: number) => {
    setForm((prev) => ({ ...prev, step }));
  };
  const nextStep = () =>
    setForm((prev) => ({ ...prev, step: Math.min(prev.step + 1, 4) }));
  const prevStep = () =>
    setForm((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }));

  const updateDetails = (
    field: keyof DetailsConfig,
    value: DetailsConfig[keyof DetailsConfig]
  ) =>
    setForm((prev) => ({
      ...prev,
      details: { ...prev.details, [field]: value },
    }));

  const updateTestConfig = (
    field: keyof TestContainerConfig,
    value: TestContainerConfig[keyof TestContainerConfig]
  ) =>
    setForm((prev) => ({
      ...prev,
      testContainer: { ...prev.testContainer, [field]: value },
    }));

  const updateSubmission = (
    field: keyof SubmissionConfig,
    value: SubmissionConfig[keyof SubmissionConfig]
  ) =>
    setForm((prev) => ({
      ...prev,
      submission: { ...prev.submission, [field]: value },
    }));

  return {
    form,
    setForm,
    setCurrentStep,
    nextStep,
    prevStep,
    updateDetails,
    updateTestConfig,
    updateSubmission,
  };
};

export default useCreateChallenge;
