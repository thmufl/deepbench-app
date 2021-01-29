import CryptoWorldEnvironment, { Position, Action } from "./CryptoWorldEnvironment";
import ReplayMemory from "./ReplayMemory";
import * as tf from "@tensorflow/tfjs";

class CryptoWorldAgent {

  static DEFAULT_MODEL = tf.sequential({
    layers: [
        tf.layers.dense({ inputShape: [6], units: 100, activation: "relu", }),
        tf.layers.dense({ units: 150, activation: "relu" }),
        tf.layers.dropout({rate: 0.1}),
        tf.layers.dense({ units: 200, activation: "relu" }),
        tf.layers.dropout({rate: 0.2}),
        tf.layers.dense({ units: 150, activation: "relu" }),
        tf.layers.dropout({rate: 0.1}),
        tf.layers.dense({ units: 50, activation: "relu" }),
        tf.layers.dense({ units: 11, activation: "tanh" }),
    ],
  });

  static DEFAULT_MODEL_COMPILE_ARGS: tf.ModelCompileArgs = {
      optimizer: tf.train.adam(2e-5),
      loss: "meanSquaredError",
      metrics: ["mse"],
  };

  environment: CryptoWorldEnvironment
  model: tf.Sequential
  modelCompileArgs: tf.ModelCompileArgs
  numEpisodes: number = 2000
  currentEpisode: number = 0
  gamma: number
  epsilon: number
  replayMemory = new ReplayMemory(10000, 64)
  startTime: number = Date.now()
  history: any[] = []
  trace = false

  TARGET_URL = "localstorage://cryptoworld-model-target";

  constructor(
    environment: CryptoWorldEnvironment,
    gamma?: number,
    model?: tf.Sequential,
    modelCompileArgs?: tf.ModelCompileArgs
  ) {
    this.environment = environment;
    this.gamma = gamma || 0.9;
    this.epsilon = 1.0;
    this.model = model || CryptoWorldAgent.DEFAULT_MODEL;
    this.modelCompileArgs = modelCompileArgs || CryptoWorldAgent.DEFAULT_MODEL_COMPILE_ARGS;
    this.model.compile(this.modelCompileArgs);
    this.history = new Array(this.environment.historicalData.length)
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
    console.log(`Training model for ${this.numEpisodes} episodes. Summary:`)
    console.log(`Replay memory max size: ${this.replayMemory.maxSize}, batch size: ${this.replayMemory.batchSize}`)
    this.model.summary();

    this.startTime = Date.now();
    await this.model.save(this.TARGET_URL);
    const targetModel = (await tf.loadLayersModel(this.TARGET_URL)) as tf.Sequential;
    this.epsilon = 1.0;

    for (this.currentEpisode = 0; this.currentEpisode < numEpisodes; this.currentEpisode++) {
      this.environment.reset();
      let x: number[];
      let y: number[];
      this.history[0] = this.environment.getState()

      while (!this.environment.isDone()) {
        let d = tf.tidy(() => {
          if (this.environment.currentPosition.day % 4 === 0) {
            targetModel.setWeights(this.model.getWeights().map((w) => w.clone()))
          }

          const state0 = this.environment.getStateTensor()
          const prediction0 = (targetModel.predict(state0) as tf.Tensor2D).arraySync()[0]

          let actionIndex = null
          if (Math.random() < this.epsilon) {
            let type = Math.floor(Math.random() * 3)
            actionIndex = type === 0 ? 0 : 1 + Math.floor(Math.random() * this.environment.ACTIONS.length-1)
          } else {
            actionIndex = prediction0.indexOf(Math.max(...prediction0))
            if(this.trace && this.currentEpisode % 10 === 0) {
              console.log(`day: ${this.environment.currentPosition.day}, action: ${this.environment.ACTIONS[actionIndex].type},${this.environment.ACTIONS[actionIndex].amount}`)
            }
          }
          const {done, reward, state} = this.environment.makeStep(this.environment.ACTIONS[actionIndex])
          if(this.trace && this.currentEpisode % 10 === 0) {
            //console.log(`--- reward: ${reward} (done: ${done}), prediction0: ${JSON.stringify(prediction0)}`)
            //console.log(`reward: ${reward} (done: ${done})`)
          }
          this.history[state.day] = state

          const state1 = this.environment.getStateTensor()
          const prediction1 = (targetModel.predict(state1) as tf.Tensor2D).arraySync()[0]
          const maxQ = Math.max(...prediction1)
          const qval = prediction0
          
          qval[actionIndex] = reward + this.gamma * maxQ
          if (done) {
            qval[actionIndex] = reward
          }
          x = state0.arraySync()[0]
          y = qval
          state0.dispose()
          state1.dispose()
          return {x, y}
        })
        this.replayMemory.push({x: d.x, y: d.y})

        if(this.replayMemory.isBatchAvailable()) {
          const {xs, ys} = this.replayMemory.sample()
          await this.model.trainOnBatch(xs, ys).then((info) => {
            if (this.currentEpisode % 10 === 0 && this.environment.currentPosition.day === this.environment.historicalData.length-1) {
                let loss = (info as number[])[0]
                let pos = this.environment.currentPosition
                console.log(`episode: ${this.currentEpisode}, date: ${pos.date}, epsilon: ${this.epsilon.toFixed(3)}, eur: ${pos.eur.toFixed(2)}, btc: ${pos.btc.toFixed(4)}, value: ${pos.value.toFixed(2)}, ms/episode: ${((Date.now() - this.startTime) / this.currentEpisode).toFixed(2)}, tensors: ${tf.engine().memory().numTensors}, loss: ${loss.toFixed(4)}`)
              }
          });
          xs.dispose()
          ys.dispose()
        }
      }
      if (this.epsilon > 0.1) this.epsilon -= 1 / numEpisodes
    }
    let pos = this.environment.currentPosition
    console.log(`Training done. ${numEpisodes} episodes in ${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)} minutes.`)
    console.log(`Positions on day ${pos.day}: EUR ${pos.eur.toFixed(2)}, BTC ${pos.btc.toFixed(8)}, eurValue: ${pos.value.toFixed(2)}`)
  };

  predict = async () => {
    this.environment.reset()
    this.history = new Array(this.environment.historicalData.length)
    this.history[0] = this.environment.getState()
    while(!this.environment.isDone()) {
      const day = this.environment.currentPosition.day
      const state0 = this.environment.getStateTensor()
      const prediction = (this.model.predict(state0) as tf.Tensor2D).arraySync()[0]
      let actionIndex = prediction.indexOf(Math.max(...prediction))
      let action = this.environment.ACTIONS[actionIndex]
      const {done, reward, state} = this.environment.makeStep(action)
      this.history[state.day] = state

      let pos = this.environment.currentPosition
      console.log(`date: ${pos.date}, day ${day}: ${action.type} ${action.amount}, eur: ${pos.eur.toFixed(2)}, btc: ${pos.btc.toFixed(8)}, open: ${pos.open.toFixed(2)}, value: ${pos.value.toFixed(2)}`)
    }
    //this.history.push(this.environment.getState())
  }

  save = async (url: string) => {
    return await this.model.save(url)
  };

  load = async (url: string) => {
    this.model = (await tf.loadLayersModel(url)) as tf.Sequential
    this.model.compile(this.modelCompileArgs)
  };
}

export default CryptoWorldAgent
