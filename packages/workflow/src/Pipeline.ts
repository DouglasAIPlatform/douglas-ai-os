export interface PipelineStage {
  id: string;
  name: string;
  taskIds: string[];
  order: number;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
}

export function createPipeline(
  input: Omit<Pipeline, "stages"> & { stages?: PipelineStage[] },
): Pipeline {
  return {
    ...input,
    stages: [...(input.stages ?? [])].sort((a, b) => a.order - b.order),
  };
}

export function getOrderedTaskIds(pipeline: Pipeline): string[] {
  return pipeline.stages
    .sort((a, b) => a.order - b.order)
    .flatMap((stage) => stage.taskIds);
}
