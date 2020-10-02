// eslint-disable-next-line
import React, { useState, useEffect, useRef, Fragment } from "react";
import Button from "react-bootstrap/Button";

import * as d3 from "d3";
import { FaPause, FaPlay, FaExpand, FaCompress } from "react-icons/fa";

import { getRandom, getRandomInt } from "../services/RandomDataService";
import AnimationSettingsForm from "./commons/AnimationSettingsForm";

type DataItem = { key: number; value: number };

const ColorCircleAnimation = (props: {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  palette: {
    background: string[];
    a: string[];
    b: string[];
    label: string[];
  };
  colorBackground: string;
  colorInterpolator: any;
  colorA: string;
  colorB: string;
  opacityA: number;
  opacityB: number;
  data: DataItem[];
  animate: boolean;
  animateScale: number;
  animateInterval: number;
  animateIntervalId?: NodeJS.Timeout | null;
  label?: string;
  colorLabel?: string;
}) => {
  const [state, setState] = useState(props);
  const [zoom, setZoom] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const {
      width,
      height,
      margin,
      palette,
      colorBackground,
      colorInterpolator,
      colorA,
      colorB,
      opacityA,
      opacityB,
      data,
      animateInterval,
      label,
      colorLabel,
    } = state;

    const cx = margin.left + (width - margin.right - margin.left) / 2;
    const cy = margin.top + (height - margin.top - margin.bottom) / 2;
    const r = (height - margin.top - margin.bottom) / 2;

    const rScale: any = d3.scaleLinear().domain([0, 1]).range([0, r]);
    const colorScale: any = colorInterpolator(
      colorA === "random" ? palette.a[getRandomInt(palette.a.length)] : colorA,
      colorB === "random" ? palette.b[getRandomInt(palette.b.length)] : colorB
    );

    const opacityScale: any = d3
      .scaleLinear()
      .domain([0, 1])
      .range([opacityA, opacityB]);

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
            ? palette.background[getRandomInt(palette.background.length)]
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
        .style("fill", colorLabel || "darkgrey")
        .text(
          `Color Circle \u2022 ${colorBackground}-${colorA}-${colorB} \u2022 ${new Date().toLocaleDateString()} \u2022 ${label}`
        );
    }
    // Ensure interval ist cleared on unmount
    // if (animateIntervalId) return clearInterval(animateIntervalId);
  }, [state, svgRef]);

  const {
    width,
    height,
    palette,
    colorBackground,
    colorA,
    colorB,
    opacityA,
    opacityB,
    data,
    animate,
    animateScale,
    animateInterval,
    animateIntervalId,
    label,
    colorLabel,
  } = state;

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

  const handleResetData = () => {
    setState({ ...state, data: [] });
  };

  const handleToggleAnimate = () => {
    if (!animate && !animateIntervalId) {
      const maxKey = 100000;
      let key = d3.max(data, (d) => d.key) || 0;
      key = key > maxKey ? key - maxKey : key;

      const id = setInterval(() => {
        data.push({
          key: ++key,
          value: getRandom(d3.min(data, (d) => d.value) || 0.1),
        });
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
        <Button variant="primary" className="mr-2" onClick={handleResetData}>
          Reset
        </Button>
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

      <AnimationSettingsForm
        onChange={handleOnChange}
        palette={palette}
        colorBackground={colorBackground}
        colorA={colorA}
        colorB={colorB}
        opacityA={opacityA}
        opacityB={opacityB}
        animateScale={animateScale}
        animateInterval={animateInterval}
        label={label}
        colorLabel={colorLabel}
      />
    </Fragment>
  );
};
export default ColorCircleAnimation;
