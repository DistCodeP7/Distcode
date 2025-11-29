"use client";
import { useState, useEffect } from "react";
import * as motion from "motion/react-client";
import {
  Plus,
  Trash2,
  Box,
  Layers,
  ArrowRight,
  ArrowLeft,
  FileText,
  Terminal,
  CheckCircle2,
  FileCode,
  Server,
  Cpu,
  Globe,
  SearchCode,
  IdCard,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import NeonLines from "@/components/custom/NeonLine";
import { Separator } from "@/components/ui/separator";

// --- Types ---
type Env = { key: string; value: string };
type Difficulty = "Easy" | "Medium" | "Hard";

type TestContainerConfig = {
  alias: string;
  testFiles: string[];
  buildCommand: string;
  entryCommand: string;
  envs: Env[];
};

type ReplicaConfig = {
  alias: string;
  envs: Env[];
};

type SubmissionConfig = {
  testFiles: string[];
  buildCommand: string;
  entryCommand: string;
  globalEnvs: Env[];
  replicas: number;
  replicaConfigs: Record<number, ReplicaConfig>;
};

type FormState = {
  title: string;
  description: string;
  difficulty: Difficulty | "";
  testContainer: TestContainerConfig;
  submission: SubmissionConfig;
};

// --- Main Component ---
export default function CreateChallenge() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    difficulty: "",
    testContainer: {
      alias: "test-runner",
      testFiles: [],
      buildCommand: "npm run build",
      entryCommand: "npm test",
      envs: [{ key: "TEST_MODE", value: "true" }],
    },
    submission: {
      buildCommand: "npm run build",
      entryCommand: "npm start",
      testFiles: [],
      replicas: 1,
      globalEnvs: [{ key: "PORT", value: "3000" }],
      replicaConfigs: {
        0: { alias: "user-service-1", envs: [] },
      },
    },
  });

  const setCurrentStep = (step: number) => {
    setStep(step);
  };
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // --- Updaters ---
  const updateDetails = (
    field: keyof FormState,
    value: FormState[keyof FormState]
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

  return (
    <div className="min-h-screen bg-secondary/20 p-6 md:p-12 flex justify-center items-start">
      <div className="w-full max-w-5xl ">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <NeonLines count={80} />
        </div>
        <Header step={step} setCurrentStep={setCurrentStep} />

        <Card className="min-h-[600px] flex flex-col ">
          <CardContent className="flex-1 p-0">
            {step === 1 && (
              <StepOneDetails form={form} updateField={updateDetails} />
            )}
            {step === 2 && (
              <StepTwoTestEnv
                config={form.testContainer}
                update={updateTestConfig}
              />
            )}
            {step === 3 && (
              <StepThreeSubmission
                config={form.submission}
                update={updateSubmission}
              />
            )}
            {step === 4 && <StepFourSummary form={form} />}
          </CardContent>

          <FooterNav
            step={step}
            onNext={nextStep}
            onPrev={prevStep}
            onSubmit={() => console.log("Final Config:", form)}
          />
        </Card>
      </div>
    </div>
  );
}

// --- Sub-Components ---

// 1. Header
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

type StepOneDetailsProps = {
  form: FormState;
  updateField: (
    field: keyof FormState,
    value: FormState[keyof FormState]
  ) => void;
};

// 3. Step 1: Details
const StepOneDetails = ({ form, updateField }: StepOneDetailsProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-8 space-y-6 max-w-3xl mx-auto"
  >
    <CardHeader className="px-0 pt-0">
      <CardTitle>Challenge Details</CardTitle>
      <CardDescription>Basic information about your challenge</CardDescription>
    </CardHeader>

    <div className="space-y-6">
      <div className="grid gap-2">
        <Label htmlFor="title">Challenge Title</Label>
        <Input
          id="title"
          placeholder="e.g. Distributed Caching System"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          className="h-11"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the problem context..."
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="min-h-[150px] resize-none p-4"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="difficulty">Difficulty Level</Label>
        <Select
          value={form.difficulty}
          onValueChange={(val) => updateField("difficulty", val)}
        >
          <SelectTrigger className="w-full md:w-[240px] h-11" id="difficulty">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </motion.div>
);

// 4. Step 2: Test Environment
const StepTwoTestEnv = ({
  config,
  update,
}: {
  config: TestContainerConfig;
  update: (
    field: keyof TestContainerConfig,
    value: TestContainerConfig[keyof TestContainerConfig]
  ) => void;
}) => {
  const toggleFile = (file: string) => {
    const current = config.testFiles;
    if (current.includes(file))
      update(
        "testFiles",
        current.filter((f) => f !== file)
      );
    else update("testFiles", [...current, file]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-8 grid md:grid-cols-2 gap-8"
    >
      <div className="space-y-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2">
            <Server className="text-primary" size={20} />
            Test Container
          </CardTitle>
          <CardDescription>
            This container acts as the judge, running tests against the user's
            code.
          </CardDescription>
        </CardHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="alias">Container Alias</Label>
            <div className="relative">
              <IdCard
                className="absolute left-3 top-3 text-muted-foreground"
                size={14}
              />
              <Input
                id="alias"
                value={config.alias}
                className="pl-9 font-mono text-sm"
                onChange={(e) => update("alias", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="buildCommand">Build Command</Label>
            <div className="relative">
              <Terminal
                className="absolute left-3 top-3 text-muted-foreground"
                size={14}
              />
              <Input
                id="buildCommand"
                className="pl-9 font-mono text-sm"
                value={config.buildCommand}
                onChange={(e) => update("buildCommand", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entryCommand">Entry Command</Label>
            <div className="relative">
              <Terminal
                className="absolute left-3 top-3 text-muted-foreground"
                size={14}
              />
              <Input
                id="entryCommand"
                className="pl-9 font-mono text-sm"
                value={config.entryCommand}
                onChange={(e) => update("entryCommand", e.target.value)}
              />
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Environment Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <EnvList
              envs={config.envs}
              onChange={(envs) => update("envs", envs)}
            />
          </CardContent>
          <CardFooter />
        </Card>
      </div>

      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileCode size={20} />
            Select Test Files
          </CardTitle>
          <CardDescription>
            Selected files will be mounted into the test container
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-0">
          <div className="rounded-md divide-y ">
            {[
              "test_suite.py",
              "validate_api.js",
              "load_test.go",
              "config.json",
            ].map((file) => (
              <button
                key={file}
                type="button"
                onClick={() => toggleFile(file)}
                className={`flex items-center justify-between p-3 w-full text-left cursor-pointer text-sm transition-colors border-0 bg-transparent rounded-none ${
                  config.testFiles.includes(file)
                    ? "bg-primary/5"
                    : "hover:bg-secondary/40"
                }`}
              >
                <span className="font-mono text-foreground ml-4">{file}</span>
                <div className="flex flex-row gap-4 mr-4">
                  <SearchCode size={20} />
                  {config.testFiles.includes(file) ? (
                    <CheckCircle2 size={20} className="text-primary" />
                  ) : (
                    <CheckCircle2 size={20} className="text-muted-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const StepThreeSubmission = ({
  config,
  update,
}: {
  config: SubmissionConfig;
  update: (
    field: keyof SubmissionConfig,
    value: SubmissionConfig[keyof SubmissionConfig]
  ) => void;
}) => {
  const replicaConfigs = Array.from({ length: config.replicas }).map((_, i) => {
    return (
      config.replicaConfigs[i] || { alias: `user-service-${i + 1}`, envs: [] }
    );
  });

  const updateReplica = (
    index: number,
    field: keyof ReplicaConfig,
    value: ReplicaConfig[keyof ReplicaConfig]
  ) => {
    const current = replicaConfigs[index];
    update("replicaConfigs", {
      ...config.replicaConfigs,
      [index]: { ...current, [field]: value },
    });
  };

  const toggleFile = (file: string) => {
    const current = config.testFiles;
    if (current.includes(file))
      update(
        "testFiles",
        current.filter((f) => f !== file)
      );
    else update("testFiles", [...current, file]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-8 space-y-8"
    >
      {/* Top Section: Left = Commands + Env, Right = Files */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Side: Commands + Env */}
        <div className="space-y-6">
          {/* Commands */}
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex gap-2">
              <Cpu className="text-primary" size={20} />
              User Submission
            </CardTitle>
            <CardDescription>
              Configuration for the container running the user's code.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            <div className="grid gap-2">
              <Label htmlFor="submissionBuildCommand">Build Command</Label>
              <div className="relative">
                <Terminal
                  className="absolute left-3 top-3 text-muted-foreground"
                  size={14}
                />
                <Input
                  id="submissionBuildCommand"
                  className="pl-9 font-mono text-sm"
                  value={config.buildCommand}
                  onChange={(e) => update("buildCommand", e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="submissionEntryCommand">Entry Command</Label>
              <div className="relative">
                <Terminal
                  className="absolute left-3 top-3 text-muted-foreground"
                  size={14}
                />
                <Input
                  id="submissionEntryCommand"
                  className="pl-9 font-mono text-sm"
                  value={config.entryCommand}
                  onChange={(e) => update("entryCommand", e.target.value)}
                />
              </div>
            </div>
          </CardContent>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Global Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnvList
                envs={config.globalEnvs}
                onChange={(envs) => update("globalEnvs", envs)}
              />
            </CardContent>
            <CardFooter />
          </Card>
        </div>

        {/* Right Side: Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileCode size={20} />
              Select Test Files
            </CardTitle>
            <CardDescription>
              Selected files will be mounted into each user submission container
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 mt-0">
            <div className="rounded-md divide-y">
              {[
                "test_suite.py",
                "validate_api.js",
                "load_test.go",
                "config.json",
              ].map((file) => (
                <button
                  key={file}
                  type="button"
                  onClick={() => toggleFile(file)}
                  className={`flex items-center justify-between p-3 w-full text-left cursor-pointer text-sm transition-colors border-0 bg-transparent rounded-none ${
                    config.testFiles.includes(file)
                      ? "bg-primary/5"
                      : "hover:bg-secondary/40"
                  }`}
                >
                  <span className="font-mono text-foreground ml-4">{file}</span>
                  <div className="flex flex-row gap-4 mr-4">
                    <SearchCode size={20} />
                    {config.testFiles.includes(file) ? (
                      <CheckCircle2 size={20} className="text-primary" />
                    ) : (
                      <CheckCircle2
                        size={20}
                        className="text-muted-foreground"
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Replica Orchestration */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex gap-2 items-center text-lg">
              <Layers size={18} />
              Replica Orchestration
            </CardTitle>
            <CardDescription>
              Define aliases and envs for each instance.
            </CardDescription>
          </div>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                Replicas: {config.replicas}
              </span>
              <Slider
                value={[config.replicas]}
                min={1}
                max={5}
                step={1}
                onValueChange={(val) => update("replicas", val[0])}
                className="w-32"
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: config.replicas }).map((_, i) => {
            const replicaData = config.replicaConfigs[i] || {
              alias: `user-service-${i + 1}`,
              envs: [],
            };
            return (
              <Card
                key={replicaData.alias}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Box size={20} className="text-muted-foreground" />
                    <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Replica {i + 1}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      Container Alias
                    </Label>
                    <div className="relative">
                      <Globe
                        className="absolute left-2.5 top-2.5 text-muted-foreground"
                        size={12}
                      />
                      <Input
                        value={replicaData.alias}
                        onChange={(e) =>
                          updateReplica(i, "alias", e.target.value)
                        }
                        className="h-8 text-xs pl-7 font-mono"
                        placeholder="alias"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Instance Environment Variables
                    </Label>
                    <EnvList
                      compact
                      envs={replicaData.envs}
                      onChange={(envs) => updateReplica(i, "envs", envs)}
                    />
                  </div>
                </CardContent>
                <CardFooter />
              </Card>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

const StepFourSummary = ({ form }: { form: FormState }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="p-8 space-y-6"
  >
    <CardHeader className="px-0 pt-0">
      <CardTitle className="flex items-center gap-3 text-2xl">
        <FileText className="text-primary" size={24} />
        Challenge Summary
      </CardTitle>
    </CardHeader>
    <div className="font-semibold text-base">Challenge Details</div>
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Title:</span>
        <span className="font-medium">{form.title || "N/A"}</span>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Description:</span>
        <span className="font-medium break-words">
          {form.description || "N/A"}
        </span>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Difficulty:</span>
        <span className="font-medium">{form.difficulty || "N/A"}</span>
      </div>

      <Separator className="my-4" />

      {/* Test Configuration */}
      <div className="font-semibold text-base">Test Configuration</div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Alias:</span>
        <span className="font-medium">{form.testContainer.alias}</span>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Files:</span>
        <span className="font-medium">
          {form.testContainer.testFiles.join(", ") || "None"}
        </span>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Build Command:</span>
        <code className="bg-secondary/50 px-1 py-0.5 rounded font-mono text-xs w-fit">
          {form.testContainer.buildCommand}
        </code>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Entry Command:</span>
        <code className="bg-secondary/50 px-1 py-0.5 rounded font-mono text-xs w-fit">
          {form.testContainer.entryCommand}
        </code>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Environment:</span>
        <div className="flex flex-wrap">
          {form.testContainer.envs.map((e) => (
            <Badge
              key={e.key}
              variant="outline"
              className="mr-1 mb-1 font-mono text-xs"
            >
              {e.key}={e.value}
            </Badge>
          ))}
        </div>
      </div>

      <Separator className="my-4" />

      {/* Submission Configuration */}
      <div className="font-semibold text-base">Submission</div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Build Command:</span>
        <code className="bg-secondary/50 px-1 py-0.5 rounded font-mono text-xs w-fit">
          {form.submission.buildCommand}
        </code>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Entry Command:</span>
        <code className="bg-secondary/50 px-1 py-0.5 rounded font-mono text-xs w-fit">
          {form.submission.entryCommand}
        </code>
      </div>

      <div className="grid grid-cols-[140px_1fr] gap-2">
        <span className="text-muted-foreground">Global Envs:</span>
        <div className="flex flex-wrap">
          {form.submission.globalEnvs.map((e) => (
            <Badge
              key={e.key}
              variant="outline"
              className="mr-1 mb-1 font-mono text-xs"
            >
              {e.key}={e.value}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <span className="text-muted-foreground block mb-4">
          Replica Configs:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.values(form.submission.replicaConfigs).map((rep: any) => (
            <Card key={rep.alias}>
              <CardHeader>
                <CardTitle className="text-sm">
                  <div className="flex items-center gap-2">
                    <Box size={20} className="text-muted-foreground" />
                    <p className="font-bold">{rep.alias}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Environment Variables:
                  </span>
                  {rep.envs.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                      No specific envs.
                    </span>
                  )}
                  {rep.envs.map((e: Env) => (
                    <Badge
                      key={e.key}
                      variant="outline"
                      className="mr-1 mb-1 font-mono text-xs"
                    >
                      {e.key}={e.value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter />
            </Card>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

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
  const add = () => onChange([...envs, { key: "", value: "" }]);

  return (
    <div className="space-y-2">
      {envs.map((env, i) => (
        <div key={i} className="flex gap-2 group">
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
