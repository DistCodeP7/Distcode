import {
  CheckCircle2,
  FileCode,
  IdCard,
  SearchCode,
  Server,
  Terminal,
} from "lucide-react";
import * as motion from "motion/react-client";
import { useId } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TestContainerConfig } from "../challenge";
import EnvList from "../components/EnvList";

const StepTwoTestEnv = ({
  base,
  config,
  update,
}: {
  base: TestContainerConfig;
  config: TestContainerConfig;
  update: (
    field: keyof TestContainerConfig,
    value: TestContainerConfig[keyof TestContainerConfig]
  ) => void;
}) => {
  const toggleFile = (file: string) => {
    const current = config.testFiles || {};
    if (current[file] !== undefined) {
      const { [file]: _removed, ...rest } = current;
      update("testFiles", rest);
    } else {
      update("testFiles", { ...current, [file]: base.testFiles[file] || "" });
    }
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
                id={useId()}
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
                id={useId()}
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
                id={useId()}
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
            {Object.keys(base.testFiles).map((file) => {
              const isRequiredTest = file === "test/test.go";
              const selected =
                config.testFiles?.[file] !== undefined || isRequiredTest;

              if (isRequiredTest) {
                return (
                  <div
                    key={file}
                    className={`flex items-center justify-between p-3 w-full text-left text-sm bg-primary/5 rounded-none border-0`}
                  >
                    <span className="font-mono text-foreground ml-4">
                      {file}
                    </span>
                    <div className="flex flex-row gap-4 mr-4">
                      <SearchCode size={20} />
                      <CheckCircle2 size={20} className="text-primary" />
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={file}
                  type="button"
                  onClick={() => toggleFile(file)}
                  className={`flex items-center justify-between p-3 w-full text-left cursor-pointer text-sm transition-colors border-0 bg-transparent rounded-none ${
                    selected ? "bg-primary/5" : "hover:bg-secondary/40"
                  }`}
                >
                  <span className="font-mono text-foreground ml-4">{file}</span>
                  <div className="flex flex-row gap-4 mr-4">
                    <SearchCode size={20} />
                    {selected ? (
                      <CheckCircle2 size={20} className="text-primary" />
                    ) : (
                      <CheckCircle2
                        size={20}
                        className="text-muted-foreground"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
export default StepTwoTestEnv;
