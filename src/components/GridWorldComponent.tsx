import React, { useState, useRef, useEffect } from "react"
import { Button } from "react-bootstrap"
import * as d3 from "d3"

import GridWorldAgent from "../gridworld/GridWorldAgent"

const GridWorldComponent = (props: {agent: GridWorldAgent, width: number, height: number}) => {
    const [state, setState] = useState(props)
    const {agent, width, height} = state

    const [environment, setEnvironment] = useState(agent.environment)
    const svgRef = useRef<SVGSVGElement | null>(null)

    const colors = {
        background: "lightgrey",
        agent: "magenta",
        goal: "yellow",
        pit: "cyan",
        wall: "dimgrey"
    }

    const MODEL_URL = "localstorage://gridworld-model";

    environment.callbacks = {
        //onGoal: () => setEnvironment({...environment}),
        //onAfterMakeStep: () => setEnvironment({...environment}),
        onAfterMakeStep: () => setEnvironment({...environment}),
        onReset: () => setEnvironment({...environment})
    }

    const handleTrain = (event: React.MouseEvent) => {
        event.preventDefault()
        agent.train(6000)
    }

    const handleReset = (event: React.MouseEvent) => {
        event.preventDefault()
        let state = environment.reset()
        setEnvironment({...environment, positions: state.positions})
    }

    const handlePlay = (event: React.MouseEvent) => {
        event.preventDefault()
        agent.play()
    }

    const handleSaveModel = async (event: React.MouseEvent) => {
        event.preventDefault()
        let result = await agent.save(MODEL_URL)
        console.log(`Saved model: ${JSON.stringify(result)}`)
    };

    const handleLoadModel = async (event: React.MouseEvent) => {
        event.preventDefault()
        await agent.load(MODEL_URL)
        console.log(`Loaded model ${MODEL_URL}`)
    };

    useEffect(() => {
        const {width, height} = state
        const stepX = width / environment.size
        const stepY = height / environment.size
        const codes = ["A", "+", "-", "W"]

        if(svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg
                .style("background", colors.background)
                .style("opacity", 0.9)
            
            const positionsAll = svg.selectAll<SVGGElement, number[][]>("g")
                .data([environment.positions.agent, environment.positions.goal, environment.positions.pit, environment.positions.wall])
                
            const positionsEnter = positionsAll.enter()
                .append("g")
                .attr("class", (_, i) => ("position " + codes[i]))
                
            positionsEnter
                .append("rect")
                .attr("width", stepX)
                .attr("height", stepY)
                .style("fill", (_, i) => {
                    switch(codes[i]) {
                        case "A": return colors.agent
                        case "+": return colors.goal
                        case "-": return colors.pit
                        case "W": return colors.wall
                        default: return "grey"
                    }
                })    
                .style("opacity", (_, i) => {
                    switch(codes[i]) {
                        case "A": return 0.9
                        case "-": return 0.7
                        case "W": return 0.7
                        default: return 0.7
                    }
                })

            positionsEnter
                .append("text")
                .attr("x", stepX / 2)
                .attr("y", stepY / 2 + 5)
                .attr("text-anchor", "middle")
                .text((_, i) => codes[i])
                .style("fill", "white")
                .style("font-family", "monospace")
                .style("font-size", "20px")
                .style("font-weight", 800)

            positionsAll.merge(positionsEnter)
                .attr("transform", d => "translate(" + d.y * stepX + " " + d.x * stepY + ")")                    
            
            positionsAll.exit()
                .remove()

            let last50 = environment.history.length - 50
            let pos = environment.history.filter((x, i) => i > last50 && x === 10).length
            let neg = environment.history.filter((x, i) => i > last50 && x === -10).length

            const stats = "pos/neg: " + (pos/neg).toFixed(3) + ", epsilon: " + agent.epsilon.toFixed(3)
            const statsAll = svg.selectAll<SVGTextElement, number>(".stats")
                .data([stats])

            const statsEnter = statsAll.enter()
                .append("text")
                .attr("class", "stats")
                .attr("transform", "translate(" + (4 * stepY - 260) + " 20)")
                .attr("text-anchor", "start")
                .style("font-size", "14px")
                .style("font-family", "monospace")
                .style("font-weight", 800)
                    
            statsAll.merge(statsEnter).text(d => d)
        }
    }, [svgRef, environment, agent, colors]);

    return (
        <>
            <svg
                className="gridworld-component"
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMinYMin meet"
                ref={svgRef}
            />
            <Button
                variant="secondary"
                className="ml-2"
                onClick={handleLoadModel}
            >Load</Button>
            <Button
                variant="secondary"
                className="ml-2"
                onClick={handleTrain}
            >Train</Button>
            <Button
                variant="secondary"
                className="ml-2"
                onClick={handlePlay}
            >Play</Button>
            <Button
                variant="secondary"
                className="ml-2"
                onClick={handleReset}
            >Reset</Button>
            <Button
                variant="secondary"
                className="ml-2"
                onClick={handleSaveModel}
            >Save</Button>
        </>
    );
};

export default GridWorldComponent;