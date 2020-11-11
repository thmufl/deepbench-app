// eslint-disable-next-line
import React, { useState, useEffect, useRef, Fragment } from "react";
import * as d3 from "d3";

import { Point, Path } from "./Types";
import ReactDOM from "react-dom";

const LineChartControl = (props: {
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
  epoch: number;
  batch: number;
  logs: any;
  predictions: Path[];
  drawAxis?: boolean;
  zoom: boolean;
}) => {
  const { width, height, zoom } = props;
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [lastEpoch, setLastEpoch] = useState(0);

  useEffect(() => {
    const {
      predictions,
      width,
      height,
      margin,
      colors,
      xs,
      ys,
      epoch,
      batch,
      logs,
      title,
      drawAxis,
    } = props;

    const w = width - margin.right - margin.left;
    const h = height - margin.top - margin.bottom;

    const trainData = (key: string): Path[] => {
      let points = xs.map((_, i) => {
        return { x: xs[i], y: ys[i] };
      });
      return [{ key, points: points.sort((a, b) => a.x - b.x) }];
    };

    const xScale: any = d3.scaleLinear().domain([0, 1]).range([0, w]);
    const yScale: any = d3
      .scaleLinear()
      .domain([1, 0])
      .range([0, h / 2.5]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    if (svgRef.current) {
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
          .attr("transform", `translate(0, ${h / 4})`)
          .call(xAxis);
        main
          .append("g")
          .attr("class", "y-axis")
          .attr("transform", `translate(${w / 4}, 0)`)
          .call(yAxis);
      }

      // lines generator
      const line = d3
        .line<Point>()
        .curve(d3.curveNatural)
        .x((d: Point) => {
          return xScale(d.x);
        })
        .y((d: Point) => yScale(d.y));

      // Draw training data
      main
        .append("g")
        .attr("class", "training-data")
        .attr("transform", `translate(${0}, ${-60})`);

      const trainUpdate = d3
        .select(".training-data")
        .selectAll<SVGSVGElement, Path>("path")
        .data(trainData("training-data"), (d) => d.key);

      trainUpdate
        .enter()
        .append("path")
        .style("fill", "none")
        .style("stroke", colors.trainingData)
        .style("stroke-width", 20)
        //.style("stroke-dasharray", "0 25")
        .style("stroke-linecap", "round")
        .style("opacity", 0.9)
        .attr("d", (d) => line(d.points));

      trainUpdate.exit().remove();

      // Draw history
      main
        .append("g")
        .attr("transform", `translate(${0}, ${h - 400})`)
        .attr("class", "prediction-history");

      const colorScale: any = d3.scaleLinear().domain([0, predictions.length]);
      const color = (i: number) =>
        d3.interpolateRgb.gamma(2.2)(
          colors.predictionHistory[0],
          colors.predictionHistory[1]
        )(colorScale(i));

      const historyUpdate = d3
        .select(".prediction-history")
        .selectAll<SVGSVGElement, Path>("path")
        .data(predictions, (d) => d.key);

      historyUpdate
        .enter()
        .append("path")
        .style("fill", "none")
        .style("stroke", (_, i) => color(i))
        .style("stroke-width", 1)
        .style("opacity", 0.6)
        .attr("d", (d) => line(d.points));

      historyUpdate.style("stroke", (_, i) => color(i));
      historyUpdate.exit().remove();

      // Draw prediction
      main
        .append("g")
        .attr("transform", `translate(${0}, ${h - 400})`)
        .attr("class", "prediction");

      const prediction = predictions.slice(
        predictions.length - 1,
        predictions.length
      );
      if (prediction.length > 0) prediction[0].key = "prediction";

      const predictionUpdate = svg
        .selectAll(".prediction")
        .selectAll<SVGSVGElement, Path>("path")
        .data(prediction, (d) => d.key);

      predictionUpdate.interrupt();

      if (lastEpoch === 0) setLastEpoch(d3.now());
      //console.log(0.8 * (d3.now() - lastEpoch));
      predictionUpdate
        .transition()
        .duration(0.3 * (d3.now() - lastEpoch))
        .ease(d3.easeLinear)
        .attr("d", (d) => line(d.points));

      setLastEpoch(d3.now());

      predictionUpdate
        .enter()
        .append("path")
        .style("fill", "none")
        .style("stroke", colors.prediction)
        .style("stroke-width", 10)
        //.attr("stroke-dasharray", "0 25")
        .style("stroke-linecap", "round")
        .style("opacity", 0.9)
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
          `Epoch: ${("00000" + epoch).substr(-5)} \u2022 Batch: ${(
            "000" + batch
          ).substr(-3)} \u2022 Error: ${(logs.mae * 100).toFixed(2)}%`
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
  }, [svgRef, props]);

  return (
    <Fragment>
      <svg
        className="d3-component"
        width={zoom ? width : undefined}
        height={zoom ? height : undefined}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        ref={svgRef}
      />
    </Fragment>
  );
};

LineChartControl.defaultProps = {
  width: 1920,
  height: 1080,
  label: "deep@cyin.org",
  delay: 0,
  stopTraining: false,
};

export default LineChartControl;
