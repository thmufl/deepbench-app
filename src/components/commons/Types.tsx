import { Tensor, Logs } from "@tensorflow/tfjs";

export type TrainingData = {
  xTrain: Tensor;
  xTest: Tensor;
  xVal: Tensor;
  yVal: Tensor;
};

export type Step = {
  epoch: Number;
  batch: Number;
  logs: Logs | undefined;
  weight: Number;
  bias: Number;
  predictions: Path;
};

export type Point = { x: number; y: number };
export type Path = { key: string; points: Point[] };
