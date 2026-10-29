import type { ComponentType } from "react";

import { AgentLoopDiagram } from "./AgentLoopDiagram";
import { AutoencoderDiagram } from "./AutoencoderDiagram";
import { CrispDiagram } from "./CrispDiagram";
import { CnnDiagram, GanDiagram, TransferDiagram } from "./DeepDiagrams";
import { FuzzyControllerDiagram } from "./FuzzyControllerDiagram";

/** Static diagrams a lesson can use by name, like the simulations. */
export const illustrations: Record<string, ComponentType> = {
  AgentLoopDiagram,
  AutoencoderDiagram,
  CnnDiagram,
  CrispDiagram,
  FuzzyControllerDiagram,
  GanDiagram,
  TransferDiagram,
};
