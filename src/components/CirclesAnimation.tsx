import React, { useState, useEffect, useRef, Fragment } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import * as d3 from "d3";
import { FaPause, FaPlay, FaExpand, FaCompress } from "react-icons/fa";
import ColorControl from "./commons/ColorControl";

type DataItem = { key: number; value: number };

const CirclesAnimation = (props: {
  width: number;
  height: number;
  palette: { background: string[]; a: string[]; b: string[] };
  background: string;
  colorA: string;
  colorB: string;
  data: DataItem[];
  updateInterval: number;
  animate: boolean;
  animateScale: number;
  author?: string;
}) => {
  const [state, setState] = useState(props);
  const [zoom, setZoom] = React.useState(false);

  const {
    width,
    height,
    palette,
    background,
    colorA,
    colorB,
    data,
    updateInterval,
    animate,
    animateScale,
    author,
  } = state;

  const d3Container = React.createRef<SVGSVGElement>();

  useEffect(() => {
    const margin = {
      top: 15,
      right: 15,
      bottom: 15,
      left: 15,
    };

    const cx = (width - margin.right - margin.left) / 2;
    const cy = (height - margin.top - margin.bottom) / 2;
    const r = (height - margin.top - margin.bottom) / 2;

    const rScale: any = d3.scaleLinear().domain([0, 1]).range([0, r]);
    const colorScale: any = d3.interpolateHsl(colorA, colorB);
    const opacityScale: any = d3.scaleSqrt().domain([0, 1]).range([0.7, 0.05]);

    const render = (data: DataItem[]) => {
      if (data && d3Container.current) {
        const svg = d3.select(d3Container.current);

        // Bind D3 data
        const update = svg
          .style("background", background)
          .selectAll<SVGCircleElement, DataItem>("circle")
          .data(data, (d) => d.key);

        // Enter new D3 elements
        const enter = update
          .enter()
          .append("circle")
          .attr("cx", cx)
          .attr("cy", cy);

        // Update existing D3 elements

        update
          .merge(enter)
          .transition()
          .duration(updateInterval)
          .ease(d3.easeLinear)
          .attr("r", (d) => rScale(d.value))
          .style("fill", (d) => colorScale(d.value))
          .style("opacity", (d) => opacityScale(d.value));

        // Remove old D3 elements
        update
          .exit()
          .transition()
          .duration(updateInterval)
          .ease(d3.easeLinear)
          .style("opacity", 0)
          .remove();

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
          .style("fill", "lightgrey")
          .text(
            `Color Circles I \u2022 ${background}/${colorA}/${colorB} \u2022 ${new Date().toLocaleDateString()} \u2022 ${author}`
          );
      }
    };

    console.log("animate", animate);

    let s = { ...state };
    let lastKey = s.data.length;

    let interval = d3.interval((elapsed) => {
      if (animate) {
        s.data.push({ key: ++lastKey, value: Math.random() / 100 });
        s.data.forEach((item) => (item.value *= animateScale));
      }
      // clean up and sort data
      s.data.forEach((item, index, object) => {
        if (rScale(item.value) > r) {
          console.log(
            `removing item ${index} (value: ${item.value}, data length: ${s.data.length})`
          );
          object.splice(index, 1);
        }
      });

      s.data = s.data.sort((a, b) => b.value - a.value);
      console.log("s.data", s.data);

      render(s.data);
      if (!animate) {
        interval.stop();
      }
    }, updateInterval);
  }, [
    d3Container,
    width,
    height,
    background,
    colorA,
    colorB,
    data,
    updateInterval,
    animate,
    animateScale,
    author,
  ]);

  const handleOnChange = (event: any) => {
    const { name, value } = event.currentTarget;
    setState({ ...state, [name]: value });
    if (name === "circles") {
      //setData(undefined);
    }
  };

  const handleToggleAnimate = () => {
    setState({ ...state, animate: !animate });
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
        width={zoom ? (1920 / 3) * 1.8 : undefined}
        height={zoom ? (1080 / 3) * 1.8 : undefined}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMinYMin meet"
        ref={d3Container}
      />

      <div className="d-flex justify-content-end mt-2">
        <Button
          variant="primary"
          className="mr-2"
          onClick={handleToggleAnimate}
        >
          {animate ? <FaPause /> : <FaPlay />}
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
                onChange={handleOnChange}
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
                onChange={handleOnChange}
                colors={palette.b}
              />
              <Form.Text>2nd color of the circles.</Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col>
            <Form.Group>
              <Form.Label>Animate Scale</Form.Label>
              <Form.Control
                type="number"
                name="animateScale"
                value={animateScale}
                onChange={handleOnChange}
              ></Form.Control>
              <Form.Text>Scale per step in animations.</Form.Text>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group>
              <Form.Label>Update Interval</Form.Label>
              <Form.Control
                type="number"
                name="updateInterval"
                value={updateInterval}
                disabled={animate ? true : false}
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
export default CirclesAnimation;
