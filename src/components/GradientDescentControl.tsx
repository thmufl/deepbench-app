// eslint-disable-next-line
import React, { useState, useEffect, useRef, Fragment } from "react";
import { Button } from "react-bootstrap";
import Accordion from "react-bootstrap/esm/Accordion";

import { FaExpand, FaCompress } from "react-icons/fa";

import * as tf from "@tensorflow/tfjs";
import { Step } from "./commons/Types";

import GradientDescentAnimation from "./GradientDescentAnimation";

const GradientDescentControl = (props: {
  data: {
    xTrain: number[];
    yTrain: number[];
    xVal?: number[];
    yVal?: number[];
  };
  epochs: number;
  zoom?: boolean;
}) => {
  const [state, setState] = useState(props);
  const [steps, setSteps] = useState<Step[]>([]);

  const { data, epochs, zoom } = state;
  const { xTrain, yTrain, xVal, yVal } = data;

  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [1],
        units: 1,
        activation: "linear",
      }),
      tf.layers.dense({ units: 1, activation: "linear" }),
    ],
  });

  const handleCompileModel = (event: React.MouseEvent) => {
    event.preventDefault();
    model.compile({
      optimizer: "sgd",
      //optimizer: tf.train.sgd(0.01),
      loss: "meanSquaredError", // meanAbsoluteError, meanSquaredError, categoricalCrossentropy
      metrics: ["mae", "mse", "acc"],
    });
  };

  const handleTrainModel = async (event: React.MouseEvent) => {
    event.preventDefault();
    await model
      .fit(tf.tensor1d(xTrain), tf.tensor1d(yTrain), {
        epochs: +epochs,
        batchSize: undefined,
        shuffle: false,
        validationSplit: 0.1,
        yieldEvery: "auto",
        callbacks: {
          onTrainBegin: async (logs: tf.Logs | undefined) => {
            console.time("train");
          },
          onYield: async (
            epoch: number,
            batch: number,
            logs: tf.Logs | undefined
          ) => {},
          onEpochEnd: async (epoch: number, logs: tf.Logs | undefined) => {
            if (epoch % 5 === 0) {
              const weights = model.layers[1].getWeights();
              const weight = weights[0].dataSync();

              const predictionPoints = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4];
              const predictions = model.predict(
                tf.tensor(predictionPoints)
              ) as tf.Tensor;

              steps.push({
                epoch,
                batch: 0,
                logs,
                weight: weight[0],
                bias: weight[1],
                predictions: {
                  key: "predictions",
                  points: (predictions.arraySync() as number[]).map((d, i) => {
                    return { x: predictionPoints[i], y: d };
                  }),
                },
              });
              setSteps(steps.map((s) => s));

              if (epoch % 100 === 0)
                console.log(
                  `epoch: ${epoch}, mse: ${logs ? logs.mse : NaN}, weight: ${
                    weight[0]
                  }`
                );
            }
          },
          onTrainEnd: async (logs: tf.Logs | undefined) => {
            setSteps(steps.map((s) => s));
            console.timeEnd("train");
          },
        },
      })
      .then((info) => {
        console.log("Final error: " + info.history.mse.slice(-1)[0]);
      });
  };

  const handleToggleZoom = (_event: React.MouseEvent) => {
    setState({ ...state, zoom: !zoom });
  };

  useEffect(() => {
    //console.log("GradientDescentControl: useEffect");
  }, []);

  return (
    <Fragment>
      <GradientDescentAnimation
        data={data}
        steps={steps}
        drawAxis={true}
        zoom={zoom}
      />
      <div className="d-flex justify-content-start mt-2">
        <Button
          variant="secondary"
          className="ml-2"
          onClick={handleCompileModel}
        >
          Compile Model
        </Button>
        <Button variant="secondary" className="ml-2" onClick={handleTrainModel}>
          Train Model
        </Button>
        <Button variant="secondary" className="ml-2" onClick={handleToggleZoom}>
          {zoom ? <FaCompress /> : <FaExpand />}
        </Button>
      </div>
    </Fragment>
  );
};

GradientDescentControl.defaultProps = {
  label: "deep@cyin.org",
};

export default GradientDescentControl;
