import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudConnection } from "iconsax-react";
import type { ServerConnectionInput } from "@termloop/shared";
import { useCreateConnection } from "../hooks/use-connections";
import { CustomDialog } from "@/components/ui/custom-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const providerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  host: z.string().min(1, "Host/IP is required"),
  username: z.string().min(1, "Username is required"),
  privateKey: z.string().min(1, "Private key is required"),
});

type ProviderFormValues = z.infer<typeof providerSchema>;

export type CloudProvider = "aws" | "gcp" | "azure" | "digitalocean" | "linode" | "hetzner" | "vultr";

interface ProviderDialogProps {
  open: boolean;
  onClose: () => void;
  provider: CloudProvider | null;
}

const providerInfo: Record<CloudProvider, { name: string; icon: string; defaultUser: string; docs: string }> = {
  aws: {
    name: "Amazon Web Services (EC2)",
    icon: "AWS",
    defaultUser: "ubuntu",
    docs: "Typically uses 'ubuntu', 'ec2-user', or 'admin' depending on the AMI",
  },
  gcp: {
    name: "Google Cloud Platform",
    icon: "GCP",
    defaultUser: "your-username",
    docs: "Use your GCP username or create one in Compute Engine settings",
  },
  azure: {
    name: "Microsoft Azure",
    icon: "Azure",
    defaultUser: "azureuser",
    docs: "Default user is 'azureuser' unless specified during VM creation",
  },
  digitalocean: {
    name: "DigitalOcean Droplet",
    icon: "DO",
    defaultUser: "root",
    docs: "DigitalOcean droplets use 'root' by default",
  },
  linode: {
    name: "Linode (Akamai)",
    icon: "Linode",
    defaultUser: "root",
    docs: "Linode instances use 'root' by default",
  },
  hetzner: {
    name: "Hetzner Cloud",
    icon: "Hetzner",
    defaultUser: "root",
    docs: "Hetzner Cloud servers use 'root' by default",
  },
  vultr: {
    name: "Vultr",
    icon: "Vultr",
    defaultUser: "root",
    docs: "Vultr instances use 'root' by default",
  },
};

const providerColors: Record<CloudProvider, string> = {
  aws: "#FF9900",
  gcp: "#4285F4",
  azure: "#0078D4",
  digitalocean: "#0080FF",
  linode: "#00A95C",
  hetzner: "#D50C2D",
  vultr: "#007BFC",
};

export function ProviderDialog({ open, onClose, provider }: ProviderDialogProps) {
  const createMutation = useCreateConnection();
  const [step, setStep] = useState<"info" | "form">("info");

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      name: "",
      host: "",
      username: provider ? providerInfo[provider].defaultUser : "",
      privateKey: "",
    },
  });

  const handleClose = () => {
    setStep("info");
    reset();
    onClose();
  };

  const onSubmit = handleSubmit((data) => {
    const payload: ServerConnectionInput = {
      name: data.name,
      host: data.host,
      port: 22,
      username: data.username,
      authMethod: "key",
      privateKey: data.privateKey,
      password: "",
      color: provider ? providerColors[provider] : "#6366f1",
      tags: provider ? [providerInfo[provider].icon] : [],
    };

    createMutation.mutate(payload, {
      onSuccess: () => handleClose(),
    });
  });

  if (!provider) return null;

  const info = providerInfo[provider];

  if (step === "info") {
    return (
      <CustomDialog
        open={open}
        onOpenChange={(v) => !v && handleClose()}
        title={`Connect to ${info.name}`}
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={() => setStep("form")}>
              Continue
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <CloudConnection size={24} color="currentColor" className="text-primary mt-0.5" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold">Quick Connect Guide</h3>
              <p className="text-sm text-muted-foreground">
                To connect to your {info.name} server, you'll need:
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">1. Server IP Address</h4>
              <p className="text-sm text-muted-foreground">
                Find your instance's public IP in your {info.name} dashboard
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-medium">2. SSH Username</h4>
              <p className="text-sm text-muted-foreground">{info.docs}</p>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-medium">3. SSH Private Key</h4>
              <p className="text-sm text-muted-foreground">
                Download your private key (.pem or .key file) from your cloud provider and paste its contents
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 <strong>Tip:</strong> Make sure your instance's security group/firewall allows SSH (port 22) from your IP address
            </p>
          </div>
        </div>
      </CustomDialog>
    );
  }

  return (
    <CustomDialog
      open={open}
      onOpenChange={(v) => !v && handleClose()}
      title={`Add ${info.name} Server`}
      footer={
        <form onSubmit={onSubmit} className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setStep("info")}>
            Back
          </Button>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Add Server
          </Button>
        </form>
      }
    >
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Server Name</FieldLabel>
          <Input
            id="name"
            placeholder={`My ${info.icon} Server`}
            {...register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.host}>
          <FieldLabel htmlFor="host">IP Address or Hostname</FieldLabel>
          <Input
            id="host"
            placeholder="e.g., 54.123.45.67"
            {...register("host")}
          />
          <FieldError errors={[errors.host]} />
        </Field>

        <Field data-invalid={!!errors.username}>
          <FieldLabel htmlFor="username">SSH Username</FieldLabel>
          <Input
            id="username"
            placeholder={info.defaultUser}
            {...register("username")}
          />
          <FieldError errors={[errors.username]} />
          <p className="text-xs text-muted-foreground mt-1">{info.docs}</p>
        </Field>

        <Field data-invalid={!!errors.privateKey}>
          <FieldLabel htmlFor="privateKey">SSH Private Key</FieldLabel>
          <Textarea
            id="privateKey"
            placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;Paste your private key here...&#10;-----END RSA PRIVATE KEY-----"
            className="min-h-[120px] font-mono text-xs"
            {...register("privateKey")}
          />
          <FieldError errors={[errors.privateKey]} />
          <p className="text-xs text-muted-foreground mt-1">
            Paste the contents of your .pem or .key file
          </p>
        </Field>
      </FieldGroup>
    </CustomDialog>
  );
}
