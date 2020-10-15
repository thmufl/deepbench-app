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
import { map } from "d3";

type TrainData = { x: number; y: number };
type Point = { x: number; y: number };

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
  model?: tf.Sequential;
}) => {
  const [state, setState] = useState(props);
  const { width, height, margin, label, xs, ys, epochs, model } = state;

  const [epoch, setEpoch] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [mse, setMse] = useState(0);
  //const [pathes, setPathes] = useState<[Point] | []>([]);
  const [pathes, setPathes] = useState([
    [
      { x: -0, y: -0 },
      { x: 0, y: 0 },
    ],
  ]);

  const createModel = () => {
    const model = tf.sequential();
    model.add(
      tf.layers.dense({ inputShape: [1], units: 1, activation: "linear" })
    );
    setState({ ...state, model });
    console.log(model.summary());
  };

  const compileModel = () => {
    if (model) {
      model.compile({
        optimizer: "sgd", // sgd, adam, adamax, adagrad, rmsprop
        loss: "meanSquaredError", // meanSquaredError, sigmoidCrossEntropy, categoricalCrossentropy
        metrics: ["mse", "acc"],
      });

      console.log("compiled", model.getWeights());
    }
  };

  async function train() {
    if (model) {
      const onEpochBegin = (batch: any, logs: any) => {
        // console.log(
        //   `epoch begin - batch: ${batch}, , logs: ${JSON.stringify(logs)}`
        // );
      };

      const onYield = (epoch: any, batch: any, logs: any) => {
        console.log(
          `yield - epoch: ${epoch}, batch: ${batch}, logs: ${JSON.stringify(
            logs
          )}`
        );

        let m = +model.layers[0].getWeights()[0].arraySync();
        let b = +model.layers[0].getWeights()[1].arraySync();

        console.log(`m: ${m}, b: ${b}}`);
        // console.log(
        //   "WEIGHTS",
        //   model.layers[0].getWeights().map((d) => d.arraySync())
        // );

        pathes.push([
          { x: -1.5, y: -1.5 * m + b },
          { x: 1.5, y: 1.5 * m + b },
        ]);

        setPathes(new Array(...pathes));
        //setPathes({...pathes})
        setEpoch(epoch);
        setAccuracy(logs.acc);
        setMse(logs.mse);
      };

      const onEpochEnd = (batch: any, logs: any) => {
        // console.log(
        //   `epoch end - batch: ${batch}, logs: ${JSON.stringify(logs)}`
        // );
        //console.log('epoch ' + batch + ' - acc: ' + logs.acc + ', loss: ' + logs.loss);
        //console.log('layer 0: ', model.layers[0].getWeights()[0].arraySync());
        //console.log('layer 1: ', model.layers[1].getWeights()[0].arraySync());
      };

      await model
        .fit(tf.tensor1d(xs), tf.tensor1d(ys), {
          epochs: epochs,
          batchSize: 6,
          shuffle: true,
          // validationData: [testData.xs, testData.labels],
          callbacks: { onEpochBegin, onEpochEnd, onYield },
        })
        .then((info) => {
          console.log("Final accuracy: " + info.history.acc.slice(-1)[0]);
        });
    }
  }

  const svgRef = useRef<SVGSVGElement | null>(null);
  const w = width - margin.right - margin.left;
  const h = height - margin.top - margin.bottom;
  const trainData = xs.map((_, i) => {
    return { x: xs[i], y: ys[i] };
  });

  useEffect(() => {
    const xScale: any = d3.scaleLinear().domain([-2, 2]).range([0, w]);
    const yScale: any = d3.scaleLinear().domain([2, -2]).range([0, h]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    if (trainData && svgRef.current) {
      const svg = d3.select(svgRef.current);

      svg.style("background", "lightgrey");

      const g = svg
        .selectAll(".main")
        .data([0])
        .enter()
        .append("g")
        .attr("class", "main")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

      // Draw axis
      g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${h / 2})`)
        .call(xAxis);
      g.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${w / 2}, 0)`)
        .call(yAxis);

      // Draw the lines
      const line = d3
        .line<Point>()
        .x((d: Point) => {
          return xScale(d.x);
        })
        .y((d: Point) => yScale(d.y));

      const gPathes = g.append("g").attr("class", "pathes");

      d3.selectAll(".pathes")
        .selectAll("path")
        .attr("stroke", "blue")
        .attr("stroke-width", 0.1)

      d3.selectAll(".pathes")
        .selectAll("path")
        .data(pathes)
        .enter()
        .append("path")
        .attr("d", (d) => {
          return line(d);
        })
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("fill", "none");

      // Bind D3 data
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
        .style("fill", (d) => "red");

      // Remove old D3 elements
      update.exit().style("opacity", 0).remove();

      svg
        .selectAll(".label")
        .data([0])
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", width - 10)
        .attr("y", height - 10)
        .attr("text-anchor", "end")
        .style("font-family", "Work Sans")
        .style("font-size", "6pt")
        .style("opacity", 0.9);

      svg
        .selectAll(".label")
        .style("fill", "black")
        .text(
          `Perceptron Animation \u2022 ${new Date().toLocaleDateString()} \u2022 ${label}`
        );
    }
  }, [state, pathes, svgRef]);

  const timeoutTrain = () => setTimeout(train, 15000);

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
      <p>Epoch: {epoch}<br/>MSE: {mse}<br/>ACC: {accuracy}</p>
      <button onClick={createModel}>Create Model</button>
      <button onClick={compileModel}>Compile Model</button>
      <button onClick={train}>Train Model</button>
      <button onClick={timeoutTrain}>Timeout Train Model</button>
    </Fragment>
  );
};

/*
PerceptronAnimation.defaultProps = {
  width: 1920,
  height: 1080,
  label: "deep@cyin.org",
};
*/

export default PerceptronAnimation;
