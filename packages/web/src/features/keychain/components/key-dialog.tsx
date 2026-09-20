import { useEffect, useRef, type ChangeEvent } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { SSHKey, SSHKeyInput } from '@termloop/shared';
import { useCreateKey, useUpdateKey } from '@/features/keychain';
import { keychainApi } from '../api';
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

const keySchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    type: z.enum(['file', 'text']),
    keyContent: z.string(),
    passphrase: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.keyContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.type === 'file'
            ? 'Key file is required'
            : 'Key content is required',
        path: ['keyContent'],
      });
    }
  });

type KeyFormValues = z.infer<typeof keySchema>;

const defaults: KeyFormValues = {
  name: '',
  type: 'file',
  keyContent: '',
  passphrase: '',
};

interface KeyDialogProps {
  open: boolean;
  onClose: () => void;
  editKey?: SSHKey;
}

export function KeyDialog({ open, onClose, editKey }: KeyDialogProps) {
  const isEdit = !!editKey;
  const createMutation = useCreateKey();
  const updateMutation = useUpdateKey();
  const isPending = isEdit
    ? updateMutation.isPending
    : createMutation.isPending;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: fullKeyData } = useQuery({
    queryKey: ['keychain', editKey?.id],
    queryFn: () => keychainApi.get(editKey!.id),
    enabled: open && !!editKey,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<KeyFormValues>({
    resolver: zodResolver(keySchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (open && !editKey) {
      reset(defaults);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, editKey, reset]);

  useEffect(() => {
    if (open && editKey && fullKeyData?.data) {
      const key = fullKeyData.data as SSHKey;
      reset({
        name: key.name,
        type: 'text',
        keyContent: key.keyContent ?? '',
        passphrase: key.passphrase ?? '',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, editKey, fullKeyData, reset]);

  const keyType = watch('type');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setValue('keyContent', reader.result as string, {
        shouldValidate: true,
      });
    };
    reader.readAsText(file);
  };

  const onSubmit = handleSubmit((data) => {
    const payload: SSHKeyInput = {
      name: data.name,
      type: 'text',
      keyContent: data.keyContent,
      passphrase: data.passphrase || undefined,
    };

    if (isEdit) {
      updateMutation.mutate(
        { id: editKey.id, data: payload },
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
      title={isEdit ? 'Edit SSH Key' : 'Add SSH Key'}
      footer={
        <form
          onSubmit={onSubmit}
          className="flex w-full items-center justify-end gap-2"
        >
          <Button type="button" variant="outline" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEdit ? 'Update' : 'Add Key'}
          </Button>
        </form>
      }
    >
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="key-name">Name</FieldLabel>
          <Input
            id="key-name"
            placeholder="Production Key"
            {...register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field>
          <FieldLabel>Key Type</FieldLabel>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">Import File</SelectItem>
                  <SelectItem value="text">Paste Key</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        {keyType === 'file' ? (
          <Field data-invalid={!!errors.keyContent}>
            <FieldLabel htmlFor="key-file">Key File</FieldLabel>
            <Input
              id="key-file"
              ref={fileInputRef}
              type="file"
              accept=".pem,.key,.pub,.ppk,*"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <FieldError errors={[errors.keyContent]} />
          </Field>
        ) : (
          <Field data-invalid={!!errors.keyContent}>
            <FieldLabel htmlFor="key-content">Private Key</FieldLabel>
            <Textarea
              id="key-content"
              placeholder="Paste your private key here..."
              className="min-h-[120px] font-mono text-sm"
              {...register('keyContent')}
            />
            <FieldError errors={[errors.keyContent]} />
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="key-passphrase">
            Passphrase (optional)
          </FieldLabel>
          <Input
            id="key-passphrase"
            type="password"
            placeholder="Enter passphrase"
            {...register('passphrase')}
          />
        </Field>
      </FieldGroup>
    </CustomDialog>
  );
}
