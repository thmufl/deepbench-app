import React, { useState, useRef, useEffect } from "react"
import { Button } from "react-bootstrap"
import * as d3 from "d3"


import Position from "../cryptosaves/CryptoSavesEnvironment"
import CryptoSavesAgent from "../cryptosaves/CryptoSavesAgent"

const CryptoSavesComponent = (props: { agent: CryptoSavesAgent, width: number, height: number }) => {
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

    const MODEL_URL = "localstorage://cryptosaves-model"

    environment.callbacks = {
        onAfterMakeStep: () => setEnvironment({...environment}),
    }

    const handleTrain = (event: React.MouseEvent) => {
        event.preventDefault()
        agent.train(2000)
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
        //console.log("CryptoSavesComponent: useEffect()")
        const { width, height } = state

        if(svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg
                .style("background", colors.background)
                .style("opacity", 0.9)

            const pricesAll = svg.selectAll<SVGTextElement, Position>(".prices")
                .data(environment.historicalData, d => d.Date)

            const pricesEnter = pricesAll.enter()
                .append("text")
                .attr("class", "prices")
                .attr("transform", (d, i) => "translate(" + (width - 170) + " " + (10 + i * 0.9 * height / (environment.historicalData.length + 1)) +")")
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
                .style("font-size", "4px")
                .style("font-family", "monospace")
                .style("font-weight", 200)

            positionsEnter.append("tspan").attr("class", "eur").attr("x", -115)
            positionsEnter.append("tspan").attr("class", "btc").attr("x", -90)
            positionsEnter.append("tspan").attr("class", "saves").attr("x", -65)
            positionsEnter.append("tspan").attr("class", "value").attr("x", -40)
            positionsEnter.append("tspan").attr("class", "action-type").attr("x", -15)
            positionsEnter.append("tspan").attr("class", "action-amount").attr("x", 0)
                    
            positionsAll.merge(positionsEnter).select(".eur").text(d => d.eur.toFixed(2))
            positionsAll.merge(positionsEnter).select(".btc").text(d => d.btc.toFixed(5))
            positionsAll.merge(positionsEnter).select(".saves").text(d => d.saves.toFixed(2))
            positionsAll.merge(positionsEnter).select(".value").text(d => d.value.toFixed(2))
            positionsAll.merge(positionsEnter).select(".action-type").text(d => d.action.type)
            positionsAll.merge(positionsEnter).select(".action-amount").text(d => d.action.amount.toFixed(2))

            const title = "Crypto Saves Q-Learning - 25-Jan-2021 - thmf@me.com"
            const titleAll = svg.selectAll<SVGTextElement, number>(".title")
                .data([title])

            const titleEnter = titleAll.enter()
                .append("text")
                .attr("class", "title")
                .attr("transform", "translate(" + (width - 15) + " " + (height - 8) + ")")
                .style("text-anchor", "end")
                .style("fill", colors.text)
                .style("font-size", "4px")
                .style("font-family", "monospace")
                .style("font-weight", 600)
                    
            titleAll.merge(titleEnter).text(d => d)
        }
    }, [svgRef, environment, agent, colors]);

    return (
        <>
            <svg
                className="cryptosaves-component"
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

export default CryptoSavesComponent;