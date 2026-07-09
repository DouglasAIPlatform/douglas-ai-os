export type KnowledgeStatus = "draft" | "published" | "archived";

export type KnowledgeCategory =
  | "documentation"
  | "procedure"
  | "reference"
  | "insight";

export interface Knowledge {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  status: KnowledgeStatus;
  tags: string[];
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}
