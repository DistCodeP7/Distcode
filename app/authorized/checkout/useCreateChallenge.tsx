"use client";

import { nanoid } from "nanoid";
import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import type {
  CheckoutFormState,
  DetailsConfig,
  SubmissionConfig,
  TestContainerConfig,
} from "./challenge";

const initialFormState: CheckoutFormState = {
  step: 1,
  details: {
    title: "",
    description: "",
    difficulty: "",
  },
  testContainer: {
    alias: "test-runner",
    testFiles: {},
    buildCommand: "npm run build",
    entryCommand: "npm test",
    envs: [{ key: "TEST_MODE", value: "true", id: nanoid() }],
  },
  submission: {
    buildCommand: "npm run build",
    entryCommand: "npm start",
    replicas: 1,
    globalEnvs: [{ key: "PORT", value: "3000", id: nanoid() }],
    replicaConfigs: {
      0: { alias: "user-service-1", envs: [] },
    },
  },
};

const useCreateChallenge = () => {
  const searchParams = useSearchParams();
  const challengeFormStr = searchParams
    ? searchParams.get("challengeForm")
    : null;
  let challengeForm: CheckoutFormState = initialFormState;
  if (challengeFormStr) {
    try {
      // Query params may be URL-encoded; attempt decode then parse
      const decoded = decodeURIComponent(challengeFormStr);
      challengeForm = JSON.parse(decoded) as CheckoutFormState;
    } catch (err) {
      console.warn(
        "Invalid challengeForm query param, falling back to default:",
        err
      );
      challengeForm = initialFormState;
    }
  }

  const baseForm = challengeForm;

  const idParam = searchParams
    ? (searchParams.get("id") ?? searchParams.get("exerciseId"))
    : null;
  const exerciseId = idParam ? parseInt(idParam, 10) : undefined;

  const [form, setForm] = useState<CheckoutFormState>(challengeForm);

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
        setForm(initialFormState);
      }
    } else {
      setForm(initialFormState);
    }
  }, []);

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

  // --- Updaters ---
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
    baseForm,
    form,
    setForm,
    setCurrentStep,
    nextStep,
    prevStep,
    updateDetails,
    updateTestConfig,
    updateSubmission,
    exerciseId,
  };
};

export default useCreateChallenge;
