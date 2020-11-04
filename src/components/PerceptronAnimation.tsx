// eslint-disable-next-line
import React, { useState, useEffect, useRef, Fragment } from "react";
import Button from "react-bootstrap/Button";
import {
  FaPlusSquare,
  FaMinusSquare,
  FaStop,
  FaPause,
  FaPlay,
  FaExpand,
  FaCompress,
} from "react-icons/fa";

import * as tf from "@tensorflow/tfjs";
//import * as tfvis from "@tensorflow/tfjs-vis";

import { Point, Path } from "./commons/Types";
import LineChartControl from "./commons/LineChartControl";
import { setTimeout } from "timers";
import { parentPort } from "worker_threads";

const PerceptronAnimation = (props: {
  width: number;
  height: number;
  margin: {
    top: number | 0;
    right: number | 0;
    bottom: number | 0;
    left: number | 0;
  };
  colors: {
    background: string;
    trainingData: string;
    predictionHistory: [string, string];
    prediction: string;
    mae: string;
    text: string;
  };
  title: string;
  description: string;
  xs: number[];
  ys: number[];
  model: tf.Sequential;
  modelCompileArgs: tf.ModelCompileArgs;
  epochs: number;
  batchSize: number | undefined;
  yieldEvery: number;
  history: number;
  drawAxis?: boolean;
  zoom?: boolean;
}) => {
  const [state, setState] = useState(props);
  const {
    width,
    height,
    margin,
    colors,
    title,
    description,
    xs,
    ys,
    model,
    modelCompileArgs,
    epochs,
    batchSize,
    yieldEvery,
    history,
    zoom = false,
    drawAxis = false,
  } = state;

  const [trainingData, setTrainingData] = useState<{
    epoch: number;
    batch: number;
    predictions: Path[];
    mae: Path;
  }>({ epoch: 0, batch: 0, predictions: [], mae: { key: "mae", points: [] } });

  const [modelCompiled, setModelCompiled] = useState(false);
  const [modelTraining, setModelTraining] = useState(false);
  const [timeoutBeforeTrain, setTimeoutBeforeTrain] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const toggleTimeoutBeforeTrain = (event: React.ChangeEvent) => {
    setTimeoutBeforeTrain(!timeoutBeforeTrain);
  };

  const toggleZoom = (event: React.MouseEvent) => {
    setState({ ...state, zoom: !zoom });
  };

  const stopTraining = (event: React.MouseEvent) => {
    event.preventDefault();
    model.stopTraining = true;
    setModelTraining(false);
    console.log(`Training stopped after ${trainingData.epoch} epochs`);
  };

  const compileModel = (event: React.MouseEvent) => {
    event.preventDefault();
    model.compile(modelCompileArgs);
    setModelCompiled(true);
    console.log(model.summary());
  };

  const saveModel = async (event: React.MouseEvent) => {
    event.preventDefault();
    let result = await model.save("localstorage://sine-model");
    console.log(`Model saved: ${JSON.stringify(result)}`);
  };

  const freezeLayers = async (event: React.MouseEvent) => {
    event.preventDefault();

    const layers = model.layers;
    const n = 2;
    for (let i = 0; i < layers.length - n; i++) {
      layers[i].trainable = false;
      console.log(`Freezing layer ${i}`);
    }

    // Set random values to the remaining layers
    for (let i = layers.length - n; i < layers.length; i++) {
      let weights = layers[i].getWeights();
      let newWeigths = [];
      for (let j = 0; j < weights.length; j++) {
        newWeigths.push(
          tf.randomUniform(weights[j].shape, -0.5, 0.5, "float32", j)
        );
      }
      layers[i].setWeights(newWeigths);
      console.log(`Resetting layer ${i}`);
    }
  };

  const loadModel = async (event: React.MouseEvent) => {
    event.preventDefault();
    let m = (await tf.loadLayersModel(
      "localstorage://sine-model"
    )) as tf.Sequential;
    setState({ ...state, model: m });
    console.log("model loaded");
  };

  const clearTraining = (event: React.MouseEvent) => {
    event.preventDefault();
    setTrainingData({
      epoch: 0,
      batch: 0,
      predictions: [],
      mae: { key: "mae", points: [] },
    });
    model.layers.forEach((layer) => {
      let weights = layer.getWeights(true);
      weights = weights.map((w) => tf.randomUniform(w.shape, -0.5, 0.5));
      layer.setWeights(weights);
    });
  };

  const updateTrainingData = (epoch: number, batch: number, logs: any) => {
    // Add new mean absolute error
    trainingData.mae.points.push({
      x: epoch / epochs + (batch / epochs) * 0.01,
      y: logs.mae,
    });

    tf.tidy(() => {
      const xt: number[] = [];
      for (let x = 0; x < 1.0025; x += 0.0025) {
        xt.push(x);
      }

      let pred = model.predict(tf.tensor(xt)) as tf.Tensor;
      let path: Path = { key: `e${epoch}b${batch}`, points: [] };

      pred.data().then((array) => {
        array.forEach((d: number, i: number) =>
          path.points.push({ x: xt[i], y: d })
        );
        pred.dispose();

        trainingData.epoch = epoch;
        trainingData.batch = batch;
        trainingData.predictions.push(path);
        trainingData.predictions = trainingData.predictions.filter(
          (_, i) => i > trainingData.predictions.length - history || i % 2 === 0
        );
        setTrainingData({ ...trainingData });
      });
    });
  };

  const onEpochEnd = async (epoch: number, logs: any) => {
    updateTrainingData(epoch, -1, logs);
  };

  const onYield = async (epoch: number, batch: number, logs: any) => {
    updateTrainingData(epoch, batch | 0, logs);
  };

  const trainModel = async (event: React.MouseEvent) => {
    if (event) event.preventDefault();
    setModelTraining(true);

    const train = async () => {
      setStartTime(Date.now());
      await model
        .fit(tf.tensor1d(xs), tf.tensor1d(ys), {
          epochs: epochs,
          batchSize: batchSize,
          shuffle: false,
          validationSplit: 0.3,
          yieldEvery: yieldEvery,
          callbacks: {
            //onEpochEnd,
            onYield,
          },
        })
        .then((info) => {
          console.log("Final error: " + info.history.val_mae.slice(-1)[0]);
        });
    };

    if (!timeoutBeforeTrain) {
      train();
    } else {
      setTimeout(train, 15000);
    }
  };

  /**
   * Convert milliseconds to time string (hh:mm:ss:mss).
   *
   * @param Number ms
   *
   * @return String
   */
  const msToTime = (ms: number) => {
    return new Date(ms).toISOString().slice(11, -1);
  };

  return (
    <Fragment>
      <LineChartControl
        width={zoom ? window.innerWidth : undefined}
        height={zoom ? (window.innerWidth * height) / width : undefined}
        margin={margin}
        colors={colors}
        title={title}
        description={description}
        xs={xs}
        ys={ys}
        epoch={trainingData.epoch}
        batch={trainingData.batch}
        yieldEvery={yieldEvery}
        predictions={trainingData.predictions}
        mae={trainingData.mae}
        drawAxis={drawAxis}
        zoom={zoom}
      />
      <Button
        variant="secondary"
        className="mt-1 float-right"
        onClick={toggleZoom}
      >
        {zoom ? <FaCompress /> : <FaExpand />}
      </Button>

      <p>
        Time: {msToTime(Date.now() - startTime)}
        <br />
        EPOCHS: {epochs}
      </p>
      <p></p>
      <Button variant="secondary" onClick={loadModel} disabled={modelTraining}>
        Load Model
      </Button>
      <Button
        variant="secondary"
        className="ml-2"
        onClick={freezeLayers}
        disabled={modelTraining}
      >
        Freeze Layers
      </Button>
      <Button
        variant="secondary"
        className="ml-2"
        onClick={compileModel}
        disabled={modelTraining}
      >
        Compile Model
      </Button>
      <Button
        variant="secondary"
        className="ml-1"
        onClick={modelTraining ? stopTraining : trainModel}
        disabled={!modelCompiled}
      >
        {modelTraining ? "Stop Training" : "Train Model"}
      </Button>
      <Button
        variant="secondary"
        className="ml-2"
        onClick={saveModel}
        disabled={modelTraining}
      >
        Save Model
      </Button>
      <Button
        variant="secondary"
        className="ml-2"
        onClick={clearTraining}
        disabled={modelTraining}
      >
        Clear Training
      </Button>
      <p>
        <label>
          <input
            type="checkbox"
            checked={timeoutBeforeTrain}
            onChange={toggleTimeoutBeforeTrain}
          />
          Timeout before Train
        </label>
      </p>
    </Fragment>
  );
};

PerceptronAnimation.defaultProps = {
  width: 1920,
  height: 1080,
  label: "deep@cyin.org",
  delay: 0,
  stopTraining: false,
};

export default PerceptronAnimation;