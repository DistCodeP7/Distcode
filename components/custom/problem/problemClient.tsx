import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FileCreatorProps = {
  onCreate: (path: string) => void;
};

export const FileCreator = ({ onCreate }: FileCreatorProps) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const fileName = formData.get("fileName") as string;

    if (fileName?.trim()) {
      onCreate(fileName);
      e.currentTarget.reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <Input
        name="fileName"
        type="text"
        className="border p-1 text-sm rounded w-full"
        autoComplete="off"
      />
      <Button
        type="submit"
        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
      >
        +
      </Button>
    </form>
  );
};
