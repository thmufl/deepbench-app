import GridWorldEnvironment from "./GridWorldEnvironment"

import * as tf from "@tensorflow/tfjs"

class GridWorldAgent {

    static DEFAULT_MODEL = tf.sequential({
        layers: [
            tf.layers.dense({ inputShape: [64], units: 200, useBias: false, activation: "relu" }),
            tf.layers.dense({ units: 200, useBias: false, activation: "relu" }),
            tf.layers.dense({ units: 150, useBias: false, activation: "relu" }),
            tf.layers.dense({ units: 50, useBias: false, activation: "relu" }),
            tf.layers.dense({ units: 4, useBias: false, activation: "softmax" }),
        ],
    })

    // static DEFAULT_MODEL = tf.sequential({
    //     layers: [
    //         tf.layers.conv2d({inputShape: [4,4,4], filters: 128, kernelSize: 3, activation: "relu" }),
    //         tf.layers.conv2d({filters: 128, kernelSize: 3, activation: "relu" }),
    //         tf.layers.dense({ units: 100, useBias: false, activation: "relu" }),
    //         tf.layers.dropout({ rate: 0.1 }),
    //         tf.layers.dense({ units: 50, useBias: false, activation: "relu" }),
    //         tf.layers.dense({ units: 4, useBias: false, activation: "selu" }),
    //     ],
    // })

    static DEFAULT_MODEL_COMPILE_ARGS: tf.ModelCompileArgs = {
        optimizer: tf.train.adam(5e-5), // tf.train.adam(5e-4), //tf.train.adam(5e-6), // tf.train.adam(1e-4), // "adam"
        loss: "meanSquaredError",
        metrics: ["mse"],
    }

    environment: GridWorldEnvironment
    model: tf.Sequential
    modelCompileArgs: tf.ModelCompileArgs
    numGames: number
    gamma: number
    epsilon: number
    maxSteps: number
    replayMemory: { xs: number[][], ys: number[][] }

    THETA_URL = "localstorage://gridworld-model-theta"
    static DIRECTIONS = ["up", "down", "left", "right"]

    constructor(
        environment: GridWorldEnvironment,
        numGames?: number,
        gamma?: number,
        maxSteps?: number,
        model?: tf.Sequential,
        modelCompileArgs?: tf.ModelCompileArgs) {
        this.environment = environment
        this.numGames = numGames || 1000
        this.gamma = gamma || 0.9
        this.epsilon = 1.0
        this.maxSteps = maxSteps || 50
        this.model = model || GridWorldAgent.DEFAULT_MODEL
        this.modelCompileArgs = modelCompileArgs || GridWorldAgent.DEFAULT_MODEL_COMPILE_ARGS
        this.model.compile(this.modelCompileArgs)
        this.replayMemory = { xs: Array<number[]>(), ys: Array<number[]>() }
    }

    train = async(numGames: number) => {
        console.log(`Training model for ${numGames} games. Model summary:`)
        this.model.summary()
        const startTime = Date.now()
        await this.model.save(this.THETA_URL)
        const theta = await tf.loadLayersModel(this.THETA_URL) as tf.Sequential

        this.epsilon = 1.0
        const trace = false

        for(let game = 0; game < numGames; game++) { 

            let status = 1
            let step = 0
            let xs: number[]
            let ys: number[]
            let trainingData = { xs: Array<number[]>(), ys: Array<number[]>() }
                        
            while(status === 1 && step < this.maxSteps) {
                tf.tidy(() => {
                    if(step % 4 === 0) {
                        theta.setWeights(this.model.getWeights(true).map(w => w.clone()))
                    }

                    const state0 = tf.tensor3d(this.environment.getState()).reshape([1, 64]).add(tf.randomNormal([64]).div(100))

                    let action: number
                    const prediction0 = (theta.predict(state0) as tf.Tensor).reshape([4])
                    if(Math.random() < this.epsilon) {
                        action = (Math.floor(Math.random() * 4))
                    } else {
                        action = prediction0.argMax().dataSync()[0]
                    }

                    if(trace && game % 10 === 0) {
                        console.log("\n\nprediction0 (action=" + GridWorldAgent.DIRECTIONS[action] + ")")
                        this.environment.print()
                        prediction0.print()
                    }

                    const {state, reward} = this.environment.makeStep(GridWorldAgent.DIRECTIONS[action])
                    const state1 = tf.tensor(state).reshape([1, 64]).add(tf.randomNormal([64]).div(100))

                    const prediction1 = (theta.predict(state1) as tf.Tensor).reshape([4])
                    const maxQ = tf.max(prediction1).dataSync()[0]
                    
                    const qval = prediction0.arraySync() as number[]
                    qval[action] = reward + this.gamma * maxQ

                    if(trace && game % 10 === 0) {
                        console.log("prediction1 (reward=" + reward + ", maxQ=" + maxQ + ")" )
                        this.environment.print()
                        prediction1.print()
                    }
                  
                    if(reward !== -1) {
                        qval[action] = reward
                        status = 0
                    }

                    xs = state0.reshape([64]).arraySync() as number[]
                    ys = tf.tensor(qval).reshape([4]).arraySync() as number[]

                    if(this.replayMemory.xs.length > 50) {
                        this.replayMemory.xs.splice(0, 1)
                        this.replayMemory.ys.splice(0, 1)
                    }
                    this.replayMemory.xs.push(xs)
                    this.replayMemory.ys.push(ys)

                    trainingData.xs = []
                    trainingData.ys = []
                    for(let i = 0; i < 3; i++) {
                        let j = (Math.floor(Math.random() * this.replayMemory.xs.length))
                        trainingData.xs.push(this.replayMemory.xs[j])
                        trainingData.ys.push(this.replayMemory.ys[j])
                    }

                    trainingData.xs.push(xs)
                    trainingData.ys.push(ys)

                    state0.dispose()
                    prediction0.dispose()
                    state1.dispose()
                    prediction1.dispose()
                })

                let x = tf.tensor(trainingData.xs)
                let y = tf.tensor(trainingData.ys)

                await this.model.trainOnBatch(x, y).then((info) => {
                    if(game % 10 === 0 && step === 0) {
                        let last50 = this.environment.history.length - 50
                        let pos = this.environment.history.filter((x, i) => i > last50 && x === 10).length
                        let neg = this.environment.history.filter((x, i) => i > last50 && x === -10).length

                        console.log(
                            "Game: " + game + 
                            ", pos/neg: " + (neg !== 0 ? (pos / neg).toFixed(3) : pos) +
                            ", epsilon: " + this.epsilon.toFixed(3) +
                            ", loss: " + (info as number[])[0].toFixed(4) + //JSON.stringify(info) +
                            ", tensors: " + tf.memory().numTensors +
                            //", shapes: " + x.shape + ", " + y.shape +
                            ", ms/game: " + (((Date.now() - startTime)) / game).toFixed(2))

                        //console.log("xs:", trainingData.xs.arraySync(), "\nys:", trainingData.ys.arraySync())
                    }
                });
                step++
                x.dispose()
                y.dispose()
            }
            if(this.epsilon > 0.1) this.epsilon -= 1 / numGames;
            this.environment.reset();
        }
        console.log("Training done. " + numGames + " games in " + ((Date.now() - startTime) / 1000 / 60).toFixed(2) + " minutes.")
    }

    save = async(url: string) => {
        return await this.model.save(url)
    }

    load = async(url: string) => {
        this.model = (await tf.loadLayersModel(url)) as tf.Sequential
        this.model.compile(this.modelCompileArgs)
    }

    play = () => {
        tf.tidy(() => {
            let step = 0;
            const id = setInterval(() => {
                let state = tf.tensor3d(this.environment.getState()).reshape([1, 64]);
                let qval = this.model.predict(state) as tf.Tensor;
                let action = tf.argMax(qval.reshape([4])).dataSync()[0];
                console.log(step + ": " + GridWorldAgent.DIRECTIONS[action]);
                this.environment.makeStep(GridWorldAgent.DIRECTIONS[action]);

                let reward = this.environment.getReward();
                step++;
                if(reward === 10 || reward === -10 || step >= 10) {
                    clearInterval(id);
                    console.log(reward === 10 ? "WON" : "LOST");
                    return;
                }
            }, 600);
        });
    };
}

export default GridWorldAgent