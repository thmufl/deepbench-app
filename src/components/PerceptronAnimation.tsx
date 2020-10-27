// eslint-disable-next-line
import React, {
  useState,
  useReducer,
  useEffect,
  useRef,
  Fragment,
} from "react";
import Button from "react-bootstrap/Button";
import { FaPause, FaPlay, FaExpand, FaCompress } from "react-icons/fa";

import * as d3 from "d3";
import * as tf from "@tensorflow/tfjs";
//import * as tfvis from "@tensorflow/tfjs-vis";
import { map, transition } from "d3";

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
  label: string;
  xs: number[];
  ys: number[];
  model: tf.Sequential;
  epochs: number;
  history: number;
  delay?: number;
}) => {
  const [state, setState] = useState(props);
  const {
    width,
    height,
    margin,
    label,
    xs,
    ys,
    model,
    epochs,
    history,
    delay,
  } = state;

  const [epoch, setEpoch] = useState(0);
  const [batch, setBatch] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [mae, setMae] = useState(0);
  const [mse, setMse] = useState(0);
  const [pathes, setPathes] = useState<Path[]>([]);
  const [stopTraining, setStopTraining] = useState(false);

  const timeoutTrain = () => setTimeout(trainModel, 15000);

  const slower = () => {
    setState({ ...state, delay: (delay || 0) + 100 });
  };

  const faster = () => {
    setState({ ...state, delay: (delay || 0) - 100 });
  };

  const requestStopTraining = () => {
    console.log("stopTraining requested");
    setStopTraining(true);
    model.stopTraining = true;
  };

  const compileModel = () => {
    if (model) {
      //const optimizer = new tf.SGDOptimizer(learingRate);
      model.compile({
        optimizer: "adam", // sgd, adam, adamax, adagrad, adadelta, rmsprop
        loss: "meanAbsoluteError", // meanAbsoluteError, meanSquaredError, categoricalCrossentropy
        metrics: ["mae", "mse", "acc"],
      });
    }
  };

  const resetWeights = () => {
    console.log("weights", model.getWeights(), model.getWeights());
  };

  const sleep = (milliseconds: number) => {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  };

  const trainModel = async () => {
    const onBatchBegin = (batch: number, logs: any) => {
      setBatch(batch);
    };

    const onBatchEnd = (batch: number, logs: any) => {
      setMae(logs.mae);
      setMse(logs.mse);
      setAccuracy(logs.acc);
    };

    const onEpochBegin = (epoch: number, logs: any) => {
      setEpoch(epoch);
    };

    const onEpochEnd = (epoch: number, logs: any) => {};

    const onYield = (epoch: number, batch: number, logs: any) => {
      if (delay && delay > 0) sleep(delay);

      tf.tidy(() => {
        const xt: number[] = [];
        for (let x = 0; x < 1.005; x += 0.005) {
          xt.push(x);
        }

        let predictions = model.predict(tf.tensor(xt)) as tf.Tensor;
        predictions.array().then((array) => {
          let path: Path = { key: `e${epoch}b${batch}`, points: [] };
          (array as number[]).forEach((d, i) =>
            path.points.push({ x: xt[i], y: d })
          );
          pathes.push(path);
          setPathes(
            pathes.filter((_, i) => i > pathes.length - history || i % 10 === 0)
          );
          predictions.dispose();
        });
      });
    };

    await model
      .fit(tf.tensor1d(xs), tf.tensor1d(ys), {
        epochs: epochs,
        //batchSize: 40,
        shuffle: true,
        validationSplit: 0.2,
        //yieldEvery: 200,
        callbacks: {
          onBatchBegin,
          onBatchEnd,
          onEpochBegin,
          onEpochEnd,
          onYield,
        },
      })
      .then((info) => {
        console.log("Final accuracy: " + info.history.acc.slice(-1)[0]);
      });
  };

  const trainData = (key: string): Path[] => {
    let points = xs.map((_, i) => {
      return { x: xs[i], y: ys[i] };
    });
    return [{ key, points: points.sort((a, b) => a.x - b.x) }];
  };

  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const w = width - margin.right - margin.left;
    const h = height - margin.top - margin.bottom;

    const xScale: any = d3.scaleLinear().domain([0, 1]).range([0, w]);
    const yScale: any = d3.scaleLinear().domain([1, 0]).range([0, h]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    if (trainData && svgRef.current) {
      const svg = d3.select(svgRef.current);

      svg.style("background", "navy");

      const main = svg
        .selectAll(".main")
        .data([0])
        .enter()
        .append("g")
        .attr("class", "main")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Draw axis
      // g.append("g")
      //   .attr("class", "x-axis")
      //   .attr("transform", `translate(0, ${h / 2})`)
      //   .call(xAxis);
      // g.append("g")
      //   .attr("class", "y-axis")
      //   .attr("transform", `translate(${w / 2}, 0)`)
      //   .call(yAxis);

      // Draw lines
      const line = d3
        .line<Point>()
        .x((d: Point) => {
          return xScale(d.x);
        })
        .y((d: Point) => yScale(d.y));

      // Draw training data
      main.append("g").attr("class", "train");
      const trainUpdate = d3
        .select(".train")
        .selectAll<SVGSVGElement, Path>("path")
        .data(trainData("train"), (d) => d.key);

      trainUpdate
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "cyan")
        .attr("stroke-width", 3)
        .attr("d", (d) => line(d.points));

      trainUpdate.exit().remove();

      // draw history
      main.append("g").attr("class", "history");

      const pathesUpdate = d3
        .select(".history")
        .selectAll<SVGSVGElement, Path>("path")
        .data(pathes, (d) => d.key);

      pathesUpdate
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "yellow")
        .attr("stroke-width", 1)
        .attr("opacity", 0.6)
        .attr("d", (d) => line(d.points));

      pathesUpdate.exit().remove();

      // Draw current
      main.append("g").attr("class", "current");

      const currentUpdate = d3
        .selectAll(".current")
        .selectAll<SVGSVGElement, Path>("path")
        .data(pathes.slice(pathes.length - 1, pathes.length));

      currentUpdate.attr("d", (d) => line(d.points));

      currentUpdate
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", "magenta")
        .attr("stroke-width", 8)
        .attr("opacity", 0.9)
        .attr("d", (d) => line(d.points));

      currentUpdate.exit().remove();

      svg
        .selectAll(".label")
        .data([0])
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", width - 20)
        .attr("y", height - 10)
        .attr("text-anchor", "end")
        .style("font-family", "Work Sans")
        .style("font-size", "6pt")
        .style("opacity", 0.9);

      //const reducer = (accumulator, currentValue) => accumulator + currentValue;

      var trainableWeights = 33; //model.trainableWeights.reduce((a, b) => { return a.shape[0] + b.shape[0]; });

      svg.selectAll(".label").style("fill", "snow").text(
        `Learning a Random Curve \u2022 ${
          model.layers.length
        } layers with ${trainableWeights}
          trainable weights \u2022 ${new Date().toLocaleDateString()} \u2022 ${label}`
      );
    }
  }, [state, pathes, svgRef, width, height, margin, trainData, label]);

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
        Epoch: {epoch}, Batch: {batch}
        <br />
        MAE: {mae}
        <br />
        MSE: {mse}
        <br />
        ACC: {accuracy}
        <br />
        EPOCHS: {epochs} - STOP: {stopTraining ? "true" : "false"}
        <br />
        DELAY: {delay}
      </p>
      <button onClick={compileModel}>Compile Model</button>
      <button onClick={trainModel}>Train Model</button>
      <button onClick={timeoutTrain}>Timeout Train Model</button>
      <button onClick={slower}>Slower</button>
      <button onClick={faster}>Faster</button>
      <button onClick={requestStopTraining}>Stop Training</button>
      <button onClick={resetWeights}>Reset Weights</button>
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
