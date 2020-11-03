// eslint-disable-next-line
import React, { useState, useEffect, useRef, Fragment } from "react";
import Button from "react-bootstrap/Button";
import { FaPause, FaPlay, FaExpand, FaCompress } from "react-icons/fa";

import * as d3 from "d3";
import * as tf from "@tensorflow/tfjs";
//import * as tfvis from "@tensorflow/tfjs-vis";

type Point = { x: number; y: number };
type Path = { key: string; points: Point[] };

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
    const n = 3;
    for (let i = 0; i < layers.length - n; i++) {
      layers[i].trainable = false;
      console.log(`Freezing layer ${i}`);
    }

    // Set random values to the remaining layers
    for (let i = layers.length - n; i < layers.length; i++) {
      let weights = layers[i].getWeights();
      let newWeigths = [];
      for (let j = 0; j < weights.length; j++) {
        //rand.push(tf.randomNormal(weights[j].shape));
        //rand.push(tf.randomGamma(weights[j].shape, 1));
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

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const w = width - margin.right - margin.left;
    const h = height - margin.top - margin.bottom;

    const trainData = (key: string): Path[] => {
      let points = xs.map((_, i) => {
        return { x: xs[i], y: ys[i] };
      });
      return [{ key, points: points.sort((a, b) => a.x - b.x) }];
    };

    const xScale: any = d3.scaleLinear().domain([0, 1]).range([0, w]);
    const yScale: any = d3.scaleLinear().domain([1, 0]).range([0, h]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    if (trainData && svgRef.current) {
      const svg = d3.select(svgRef.current);

      svg.style("background", colors.background);

      const main = svg
        .selectAll(".main")
        .data([0])
        .enter()
        .append("g")
        .attr("class", "main")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Draw axis
      if (drawAxis) {
        main
          .append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(0, ${h / 2})`)
          .call(xAxis);
        main
          .append("g")
          .attr("class", "y-axis")
          .attr("transform", `translate(${w / 2}, 0)`)
          .call(yAxis);
      }

      // Draw lines
      const line = d3
        .line<Point>()
        .x((d: Point) => {
          return xScale(d.x);
        })
        .y((d: Point) => yScale(d.y));

      // Draw mae
      main.append("g").attr("class", "mae");

      const maeUpdate = d3
        .selectAll(".mae")
        .selectAll<SVGSVGElement, Path>("path")
        .data([mae]);

      maeUpdate.attr("d", (d) => line(d.points));

      maeUpdate
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", colors.mae)
        .attr("stroke-width", 0.25)
        .attr("opacity", 0.6)
        .attr("d", (d) => line(d.points));

      maeUpdate.exit().remove();

      // Draw training data
      main.append("g").attr("class", "training-data");
      const trainUpdate = d3
        .select(".training-data")
        .selectAll<SVGSVGElement, Path>("path")
        .data(trainData("training-data"), (d) => d.key);

      trainUpdate
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", colors.trainingData)
        .attr("stroke-width", 12)
        // .attr("stroke-dasharray", "0 25")
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.8)
        .attr("d", (d) => line(d.points));

      trainUpdate.exit().remove();

      // Draw history
      main.append("g").attr("class", "prediction-history");

      const colorScale: any = d3.scaleLinear().domain([0, pathes.length]);
      const color = (i: number) =>
        d3.interpolateRgb.gamma(2.2)(
          colors.predictionHistory[0],
          colors.predictionHistory[1]
        )(colorScale(i));

      const historyUpdate = d3
        .select(".prediction-history")
        .selectAll<SVGSVGElement, Path>("path")
        .data(pathes, (d) => d.key);

      historyUpdate
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", (_, i) => color(i))
        .attr("stroke-width", 0.6)
        .attr("opacity", 0.5)
        .attr("d", (d) => line(d.points));

      historyUpdate.attr("stroke", (_, i) => color(i));

      historyUpdate.exit().remove();

      // Draw prediction
      main.append("g").attr("class", "prediction");

      const predictionUpdate = d3
        .selectAll(".prediction")
        .selectAll<SVGSVGElement, Path>("path")
        .data(pathes.slice(pathes.length - 1, pathes.length));

      predictionUpdate
        .transition()
        .duration(yieldEvery - 20)
        .ease(d3.easeBounce)
        .attr("d", (d) => line(d.points));

      predictionUpdate
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", colors.prediction)
        .attr("stroke-width", 12)
        // .attr("stroke-dasharray", "0 25")
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.8)
        .attr("d", (d) => line(d.points));

      predictionUpdate.exit().remove();

      // metrics
      svg
        .selectAll(".metrics")
        .data([0])
        .enter()
        .append("text")
        .attr("class", "metrics")
        .attr("x", 20)
        .attr("y", height - 10)
        .attr("text-anchor", "start")
        .style("font-family", "Roboto Mono")
        .style("font-size", "8pt")
        .style("opacity", 0.9);

      svg
        .selectAll(".metrics")
        .style("fill", colors.text)
        .text(
          `Layers: ${
            model.layers.length
          }  \u2022 Parameters: ${model.countParams()} \u2022 Epoch: ${(
            "0000" + epoch
          ).substr(-4)} \u2022 Batch: ${("000" + batch).substr(
            -3
          )} \u2022 Error: ${(mae.points.length > 0
            ? 100 * mae.points[mae.points.length - 1].y
            : 100
          ).toFixed(2)}%`
        );

      // label
      svg
        .selectAll(".title")
        .data([0])
        .enter()
        .append("text")
        .attr("class", "title")
        .attr("x", width - 20)
        .attr("y", height - 10)
        .attr("text-anchor", "end")
        .style("font-family", "Roboto Mono")
        .style("font-size", "8pt")
        .style("opacity", 0.9);

      svg
        .selectAll(".title")
        .style("fill", colors.text)
        .text(
          `${title} \u2022 ${new Date().toLocaleDateString()} \u2022 deep@cyin.org`
        );
    }
  }, [
    state,
    pathes,
    svgRef,
    width,
    height,
    margin,
    colors,
    model,
    xs,
    ys,
    yieldEvery,
    epoch,
    batch,
    mae,
    title,
    drawAxis,
  ]);

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
      <svg
        className="d3-component"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        ref={svgRef}
      />
      <p>
        Time: {msToTime(Date.now() - startTime)}
        <br />
        Epoch: {epoch}, Batch: {batch}
        <br />
        EPOCHS: {epochs} - STOPPED: {stopTraining ? "true" : "false"}
        <br />
        YIELD_EVERY: {yieldEvery}
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
