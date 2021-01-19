import React, { useState, useRef, useEffect } from "react"
import { Button } from "react-bootstrap"
import * as d3 from "d3"

import CryptoWorldAgent from "../cryptoworld/CryptoWorldAgent"

const CryptoWorldComponent = (props: { agent: CryptoWorldAgent, width: number, height: number }) => {
    const [state, setState] = useState(props)
    const {agent, width, height} = state

    const [environment, setEnvironment] = useState(agent.environment)
    const svgRef = useRef<SVGSVGElement | null>(null)

    const colors = {
        background: "#1e1e1e",
        text: "white",
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
        agent.train(2000)
    }

    const handleReset = (event: React.MouseEvent) => {
        event.preventDefault()
        let state = environment.reset()
        //setEnvironment({...environment, positions: state.positions})
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
        const { width, height } = state

        if(svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg
                .style("background", colors.background)
                .style("opacity", 0.9)

            const pricesAll = svg.selectAll<SVGTextElement, { day: number, date: string, eur: number, btc: number, eurValue: number }>(".prices")
                .data(environment.historicalData, d => d.Date)

            const pricesEnter = pricesAll.enter()
                .append("text")
                .attr("class", "prices")
                .attr("transform", (d, i) => "translate(" + (width - 140) + " " + (10 + i * 0.9 * height / 62) +")")
                .style("text-anchor", "end")
                .style("fill", colors.text)
                .style("font-size", "5px")
                .style("font-family", "monospace")
                .style("font-weight", 400)
                    
            pricesAll.merge(pricesEnter).text(d => parseFloat(d.Open).toFixed(2))


            const positionsAll = svg.selectAll<SVGTextElement, { day: number, date: string, eur: number, btc: number, eurValue: number }>(".positions")
                .data(agent.history, d => parseInt(d.day))

            const positionsEnter = positionsAll.enter()
                .append("text")
                .attr("class", "positions")
                .attr("transform", (d, i) => "translate(" + (width - 15) + " " + (10 + i * 0.9 * height / 62) +")")
                .style("text-anchor", "end")
                .style("fill", colors.text)
                .style("font-size", "5px")
                .style("font-family", "monospace")
                .style("font-weight", 400)

            positionsEnter.append("tspan").attr("class", "eur-position").attr("x", -80)
            positionsEnter.append("tspan").attr("class", "btc-position").attr("x", -40)
            positionsEnter.append("tspan").attr("class", "eur-value").attr("x", 0)
                    
            positionsAll.merge(positionsEnter).select(".eur-position").text(d => d.eur.toFixed(2))
            positionsAll.merge(positionsEnter).select(".btc-position").text(d => d.btc.toFixed(5))
            positionsAll.merge(positionsEnter).select(".eur-value").text(d => d.eurValue.toFixed(2))

            const title = "Crypto World Q-Learning - 19-Jan-2021 - thmf@me.com"
            const titleAll = svg.selectAll<SVGTextElement, number>(".title")
                .data([title])

            const titleEnter = titleAll.enter()
                .append("text")
                .attr("class", "title")
                .attr("transform", "translate(" + (width - 15) + " " + (height - 8) + ")")
                .style("text-anchor", "end")
                .style("fill", colors.text)
                .style("font-size", "11px")
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
            />
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
                onClick={handleReset}
            >Reset</Button>
            <Button
                variant="secondary"
                className="ml-2 mt-2"
                onClick={handleSaveModel}
            >Save</Button>
        </>
    );
};

export default CryptoWorldComponent;