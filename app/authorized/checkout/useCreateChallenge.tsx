import { useState, useLayoutEffect, useEffect } from "react";
import type {
  CheckoutFormState,
  TestContainerConfig,
  SubmissionConfig,
} from "./challenge";
import { nanoid } from "nanoid";

const initialFormState: CheckoutFormState = {
  step: 1,
  title: "",
  description: "",
  difficulty: "",
  testContainer: {
    alias: "test-runner",
    testFiles: [],
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
  const [form, setForm] = useState<CheckoutFormState>(initialFormState);

  useLayoutEffect(() => {
    const saved = localStorage.getItem("challengeForm");
    setForm(saved ? JSON.parse(saved) : initialFormState);
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
    field: keyof CheckoutFormState,
    value: CheckoutFormState[keyof CheckoutFormState]
  ) => setForm((prev) => ({ ...prev, [field]: value }));

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
