"use client";

import { useContext } from "react";
import { useAgent } from "./agent/useAgent";
import { BrainContext } from "./BrainContext";
import { useConversation } from "./conversation/useConversation";
import { useDecision } from "./decision/useDecision";
import { useKnowledge } from "./knowledge/useKnowledge";
import { useMemory } from "./memory/useMemory";
import { usePrompt } from "./prompt/usePrompt";
import { useTask } from "./task/useTask";
import { useWorkspace } from "./workspace/useWorkspace";

export function useBrain() {
  const context = useContext(BrainContext);

  if (!context) {
    throw new Error("useBrain must be used inside BrainProvider.");
  }

  return context;
}

export function useBrainDomains() {
  const workspace = useWorkspace();
  const agent = useAgent();
  const conversation = useConversation();
  const memory = useMemory();
  const prompt = usePrompt();
  const task = useTask();
  const decision = useDecision();
  const knowledge = useKnowledge();
  const brain = useBrain();

  const workspaceId = workspace.activeWorkspaceId;

  return {
    brain,
    workspace,
    agent,
    conversation,
    memory,
    prompt,
    task,
    decision,
    knowledge,
    workspaceAgents: workspaceId
      ? agent.getAgentsByWorkspace(workspaceId)
      : [],
    workspaceConversations: workspaceId
      ? conversation.getConversationsByWorkspace(workspaceId)
      : [],
    workspaceMemories: workspaceId
      ? memory.getMemoriesByWorkspace(workspaceId)
      : [],
    workspacePrompts: workspaceId
      ? prompt.getPromptsByWorkspace(workspaceId)
      : [],
    workspaceTasks: workspaceId ? task.getTasksByWorkspace(workspaceId) : [],
    workspaceDecisions: workspaceId
      ? decision.getDecisionsByWorkspace(workspaceId)
      : [],
    workspaceKnowledge: workspaceId
      ? knowledge.getKnowledgeByWorkspace(workspaceId)
      : [],
  };
}
