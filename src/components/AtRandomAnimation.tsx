// eslint-disable-next-line
import React, { useState, useEffect, Fragment } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import * as d3 from "d3";

import * as tf from "@tensorflow/tfjs";

import { FaPause, FaPlay, FaExpand, FaCompress } from "react-icons/fa";

import ColorControl from "./commons/ColorControl";

type Data = Array<{ x: number; y: number; r: number }>;

const AtRandomAnimation = (props: {
  width: number;
  height: number;
  author?: string;
  palette: { background: string[]; a: string[]; b: string[] };
  background: string;
  colorA: string[];
  colorB: string[];
  circles: number;
  updateInterval: number;
}) => {
  const [state, setState] = useState(props);
  const [data, setData] = useState<Data>();
  const [animationId, setAnimationId] = React.useState<NodeJS.Timeout>();
  const [zoom, setZoom] = React.useState(false);

  const {
    width,
    height,
    author,
    palette,
    background,
    colorA,
    colorB,
    circles,
    updateInterval,
  } = state;

  const d3Container = React.createRef<SVGSVGElement>();

  useEffect(() => {
    const getRandomData = (shape: number[]): Data => {
      let array = tf
        .abs(tf.randomUniform(shape, 0, 1, "float32"))
        .arraySync() as number[][];
      let x = array[0][0];
      let y = array[0][1];
      return array
        .map((d) => {
          return {
            x: x,
            y: y,
            r: d[2],
          };
        })
        .sort(function (a, b) {
          return b.r - a.r;
        });
    };

    const margin = {
      top: 5,
      right: 5,
      bottom: 5,
      left: 5,
    };

    const cx = (width - margin.right - margin.left) / 2;
    const cy = (height - margin.top - margin.bottom) / 2;
    const r = (height - margin.top - margin.bottom) * 0.5;

    const rScale = d3.scaleLinear().domain([0, 1]).range([0, r]);
    const opacityScale = d3.scaleSqrt().domain([0, 1]).range([0.8, 0.1]);

    const getRandomColor = (colors: string[]): string => {
      return colors[Math.round(Math.random() * (colors.length - 1))];
    };

    let currentColors = [getRandomColor(colorA), getRandomColor(colorB)];
    //console.log("color", colorA, colorB);
    //console.log("currentColors", currentColors);

    const colorScale = d3.interpolateHsl(currentColors[0], currentColors[1]);

    if (!data) setData(getRandomData([+circles, 3]));
    if (data && d3Container.current) {
      const svg = d3.select(d3Container.current);

      // Bind D3 data
      const update = svg
        .style("background", background)
        .selectAll<SVGCircleElement, number[]>("circle")
        .data(data);

      // Enter new D3 elements
      const enter = update
        .enter()
        .append("circle")
        .attr("cx", cx)
        .attr("cy", cy);

      // Update existing D3 elements
      /*
      update
        .merge(enter)
        .transition()
        .style("opacity", (d) => opacityScale(d.r))
        .duration(0.99 * updateInterval)
        .ease(d3.easeSin)
        .attr("r", (d) => rScale(d.r))
        .style("fill", (d) => colorScale(d.r));
      */
      // Remove old D3 elements
      update.exit().remove();

      svg
        .selectAll(".label")
        .data([0])
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", width - 15)
        .attr("y", height - 15)
        .attr("text-anchor", "end")
        .style("font-family", "Work Sans")
        .style("font-size", "11pt")
        .style("opacity", 0.8);

      svg
        .selectAll(".label")
        .style("fill", "grey")
        .text(
          `Color Circles I \u2022 ${background}/${currentColors[0]}/${
            currentColors[1]
          } \u2022 ${new Date().toLocaleDateString()} \u2022 ${author}`
        );
    }
  }, [
    d3Container,
    width,
    height,
    data,
    author,
    background,
    colorA,
    colorB,
    circles,
    updateInterval,
  ]);

  const handleOnChange = (event: any) => {
    const { name, value } = event.currentTarget;
    setState({ ...state, [name]: value });
    if (name === "circles") {
      setData(undefined);
    }
  };

  const handleOnChangeMultiple = (event: any) => {
    const { name, selectedOptions } = event.currentTarget;
    let values = [];
    for (let i = 0; i < selectedOptions.length; i++) {
      values.push(selectedOptions.item(i).value);
    }
    setState({ ...state, [name]: values });
  };

  const handleToggleAnimation = () => {
    if (animationId) {
      clearInterval(animationId);
      setAnimationId(undefined);
      return;
    }

    let id = setInterval(() => {
      setData(undefined);
    }, updateInterval);
    setAnimationId(id);
  };

  const handleToggleZoom = () => {
    setZoom(!zoom);
  };

  return (
    <Fragment>
      <svg
        className="d3-component"
        //width={zoom ? window.innerWidth : undefined}
        //height={zoom ? (window.innerWidth * height) / width : undefined}
        width={zoom ? (1920 / 3) * 2 : undefined}
        height={zoom ? (1080 / 3) * 2 : undefined}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        ref={d3Container}
      />

      <div className="d-flex justify-content-end mt-2">
        <Button
          variant="primary"
          className="mr-2"
          onClick={handleToggleAnimation}
        >
          {animationId ? <FaPause /> : <FaPlay />}
        </Button>
        <Button variant="primary" onClick={handleToggleZoom}>
          {zoom ? <FaCompress /> : <FaExpand />}
        </Button>
      </div>

      <Form className="mt-3">
        <Row>
          <Col>
            <Form.Group>
              <Form.Label>Background</Form.Label>
              <ColorControl
                name="background"
                value={background}
                onChange={handleOnChange}
                colors={palette.background}
              />
              <Form.Text>Background color.</Form.Text>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group>
              <Form.Label>Color A</Form.Label>
              <ColorControl
                name="colorA"
                value={colorA}
                multiple={true}
                onChange={handleOnChangeMultiple}
                colors={palette.a}
              />
              <Form.Text>1st color of the circles.</Form.Text>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group>
              <Form.Label>Color B</Form.Label>
              <ColorControl
                name="colorB"
                value={colorB}
                multiple={true}
                onChange={handleOnChangeMultiple}
                colors={palette.b}
              />
              <Form.Text>2nd color of the circles.</Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group>
              <Form.Label>Circles</Form.Label>
              <Form.Control
                type="number"
                name="circles"
                value={circles}
                onChange={handleOnChange}
              ></Form.Control>
              <Form.Text>Number of circles of the animation.</Form.Text>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group>
              <Form.Label>Update Interval</Form.Label>
              <Form.Control
                type="number"
                name="updateInterval"
                value={updateInterval}
                disabled={animationId ? true : false}
                onChange={handleOnChange}
              ></Form.Control>
              <Form.Text>The update interval in milliseconds.</Form.Text>
            </Form.Group>
          </Col>

          <Col className="col-4">
            <Form.Group>
              <Form.Label>Author</Form.Label>
              <Form.Control
                type="text"
                name="author"
                value={author}
                onChange={handleOnChange}
              ></Form.Control>
              <Form.Text>Author of the animation.</Form.Text>
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </Fragment>
  );
};
export default AtRandomAnimation;
