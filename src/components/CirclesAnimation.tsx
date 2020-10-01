// eslint-disable-next-line
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
  margin: { top: number; right: number; bottom: number; left: number };
  palette: {
    background: string[];
    inner: string[];
    outer: string[];
    label: string[];
  };
  colorBackground: string;
  colorInner: string;
  colorOuter: string;
  opacityInner: number;
  opacityOuter: number;
  data: DataItem[];
  animate: boolean;
  animateScale: number;
  animateInterval: number;
  animateIntervalId?: NodeJS.Timeout | null;
  label?: string;
  labelColor?: string;
}) => {
  const [state, setState] = useState(props);
  const [zoom, setZoom] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const {
    width,
    height,
    palette,
    colorBackground,
    colorInner,
    colorOuter,
    opacityInner,
    opacityOuter,
    data,
    animate,
    animateScale,
    animateInterval,
    animateIntervalId,
    label,
    labelColor,
  } = state;

  useEffect(() => {
    const {
      width,
      height,
      margin,
      palette,
      colorBackground,
      colorInner,
      colorOuter,
      opacityInner,
      opacityOuter,
      data,
      animateInterval,
      label,
      labelColor,
    } = state;

    const cx = (width - margin.left) / 2;
    const cy = (height - margin.bottom) / 2;
    const r = (height - margin.top - margin.bottom) / 2;

    const randomColor = (palette: string[]) => {
      let i = Math.round(((Math.random() * 100) / 100) * palette.length);
      return palette[i];
    };

    const rScale: any = d3.scaleLinear().domain([0, 1]).range([0, r]);
    const colorScale: any = d3.interpolateHsl(
      colorInner === "random" ? randomColor(palette.inner) : colorInner,
      colorOuter === "random" ? randomColor(palette.outer) : colorOuter
    );
    const opacityScale: any = d3
      .scaleLinear()
      .domain([0, 1])
      .range([opacityInner, opacityOuter]);

    const prepareData = (data: DataItem[]) => {
      // clean up and sort data
      const limit = Math.sqrt(width * width + height * height);
      data.forEach((item: DataItem, index: number, object: any) => {
        if (rScale(item.value) > limit) {
          object.splice(index, 1);
        }
      });
      return data.sort((a: DataItem, b: DataItem) => b.value - a.value);
    };

    if (data && svgRef.current) {
      const svg = d3.select(svgRef.current);

      svg
        .transition()
        .duration(animateInterval)
        .style(
          "background",
          colorBackground === "random"
            ? randomColor(palette.background)
            : colorBackground
        );

      // Bind D3 data
      const update = svg
        .selectAll<SVGCircleElement, DataItem>("circle")
        .data(prepareData(data), (d) => d.key);

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
        .duration(animateInterval)
        .ease(d3.easeLinear)
        .attr("r", (d) => rScale(d.value))
        .style("fill", (d) => colorScale(d.value))
        .style("opacity", (d) => opacityScale(d.value));

      // Remove old D3 elements
      update
        .exit()
        .transition()
        .duration(animateInterval)
        .ease(d3.easeLinear)
        .style("opacity", 0)
        .remove();

      svg
        .selectAll(".label")
        .data([0])
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", width - 20)
        .attr("y", height - 20)
        .attr("text-anchor", "end")
        .style("font-family", "Work Sans")
        .style("font-size", "11pt")
        .style("opacity", 0.9);

      svg
        .selectAll(".label")
        .style("fill", labelColor || "grey")
        .text(
          `Circles Animation \u2022 ${colorBackground}-${colorInner}-${colorOuter} \u2022 ${new Date().toLocaleDateString()} \u2022 ${label}`
        );
    }
    // Ensure interval ist cleared on unmount
    // if (animateIntervalId) return clearInterval(animateIntervalId);
  }, [state, svgRef]);

  const handleOnChange = (event: any) => {
    if (animateIntervalId) clearInterval(animateIntervalId);
    const { name, value } = event.currentTarget;
    setState({
      ...state,
      [name]: value,
      animate: false,
      animateIntervalId: null,
    });
  };

  const handleToggleAnimate = () => {
    if (!animate && !animateIntervalId) {
      const nextNumber = () => {
        let min = d3.min(data, (d) => d.value) || 1;

        let n = Math.random();
        while (n > min || n < 0.001) {
          n = Math.random();
        }
        return n;
      };

      const maxKey = 100000;
      let key = d3.max(data, (d) => d.key) || 0;
      key = key > maxKey ? key - maxKey : key;

      const id = setInterval(() => {
        data.push({ key: ++key, value: nextNumber() });
        data.forEach((item) => (item.value *= animateScale));
        setState({
          ...state,
          animate: true,
          animateIntervalId: id,
          data: data,
        });
      }, animateInterval);

      setState({
        ...state,
        animate: true,
        animateIntervalId: id,
      });
    }

    if (animate && animateIntervalId) {
      clearInterval(animateIntervalId);
      setState({ ...state, animate: false, animateIntervalId: null });
    }
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
        ref={svgRef}
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
              <Form.Label>Background color</Form.Label>
              <ColorControl
                name="colorBackground"
                value={colorBackground}
                onChange={handleOnChange}
                colors={palette.background.concat(["random"])}
              />
              <Form.Text>Background color.</Form.Text>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group>
              <Form.Label>Inner color</Form.Label>
              <ColorControl
                name="colorInner"
                value={colorInner}
                onChange={handleOnChange}
                colors={palette.inner.concat(["random"])}
              />
              <Form.Text>Inner color of the circles.</Form.Text>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group>
              <Form.Label>Outer color</Form.Label>
              <ColorControl
                name="colorOuter"
                value={colorOuter}
                onChange={handleOnChange}
                colors={palette.outer.concat(["random"])}
              />
              <Form.Text>Outer color of the circles.</Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col></Col>
          <Col>
            <Form.Group>
              <Form.Label>Inner opacity</Form.Label>
              <Form.Control
                type="number"
                step={0.01}
                name="opacityInner"
                value={opacityInner}
                onChange={handleOnChange}
              />
              <Form.Text>Inner opacity of the circles.</Form.Text>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group>
              <Form.Label>Outer opacity</Form.Label>
              <Form.Control
                type="number"
                step={0.01}
                name="opacityOuter"
                value={opacityOuter}
                onChange={handleOnChange}
              />
              <Form.Text>Outer opacity of the circles.</Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col></Col>
          <Col>
            <Form.Group>
              <Form.Label>Animate Scale</Form.Label>
              <Form.Control
                type="number"
                step={0.01}
                name="animateScale"
                value={animateScale}
                onChange={handleOnChange}
              ></Form.Control>
              <Form.Text>Scale per animation cycle.</Form.Text>
            </Form.Group>
          </Col>

          <Col>
            <Form.Group>
              <Form.Label>Animation Interval</Form.Label>
              <Form.Control
                type="number"
                step={100}
                name="animateInterval"
                value={animateInterval}
                onChange={handleOnChange}
              ></Form.Control>
              <Form.Text>The animation interval in milliseconds.</Form.Text>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col className="col-8">
            <Form.Group>
              <Form.Label>Label</Form.Label>
              <Form.Control
                type="text"
                name="label"
                value={label}
                onChange={handleOnChange}
              ></Form.Control>
              <Form.Text>Label of the animation.</Form.Text>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group>
              <Form.Label>Label Color</Form.Label>
              <ColorControl
                name="labelColor"
                value={labelColor}
                onChange={handleOnChange}
                colors={palette.label}
              />
              <Form.Text>Color of the label.</Form.Text>
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </Fragment>
  );
};
export default CirclesAnimation;
