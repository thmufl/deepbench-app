import GridWorldEnvironment, { Position } from "./GridWorldEnvironment"
import * as tf from "@tensorflow/tfjs"

class GridWorldAgent {

    // static DEFAULT_MODEL = tf.sequential({
    //     layers: [
    //         tf.layers.dense({ inputShape: [96], units: 200, activation: "relu" }),
    //         tf.layers.batchNormalization(),
    //         tf.layers.dropout({rate: 0.2}),
    //         tf.layers.dense({ units: 200, activation: "relu" }),
    //         tf.layers.dropout({rate: 0.2}),
    //         tf.layers.dense({ units: 200, activation: "relu" }),
    //         tf.layers.dropout({rate: 0.2}),
    //         tf.layers.dense({ units: 100, activation: "relu" }),
    //         tf.layers.dropout({rate: 0.1}),
    //         tf.layers.dense({ units: 4, activation: "relu" }),
    //     ],
    // })

    static DEFAULT_MODEL = tf.sequential({
        layers: [
            tf.layers.conv2d({ inputShape: [6, 9, 2], filters: 128, kernelSize: [3, 3], strides: [2, 2], activation: "relu" }),
            tf.layers.batchNormalization(),
            tf.layers.conv2d({ filters: 64, kernelSize: [2, 2], strides: 1, activation: "relu" }),
            tf.layers.flatten(),
            tf.layers.dense({ units: 100, activation: "relu" }),
            tf.layers.dropout({ rate: 0.1 }),
            tf.layers.dense({ units: 50, activation: "relu" }),
            tf.layers.dropout({ rate: 0.1 }),
            tf.layers.dense({ units: 4, activation: "relu" }),
        ],
    })

    static DEFAULT_MODEL_COMPILE_ARGS: tf.ModelCompileArgs = {
        optimizer: tf.train.adam(1e-5),
        loss: "meanSquaredError",
        metrics: ["mse"],
    }

    environment: GridWorldEnvironment
    model: tf.Sequential
    modelCompileArgs: tf.ModelCompileArgs
    currentEpisode: number
    gamma: number
    epsilon: number
    maxSteps: number
    replayMemory: { xs: number[][][][], ys: number[][] }
    trace = false

    TARGET_URL = "localstorage://gridworld-model-target"
    static DIRECTIONS = ["up", "down", "left", "right"]

    constructor(
        environment: GridWorldEnvironment,
        gamma?: number,
        maxSteps?: number,
        model?: tf.Sequential,
        modelCompileArgs?: tf.ModelCompileArgs) {
        this.environment = environment
        this.currentEpisode = -1
        this.gamma = gamma || 0.9
        this.epsilon = 1.0
        this.maxSteps = maxSteps || 200
        this.model = model || GridWorldAgent.DEFAULT_MODEL
        this.modelCompileArgs = modelCompileArgs || GridWorldAgent.DEFAULT_MODEL_COMPILE_ARGS
        this.model.compile(this.modelCompileArgs)
        this.replayMemory = { xs: Array<number[][][]>(), ys: Array<number[]>() }
    }

    train = async(episodes: number) => {
        console.log(`Training model for ${episodes} episodes. Model summary:`)
        this.model.summary()
        const startTime = Date.now()
        await this.model.save(this.TARGET_URL)
        const targetModel = await tf.loadLayersModel(this.TARGET_URL) as tf.Sequential
        this.epsilon = 1.0

        for(let episode = 0; episode < episodes; episode++) { 
            this.currentEpisode = episode
            let status = 1
            let step = 0
            let xs: number[][][]
            let ys: number[]
            let trainingData = { xs: Array<number[][][]>(), ys: Array<number[]>() }
                        
            while(status === 1 && step < this.maxSteps) {
                tf.tidy(() => {
                    if(step % 7 === 0) {
                        targetModel.setWeights(this.model.getWeights().map(w => w.clone()))
                    }
                    const state0 = this.environment.getStateTensor() //.reshape([1, 96]).add(tf.randomNormal([96]).div(100))
                    let action: number
                    const prediction0 = (targetModel.predict(state0) as tf.Tensor).reshape([4])

                    if(Math.random() < this.epsilon) {
                        action = (Math.floor(Math.random() * 4))
                    } else {
                        action = prediction0.argMax(-1).dataSync()[0]
                    }

                    if(this.trace && episode % 10 === 0) {
                        console.log("\n\nprediction0 (action=" + GridWorldAgent.DIRECTIONS[action] + ")")
                        this.environment.print()
                        prediction0.print()
                    }

                    const {state, reward} = this.environment.makeStep(GridWorldAgent.DIRECTIONS[action])
                    const state1 = this.environment.getStateTensor()  //.reshape([1, 96]).add(tf.randomNormal([96]).div(100))
                    const prediction1 = (targetModel.predict(state1) as tf.Tensor).reshape([4])
                    const maxQ = tf.max(prediction1, -1).dataSync()[0]
                    
                    const qval = prediction0.arraySync() as number[]
                    qval[action] = reward + this.gamma * maxQ

                    if(this.trace && episode % 5 === 0) {
                        console.log("prediction1 (reward=" + reward + ", maxQ=" + maxQ + ")" )
                        this.environment.print()
                        prediction1.print()
                    }
                  
                    if(reward !== -1 && reward !== 5) {
                        qval[action] = reward
                        status = 0
                    }

                    xs = state0.reshape([6, 9, 2]).arraySync() as number[][][]
                    ys = tf.tensor(qval).reshape([4]).arraySync() as number[]

                    if(this.replayMemory.xs.length > 1000) {
                        this.replayMemory.xs.splice(0, 1)
                        this.replayMemory.ys.splice(0, 1)
                    }
                    this.replayMemory.xs.push(xs)
                    this.replayMemory.ys.push(ys)

                    if(this.replayMemory.xs.length > 200) {
                        trainingData.xs = new Array<number[][][]>()
                        trainingData.ys = new Array<number[]>()
                        for(let i = 0; i < 200; i++) {
                            let ri = (Math.floor(Math.random() * this.replayMemory.xs.length))
                            trainingData.xs.push(this.replayMemory.xs[ri])
                            trainingData.ys.push(this.replayMemory.ys[ri])
                        }

                        trainingData.xs.push(xs)
                        trainingData.ys.push(ys)

                        state0.dispose()
                        prediction0.dispose()
                        state1.dispose()
                        prediction1.dispose()
                    }
                })

                if(this.replayMemory.xs.length > 200) {
                    let x = tf.tensor(trainingData.xs)
                    let y = tf.tensor(trainingData.ys)

                    await this.model.trainOnBatch(x, y).then((info) => {
                        if(step % 10 === 0) this.environment.loss = (info as number[])[0]
                        if(episode % 10 === 0 && step === 0) {
                            let last200 = this.environment.history.length - 200
                            let pos = this.environment.history.filter((x, i) => i > last200 && x === 10).length
                            let neg = this.environment.history.filter((x, i) => i > last200 && x === -10).length

                            console.log(
                                "Episode: " + episode + 
                                ", pos/neg: " + (pos / neg || 1).toFixed(3) +
                                ", epsilon: " + this.epsilon.toFixed(3) +
                                ", loss: " + (info as number[])[0].toFixed(4) +
                                ", tensors: " + tf.memory().numTensors +
                                ", ms/episode: " + (((Date.now() - startTime)) / episode).toFixed(2))
                        }
                    });
                    x.dispose()
                    y.dispose()
                }
                step++
            }
            if(this.epsilon > 0.1) this.epsilon -= 1 / episodes
            this.environment.reset();
        }
        console.log(`Training done. ${episodes} episodes in ${((Date.now() - startTime) / 1000 / 60).toFixed(2)} minutes.`)
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
            let step = 0
            const id = setInterval(() => {
                let state = this.environment.getStateTensor()
                let qval = this.model.predict(state) as tf.Tensor
                let action = tf.argMax(qval.reshape([4])).dataSync()[0]
                console.log(step + ": " + GridWorldAgent.DIRECTIONS[action])
                this.environment.makeStep(GridWorldAgent.DIRECTIONS[action])
                let reward = this.environment.getReward()
                step++
                if(reward === 10 || reward === -10 || step >= 15) {
                    console.log(reward === 10 ? "WON" : "LOST")
                    clearInterval(id)
                    return
                }
            }, 250)
        });
    };

    loop = () => {
        this.epsilon = 0
        this.environment.history.splice(0)
        this.currentEpisode = 0
        const id = setInterval(() => {
            this.environment.reset()
            console.log(`Episode: ${this.currentEpisode}`)
            this.play()
            if(this.currentEpisode++ > 20) {
                clearInterval(id)
                return
            }
        }, 5000)
    }

    benchmark = () => {
        const iterations = 20000
        console.log(`Starting benchmark for ${iterations} iterations`)
        
        const start = Date.now()
        tf.tidy(() => {  
            for(let i = 0; i < iterations; i++) {
                const a = tf.randomNormal([256, 256])
                const b = tf.randomNormal([256, 256])
                const c = a.dot(b)
                a.dispose()
                b.dispose()
                c.dispose()
            }
        })
        console.log(`${Date.now() - start}`)
    }
}

export default GridWorldAgent