import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

import { es } from "@/i18n/es";

/** Wraps a lazily loaded simulation so each one is its own chunk, loaded when a lesson uses it. */
function lazySim(load: () => Promise<{ default: ComponentType }>): ComponentType {
  const Component = lazy(load);
  return function LazySimulation(): ReactNode {
    return (
      <Suspense fallback={<p>{es.sim.loading}</p>}>
        <Component />
      </Suspense>
    );
  };
}

/** Every simulation a lesson can use, by the name used in MDX (`<KMeansSim />`). */
export const simulations = {
  AxisSim: lazySim(() => import("./python/AxisSim")),
  EventLoopSim: lazySim(() => import("./fastapi/EventLoopSim")),
  RequestLifecycleSim: lazySim(() => import("./fastapi/RequestLifecycleSim")),
  BroadcastingSim: lazySim(() => import("./python/BroadcastingSim")),
  GeneratorPipelineSim: lazySim(() => import("./python/GeneratorPipelineSim")),
  GroupBySim: lazySim(() => import("./python/GroupBySim")),
  HistogramSim: lazySim(() => import("./python/HistogramSim")),
  ImageOpsSim: lazySim(() => import("./python/ImageOpsSim")),
  MergeSim: lazySim(() => import("./python/MergeSim")),
  MissingValuesSim: lazySim(() => import("./python/MissingValuesSim")),
  ReferencesSim: lazySim(() => import("./python/ReferencesSim")),
  SlicingSim: lazySim(() => import("./python/SlicingSim")),
  TextFrequencySim: lazySim(() => import("./python/TextFrequencySim")),
  GiniSplitSim: lazySim(() => import("./supervised/GiniSplitSim")),
  KFoldSim: lazySim(() => import("./supervised/KFoldSim")),
  KnnSim: lazySim(() => import("./supervised/KnnSim")),
  LinearRegressionSim: lazySim(() => import("./supervised/LinearRegressionSim")),
  LogisticSim: lazySim(() => import("./supervised/LogisticSim")),
  OverfittingSim: lazySim(() => import("./supervised/OverfittingSim")),
  ScalingSim: lazySim(() => import("./supervised/ScalingSim")),
  ThresholdSim: lazySim(() => import("./supervised/ThresholdSim")),
  DbscanSim: lazySim(() => import("./unsupervised/DbscanSim")),
  DendrogramSim: lazySim(() => import("./unsupervised/DendrogramSim")),
  GmmEmSim: lazySim(() => import("./unsupervised/GmmEmSim")),
  KMeansSim: lazySim(() => import("./unsupervised/KMeansSim")),
  KnnGraphSim: lazySim(() => import("./unsupervised/KnnGraphSim")),
  PageRankSim: lazySim(() => import("./unsupervised/PageRankSim")),
  PcaSim: lazySim(() => import("./unsupervised/PcaSim")),
  ActivationSim: lazySim(() => import("./deep/ActivationSim")),
  AttentionSim: lazySim(() => import("./deep/AttentionSim")),
  ConvolutionSim: lazySim(() => import("./deep/ConvolutionSim")),
  GanSim: lazySim(() => import("./deep/GanSim")),
  IouNmsSim: lazySim(() => import("./deep/IouNmsSim")),
  MlpTrainerSim: lazySim(() => import("./deep/MlpTrainerSim")),
  OptimizerSim: lazySim(() => import("./deep/OptimizerSim")),
  PerceptronSim: lazySim(() => import("./deep/PerceptronSim")),
  BanditSim: lazySim(() => import("./rl/BanditSim")),
  GridWorldSim: lazySim(() => import("./rl/GridWorldSim")),
  PpoClipSim: lazySim(() => import("./rl/PpoClipSim")),
  ReturnsSim: lazySim(() => import("./rl/ReturnsSim")),
  AnnealingSim: lazySim(() => import("./optimization/AnnealingSim")),
  ComplexitySim: lazySim(() => import("./optimization/ComplexitySim")),
  GeneticSim: lazySim(() => import("./optimization/GeneticSim")),
  GradientDescentSim: lazySim(() => import("./optimization/GradientDescentSim")),
  KnapsackSim: lazySim(() => import("./optimization/KnapsackSim")),
  NQueensSim: lazySim(() => import("./optimization/NQueensSim")),
  SortingSim: lazySim(() => import("./optimization/SortingSim")),
  BayesSim: lazySim(() => import("./reasoning/BayesSim")),
  CertaintyFactorSim: lazySim(() => import("./reasoning/CertaintyFactorSim")),
  DempsterShaferSim: lazySim(() => import("./reasoning/DempsterShaferSim")),
  FuzzySetsSim: lazySim(() => import("./reasoning/FuzzySetsSim")),
  MamdaniSim: lazySim(() => import("./reasoning/MamdaniSim")),
  ClaheSim: lazySim(() => import("./tfm/ClaheSim")),
  ClassWeightsSim: lazySim(() => import("./tfm/ClassWeightsSim")),
  GradCamSim: lazySim(() => import("./tfm/GradCamSim")),
  LayerExplorerSim: lazySim(() => import("./tfm/LayerExplorerSim")),
  LossBalanceSim: lazySim(() => import("./tfm/LossBalanceSim")),
  LrScheduleSim: lazySim(() => import("./tfm/LrScheduleSim")),
  PatientAggregationSim: lazySim(() => import("./tfm/PatientAggregationSim")),
  TScoreSim: lazySim(() => import("./tfm/TScoreSim")),
} satisfies Record<string, ComponentType>;
