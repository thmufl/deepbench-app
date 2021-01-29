import React, { useState, useRef, useEffect } from "react"
import { Button } from "react-bootstrap"
import * as d3 from "d3"

import { Position } from "../cryptoworld/CryptoWorldEnvironment"
import CryptoWorldAgent from "../cryptoworld/CryptoWorldAgent"

const CryptoWorldComponent = (props: { agent: CryptoWorldAgent, width: number, height: number }) => {
    const [state, setState] = useState(props)
    const {agent, width, height} = state

    const [environment, setEnvironment] = useState(agent.environment)
    const svgRef = useRef<SVGSVGElement | null>(null)

    const colors = {
        background: "#1e1e1e",
        text: "greenyellow",
        agent: "magenta",
        goal: "greenyellow",
        pit: "darkgrey", // "#008B8B", // dark cyan
        wall: "dimgrey"
    }

    const MODEL_URL = "localstorage://cryptoworld-model"

    environment.callbacks = {
        onAfterMakeStep: () => setEnvironment({...environment}),
    }

    const handleTrain = (event: React.MouseEvent) => {
        event.preventDefault()
        agent.train(1000)
    }

    const handlePredict = (event: React.MouseEvent) => {
        event.preventDefault()
        agent.predict()
        //setEnvironment({...environment, positions: state.positions})
    }

    const handleSaveModel = async (event: React.MouseEvent) => {
        event.preventDefault()
        let result = await agent.save(MODEL_URL)
        console.log(`Saved model: ${JSON.stringify(result)} to ${MODEL_URL}`)
    };

    const handleLoadModel = async (event: React.MouseEvent) => {
        event.preventDefault()
        await agent.load(MODEL_URL)
        console.log(`Loaded model ${MODEL_URL}`)
    };

    useEffect(() => {
        //if(!agent.environment.isDone()) return;
        //console.log("CryptoSavesComponent: useEffect()")
        const { width, height } = state
        const xScale: any = d3.scaleLinear().domain([0, agent.history.length-1]).range([0, width])
        const yScaleEur: any = d3.scaleLinear().domain([40000, 0]).range([0, height])

        const curveFactory = d3.curveStep
        const openLine = d3.line<Position>()
            .curve(curveFactory)
            .x(d => xScale(d.day))
            .y(d => yScaleEur(d.open))

        const eurLine = d3.line<Position>()
            .curve(curveFactory)
            .x(d => xScale(d.day))
            .y(d => yScaleEur(d.eur))

        const btcLine = d3.line<Position>()
            .curve(curveFactory)
            .x(d => xScale(d.day))
            .y(d => yScaleEur(d.btc * d.open))

        const valueLine = d3.line<Position>()
            .curve(curveFactory)
            .x(d => xScale(d.day))
            .y(d => yScaleEur(d.value))

        const transitionDuration = 20

        if(svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg
                .style("background", colors.background)
                .style("opacity", 0.9)

            svg.select(".open")
                .style("fill", "none")
                .style("stroke", "cyan")
                .style("stroke-width", 2)
                .style("opacity", 0.8)
                .attr("d", openLine(agent.history)!)

            // svg.select(".eur")
            //     .style("fill", "none")
            //     .style("stroke", "blue")
            //     .style("stroke-width", 2)
            //     .transition()
            //     .duration(transitionDuration)
            //     .attr("d", eurLine(agent.history)!)

            svg.select(".btc")
                .style("fill", "none")
                .style("stroke", "magenta")
                .style("stroke-width", 4)
                .style("opacity", 0.8)
                // .transition()
                // .duration(transitionDuration)
                .attr("d", btcLine(agent.history)!)

            svg.select(".value")
                .style("fill", "none")
                .style("stroke", "yellow")
                .style("stroke-width", 4)
                .style("opacity", 0.8)
                // .transition()
                // .duration(transitionDuration)
                .attr("d", valueLine(agent.history)!)

            // Text output
            /*
            const pricesAll = svg.selectAll<SVGTextElement, Position>(".prices")
                .data(environment.historicalData, d => d.Date)

            const pricesEnter = pricesAll.enter()
                .append("text")
                .attr("class", "prices")
                .attr("transform", (d, i) => "translate(" + (width - 150) + " " + (10 + i * 0.9 * height / (environment.historicalData.length + 1)) +")")
                .style("text-anchor", "end")
                .style("fill", colors.text)
                .style("font-size", "4px")
                .style("font-family", "monospace")
                .style("font-weight", 200)
                    
            pricesAll.merge(pricesEnter).text(d => d.Date + " " + parseFloat(d.Open).toFixed(2))

            const positionsAll = svg.selectAll<SVGTextElement, Position>(".positions")
                .data(agent.history, d => d.day)

            const positionsEnter = positionsAll.enter()
                .append("text")
                .attr("class", "positions")
                .attr("transform", (d, i) => "translate(" + (width - 15) + " " + (10 + i * 0.9 * height / (environment.historicalData.length + 1)) +")")
                .style("text-anchor", "end")
                .style("fill", colors.text)
                .style("font-size", "6px")
                .style("font-family", "monospace")
                .style("font-weight", 200)

            positionsEnter.append("tspan").attr("class", "eur").attr("x", -120)
            positionsEnter.append("tspan").attr("class", "btc").attr("x", -90)
            positionsEnter.append("tspan").attr("class", "value").attr("x", -60)
            positionsEnter.append("tspan").attr("class", "action-type").attr("x", -25)
            positionsEnter.append("tspan").attr("class", "action-amount").attr("x", 0)
                    
            positionsAll.merge(positionsEnter).select(".eur").text(d => d.eur.toFixed(2))
            positionsAll.merge(positionsEnter).select(".btc").text(d => d.btc.toFixed(5))
            positionsAll.merge(positionsEnter).select(".value").text(d => d.value.toFixed(2))
            positionsAll.merge(positionsEnter).select(".action-type").text(d => d.action.type)
            positionsAll.merge(positionsEnter).select(".action-amount").text(d => d.action.amount.toFixed(2))
        */

            const performance = agent.history.length > 0 ? ((agent.history.slice(-1)[0].value - agent.history[0].value) / agent.history[0].value).toFixed(4) : "0"
            const statisticsAll = svg.selectAll<SVGTextElement, number>(".statistics")
                .data(["episode: " + agent.currentEpisode + ", epsilon: " + agent.epsilon.toFixed(2) + ", performance: " + performance])

            const statisticsEnter = statisticsAll.enter()
                .append("text")
                .attr("class", "statistics")
                .attr("transform", "translate(" + (width - 15) + " " + 30 + ")")
                .style("text-anchor", "end")
                .style("fill", "white")
                .style("font-size", "20px")
                .style("font-family", "monospace")
                .style("font-weight", 600)
                    
            statisticsAll.merge(statisticsEnter).text(d => d)

            const title = "CryptoWorld Q-Learning - 29-Jan-2021 - thmf@me.com"
            const titleAll = svg.selectAll<SVGTextElement, number>(".title")
                .data([title])

            const titleEnter = titleAll.enter()
                .append("text")
                .attr("class", "title")
                .attr("transform", "translate(" + (width - 15) + " " + (height - 8) + ")")
                .style("text-anchor", "end")
                .style("fill", colors.text)
                .style("font-size", "8px")
                .style("font-family", "monospace")
                .style("font-weight", 600)
                    
            titleAll.merge(titleEnter).text(d => d)
        }
    }, [svgRef, environment, agent, colors]);

    return (
        <>
            <svg
                className="cryptoworld-component"
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMinYMin meet"
                ref={svgRef}
            >
                <path className="open"></path>
                <path className="value"></path>
                <path className="btc"></path>
                <path className="eur"></path>
            </svg>
            <br />
            <Button
                variant="secondary"
                className="ml-2 mt-2"
                onClick={handleLoadModel}
            >Load</Button>
            <Button
                variant="secondary"
                className="ml-2 mt-2"
                onClick={handleTrain}
            >Train</Button>
            <Button
                variant="secondary"
                className="ml-2 mt-2"
                onClick={handlePredict}
            >Predict</Button>
            <Button
                variant="secondary"
                className="ml-2 mt-2"
                onClick={handleSaveModel}
            >Save</Button>
        </>
    );
};

export default CryptoWorldComponent;