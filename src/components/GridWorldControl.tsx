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

    const {width, height, modelCompileArgs, epochs, gamma } = props;
    let { epsilon } = props;

    const [world, setWorld] = useState(props.world);
    const [model, setModel] = useState(props.model);

    const [modelState, setModelState] = useState({ compiled: false, training: false });
    const directions = ["up", "down", "left", "right"];

    const move = (direction: string) => {
        let state = world.move(direction);
        setWorld({...world });
        return state;
    }

    const moveUp = (event: React.MouseEvent) => { event.preventDefault(); move("up");}
    const moveDown = (event: React.MouseEvent) => { event.preventDefault(); move("down"); }
    const moveLeft = (event: React.MouseEvent) => { event.preventDefault(); move("left"); }
    const moveRight = (event: React.MouseEvent) => { event.preventDefault(); move("right"); }

    const run = (event: React.MouseEvent) => {
        event.preventDefault();
        tf.tidy(() => {
            let steps = 0;
            const id = setInterval(() => {
                let state = tf.tensor3d(world.state()).reshape([1, 64]);
                let qval = model.predict(state) as tf.Tensor;
                let action = tf.argMax(qval.reshape([4])).dataSync()[0];
                console.log("action", directions[action]);
                world.move(directions[action]);
                let reward = world.calculateReward();
                setWorld({...world});
                steps++;
                qval.dispose();
                state.dispose();
                if(reward === 10 || reward === -10 || steps === 20)
                    clearInterval(id);
            }, 250);
        });
    };

    const compileModel = (event: React.MouseEvent) => {
        event.preventDefault();
        model.compile(modelCompileArgs);
        setModelState({...modelState, compiled: true });
        console.log(model.summary());
      };

    const trainModel = async (event: React.MouseEvent) => {
        console.log("Starting training model for " + epochs + " epochs." )
        setModelState({...modelState, training: true });

        let posCount = 0;
        let minCount = 0;
        const maxMoves = 128;

        let xs: any[] = [];
        let ys: any[] = [];

        for(let epoch = 0; epoch < epochs; epoch++) {   
            //console.log("***** start epoch: " + epoch + " *****")
            const startTime = Date.now();
            
            let status = 1;
            let moves = 0;

            world.init();
            setWorld({...world, positions: {...world.positions}, actions: {...[]}})
            //world.print();

            while(status === 1) {
                tf.tidy(() => {
                    if(moves % 5 === 0) setWorld({...world, positions: {...world.positions}, actions: {...world.actions}})

                    const state0 = tf.tensor3d(world.state()).reshape([1, 64])
                        .add(tf.randomNormal([64]).div(10));

                    const qval0 = model.predict(state0) as tf.Tensor;
                    
                    let action = null;
                    if(Math.random() < epsilon) {
                        action = Math.floor(Math.random() * 4);
                    } else {
                        action = tf.argMax(qval0.reshape([4])).dataSync()[0];
                    }
                    
                    const nextState = world.move(directions[action]);
                    const reward = world.calculateReward();
 
                    const state1 = tf.tensor3d(nextState).reshape([1, 64])
                        .add(tf.randomNormal([64]).div(10));

                    const qval1 = model.predict(state1) as tf.Tensor;
                    const maxQ = tf.max(qval1.reshape([4])).dataSync()[0];

                    const qval = qval0.reshape([4]).dataSync();
                    qval[action] = reward + gamma * maxQ;
                    
                    if(reward !== -1 || moves > maxMoves) { 
                        status = 0;
                        qval[action] = reward;
                        if(reward === 10) {
                            posCount++;
                        } else { 
                            minCount++;
                        }
                        //world.print();
                        setWorld({...world, positions: {...world.positions}, actions: {...world.actions}});
                    }
                    //qval[action] = 0.5 * qval[action];
                    xs.push(state0.dataSync());
                    ys.push(qval);
                    moves++;
                });
            }
            if(epsilon > 0.1) epsilon -= 1 / epochs;

            //console.log("queue length: " + xs.length);
            if(xs.length < 2048) {
                continue;
            } else {
                console.log("Training model on " + xs.length + " examples.");
                await model.fit(tf.tensor(xs), tf.tensor(ys), {
                    epochs: 100,
                    batchSize: 64,
                    shuffle: true
                }).then((info) => { 
                    console.log("Epoch: " + epoch +  
                    ", epsilon: " + epsilon.toFixed(2) + 
                    ", pos/min: " + (minCount !== 0 ? (posCount / minCount).toFixed(2) : 0) + 
                    ", acc: " + info.history.acc.slice(-1)[0] + 
                    ", ms/epoch: " + ((Date.now() - startTime)).toFixed(2));
                });
                xs = xs.slice(1024);
                ys = ys.slice(1024);
            }
        }
        setModelState({...modelState, training: false });
    }

    const stopTrainingModel = async (event: React.MouseEvent) => {
        event.preventDefault();
        model.stopTraining = true;
        setModelState({...modelState, training: false });
    };

    const saveModel = async (event: React.MouseEvent) => {
        event.preventDefault();
        let result = await model.save("localstorage://gridworld-model");
        console.log(`Saved model: ${JSON.stringify(result)}`);
    };

    const loadModel = async (event: React.MouseEvent) => {
        event.preventDefault();
        const name = "localstorage://gridworld-model";
        let model = (await tf.loadLayersModel(name)) as tf.Sequential;
        setModel(model);
        console.log(`Loaded model ${name}`);
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

            // Problem with {...} operators
            const positionsClean = [];
            positionsClean.push([world.positions[0][0], world.positions[0][1]]);
            positionsClean.push([world.positions[1][0], world.positions[1][1]]);
            positionsClean.push([world.positions[2][0], world.positions[2][1]]);
            positionsClean.push([world.positions[3][0], world.positions[3][1]]);
            // console.log("positionsClean:", positionsClean)

            const positions = svg.selectAll<SVGGElement, number[][]>("g")
                .data(positionsClean);
                
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
                        case "+": return 0.5;
                        case "-": return 0.5;
                        case "W": return 0.5;
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
                .data([world.calculateReward()])

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
        <div className="d-flex justify-content-start mt-2">
            <Button variant="secondary"
                    className="ml-2"
                    onClick={loadModel}
                    disabled={modelState.training}>Load</Button>

            <Button variant="secondary"
                    className="ml-2"
                    onClick={compileModel}
                    disabled={modelState.training}>Compile</Button>

            <Button variant="secondary"
                    className="ml-2"
                    onClick={trainModel}
                    disabled={!modelState.compiled || modelState.training}>Train </Button>

            <Button variant="secondary"
                    className="ml-2"
                    onClick={stopTrainingModel}
                    disabled={!modelState.training}>Stop</Button>

            <Button variant="secondary"
                    className="ml-2"
                    onClick={saveModel}
                    disabled={modelState.training}>Save</Button>

        </div>

        <div className="d-flex justify-content-start mt-2">
            <Button variant="secondary" className="ml-2" onClick={moveLeft} disabled={modelState.training}>Left</Button>
            <Button variant="secondary" className="ml-2" onClick={moveUp} disabled={modelState.training}>Up</Button>
            <Button variant="secondary" className="ml-2"onClick={moveDown} disabled={modelState.training}>Down</Button>
            <Button variant="secondary" className="ml-2" onClick={moveRight} disabled={modelState.training}>Right</Button>
            <Button variant="secondary" className="ml-2" onClick={run} disabled={modelState.training}>Run</Button>
        </div>
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
        goal: "blue"
    },
    world: new GridWorld(4, "player"),
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
        optimizer: "adam", // tf.train.adam(0.001),
        loss: "meanSquaredError",
        metrics: ["mse", "acc"],
        batchSize: 128
    },
    epochs: 1000,
  };

export default GridWorldControl;
