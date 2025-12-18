"use client";

import { useEffect, useState } from "react";
import type {
  CheckoutFormState,
  DetailsConfig,
  SubmissionConfig,
  TestContainerConfig,
} from "@/types/challenge";

const useCreateChallenge = (
  baseFormParam: CheckoutFormState,
  current: string[],
  storageKey?: string
) => {
  const key = storageKey ?? "challengeForm";

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

  // Initialize state directly from LocalStorage
  const [form, setForm] = useState<CheckoutFormState>(() => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : buildInitialForm();
  });

  // Persist state to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(form));
  }, [form, key]);

  const setCurrentStep = (step: number) =>
    setForm((prev) => ({ ...prev, step }));

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

  const clearDraft = () => localStorage.removeItem(key);

  return {
    form,
    setForm,
    setCurrentStep,
    nextStep,
    prevStep,
    updateDetails,
    updateTestConfig,
    updateSubmission,
    clearDraft,
  };
};

export default useCreateChallenge;
