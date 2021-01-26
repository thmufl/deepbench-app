import CryptoSavesEnvironment, { Position, Action } from "./CryptoSavesEnvironment";
import * as tf from "@tensorflow/tfjs";

class CryptoSavesAgent {

  static DEFAULT_MODEL = tf.sequential({
    layers: [
        tf.layers.dense({ inputShape: [9], units: 150, activation: "relu", }),
        tf.layers.dense({ units: 200, activation: "relu" }),
        tf.layers.dropout({rate: 0.2}),
        tf.layers.dense({ units: 150, activation: "relu" }),
        tf.layers.dropout({rate: 0.2}),
        tf.layers.dense({ units: 50, activation: "relu" }),
        tf.layers.dense({ units: 13, activation: "relu" }),
    ],
  });

    // static DEFAULT_MODEL = tf.sequential({
    //     layers: [
    //         tf.layers.dense({ inputShape: [10], units: 150, activation: "relu", }),
    //         //tf.layers.batchNormalization(),
    //         tf.layers.dense({ units: 150, activation: "relu" }),
    //         tf.layers.dropout({rate: 0.1}),
    //         tf.layers.dense({ units: 300, activation: "relu" }),
    //         tf.layers.dropout({rate: 0.1}),
    //         tf.layers.dense({ units: 150, activation: "relu" }),
    //         tf.layers.dropout({rate: 0.1}),
    //         tf.layers.dense({ units: 150, activation: "relu" }),
    //         tf.layers.dense({ units: 19, activation: "softmax" }),
    //     ],
    // });

    static DEFAULT_MODEL_COMPILE_ARGS: tf.ModelCompileArgs = {
        optimizer: tf.train.adam(1e-5),
        loss: "meanSquaredError",
        metrics: ["mse"],
    };

    environment: CryptoSavesEnvironment;
    model: tf.Sequential;
    modelCompileArgs: tf.ModelCompileArgs;
    numEpisodes: number = 2000;
    currentEpisode: number = 0;
    gamma: number;
    epsilon: number;
    replayMemory: { xs: number[][]; ys: number[][] };
    replayMemorySize = 900
    replayExamples = 300
    startTime: number = Date.now();
    history: any[] = []
    trace = false;

    TARGET_URL = "localstorage://cryptosaves-model-target";

    ACTIONS = [
        { type: "HOLD", amount: 1.0 },
        { type: "BUY", amount: 0.1 },
        { type: "BUY", amount: 0.2 },
        { type: "BUY", amount: 0.3 },
        { type: "BUY", amount: 0.5 },
        { type: "BUY", amount: 0.7 },
        { type: "BUY", amount: 1.0 },
        { type: "SELL", amount: 0.1 },
        { type: "SELL", amount: 0.2 },
        { type: "SELL", amount: 0.3 },
        { type: "SELL", amount: 0.5 },
        { type: "SELL", amount: 0.7 },
        { type: "SELL", amount: 1.0 },
        // { type: "SAVE", amount: 0.1 },
        // { type: "SAVE", amount: 0.2 },
        // { type: "SAVE", amount: 0.3 },
        // { type: "SAVE", amount: 0.5 },
        // { type: "SAVE", amount: 0.7 },
        // { type: "SAVE", amount: 1.0 }
    ]

  constructor(
    environment: CryptoSavesEnvironment,
    gamma?: number,
    model?: tf.Sequential,
    modelCompileArgs?: tf.ModelCompileArgs
  ) {
    this.environment = environment;
    this.gamma = gamma || 0.9;
    this.epsilon = 1.0;
    this.model = model || CryptoSavesAgent.DEFAULT_MODEL;
    this.modelCompileArgs = modelCompileArgs || CryptoSavesAgent.DEFAULT_MODEL_COMPILE_ARGS;
    this.model.compile(this.modelCompileArgs);
    this.replayMemory = { xs: Array<number[]>(), ys: Array<number[]>() };
  }

  train = async (numEpisodes: number) => {
    this.numEpisodes = numEpisodes;
    console.log(
      `Backend: ${tf.getBackend()}\nWEBGL_RENDER_FLOAT32_CAPABLE: ${tf.ENV.getBool(
        "WEBGL_RENDER_FLOAT32_CAPABLE"
      )}\nWEBGL_RENDER_FLOAT32_ENABLED: ${tf.ENV.getBool(
        "WEBGL_RENDER_FLOAT32_ENABLED"
      )}\nfloatPrecision: ${tf.backend().floatPrecision()}`
    );
    console.log(`Training model for ${this.numEpisodes} episodes. Model summary:`)
    this.model.summary();
    this.startTime = Date.now();
    await this.model.save(this.TARGET_URL);
    const targetModel = (await tf.loadLayersModel(this.TARGET_URL)) as tf.Sequential;
    this.epsilon = 1.0;

    for (this.currentEpisode = 0; this.currentEpisode < numEpisodes; this.currentEpisode++) {
      this.environment.reset();
      let xs: number[];
      let ys: number[];
      let trainingData = { xs: Array<number[]>(), ys: Array<number[]>() }

      this.history = [this.environment.getState()]

      while (!this.environment.isDone()) {
        tf.tidy(() => {
          if (this.environment.currentPosition.day % 4 === 0) {
            targetModel.setWeights(this.model.getWeights().map((w) => w.clone()))
          }

          const state0 = this.environment.getStateTensor()
          const prediction0 = (targetModel.predict(state0) as tf.Tensor2D).arraySync()[0]

          let action = null
          if (Math.random() < this.epsilon) {
            let type = Math.floor(Math.random() * 3)
            action = (type === 0) ? 0 : 1 + Math.floor(Math.random() * this.ACTIONS.length-1)
          } else {
            action = prediction0.indexOf(Math.max(...prediction0))
            let pos = this.history.slice(-1)[0]
            if(this.currentEpisode % 50 === 0) console.log("episode: " + this.currentEpisode + ", day: " + pos.day  + ", date: " + pos.date + ", action: " + this.ACTIONS[action].type + " " + this.ACTIONS[action].amount)
          }
          const {done, reward, state} = this.environment.makeStep(this.ACTIONS[action])
          this.history.push(state)

          const state1 = this.environment.getStateTensor()
          const prediction1 = (targetModel.predict(state1) as tf.Tensor2D).arraySync()[0]
          const maxQ = Math.max(...prediction1)
          const qval = prediction0
          
          qval[action] = reward + this.gamma * maxQ
          if (done) {
            qval[action] = reward
          }

          xs = state0.arraySync()[0]// Array.from(state0.dataSync())
          ys = qval

          if (this.replayMemory.xs.length > this.replayMemorySize) {
            this.replayMemory.xs.splice(0, 1)
            this.replayMemory.ys.splice(0, 1)
          }
          this.replayMemory.xs.push(xs)
          this.replayMemory.ys.push(ys)

          if (this.replayMemory.xs.length > this.replayExamples) {
            trainingData.xs = new Array<number[]>()
            trainingData.ys = new Array<number[]>()
            for (let i = 0; i < this.replayMemorySize; i++) {
              let j = Math.floor(Math.random() * this.replayMemory.xs.length)
              trainingData.xs.push(this.replayMemory.xs[j])
              trainingData.ys.push(this.replayMemory.ys[j])
            }
            trainingData.xs.push(xs)
            trainingData.ys.push(ys)

            state0.dispose()
            //prediction0.dispose()
            state1.dispose()
            //prediction1.dispose()
          }
        });

        if (this.replayMemory.xs.length > this.replayExamples) {
          let x = tf.tensor2d(trainingData.xs)
          let y = tf.tensor2d(trainingData.ys)

          await this.model.trainOnBatch(x, y).then((info) => {
            if (this.currentEpisode % 10 === 0 && this.environment.currentPosition.day === this.environment.historicalData.length-1) {
                let loss = (info as number[])[0]
                let pos = this.environment.currentPosition
                console.log(`episode: ${this.currentEpisode}, date: ${pos.date}, epsilon: ${this.epsilon.toFixed(3)}, eur: ${pos.eur.toFixed(2)}, btc: ${pos.btc.toFixed(8)}, saves: ${pos.saves.toFixed(2)}, eurValue: ${pos.value.toFixed(2)}, ms/episode: ${((Date.now() - this.startTime) / this.currentEpisode).toFixed(2)}, loss: ${loss.toFixed(4)}`)
            }
          });
          x.dispose()
          y.dispose()
        }
      }
      if (this.epsilon > 0.1) this.epsilon -= 1 / numEpisodes
    }
    let pos = this.environment.currentPosition
    console.log(`Training done. ${numEpisodes} episodes in ${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)} minutes.`)
    console.log(`Positions on day ${pos.day}: EUR ${pos.eur.toFixed(2)}, BTC ${pos.btc.toFixed(8)}, SAVES (EUR) ${pos.saves.toFixed(2)}, eurValue: ${pos.value.toFixed(2)}`)
  };

  predict = async () => {
    this.environment.reset()
    this.history = []
    while(!this.environment.isDone()) {
      this.history.push(this.environment.getState())
      const day = this.environment.currentPosition.day
      const prediction = await this.model.predict(this.environment.getStateTensor()) as tf.Tensor
      let action = prediction.argMax(-1).arraySync() as number
      let pos = this.environment.currentPosition
      console.log(`day ${day}: ${this.ACTIONS[action].type} ${this.ACTIONS[action].amount}, eur: ${pos.eur.toFixed(2)}, btc: ${pos.btc.toFixed(8)}, saves: ${pos.saves.toFixed(2)}, eurValue: ${pos.value.toFixed(2)}`)
      this.environment.makeStep(this.ACTIONS[action])
    }
    this.history.push(this.environment.getState())
  }

  save = async (url: string) => {
    return await this.model.save(url)
  };

  load = async (url: string) => {
    this.model = (await tf.loadLayersModel(url)) as tf.Sequential
    this.model.compile(this.modelCompileArgs)
  };
}

export default CryptoSavesAgent
