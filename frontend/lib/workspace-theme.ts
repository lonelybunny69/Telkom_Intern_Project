import type { WorkspaceTheme } from "./workspace-types";

export interface WorkspaceThemeClasses {
  page: string;
  panel: string;
  card: string;
  elevated: string;
  muted: string;
  secondary: string;
  border: string;
  subtleBorder: string;
  input: string;
  tableHeader: string;
  rowHover: string;
  chip: string;
  botBubble: string;
  composer: string;
}

const themedClasses: WorkspaceThemeClasses = {
  page: "text-(--workspace-foreground)",
  panel: "border-(--workspace-border) bg-(--workspace-panel)",
  card: "workspace-glass border-(--workspace-border)",
  elevated: "border-(--workspace-border) bg-(--workspace-elevated)",
  muted: "text-(--workspace-muted)",
  secondary: "text-(--workspace-secondary)",
  border: "border-(--workspace-border)",
  subtleBorder: "border-(--workspace-border-strong)",
  input: "border-(--workspace-border-strong) bg-(--workspace-input) text-(--workspace-foreground) placeholder:text-(--workspace-muted)",
  tableHeader: "bg-(--workspace-table-header) text-(--workspace-muted)",
  rowHover: "hover:bg-(--workspace-row-hover)",
  chip: "bg-(--workspace-chip) text-(--workspace-secondary)",
  botBubble: "bg-(--workspace-chip) text-(--workspace-secondary)",
  composer: "border-(--workspace-border) bg-(--workspace-composer)",
};

export const workspaceThemeClasses: Record<WorkspaceTheme, WorkspaceThemeClasses> = {
  dark: themedClasses,
  light: themedClasses,
};
