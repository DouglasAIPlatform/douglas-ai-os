"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { AgentProvider } from "./agent/AgentProvider";
import { useAgent } from "./agent/useAgent";
import { BrainContext } from "./BrainContext";
import { ConversationProvider } from "./conversation/ConversationProvider";
import { useConversation } from "./conversation/useConversation";
import { DecisionProvider } from "./decision/DecisionProvider";
import { useDecision } from "./decision/useDecision";
import { KnowledgeProvider } from "./knowledge/KnowledgeProvider";
import { useKnowledge } from "./knowledge/useKnowledge";
import { MemoryProvider } from "./memory/MemoryProvider";
import { useMemory } from "./memory/useMemory";
import { PromptProvider } from "./prompt/PromptProvider";
import { usePrompt } from "./prompt/usePrompt";
import { TaskProvider } from "./task/TaskProvider";
import { useTask } from "./task/useTask";
import { WorkspaceProvider } from "./workspace/WorkspaceProvider";
import { useWorkspace } from "./workspace/useWorkspace";

interface BrainProviderProps {
  children: ReactNode;
}

function BrainContextBridge({ children }: BrainProviderProps) {
  const { activeWorkspaceId } = useWorkspace();
  const { getAgentsByWorkspace } = useAgent();
  const { getConversationsByWorkspace } = useConversation();
  const { getMemoriesByWorkspace } = useMemory();
  const { getPromptsByWorkspace } = usePrompt();
  const { getTasksByWorkspace } = useTask();
  const { getDecisionsByWorkspace } = useDecision();
  const { getKnowledgeByWorkspace } = useKnowledge();

  const domainCounts = useMemo(() => {
    if (!activeWorkspaceId) {
      return {
        conversations: 0,
        agents: 0,
        memories: 0,
        prompts: 0,
        tasks: 0,
        decisions: 0,
        knowledge: 0,
      };
    }

    return {
      conversations: getConversationsByWorkspace(activeWorkspaceId).length,
      agents: getAgentsByWorkspace(activeWorkspaceId).length,
      memories: getMemoriesByWorkspace(activeWorkspaceId).length,
      prompts: getPromptsByWorkspace(activeWorkspaceId).length,
      tasks: getTasksByWorkspace(activeWorkspaceId).length,
      decisions: getDecisionsByWorkspace(activeWorkspaceId).length,
      knowledge: getKnowledgeByWorkspace(activeWorkspaceId).length,
    };
  }, [
    activeWorkspaceId,
    getAgentsByWorkspace,
    getConversationsByWorkspace,
    getDecisionsByWorkspace,
    getKnowledgeByWorkspace,
    getMemoriesByWorkspace,
    getPromptsByWorkspace,
    getTasksByWorkspace,
  ]);

  const value = useMemo(
    () => ({
      isReady: true,
      activeWorkspaceId,
      domainCounts,
    }),
    [activeWorkspaceId, domainCounts],
  );

  return <BrainContext.Provider value={value}>{children}</BrainContext.Provider>;
}

export function BrainProvider({ children }: BrainProviderProps) {
  return (
    <WorkspaceProvider>
      <AgentProvider>
        <MemoryProvider>
          <KnowledgeProvider>
            <PromptProvider>
              <ConversationProvider>
                <TaskProvider>
                  <DecisionProvider>
                    <BrainContextBridge>{children}</BrainContextBridge>
                  </DecisionProvider>
                </TaskProvider>
              </ConversationProvider>
            </PromptProvider>
          </KnowledgeProvider>
        </MemoryProvider>
      </AgentProvider>
    </WorkspaceProvider>
  );
}
