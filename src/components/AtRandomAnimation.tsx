import React, { useState, useEffect, useRef, Fragment } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import * as d3 from "d3";

import * as tf from "@tensorflow/tfjs";

import { FaPause, FaPlay, FaExpand, FaCompress } from "react-icons/fa";

import ColorControl from "./commons/ColorControl";

const AtRandomAnimation = (props: {
  width: number;
  height: number;
  author?: string;
  background: string;
  fill: string;
  circles: number;
  zoom: boolean;
}) => {
  const { width, height } = props;
  const [author, setAuthor] = useState(props.author || "deepbench@cyin.org");
  const [background, setBackground] = useState(props.background);
  const [fill, setFill] = useState(props.fill);
  const [circles, setCircles] = useState(props.circles);
  const [zoom, setZoom] = useState(props.zoom);
  const [data, setData] = useState<
    Array<{ x: number; y: number; r: number }>
  >();
  const [animationId, setAnimationId] = React.useState<NodeJS.Timeout>();

  const d3Container = React.createRef<SVGSVGElement>();

  useEffect(() => {
    const getRandomData = (
      shape: number[]
    ): Array<{ x: number; y: number; r: number }> => {
      let array = tf.abs(tf.randomUniform(shape)).arraySync() as number[][];
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
          return a.r - b.r;
        });
    };

    const margin = {
      top: height * 0.1,
      right: width * 0.1,
      bottom: height * 0.1,
      left: width * 0.1,
    };

    const r = (height - margin.top - margin.bottom) * 0.66;

    const xScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([margin.top, height - margin.bottom]);

    const rScale = d3.scaleLinear().domain([0, 1]).range([0, r]);

    const opacityScale = d3.scaleSqrt().domain([0, 1]).range([1, 0]);

    if (!data) setData(getRandomData([circles, 3]));
    if (data && d3Container.current) {
      const svg = d3.select(d3Container.current);

      // Bind D3 data
      const update = svg
        .style("background", background)
        .selectAll<SVGCircleElement, number[]>("circle")
        .data(data);

      // Enter new D3 elements
      const enter = update.enter().append("circle");

      // Update existing D3 elements
      update
        .merge(enter)
        .style("fill", fill)
        .transition()
        .duration(4000)
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", (d) => rScale(d.r))
        .style("opacity", (d, i) => opacityScale(d.r));

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
        .style("fill", fill)
        .text(
          `At Random I \u2022 ${new Date().toLocaleDateString()} \u2022 ${author}`
        );
    }
  }, [d3Container, width, height, data, author, background, fill, circles]);

  const handleOnChange = (event: any) => {
    const { name, value } = event.currentTarget;

    switch (name) {
      case "author":
        setAuthor(value);
        break;

      case "background":
        setBackground(value);
        break;

      case "fill":
        setFill(value);
        break;

      case "circles":
        setCircles(value > 0 ? parseInt(value) : 1);
        setData(undefined);
        break;

      default:
        return new Error(`No form element: ${name}`);
    }
  };

  const handleToggleAnimation = () => {
    if (animationId) {
      clearInterval(animationId);
      setAnimationId(undefined);
      return;
    }

    let id = setInterval(() => {
      setData(undefined);
    }, 5000);
    setAnimationId(id);
  };

  const handleToggleZoom = () => {
    setZoom(!zoom);
  };

  return (
    <Fragment>
      <svg
        className="d3-component"
        width={zoom ? window.innerWidth : undefined}
        height={zoom ? (window.innerWidth * height) / width : undefined}
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
                colors="extended"
              />
              <Form.Text>Background color.</Form.Text>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group>
              <Form.Label>Fill</Form.Label>
              <ColorControl
                name="fill"
                value={fill}
                onChange={handleOnChange}
                colors="extended"
              />
              <Form.Text>Fill color of the circles.</Form.Text>
            </Form.Group>
          </Col>

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

          <Col className="col-5">
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
