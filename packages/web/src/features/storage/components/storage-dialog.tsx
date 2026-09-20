import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TickCircle, CloseCircle } from 'iconsax-react';
import type {
  StorageCredential,
  StorageCredentialInput,
} from '@termloop/shared';
import {
  useCreateStorage,
  useUpdateStorage,
  useTestStorageDirect,
} from '@/features/storage';
import { storageApi } from '../api';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const s3Schema = z.object({
  type: z.literal('s3'),
  name: z.string().min(1, 'Name is required'),
  provider: z.enum(['s3', 'r2', 'minio', 'other']),
  endpointUrl: z.string().min(1, 'Endpoint URL is required'),
  region: z.string().min(1, 'Region is required'),
  accessKeyId: z.string().min(1, 'Access Key ID is required'),
  secretAccessKey: z.string().min(1, 'Secret Access Key is required'),
  defaultBucket: z.string(),
});

const gcsSchema = z.object({
  type: z.literal('gcs'),
  name: z.string().min(1, 'Name is required'),
  inputMode: z.enum(['file', 'text']),
  serviceAccountJson: z.string().min(1, 'Service account JSON is required'),
  defaultBucket: z.string(),
});

const bucketSchema = z.discriminatedUnion('type', [s3Schema, gcsSchema]);

type BucketFormValues = z.infer<typeof bucketSchema>;

const s3Defaults: BucketFormValues = {
  type: 's3',
  name: '',
  provider: 's3',
  endpointUrl: '',
  region: '',
  accessKeyId: '',
  secretAccessKey: '',
  defaultBucket: '',
};

interface StorageDialogProps {
  open: boolean;
  onClose: () => void;
  editCredential?: StorageCredential;
}

export function StorageDialog({
  open,
  onClose,
  editCredential,
}: StorageDialogProps) {
  const isEdit = !!editCredential;
  const createMutation = useCreateStorage();
  const updateMutation = useUpdateStorage();
  const testMutation = useTestStorageDirect();
  const isPending = isEdit
    ? updateMutation.isPending
    : createMutation.isPending;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const { data: fullData } = useQuery({
    queryKey: ['storage', editCredential?.id],
    queryFn: () => storageApi.get(editCredential!.id),
    enabled: open && !!editCredential,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<BucketFormValues>({
    resolver: zodResolver(bucketSchema),
    defaultValues: s3Defaults,
  });

  useEffect(() => {
    if (open && !editCredential) {
      reset(s3Defaults);
      setTestResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    if (!open) setTestResult(null);
  }, [open, editCredential, reset]);

  useEffect(() => {
    if (open && editCredential && fullData?.data) {
      const cred = fullData.data as StorageCredential;
      if (cred.type === 'gcs') {
        reset({
          type: 'gcs',
          name: cred.name,
          inputMode: 'text',
          serviceAccountJson: cred.serviceAccountJson ?? '',
          defaultBucket: cred.defaultBucket ?? '',
        });
      } else {
        reset({
          type: 's3',
          name: cred.name,
          provider: cred.provider,
          endpointUrl: cred.endpointUrl,
          region: cred.region,
          accessKeyId: cred.accessKeyId,
          secretAccessKey: cred.secretAccessKey ?? '',
          defaultBucket: cred.defaultBucket ?? '',
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, editCredential, fullData, reset]);

  const credType = watch('type');
  const inputMode =
    credType === 'gcs' ? ((watch as any)('inputMode') as string) : undefined;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setValue('serviceAccountJson' as never, reader.result as never, {
        shouldValidate: true,
      });
    };
    reader.readAsText(file);
  };

  const buildPayload = (data: BucketFormValues): StorageCredentialInput => {
    if (data.type === 'gcs') {
      return {
        type: 'gcs',
        name: data.name,
        provider: 'gcs',
        serviceAccountJson: data.serviceAccountJson,
        defaultBucket: data.defaultBucket || undefined,
      };
    }
    return {
      type: 's3',
      name: data.name,
      provider: data.provider,
      endpointUrl: data.endpointUrl,
      region: data.region,
      accessKeyId: data.accessKeyId,
      secretAccessKey: data.secretAccessKey,
      defaultBucket: data.defaultBucket || undefined,
    };
  };

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
            ? { success: true, message: 'Connection successful' }
            : { success: false, message: res.error ?? 'Connection failed' },
        );
      },
      onError: () => {
        setTestResult({ success: false, message: 'Connection failed' });
      },
    });
  };

  const onSubmit = handleSubmit((data) => {
    const payload = buildPayload(data);
    if (isEdit) {
      updateMutation.mutate(
        { id: editCredential.id, data: payload as Partial<StorageCredential> },
        { onSuccess: () => onClose() },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => onClose() });
    }
  });

  return (
    <CustomDialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={isEdit ? 'Edit Bucket Credential' : 'Add Bucket Credential'}
      footer={
        <form onSubmit={onSubmit} className="flex w-full items-center gap-2">
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
                testResult.success ? 'text-emerald-500' : 'text-destructive'
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
          <div className="flex-1" />
          <Button type="button" variant="outline" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEdit ? 'Update' : 'Add Credential'}
          </Button>
        </form>
      }
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Storage Type</FieldLabel>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  if (v === 'gcs') {
                    reset({
                      type: 'gcs',
                      name: watch('name'),
                      inputMode: 'file',
                      serviceAccountJson: '',
                      defaultBucket: watch('defaultBucket'),
                    });
                  } else {
                    reset({
                      ...s3Defaults,
                      name: watch('name'),
                      defaultBucket: watch('defaultBucket'),
                    });
                  }
                }}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s3">S3 Compatible</SelectItem>
                  <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="bucket-name">Name</FieldLabel>
          <Input
            id="bucket-name"
            placeholder="Production Storage"
            {...register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        {credType === 's3' && (
          <>
            <Field>
              <FieldLabel>Provider</FieldLabel>
              <Controller
                control={control}
                name="provider"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s3">AWS S3</SelectItem>
                      <SelectItem value="r2">Cloudflare R2</SelectItem>
                      <SelectItem value="minio">MinIO</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field data-invalid={!!(errors as any).endpointUrl}>
              <FieldLabel htmlFor="bucket-endpoint">Endpoint URL</FieldLabel>
              <Input
                id="bucket-endpoint"
                placeholder="https://s3.amazonaws.com"
                {...register('endpointUrl')}
              />
              <FieldError errors={[(errors as any).endpointUrl]} />
            </Field>

            <Field data-invalid={!!(errors as any).region}>
              <FieldLabel htmlFor="bucket-region">Region</FieldLabel>
              <Input
                id="bucket-region"
                placeholder="us-east-1"
                {...register('region')}
              />
              <FieldError errors={[(errors as any).region]} />
            </Field>

            <Field data-invalid={!!(errors as any).accessKeyId}>
              <FieldLabel htmlFor="bucket-access-key">Access Key ID</FieldLabel>
              <Input
                id="bucket-access-key"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                {...register('accessKeyId')}
              />
              <FieldError errors={[(errors as any).accessKeyId]} />
            </Field>

            <Field data-invalid={!!(errors as any).secretAccessKey}>
              <FieldLabel htmlFor="bucket-secret-key">
                Secret Access Key
              </FieldLabel>
              <Input
                id="bucket-secret-key"
                type="password"
                placeholder="Enter secret access key"
                {...register('secretAccessKey')}
              />
              <FieldError errors={[(errors as any).secretAccessKey]} />
            </Field>
          </>
        )}

        {credType === 'gcs' && (
          <>
            <Field>
              <FieldLabel>Input Method</FieldLabel>
              <Controller
                control={control}
                name={'inputMode' as never}
                render={({ field }) => (
                  <Select
                    value={field.value as string}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">Import File</SelectItem>
                      <SelectItem value="text">Paste JSON</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {inputMode === 'file' ? (
              <Field data-invalid={!!(errors as any).serviceAccountJson}>
                <FieldLabel htmlFor="bucket-sa-file">
                  Service Account JSON File
                </FieldLabel>
                <Input
                  id="bucket-sa-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <FieldError errors={[(errors as any).serviceAccountJson]} />
              </Field>
            ) : (
              <Field data-invalid={!!(errors as any).serviceAccountJson}>
                <FieldLabel htmlFor="bucket-sa-json">
                  Service Account JSON
                </FieldLabel>
                <Textarea
                  id="bucket-sa-json"
                  placeholder="Paste your service account JSON here..."
                  className="min-h-[120px] font-mono text-sm"
                  {...register('serviceAccountJson' as never)}
                />
                <FieldError errors={[(errors as any).serviceAccountJson]} />
              </Field>
            )}
          </>
        )}

        <Field>
          <FieldLabel htmlFor="bucket-default">
            Default Bucket (optional)
          </FieldLabel>
          <Input
            id="bucket-default"
            placeholder="my-bucket"
            {...register('defaultBucket')}
          />
        </Field>
      </FieldGroup>
    </CustomDialog>
  );
}
