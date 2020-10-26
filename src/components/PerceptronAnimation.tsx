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

type TrainData = { x: number; y: number };
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
  epochs: number;
  history: number;
  stopTraining?: boolean;
}) => {
  const [state, setState] = useState(props);
  const {
    width,
    height,
    margin,
    label,
    xs,
    ys,
    epochs,
    history,
    stopTraining,
  } = state;

  const [model, setModel] = useState(tf.sequential());
  const [epoch, setEpoch] = useState(0);
  const [batch, setBatch] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [mae, setMae] = useState(0);
  const [mse, setMse] = useState(0);
  //const [pathes, setPathes] = useState<[Point] | []>([]);
  const [pathes, setPathes] = useState([
    {
      key: "0",
      points: [
        { x: -0, y: -0 },
        { x: 0, y: 0 },
      ],
    },
  ]);

  const units = 10;
  const activation = "elu"; // 'elu'|'hardSigmoid'|'linear'|'relu'|'relu6'| 'selu'|'sigmoid'|'softmax'|'softplus'|'softsign'|'tanh'
  const hidden_layers = 3;
  const DROPOUT_RATE = 0.2;

  const timeoutTrain = () => setTimeout(train, 15000);

  const requestStopTraining = () => {
    console.log("stopTraining requested");
    setState({ ...state, stopTraining: !stopTraining });
  };

  const createModel = () => {
    console.log("state: ", state);
    model.add(
      tf.layers.dense({ inputShape: [1], units: units, activation: activation })
    );

    for (let i = 0; i < hidden_layers; i++) {
      model.add(
        tf.layers.dense({
          units: units,
          //kernelInitializer: "glorotNormal", // 'constant'|'glorotNormal'|'glorotUniform'|'heNormal'|'heUniform'|'identity'| 'leCunNormal'|'leCunUniform'|'ones'|'orthogonal'|'randomNormal'| 'randomUniform'|'truncatedNormal'|'varianceScaling'|'zeros'
          //biasInitializer: "glorotNormal",
          //kernelRegularizer: "l1l2",
          activation: activation,
        })
      );
      //if (i % 2 === 0) model.add(tf.layers.dropout({ rate: DROPOUT_RATE }));
    }
    model.add(tf.layers.dense({ units: 1, activation: "linear" }));
    setModel(model);
    console.log(model.summary());
    //tfvis.show.modelSummary({ name: "Model Summary" }, model);
  };

  const learingRate = 0.005;

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

  const train = async () => {
    if (model) {
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

      const onEpochEnd = (epoch: number, logs: any) => {
        console.log("onEpochEnd - stopTraining", stopTraining);
        if (stopTraining) {
          console.log("stopping training...");
          model.stopTraining = true;
        }
      };

      const onYield = (epoch: number, batch: number, logs: any) => {
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
              pathes.filter(
                (_, i) => i > pathes.length - history || i % 5 === 0
              )
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
    }
  };

  const trainData = xs.map((_, i) => {
    return { x: xs[i], y: ys[i] };
  });

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

      const g = svg
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

      // Draw the data
      const update = g
        .selectAll<SVGCircleElement, TrainData>("circle")
        .data(trainData);

      // Enter new D3 elements
      const enter = update
        .enter()
        .append("circle")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y));

      // Update existing D3 elements
      update
        .merge(enter)
        .attr("r", (d) => 4)
        .style("fill", (d) => "cyan")
        .style("opacity", 0.6);

      // Remove old D3 elements
      update.exit().style("opacity", 0).remove();

      // Draw the lines
      const line = d3
        .line<Point>()
        .x((d: Point) => {
          return xScale(d.x);
        })
        .y((d: Point) => yScale(d.y));

      const gPathes = g.append("g").attr("class", "pathes");

      const pathUpdate = d3
        .selectAll(".pathes")
        .selectAll<SVGSVGElement, Path>("path")
        .data(pathes, (d) => d.key);

      pathUpdate
        .transition()
        .duration(100)
        .attr("stroke", "yellow")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.7);

      pathUpdate
        .enter()
        .append("path")
        .attr("d", (d) => {
          return line(d.points);
        })
        .attr("stroke", "magenta")
        .attr("stroke-width", 6)
        .style("opacity", 0.9)
        .style("fill", "none");

      pathUpdate.exit().remove();

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

      svg
        .selectAll(".label")
        .style("fill", "snow")
        .text(
          `Learning a Random Curve \u2022 ${
            hidden_layers + 1
          } layers with ${units} units each \u2022 ${new Date().toLocaleDateString()} \u2022 ${label}`
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
        EPOCHS: {epochs} - STOP: {stopTraining ? "TRUE" : "FALSE"}
      </p>
      <button onClick={createModel}>Create Model</button>
      <button onClick={compileModel}>Compile Model</button>
      <button onClick={train}>Train Model</button>
      <button onClick={timeoutTrain}>Timeout Train Model</button>
      <button onClick={requestStopTraining}>Stop Training</button>
    </Fragment>
  );
};

PerceptronAnimation.defaultProps = {
  width: 1920,
  height: 1080,
  label: "deep@cyin.org",
  stopTraining: false,
};

export default PerceptronAnimation;
