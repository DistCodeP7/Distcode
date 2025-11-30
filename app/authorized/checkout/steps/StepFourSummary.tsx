import { Box, FileText } from "lucide-react";
import * as motion from "motion/react-client";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CheckoutFormState, Env } from "../challenge";

const StepFourSummary = ({ form }: { form: CheckoutFormState }) => (
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

    <div className="space-y-8 text-sm">
      {/* Challenge Details */}
      <div className="space-y-4">
        <div className="font-semibold text-base">Challenge Details</div>
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <span className="text-muted-foreground">Title:</span>
          <span className="font-medium">{form.details.title || "N/A"}</span>
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <span className="text-muted-foreground">Description:</span>
          <span className="font-medium break-words">
            {form.details.description || "N/A"}
          </span>
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <span className="text-muted-foreground">Difficulty:</span>
          <span className="font-medium">
            {form.details.difficulty || "N/A"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Test Configuration */}
        <div className="font-semibold text-base">Test Configuration</div>
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <span className="text-muted-foreground">Alias:</span>
          <span className="font-medium">{form.testContainer.alias}</span>
        </div>
        <div className="grid grid-cols-[140px_1fr] gap-2">
          <span className="text-muted-foreground">Files:</span>
          <span className="font-medium">
            {Object.keys(form.testContainer.testFiles || {}).length > 0
              ? Object.keys(form.testContainer.testFiles).join(", ")
              : "None"}
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
            {form.testContainer.envs.map((e, i) => (
              <Badge
                key={`${e.key}-${e.value}-${i}`}
                variant="outline"
                className="mr-1 mb-1 font-mono text-xs"
              >
                {e.key}={e.value}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
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
            {form.submission.globalEnvs.map((e, i) => (
              <Badge
                key={`${e.key}-${e.value}-${i}`}
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
            {Object.values(form.submission.replicaConfigs).map((rep) => (
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
    </div>
  </motion.div>
);

export default StepFourSummary;
