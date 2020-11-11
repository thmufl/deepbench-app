// eslint-disable-next-line
import React, { useState, useEffect, useRef, Fragment } from "react";
import * as d3 from "d3";

import { Step, Point, Path } from "./commons/Types";

const GradientDescentAnimation = (props: {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colors: {
    background: string;
    curve: string;
    train: string;
    predictions: string;
    text: string;
  };
  data: {
    xTrain: number[];
    yTrain: number[];
    xVal?: number[];
    yVal?: number[];
  };
  steps: Step[];
  drawAxis?: boolean;
  zoom?: boolean;
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { width, height, steps, drawAxis, zoom } = props;
  const { xTrain, yTrain, xVal, yVal } = props.data;

  const train = xTrain.map((d, i) => {
    return { x: d, y: yTrain[i] };
  });

  useEffect(() => {
    const { width, height, margin, colors } = props;
    const w = width - margin.right - margin.left;
    const h = height - margin.top - margin.bottom;

    const weightScale: any = d3
      .scaleLinear()
      .domain([-3, 3])
      .range([0, w / 2]);

    const errorScale: any = d3
      .scaleLinear()
      .domain([0, 50])
      .range([h / 2, 0]);

    const xScale: any = d3
      .scaleLinear()
      .domain([-10, 10])
      .range([0, w / 2]);

    const yScale: any = d3
      .scaleLinear()
      .domain([-10, 10])
      .range([h / 2, 0]);

    const weightAxis = d3.axisBottom(weightScale);
    const errorAxis = d3.axisLeft(errorScale);

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
          .attr("class", "weight-axis")
          .attr("transform", `translate(0, ${h / 2})`)
          .call(weightAxis);
        main
          .append("g")
          .attr("class", "error-axis")
          .attr("transform", `translate(${w / 4}, 0)`)
          .call(errorAxis);

        main
          .append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(${w / 2}, ${h / 4})`)
          .call(xAxis);

        main
          .append("g")
          .attr("class", "y-axis")
          .attr("transform", `translate(${(w / 4) * 3}, 0)`)
          .call(yAxis);
      }

      const radius = 5;

      // steps
      const gSteps = main.append("g").attr("class", "steps");
      const stepsUpdate = d3
        .select(".steps")
        .selectAll<SVGSVGElement, Step>(".step")
        .data(steps, (d) => `e${d.epoch}b${d.batch}`);

      stepsUpdate
        .enter()
        .append("circle")
        .attr("class", "step")
        .attr("cx", (d) => weightScale(d.weight))
        .attr("cy", (d) => errorScale(d.logs ? d.logs.mse : 0))
        .attr("r", radius);

      stepsUpdate.style("fill", colors.curve).style("opacity", 0.9);
      stepsUpdate.exit().remove();

      // predictions

      // lines generator
      const line = d3
        .line<Point>()
        //.curve(d3.curveNatural)
        .x((d: Point) => {
          return xScale(d.x);
        })
        .y((d: Point) => yScale(d.y));

      const gPredictions = main
        .append("g")
        .attr("class", "predictions")
        .attr("transform", `translate(${w / 2}, 0)`);

      const predictionsUpdate = d3
        .select(".predictions")
        .selectAll<SVGSVGElement, Path>("path")
        .data(steps, (d) => `e${(d as Step).epoch}b${(d as Step).batch}`);

      predictionsUpdate
        .style("stroke-width", (d, i) => (i === steps.length - 1 ? 8 : 1))
        //.style("stroke-dasharray", "8 8")
        .style("stroke", (d, i) =>
          i === steps.length - 1 ? colors.predictions : "grey"
        );

      predictionsUpdate
        .enter()
        .append("path")
        .style("fill", "none")
        .style("stroke", colors.predictions)
        .style("stroke-width", 8)
        //.style("stroke-dasharray", "0 25")
        .style("stroke-linecap", "round")
        .style("opacity", 0.9)
        .attr("d", (d) => line(d.predictions.points));

      predictionsUpdate.exit().remove();

      // train
      const gTrains = main
        .append("g")
        .attr("class", "trains")
        .attr("transform", `translate(${w / 2}, 0)`);

      const trainsUpdate = d3
        .select(".trains")
        .selectAll<SVGSVGElement, Point>(".train")
        .data(train);

      trainsUpdate
        .enter()
        .append("circle")
        .attr("class", "train")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", radius)
        .style("fill", colors.train)
        .style("opacity", 0.8);

      trainsUpdate.exit().remove();

      svg
        .selectAll(".metrics")
        .style("fill", colors.text)
        .text(
          `Epoch: ${("0000" + "epoch").substr(-4)} \u2022 Batch: ${(
            "000" + "batch"
          ).substr(-3)} \u2022 Error: ${(1 * 100).toFixed(2)}%`
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
          `${"Gradient Descent I"} \u2022 ${new Date().toLocaleDateString()} \u2022 deep@cyin.org`
        );
    }
  }, [svgRef, props, train, steps]);

  return (
    <Fragment>
      <svg
        className="d3-component"
        width={zoom ? 0.7 * width : undefined}
        height={zoom ? 0.7 * height : undefined}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        ref={svgRef}
      />
    </Fragment>
  );
};

GradientDescentAnimation.defaultProps = {
  width: 1920,
  height: 1080,
  margin: { top: 300, right: 80, bottom: 80, left: 80 },
  colors: {
    background: "gold",
    curve: "blue",
    train: "red",
    predictions: "dimgrey",
  },
  label: "deep@cyin.org",
  drawAxis: true,
  zoom: false,
};

export default GradientDescentAnimation;
