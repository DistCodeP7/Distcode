import * as motion from "motion/react-client";
import { useId } from "react";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { DetailsConfig, Difficulty } from "../challenge";

type StepOneDetailsProps = {
  form: DetailsConfig;
  updateField: (
    field: keyof DetailsConfig,
    value: DetailsConfig[keyof DetailsConfig]
  ) => void;
};

// 3. Step 1: Details
const StepOneDetails = ({ form, updateField }: StepOneDetailsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-6 max-w-3xl mx-auto"
    >
      <CardHeader className="px-0 pt-0">
        <CardTitle>Challenge Details</CardTitle>
        <CardDescription>
          Basic information about your challenge
        </CardDescription>
      </CardHeader>

      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Challenge Title</Label>
          <Input
            id={useId()}
            placeholder="e.g. Distributed Caching System"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id={useId()}
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
            onValueChange={(val: Difficulty) => updateField("difficulty", val)}
          >
            <SelectTrigger className="w-full md:w-[240px] h-11" id={useId()}>
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
};
export default StepOneDetails;
