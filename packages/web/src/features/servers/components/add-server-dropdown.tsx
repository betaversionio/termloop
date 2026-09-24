import { Add, DocumentUpload, Setting2 } from "iconsax-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConnectionDialog } from "./connection-dialog-context";

export function AddServerDropdown() {
  const { openAddDialog, openSSHConfigImport } = useConnectionDialog();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Add size={18} color="currentColor" />
          Add Server
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Add New Server</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={openAddDialog}>
          <Setting2 size={16} color="currentColor" className="mr-2" />
          Manual Configuration
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={openSSHConfigImport}>
          <DocumentUpload size={16} color="currentColor" className="mr-2" />
          Import SSH Config
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
