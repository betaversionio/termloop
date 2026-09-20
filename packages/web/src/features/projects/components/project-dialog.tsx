import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Monitor, CloudConnection } from "iconsax-react";
import type { Project, ServerConnection, StorageCredential } from "@termloop/shared";
import { useCreateProject, useUpdateProject } from "../hooks/use-projects";
import { useConnections } from "@/features/servers";
import { useStorage } from "@/features/storage";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ColorPicker } from "@/components/ui/color-picker";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  color: z.string(),
  serverIds: z.array(z.string()),
  storageCredentialIds: z.array(z.string()),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  editProject?: Project;
}

export function ProjectDialog({ open, onClose, editProject }: ProjectDialogProps) {
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const isEdit = !!editProject;

  const { data: connectionsData } = useConnections();
  const { data: bucketsData } = useStorage();

  const connections = (connectionsData?.data as ServerConnection[] | undefined) ?? [];
  const buckets = (bucketsData?.data as StorageCredential[] | undefined) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "",
      serverIds: [],
      storageCredentialIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (editProject) {
        reset({
          name: editProject.name,
          description: editProject.description ?? "",
          color: editProject.color ?? "",
          serverIds: editProject.serverIds ?? [],
          storageCredentialIds: editProject.storageCredentialIds ?? [],
        });
      } else {
        reset({ name: "", description: "", color: "", serverIds: [], storageCredentialIds: [] });
      }
    }
  }, [open, editProject, reset]);

  const onSubmit = async (values: ProjectFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      color: values.color || undefined,
      serverIds: values.serverIds,
      storageCredentialIds: values.storageCredentialIds,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: editProject.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const selectedServerIds = watch("serverIds");
  const selectedBucketIds = watch("storageCredentialIds");

  const toggleServer = (id: string) => {
    const current = selectedServerIds;
    setValue(
      "serverIds",
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    );
  };

  const toggleBucket = (id: string) => {
    const current = selectedBucketIds;
    setValue(
      "storageCredentialIds",
      current.includes(id) ? current.filter((b) => b !== id) : [...current, id]
    );
  };

  return (
    <CustomDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={isEdit ? "Edit Project" : "New Project"}
      footer={
        <div className="flex gap-2 justify-end w-full">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? "Saving..." : isEdit ? "Save" : "Create"}
          </Button>
        </div>
      }
    >
      <Field>
        <FieldLabel>Name</FieldLabel>
        <Input placeholder="My Project" {...register("name")} />
        {errors.name && <FieldError>{errors.name.message}</FieldError>}
      </Field>

      <Field>
        <FieldLabel>Description</FieldLabel>
        <Textarea
          placeholder="Optional description..."
          rows={2}
          {...register("description")}
        />
      </Field>

      <Field>
        <FieldLabel>Color</FieldLabel>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <ColorPicker
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              className="h-8 w-8"
            />
          )}
        />
      </Field>

      {/* Servers */}
      <Field>
        <FieldLabel>Servers</FieldLabel>
        {connections.length === 0 ? (
          <p className="text-xs text-muted-foreground">No servers available. Add one from the Servers page.</p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-md border border-border p-2">
            {connections.map((conn) => (
              <label
                key={conn.id}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selectedServerIds.includes(conn.id)}
                  onCheckedChange={() => toggleServer(conn.id)}
                />
                <Monitor size={14} color={conn.color || "currentColor"} className="shrink-0" />
                <span className="truncate">{conn.name}</span>
                <span className="ml-auto text-xs text-muted-foreground truncate">
                  {conn.host}
                </span>
              </label>
            ))}
          </div>
        )}
      </Field>

      {/* Buckets */}
      <Field>
        <FieldLabel>Buckets</FieldLabel>
        {buckets.length === 0 ? (
          <p className="text-xs text-muted-foreground">No buckets available. Add one from the Buckets page.</p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-md border border-border p-2">
            {buckets.map((bucket) => (
              <label
                key={bucket.id}
                className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selectedBucketIds.includes(bucket.id)}
                  onCheckedChange={() => toggleBucket(bucket.id)}
                />
                <CloudConnection size={14} color="currentColor" className="shrink-0" />
                <span className="truncate">{bucket.name}</span>
                <span className="ml-auto text-xs text-muted-foreground truncate">
                  {bucket.type.toUpperCase()}
                </span>
              </label>
            ))}
          </div>
        )}
      </Field>
    </CustomDialog>
  );
}
