import React, { useState, useRef, useEffect } from "react";
import * as d3 from "d3";

import { useEnvironment } from "./context/GridWorldEnvironment";

const GridWorldDisplay = (props: { width: number, height: number }) => {
    const { size, positions, getReward } = useEnvironment()!;
    //const positions = [[0,3], [0,0], [0,1], [1,1]];

    const [state, setState] = useState(props);

    const { width, height } = state;
    const svgRef = useRef<SVGSVGElement | null>(null);

    const colors = {
        background: "lightgrey",
        agent: "magenta",
        goal: "yellow",
        pit: "cyan",
        wall: "black"
    }

    useEffect(() => {
        const {width, height} = state;
        const stepX = width / size;
        const stepY = height / size;
        const codes = ["A", "+", "-", "W"];

        console.log("Display:", size, positions);

        if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.style("background", colors.background).style("opacity", 0.9);
            
            const positionsAll = svg.selectAll<SVGGElement, number[][]>("g")
                .data(positions);
                
            const positionsEnter = positionsAll.enter()
                .append("g")
                .attr("class", (_, i) => ("position " + codes[i]))
                
            positionsEnter
                .append("rect")
                .attr("width", stepX)
                .attr("height", stepY)
                .style("fill", (_, i) => {
                    switch(codes[i]) {
                        case "A": return colors.agent;
                        case "+": return colors.goal;
                        case "-": return colors.pit;
                        case "W": return colors.wall;
                        default: return "grey"
                    }
                })
                .style("opacity", (_, i) => {
                    switch(codes[i]) {
                        case "A": return 0.95;
                        case "+": return 0.7;
                        case "-": return 0.7;
                        case "W": return 0.7;
                        default: return 0.5
                    }
                })

            positionsEnter
                .append("text")
                .attr("x", stepX / 2)
                .attr("y", stepY / 2 + 5)
                .attr("text-anchor", "middle")
                .text((_, i) => codes[i])
                .style("fill", "white")

            positionsAll.merge(positionsEnter)
                .attr("transform", d => "translate(" + d[1] * stepX + " " + d[0] * stepY + ")")

            positionsAll.exit()
                .remove();

            const reward = svg.selectAll<SVGTextElement, number>(".reward")
                .data([getReward()])

            const rewardEnter = reward.enter()
                .append("text")
                .attr("class", "reward")
                .attr("transform", "translate(" + (4 * stepY - 10) + " 20)")
                .attr("text-anchor", "end");
                
            reward.merge(rewardEnter).text(d => { return "reward: " + d; });
        }
    }, [svgRef, size, positions]);

    return (
        <svg
            className="grid-world-environment"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMinYMin meet"
            ref={svgRef}
    />
    );
};

export default GridWorldDisplay;