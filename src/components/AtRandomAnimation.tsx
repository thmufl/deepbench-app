import React, { useState, useEffect, useRef, Fragment } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import * as d3 from "d3";

import * as tf from "@tensorflow/tfjs";

import { FaPause, FaPlay, FaSearchPlus, FaSearchMinus } from "react-icons/fa";

const AtRandomAnimation = (props: {
  width: number;
  height: number;
  background: string;
  fill: string;
  circles: number;
  zoom: boolean;
}) => {
  const { width, height } = props;

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
      let array = tf.abs(tf.randomNormal(shape)).arraySync() as number[][];
      let x = array[0][0];
      let y = array[0][1];

      return array.map((d) => {
        return {
          x: x * width * 0.5,
          y: y * height * 0.5,
          r: d[2] * height * 0.5,
        };
      });
    };

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
        .style("opacity", 1 / circles)
        .transition()
        .duration(4000)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", (d) => d.r);

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
        .style("font-size", "12pt")
        .style("fill", "black")
        .text(
          `At Random I \u2022 thmufl@cyin.org \u2022 ${new Date().toLocaleDateString()}`
        );
    }
  }, [d3Container, width, height, data, background, fill, circles]);

  const handleOnChange = (event: any) => {
    switch (event.currentTarget.id) {
      case "formBackground":
        setBackground(event.currentTarget.value);
        break;

      case "formFill":
        setFill(event.currentTarget.value);
        break;

      case "formCircles":
        let circles = +event.currentTarget.value;
        setCircles(circles > 0 ? circles : 1);
        setData(undefined);
        break;

      default:
        return new Error(`No setting: ${event.currentTarget.name}`);
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
        width={zoom ? 1920 * 0.9 : undefined}
        height={zoom ? 1080 * 0.9 : undefined}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMinYMin meet"
        ref={d3Container}
      />

      <div className="d-flex justify-content-end mt-2">
        <Button variant="primary" className="" onClick={handleToggleAnimation}>
          {animationId ? <FaPause /> : <FaPlay />}
        </Button>
        &nbsp;
        <Button variant="primary" className="" onClick={handleToggleZoom}>
          {zoom ? <FaSearchMinus /> : <FaSearchPlus />}
        </Button>
      </div>

      <Form className="mt-2">
        <Row>
          <Col>
            <Form.Group controlId="formBackground">
              <Form.Label>Background</Form.Label>
              <Form.Control
                as="select"
                value={background}
                onChange={(e) => handleOnChange(e)}
              >
                <option>red</option>
                <option>green</option>
                <option>blue</option>

                <option>cyan</option>
                <option>magenta</option>
                <option>yellow</option>

                <option>grey</option>
                <option>lightgrey</option>
                <option>dimgrey</option>
                <option>white</option>
                <option>black</option>

                <option>lightblue</option>
                <option>midnightblue</option>
                <option>slateblue</option>

                <option>orange</option>
                <option>darkorange</option>
                <option>purple</option>

                <option>lemonchiffon</option>
                <option>midnightblue</option>
                <option>seagreen</option>
              </Form.Control>
              <Form.Text>The background color.</Form.Text>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="formFill">
              <Form.Label>Fill</Form.Label>
              <Form.Control
                as="select"
                value={fill}
                onChange={(e) => handleOnChange(e)}
              >
                <option>red</option>
                <option>green</option>
                <option>blue</option>

                <option>cyan</option>
                <option>magenta</option>
                <option>yellow</option>

                <option>grey</option>
                <option>lightgrey</option>
                <option>dimgrey</option>
                <option>white</option>
                <option>black</option>

                <option>lightblue</option>
                <option>midnightblue</option>
                <option>slateblue</option>

                <option>orange</option>
                <option>darkorange</option>
                <option>purple</option>

                <option>lemonchiffon</option>
                <option>midnightblue</option>
                <option>seagreen</option>
              </Form.Control>
              <Form.Text>The fill color of the circles.</Form.Text>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group controlId="formCircles">
              <Form.Label>Circles</Form.Label>
              <Form.Control
                type="number"
                value={circles}
                onChange={(e) => handleOnChange(e)}
              ></Form.Control>
              <Form.Text>The number of circles of the animation.</Form.Text>
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </Fragment>
  );
};
export default AtRandomAnimation;
