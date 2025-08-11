import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFiles } from "@/hooks/useNotebooks";
import { toast } from "sonner";
import { useFileContext } from "@/contexts/FileContext";
import { getFileId } from "@/utils/fileUtils";

const fileTypes = [
  { value: "txt", label: "Text File (.txt)" },
  { value: "md", label: "Markdown (.md)" },
  { value: "py", label: "Python (.py)" },
  { value: "js", label: "JavaScript (.js)" },
  { value: "cpp", label: "C++ (.cpp)" },
  { value: "json", label: "JSON (.json)" },
  { value: "csv", label: "CSV (.csv)" },
] as const;

const createFileSchema = z.object({
  name: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name cannot exceed 255 characters")
    .trim(),
  type: z.enum(["txt", "md", "py", "js", "cpp", "json", "csv"], {
    required_error: "Please select a file type",
  }),
});

type CreateFileFormData = z.infer<typeof createFileSchema>;

interface CreateFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  folderId?: string;
}

export const CreateFileDialog = ({
  open,
  onOpenChange,
  notebookId,
  folderId
}: CreateFileDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createFile } = useFiles(notebookId);
  const { setSelectedFileId, setSelectedFile } = useFileContext();

  const form = useForm<CreateFileFormData>({
    resolver: zodResolver(createFileSchema),
    defaultValues: {
      name: "",
      type: undefined,
    },
  });

  const onSubmit = async (data: CreateFileFormData) => {
    setIsSubmitting(true);
    try {


      const newFile = await createFile({
        name: data.name,
        type: data.type,
        content: "",
        notebookId,
        folderId,
      });

      toast.success("File created successfully");
      form.reset();
      onOpenChange(false);

      // Automatically select the newly created file
      const fileId = getFileId(newFile);
      if (fileId) {
        setSelectedFileId(fileId);
        setSelectedFile(newFile);
        toast.success(`Opened ${newFile.name}`);
      }
    } catch (error) {
      console.error("Failed to create file:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create file");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        form.reset();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New File</DialogTitle>
          <DialogDescription>
            Create a new file in your notebook.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter file name"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fileTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create File
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
