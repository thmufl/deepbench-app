import CryptoWorldEnvironment, { Position, Action } from "./CryptoWorldEnvironment";
import * as tf from "@tensorflow/tfjs";

class CryptoWorldAgent {

  static DEFAULT_MODEL = tf.sequential({
    layers: [
        tf.layers.dense({ inputShape: [6], units: 150, activation: "relu", }),
        tf.layers.dense({ units: 200, activation: "relu" }),
        tf.layers.dropout({rate: 0.2}),
        tf.layers.dense({ units: 150, activation: "relu" }),
        tf.layers.dropout({rate: 0.2}),
        tf.layers.dense({ units: 50, activation: "relu" }),
        tf.layers.dense({ units: 21, activation: "softmax" }),
    ],
  });

  static DEFAULT_MODEL_COMPILE_ARGS: tf.ModelCompileArgs = {
    optimizer: tf.train.adam(1e-3),
    loss: "meanSquaredError",
    metrics: ["mse"],
  };

  environment: CryptoWorldEnvironment;
  model: tf.Sequential;
  modelCompileArgs: tf.ModelCompileArgs;
  numEpisodes: number = 200;
  currentEpisode: number = 0;
  gamma: number;
  epsilon: number;
  replayMemory: { xs: number[][]; ys: number[][] };
  replayMemorySize = 400
  replayExamples = 300
  startTime: number = Date.now();
  history: any[] = [];
  trace = false;

  TARGET_URL = "localstorage://cryptoworld-model-target";

  ACTIONS = [
    { type: "HOLD_BTC", amount: 1.0 },
    { type: "BUY_BTC", amount: 0.1 },
    { type: "BUY_BTC", amount: 0.2 },
    { type: "BUY_BTC", amount: 0.3 },
    { type: "BUY_BTC", amount: 0.4 },
    { type: "BUY_BTC", amount: 0.5 },
    { type: "BUY_BTC", amount: 0.6 },
    { type: "BUY_BTC", amount: 0.7 },
    { type: "BUY_BTC", amount: 0.8 },
    { type: "BUY_BTC", amount: 0.9 },
    { type: "BUY_BTC", amount: 1.0 },
    { type: "SELL_BTC", amount: 0.1 },
    { type: "SELL_BTC", amount: 0.2 },
    { type: "SELL_BTC", amount: 0.3 },
    { type: "SELL_BTC", amount: 0.4 },
    { type: "SELL_BTC", amount: 0.5 },
    { type: "SELL_BTC", amount: 0.6 },
    { type: "SELL_BTC", amount: 0.7 },
    { type: "SELL_BTC", amount: 0.8 },
    { type: "SELL_BTC", amount: 0.9 },
    { type: "SELL_BTC", amount: 1.0 }
  ]

  constructor(
    environment: CryptoWorldEnvironment,
    gamma?: number,
    model?: tf.Sequential,
    modelCompileArgs?: tf.ModelCompileArgs
  ) {
    this.environment = environment;
    this.gamma = gamma || 0.9;
    this.epsilon = 0.1;
    this.model = model || CryptoWorldAgent.DEFAULT_MODEL;
    this.modelCompileArgs = modelCompileArgs || CryptoWorldAgent.DEFAULT_MODEL_COMPILE_ARGS;
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
          if (this.environment.currentPositions.day % 4 === 0) {
            targetModel.setWeights(this.model.getWeights().map((w) => w.clone()))
          }
          const state0 = this.environment.getStateTensor(this.environment.currentPositions.day)
          const prediction0 = (targetModel.predict(state0) as tf.Tensor).reshape([this.ACTIONS.length])
          //prediction0.print()

          let action = 0
          if (Math.random() < this.epsilon) {
            let type = Math.floor(Math.random() * 3)
            action = (type === 0) ? 0 :  1 + Math.floor(Math.random() * this.ACTIONS.length-1)
          } else {
            action = prediction0.argMax().dataSync()[0]
          }

          const { done, reward, state } = this.environment.makeStep(this.ACTIONS[action]);
          this.history.push(state)
          const state1 = this.environment.getStateTensor(this.environment.currentPositions.day)
          const prediction1 = (targetModel.predict(state1) as tf.Tensor).reshape([this.ACTIONS.length])
          const maxQ = tf.max(prediction1).dataSync()[0]
          const qval = prediction0.arraySync() as number[]
          qval[action] = reward + this.gamma * maxQ

          if (this.trace && this.environment.currentPositions.day === Math.floor(Math.random() * 10)) {
            let currentPosition = this.environment.currentPositions
            console.log(`episode: ${this.currentEpisode}, step: ${currentPosition.day}, action: ${this.ACTIONS[action]}, reward: ${reward}, gamma * maxQ: ${this.gamma * maxQ}`);
            // prediction0.print()
            // prediction1.print()
            //this.environment.print()
          }

          if (done) {
            qval[action] = reward
          }

          xs = state0.reshape([6]).arraySync() as number[]
          ys = tf.tensor(qval).reshape([this.ACTIONS.length]).arraySync() as number[]

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
            prediction0.dispose()
            state1.dispose()
            prediction1.dispose()
          }
        });

        if (this.replayMemory.xs.length > this.replayExamples) {
          let x = tf.tensor(trainingData.xs)
          let y = tf.tensor(trainingData.ys)

          await this.model.trainOnBatch(x, y).then((info) => {
            if (this.currentEpisode % 10 === 0 && this.environment.currentPositions.day === this.environment.historicalData.length-1) {
                let loss = (info as number[])[0]
                let positions = this.environment.currentPositions
                let eurValue = this.environment.currentEurValue
                console.log(`episode: ${this.currentEpisode}, day: ${positions.day}, epsilon: ${this.epsilon.toFixed(3)}, eur: ${positions.eur.toFixed(2)}, btc: ${positions.btc.toFixed(8)}, eurValue: ${eurValue.toFixed(2)}, loss: ${loss.toFixed(4)}`)
            }
          });
          x.dispose()
          y.dispose()
        }
      }
      if (this.epsilon > 0.05) this.epsilon -= 1 / numEpisodes
    }
    console.log(`Training done. ${numEpisodes} episodes in ${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)} minutes.`)
    console.log(`Positions on day ${this.environment.currentPositions.day}: EUR ${this.environment.currentPositions.eur.toFixed(2)}, BTC ${this.environment.currentPositions.btc.toFixed(8)}`)
    const index = (this.model.predict(this.environment.getStateTensor(this.environment.currentPositions.day)) as tf.Tensor).reshape([this.ACTIONS.length]).argMax().dataSync()[0]
    console.log(`Predicted action for day ${this.environment.currentPositions.day} is [${this.ACTIONS[index].type} ${this.ACTIONS[index].amount}]`)
  };

  save = async (url: string) => {
    return await this.model.save(url)
  };

  load = async (url: string) => {
    this.model = (await tf.loadLayersModel(url)) as tf.Sequential
    this.model.compile(this.modelCompileArgs)
  };
}

export default CryptoWorldAgent
