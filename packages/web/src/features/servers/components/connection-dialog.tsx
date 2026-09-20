import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TickCircle, CloseCircle } from "iconsax-react";
import type { ServerConnection, ServerConnectionInput } from "@termloop/shared";
import {
  useCreateConnection,
  useUpdateConnection,
  useTestConnectionDirect,
} from "../hooks/use-connections";
import { connectionsApi } from "../api";
import { useKeychain } from "@/features/keychain";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ColorPicker } from "@/components/ui/color-picker";
import { TagInput } from "@/components/ui/tag-input";

const connectionSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    host: z.string().min(1, "Host is required"),
    port: z.number().int().min(1).max(65535, "Port must be 1-65535"),
    username: z.string().min(1, "Username is required"),
    authMethod: z.enum(["password", "key"]),
    password: z.string(),
    privateKey: z.string(),
    keychainKeyId: z.string(),
    color: z.string(),
    tags: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.authMethod === "password" && !data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required",
        path: ["password"],
      });
    }
    if (data.authMethod === "key" && !data.privateKey && !data.keychainKeyId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Private key or keychain key is required",
        path: ["privateKey"],
      });
    }
  });

type ConnectionFormValues = z.infer<typeof connectionSchema>;

const defaults: ConnectionFormValues = {
  name: "",
  host: "",
  port: 22,
  username: "",
  authMethod: "password",
  password: "",
  privateKey: "",
  keychainKeyId: "",
  color: "#6366f1",
  tags: [],
};

interface ConnectionDialogProps {
  open: boolean;
  onClose: () => void;
  editConnection?: ServerConnection;
}

export function ConnectionDialog({
  open,
  onClose,
  editConnection,
}: ConnectionDialogProps) {
  const isEdit = !!editConnection;
  const createMutation = useCreateConnection();
  const updateMutation = useUpdateConnection();
  const testMutation = useTestConnectionDirect();
  const isPending = isEdit ? updateMutation.isPending : createMutation.isPending;
  const { data: keychainData } = useKeychain();
  const keychainKeys = keychainData?.data ?? [];
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { data: fullConnectionData } = useQuery({
    queryKey: ["connection", editConnection?.id],
    queryFn: () => connectionsApi.get(editConnection!.id),
    enabled: open && !!editConnection,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open && !editConnection) {
      setTestResult(null);
      reset(defaults);
    }
  }, [open, editConnection, reset]);

  useEffect(() => {
    if (open && editConnection && fullConnectionData?.data) {
      const conn = fullConnectionData.data as ServerConnection;
      setTestResult(null);
      reset({
        name: conn.name,
        host: conn.host,
        port: conn.port,
        username: conn.username,
        authMethod: conn.authMethod,
        password: conn.password ?? "",
        privateKey: conn.privateKey ?? "",
        keychainKeyId: conn.keychainKeyId ?? "",
        color: conn.color ?? "#6366f1",
        tags: conn.tags ?? [],
      });
    }
  }, [open, editConnection, fullConnectionData, reset]);

  const authMethod = watch("authMethod");
  const keychainKeyId = watch("keychainKeyId");

  const buildPayload = (data: ConnectionFormValues): ServerConnectionInput => ({
    ...data,
    keychainKeyId: data.keychainKeyId || undefined,
    tags: data.tags.length > 0 ? data.tags : undefined,
  });

  const onSubmit = handleSubmit((data) => {
    const payload = buildPayload(data);
    if (isEdit) {
      updateMutation.mutate(
        { id: editConnection.id, data: payload },
        { onSuccess: () => onClose() }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => onClose() });
    }
  });

  const handleTestConnection = async () => {
    const valid = await trigger();
    if (!valid) return;

    setTestResult(null);
    const data = getValues();
    const payload = buildPayload(data);

    testMutation.mutate(payload, {
      onSuccess: (res) => {
        setTestResult(
          res.success
            ? { success: true, message: "Connection successful" }
            : { success: false, message: res.error ?? "Connection failed" }
        );
      },
      onError: () => {
        setTestResult({ success: false, message: "Connection failed" });
      },
    });
  };

  return (
    <CustomDialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={isEdit ? "Edit Server" : "Add Server"}
      footer={
        <form
          onSubmit={onSubmit}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              isLoading={testMutation.isPending}
            >
              Test Connection
            </Button>
            {testResult && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  testResult.success ? "text-emerald-500" : "text-destructive"
                }`}
              >
                {testResult.success ? (
                  <TickCircle size={14} color="currentColor" />
                ) : (
                  <CloseCircle size={14} color="currentColor" />
                )}
                {testResult.message}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEdit ? "Update" : "Add Server"}
            </Button>
          </div>
        </form>
      }
    >
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" placeholder="My Server" {...register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.host}>
            <FieldLabel htmlFor="host">Host</FieldLabel>
            <Input
              id="host"
              placeholder="192.168.1.100"
              {...register("host")}
            />
            <FieldError errors={[errors.host]} />
          </Field>

          <Field data-invalid={!!errors.port}>
            <FieldLabel htmlFor="port">Port</FieldLabel>
            <Input
              id="port"
              type="number"
              {...register("port", { valueAsNumber: true })}
            />
            <FieldError errors={[errors.port]} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.username}>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              placeholder="root"
              {...register("username")}
            />
            <FieldError errors={[errors.username]} />
          </Field>

          <Field>
            <FieldLabel>Auth Method</FieldLabel>
            <Controller
              control={control}
              name="authMethod"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">Password</SelectItem>
                    <SelectItem value="key">SSH Key</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        {authMethod === "password" ? (
          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              {...register("password")}
            />
            <FieldError errors={[errors.password]} />
          </Field>
        ) : (
          <>
            {keychainKeys.length > 0 && (
              <Field>
                <FieldLabel>Keychain Key</FieldLabel>
                <Controller
                  control={control}
                  name="keychainKeyId"
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stored key..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          None (paste manually)
                        </SelectItem>
                        {keychainKeys.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            )}

            {!keychainKeyId && (
              <Field data-invalid={!!errors.privateKey}>
                <FieldLabel htmlFor="privateKey">Private Key</FieldLabel>
                <Textarea
                  id="privateKey"
                  placeholder="Paste your private key here..."
                  className="min-h-[80px] font-mono text-sm"
                  {...register("privateKey")}
                />
                <FieldError errors={[errors.privateKey]} />
              </Field>
            )}
          </>
        )}

        <Field>
          <FieldLabel>Tags</FieldLabel>
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <TagInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Add tag and press Enter..."
              />
            )}
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
      </FieldGroup>
    </CustomDialog>
  );
}
