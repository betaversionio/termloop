import {
  Monitor as MonitorIcon,
  FolderOpen,
  Key,
  CloudConnection,
  Setting2,
  Add,
  type Icon,
} from "iconsax-react";

export type NavItem = {
  icon: Icon;
  label: string;
  href: string;
};

export type NavGroup = {
  title?: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    items: [
      { icon: MonitorIcon, label: "Servers", href: "/" },
    ],
  },
  {
    title: "Management",
    items: [
      { icon: FolderOpen, label: "Projects", href: "/projects" },
      { icon: Key, label: "Keychain", href: "/keychain" },
      { icon: CloudConnection, label: "Storage", href: "/storage" },
      { icon: Setting2, label: "Settings", href: "/settings" },
    ],
  },
];

export { Add };
