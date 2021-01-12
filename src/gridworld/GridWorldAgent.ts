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
            tf.layers.dropout({ rate: 0.2 }),
            tf.layers.dense({ units: 50, activation: "relu" }),
            tf.layers.dropout({ rate: 0.1 }),
            tf.layers.dense({ units: 4, activation: "softmax" }),
        ],
    })

    static DEFAULT_MODEL_COMPILE_ARGS: tf.ModelCompileArgs = {
        optimizer: tf.train.adam(1e-2),
        loss: "meanSquaredError",
        metrics: ["mse"],
    }

    environment: GridWorldEnvironment
    model: tf.Sequential
    modelCompileArgs: tf.ModelCompileArgs
    currentEpisode: number = 0
    gamma: number
    epsilon: number
    replayMemory: { xs: number[][][][], ys: number[][] }
    startTime: number = 0
    history: any[] = []
    trace = false

    TARGET_URL = "localstorage://gridworld-model-target"
    static DIRECTIONS = ["up", "down", "left", "right"]

    constructor(
        environment: GridWorldEnvironment,
        gamma?: number,
        model?: tf.Sequential,
        modelCompileArgs?: tf.ModelCompileArgs) {

        //tf.setBackend('cpu');
        
        this.environment = environment
        this.gamma = gamma || 0.9
        this.epsilon = 1.0
        this.model = model || GridWorldAgent.DEFAULT_MODEL
        this.modelCompileArgs = modelCompileArgs || GridWorldAgent.DEFAULT_MODEL_COMPILE_ARGS
        this.model.compile(this.modelCompileArgs)
        this.replayMemory = { xs: Array<number[][][]>(), ys: Array<number[]>() }
    }

    train = async(numEpisodes: number) => {
        console.log(`Backend: ${tf.getBackend()}\nWEBGL_RENDER_FLOAT32_CAPABLE: ${tf.ENV.getBool("WEBGL_RENDER_FLOAT32_CAPABLE")}\nWEBGL_RENDER_FLOAT32_ENABLED: ${tf.ENV.getBool("WEBGL_RENDER_FLOAT32_ENABLED")}\nfloatPrecision: ${tf.backend().floatPrecision()}`);
        console.log(`Training model for ${numEpisodes} episodes. Model summary:`)
        this.model.summary()
        this.startTime = Date.now()
        await this.model.save(this.TARGET_URL)
        const targetModel = await tf.loadLayersModel(this.TARGET_URL) as tf.Sequential
        this.epsilon = 1.0

        for(this.currentEpisode = 0; this.currentEpisode < numEpisodes; this.currentEpisode++) {
            this.environment.reset()
            let xs: number[][][]
            let ys: number[]
            let trainingData = { xs: Array<number[][][]>(), ys: Array<number[]>() }                    

            while(!this.environment.isDone()) {
                tf.tidy(() => {
                    if(this.environment.currentStep % 10 === 0) {
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

                    if(this.trace && this.currentEpisode % 10 === 0) {
                        console.log("\n\nprediction0 (action=" + GridWorldAgent.DIRECTIONS[action] + ")")
                        this.environment.print()
                        prediction0.print()
                    }

                    const { state, done, reward, steps } = this.environment.makeStep(GridWorldAgent.DIRECTIONS[action])
                    const state1 = this.environment.getStateTensor()  //.reshape([1, 96]).add(tf.randomNormal([96]).div(100))
                    const prediction1 = (targetModel.predict(state1) as tf.Tensor).reshape([4])
                    const maxQ = tf.max(prediction1, -1).dataSync()[0]
                    
                    const qval = prediction0.arraySync() as number[]
                    qval[action] = reward + this.gamma * maxQ

                    if(this.trace && this.currentEpisode % 5 === 0) {
                        console.log("prediction1 (reward=" + reward + ", maxQ=" + maxQ + ")" )
                        this.environment.print()
                        prediction1.print()
                    }
                  
                    if(done) {
                        qval[action] = reward
                        this.history.push({ reward, steps, timeStamp: Date.now() })
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
                        this.history[this.history.length-1].loss = (info as number[])[0]
                        if(this.currentEpisode % 10 === 0 && this.environment.currentStep === 1) {
                            let last100 = this.history.length - 100
                            let pos = this.history.filter((x, i) => i > last100 && x.reward === 10).length
                            let neg = this.history.filter((x, i) => i > last100 && x.reward === -10).length
                            let msPerEpisode = this.history.length < 100 ?
                                (this.history[this.history.length-1].timeStamp - this.history[0].timeStamp) / this.history.length :
                                (this.history[this.history.length-1].timeStamp - this.history[this.history.length-100].timeStamp) / 100

                            console.log(`episode: ${this.currentEpisode}, pos/neg: ${(pos/(neg+1)).toFixed(4)}, epsilon: ${this.epsilon.toFixed(4)}, loss: ${(info as number[])[0].toFixed(4)}, tensors: ${tf.memory().numTensors}, ms/episode: ${msPerEpisode.toFixed(2)}`)
                        }
                    });
                    x.dispose()
                    y.dispose()
                }
            }
            if(this.epsilon > 0.1) this.epsilon -= 1 / numEpisodes
        }
        console.log(`Training done. ${numEpisodes} episodes in  ${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)} minutes.`)
    }

    save = async(url: string) => {
        return await this.model.save(url)
    }

    load = async(url: string) => {
        this.model = (await tf.loadLayersModel(url)) as tf.Sequential
        this.model.compile(this.modelCompileArgs)
    }

    play = () => {
        this.environment.maxSteps = 15
        tf.tidy(() => {
            const id = setInterval(() => {
                let state = this.environment.getStateTensor()
                let qval = this.model.predict(state) as tf.Tensor
                let action = tf.argMax(qval.reshape([4])).dataSync()[0]
                console.log(this.environment.currentStep + ": " + GridWorldAgent.DIRECTIONS[action])
                this.environment.makeStep(GridWorldAgent.DIRECTIONS[action])
                let reward = this.environment.getReward()
                if(this.environment.isDone()) {
                    console.log(reward === 10 ? "WON" : "LOST")
                    clearInterval(id)
                    return
                }
            }, 250)
        });
    };

    loop = () => {
        this.epsilon = 0
        this.history.splice(0)
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