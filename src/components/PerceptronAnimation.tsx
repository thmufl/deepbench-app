// eslint-disable-next-line
import React, { useState, useEffect, useRef, Fragment } from "react";
import Button from "react-bootstrap/Button";
import { FaPause, FaPlay, FaExpand, FaCompress } from "react-icons/fa";

import * as tf from "@tensorflow/tfjs";
//import * as tfvis from "@tensorflow/tfjs-vis";

import { Point, Path } from "./commons/Types";
import LineChartControl from "./commons/LineChartControl";

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
    drawAxis = false,
  } = state;

  const [epoch, setEpoch] = useState(0);
  const [batch, setBatch] = useState(0);
  const [mae, setMae] = useState<Path>({ key: "mae", points: [] });
  const [pathes, setPathes] = useState<Path[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [stopTraining, setStopTraining] = useState(false);

  const [animationParams, setAnimationParams] = useState({
    pathes,
    width,
    height,
    margin,
    colors,
    xs,
    ys,
    epoch,
    batch,
    yieldEvery,
    mae,
    title,
    drawAxis,
  });

  const timeoutTrain = () => setTimeout(trainModel, 15000);

  const handleStopTraining = (event: React.MouseEvent) => {
    event.preventDefault();
    setStopTraining(true);
    model.stopTraining = true;
    console.log(`Training stopped after ${epoch} epochs`);
  };

  const compileModel = (event: React.MouseEvent) => {
    event.preventDefault();
    model.compile(modelCompileArgs);
    console.log(model.summary());
  };

  const saveModel = async (/*event: React.MouseEvent*/) => {
    //if (event) event.preventDefault();
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
    setPathes([]);
    model.layers.forEach((layer) => {
      let weights = layer.getWeights(true);
      weights = weights.map((w) => tf.randomUniform(w.shape, -0.5, 0.5));
      layer.setWeights(weights);
    });
  };

  const onYield = async (epoch: number, batch: number, logs: any) => {
    setBatch(batch);
    setEpoch(epoch);

    // Add new mean average error
    mae.points.push({
      x: epoch / epochs + (batch / epochs) * 0.01,
      y: logs.mae,
    });

    tf.tidy(() => {
      const xt: number[] = [];
      for (let x = 0; x < 1.0025; x += 0.0025) {
        xt.push(x);
      }

      let predictions = model.predict(tf.tensor(xt)) as tf.Tensor;
      let path: Path = { key: `e${epoch}b${batch}`, points: [] };

      predictions.data().then((array) => {
        array.forEach((d: number, i: number) =>
          path.points.push({ x: xt[i], y: d })
        );
        pathes.push(path);
        setPathes(
          pathes.filter((_, i) => i > pathes.length - history || i % 2 === 0)
        );
        predictions.dispose();
        setAnimationParams({
          pathes,
          width,
          height,
          margin,
          colors,
          xs,
          ys,
          epoch,
          batch,
          yieldEvery,
          mae,
          title,
          drawAxis,
        });
      });
    });
  };

  const trainModel = async (event: React.MouseEvent) => {
    if (event) event.preventDefault();
    setStopTraining(false);
    setStartTime(Date.now());

    await model
      .fit(tf.tensor1d(xs), tf.tensor1d(ys), {
        epochs: epochs,
        batchSize: batchSize,
        shuffle: false,
        validationSplit: 0.3,
        yieldEvery: yieldEvery,
        callbacks: {
          onYield,
        },
      })
      .then((info) => {
        //saveModel();
        console.log("Final error: " + info.history.val_mae.slice(-1)[0]);
      });
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
        width={width}
        height={height}
        margin={margin}
        colors={colors}
        title={title}
        description={description}
        xs={xs}
        ys={ys}
        epoch={epoch}
        batch={batch}
        yieldEvery={yieldEvery}
        pathes={pathes}
        mae={mae}
        drawAxis={drawAxis}
      />
      <p>
        Time: {msToTime(Date.now() - startTime)}
        <br />
        Epoch: {epoch}, Batch: {batch}
        <br />
        EPOCHS: {epochs} - STOPPED: {stopTraining ? "true" : "false"}
      </p>
      <button onClick={loadModel}>Load Model</button>
      <button onClick={freezeLayers}>Freeze Layers</button>

      <button onClick={compileModel}>Compile Model</button>

      <Button variant="primary" className="mr-2" onClick={handleStopTraining}>
        {!stopTraining ? <FaPause /> : <FaPlay />}
      </Button>

      <button onClick={trainModel}>Train Model</button>
      <button onClick={timeoutTrain}>Timeout Train Model</button>
      <button onClick={handleStopTraining} disabled={stopTraining}>
        Stop Training
      </button>
      <button onClick={saveModel}>Save Model</button>
      <button onClick={clearTraining}>Clear Training</button>
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
