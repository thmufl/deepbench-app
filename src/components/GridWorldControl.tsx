import React, { useState, useEffect, useRef, Fragment } from "react";
import Button from "react-bootstrap/Button";

import * as d3 from "d3";
import * as tf from "@tensorflow/tfjs";

import GridWorld from "../gym/GridWorld";

const GridWorldControl = (props: {
    width: number,
    height: number,
    colors: {
        background: string;
        player: string;
        goal: string;
        pit: string;
        wall: string;
    },
    world: GridWorld,
    model: tf.Sequential,
    modelCompileArgs: tf.ModelCompileArgs,
    epochs: number,
    gamma: number,
    epsilon: number
}) => {

    const {width, height, modelCompileArgs, epochs, gamma, epsilon } = props;
    const [world, setWorld] = useState(props.world);
    const [model, setModel] = useState(props.model);

    const [modelState, setModelState] = useState({ compiled: false, training: false });
    const directions = ["up", "down", "left", "right"];

    const move = (direction: string) => {
        let reward = world.move(direction);
        setWorld({...world, reward});
        return reward;
    }

    const handleMoveUp = (event: React.MouseEvent) => move("up");
    const handleMoveDown = (event: React.MouseEvent) => move("down");
    const handleMoveLeft = (event: React.MouseEvent) => move("left");
    const handleMoveRight = (event: React.MouseEvent) => move("right");

    const compileModel = (event: React.MouseEvent) => {
        event.preventDefault();
        model.compile(modelCompileArgs);
        setModelState({...modelState, compiled: true });
        console.log(model.summary());
      };
    
    const saveModel = async (event: React.MouseEvent) => {
        event.preventDefault();
        let result = await model.save("localstorage://gridworld-model");
        console.log(`Saved model: ${JSON.stringify(result)}`);
    };

    const loadModel = async (event: React.MouseEvent) => {
        event.preventDefault();
        const name = "localstorage://gridworld-model";
        let m = (await tf.loadLayersModel(name)) as tf.Sequential;
        //setState({ ...state, model: m });
        console.log(`Loaded model ${name}`);
    };

    const startTrainingModel = async (event: React.MouseEvent) => {
        console.log("start training model for " + epochs + " epochs." )
        setModelState({...modelState, training: true });
        for(let i = 0; i < epochs; i++) {
            setWorld(new GridWorld(world.size, world.mode));
            tf.tidy(() => {
                let state = tf.tensor3d(world.state()).reshape([1, 64]);
                let status = 1;
                while(status === 1) {
                    let qval = model.predict(state) as tf.Tensor;
                    let action = null;
                    if(Math.random() < epsilon) {
                        action = Math.floor(Math.random() * 4);
                    } else {
                        action = tf.argMax(qval).dataSync()[0];
                    }
                    let reward = move(directions[action]);
                    if(reward !== -1) { 
                        status = 0;
                    }
                    qval.dispose();
                }
                state.dispose();
            });
            if(i % 50 === 0) console.log("epoch: " + i + ", state: ", world.state());
        }

        setModelState({...modelState, training: false });
    }

    const stopTrainingModel = async (event: React.MouseEvent) => {
        event.preventDefault();
        model.stopTraining = true;
        setModelState({...modelState, training: false });
    };

    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        //console.log("effect (data)", world.data)
        const { width, height, colors } = props;

        const stepX = width / world.size;
        const stepY = height / world.size;
        const codes = ["P", "+", "-", "W"];

        if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            svg.style("background", colors.background);

            const positions = svg.selectAll<SVGGElement, number[][]>("g")
                .data(world.positions);
                
            const positionsEnter = positions.enter()
                .append("g")
                .attr("class", (_, i) => ("position " + codes[i]))
                
            positionsEnter
                .append("rect")
                .attr("width", stepX)
                .attr("height", stepY)
                .style("fill", (_, i) => {
                    switch(codes[i]) {
                        case "P": return colors.player;
                        case "+": return colors.goal;
                        case "-": return colors.pit;
                        case "W": return colors.wall;
                        default: return "grey"
                    }
                })
                .style("opacity", (_, i) => {
                    switch(codes[i]) {
                        case "P": return 1.0;
                        case "+": return 0.7;
                        case "-": return 0.7;
                        case "W": return 1.0;
                        default: return "grey"
                    }
                })

            positionsEnter
                .append("text")
                .attr("x", stepX / 2)
                .attr("y", stepY / 2 + 5)
                .attr("text-anchor", "middle")
                .text((_, i) => codes[i])
                .style("fill", "white")

            positions.merge(positionsEnter)
                .attr("transform", d => "translate(" + d[1] * stepX + " " + d[0] * stepY + ")")

            positions.exit()
                .transition()
                .style("opacity", 0)
                .remove();

            const reward = svg.selectAll<SVGTextElement, number[]>(".reward")
                .data([world.reward])

            const rewardEnter = reward.enter()
                .append("text")
                .attr("class", "reward")
                .attr("transform", "translate(10 20)");
                
            reward.merge(rewardEnter).text(d => { return "reward: " + d; });
        }
    }, [svgRef, world, props]);

    return (
        <Fragment>
            <svg
            className="d3-component"
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMinYMin meet"
            ref={svgRef}
        />
        <div className="d-flex justify-content-start mt-2"></div>
            <Button variant="secondary"
                    className="ml-2"
                    onClick={compileModel}
                    disabled={modelState.training}>Compile Model</Button>

            <Button variant="secondary"
                    className="ml-2"
                    onClick={startTrainingModel}
                    disabled={!modelState.compiled || modelState.training}>Start Training Model</Button>

            <Button variant="secondary"
                    className="ml-2"
                    onClick={stopTrainingModel}
                    disabled={!modelState.training}>Stop Training Model</Button>

            <Button variant="secondary"
                    className="ml-2"
                    onClick={saveModel}
                    disabled={modelState.training}>Save Model</Button>

        <br/>
        <Button onClick={handleMoveUp}>MoveUp</Button>
        <Button onClick={handleMoveDown}>MoveDown</Button>
        <Button onClick={handleMoveLeft}>MoveLeft</Button>
        <Button onClick={handleMoveRight}>MoveRight</Button>
        </Fragment>
    )
}

GridWorldControl.defaultProps = {
    width: 540,
    height: 540,
    size: 4,
    colors: {
        background: "lightgrey",
        player: "purple",
        wall: "black",
        pit: "red",
        goal: "green"
    },
    world: new GridWorld(4, "static"),
    model: tf.sequential({
        layers: [
            tf.layers.dense({
                inputShape: [64],
                units: 64,
                activation: "relu",
            }),
            tf.layers.dense({ units: 150, activation: "relu" }),
            tf.layers.dense({ units: 100, activation: "relu" }),
            tf.layers.dense({ units: 4, activation: "relu" }),
        ],
    }),
    gamma: 0.9,
    epsilon: 1.0,
    modelCompileArgs: {
        optimizer: tf.train.adam(0.001),
        loss: "meanSquaredError",
        metrics: ["mse", "acc"],
    },
    epochs: 1000,
  };

export default GridWorldControl;
