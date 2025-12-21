import { Box, Cpu, Layers } from "lucide-react";
import * as motion from "motion/react-client";
import { useId } from "react";
import { toast } from "sonner";
import { uniqueNamesGenerator } from "unique-names-generator";
import EnvList from "@/app/authorized/checkout/components/envList";
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
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import type { ReplicaConfig, SubmissionConfig } from "@/types/challenge";
import { customConfig } from "@/utils/randomName";

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
  const updateReplica = (
    index: number,
    field: keyof ReplicaConfig,
    value: ReplicaConfig[keyof ReplicaConfig]
  ) => {
    if (
      field === "alias" &&
      Object.values(config.replicaConfigs)
        .map((r) => r.alias)
        .includes(value as string)
    ) {
      toast.error("Each replica must have a unique alias.");
      return;
    }
    const current = config.replicaConfigs[index] || {
      alias: uniqueNamesGenerator(customConfig),
      envs: [],
    };
    update("replicaConfigs", {
      ...config.replicaConfigs,
      [index]: { ...current, [field]: value },
    });
  };

  const setReplicaCount = (newCount: number) => {
    const newReplicaConfigs: Record<number, ReplicaConfig> = {
      ...config.replicaConfigs,
    };

    for (let i = 0; i < newCount; i++) {
      if (!newReplicaConfigs[i]) {
        newReplicaConfigs[i] = {
          alias: uniqueNamesGenerator(customConfig),
          envs: [],
          id: i,
        };
      }
    }

    Object.keys(newReplicaConfigs).forEach((key) => {
      if (Number(key) >= newCount) delete newReplicaConfigs[Number(key)];
    });

    update("replicas", newCount);
    update("replicaConfigs", newReplicaConfigs);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-8 space-y-8"
    >
      {/* Submission Commands + Env */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-none">
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
              <Input
                id={useId()}
                className="pl-3 font-mono text-sm"
                value={config.buildCommand}
                onChange={(e) => update("buildCommand", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="submissionEntryCommand">Entry Command</Label>
              <Input
                id={useId()}
                className="pl-3 font-mono text-sm"
                value={config.entryCommand}
                onChange={(e) => update("entryCommand", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

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
                max={10}
                step={1}
                onValueChange={(val) => setReplicaCount(val[0])}
                className="w-32"
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: config.replicas }).map((_, i) => {
            const rep = config.replicaConfigs[i] || {
              alias: uniqueNamesGenerator(customConfig),
              envs: [],
            };
            return (
              <Card
                key={rep.id ?? i}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <CardTitle className="text-sm">
                    <div className="flex items-center gap-2">
                      <Box size={20} className="text-muted-foreground" />
                      <p className="font-bold">{`Replica-${i + 1}`}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs mb-2 text-muted-foreground">
                      Container Alias
                    </Label>
                    <Input
                      value={rep.alias}
                      onChange={(e) =>
                        updateReplica(i, "alias", e.target.value)
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-2 text-muted-foreground">
                      Instance Environment Variables
                    </Label>
                    <EnvList
                      envs={rep.envs}
                      onChange={(envs) => updateReplica(i, "envs", envs)}
                      compact
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
export default StepThreeSubmission;
