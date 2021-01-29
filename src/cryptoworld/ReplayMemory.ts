import * as tf from "@tensorflow/tfjs";

class ReplayMemory {

  maxSize: number
  batchSize: number
  memory: {x: tf.Tensor, y: tf.Tensor}[]
  
  constructor(maxSize: number = 10000, batchSize: number = 64) {
    this.maxSize = maxSize
    this.batchSize = batchSize
    this.memory = Array<{x: tf.Tensor, y: tf.Tensor}>()
  }

  isBatchAvailable = (): boolean => this.memory.length >= this.batchSize

  push = (sample: {x: number[], y: number[]}) => {
    if(this.memory.length > this.maxSize) {
        let item = this.memory[0]
        this.memory.splice(0, 1)
        item.x.dispose()
        item.y.dispose()
    }
    this.memory.push({x: tf.tensor([sample.x]), y: tf.tensor([sample.y])})
  }

  sample = (): {xs: tf.Tensor, ys: tf.Tensor} => {
    return tf.tidy(() => {
        const size = Math.min(this.memory.length, this.batchSize)
        const indices = tf.randomUniform([size], 0, size-1, "int32").arraySync() as number[] // shape, minval?, maxval?, dtype?, seed?
        const xs = new Array(size)
        const ys = new Array(size)
        for(let i = 0; i < size; i++) {
            xs[i] = this.memory[indices[i]].x
            ys[i] = this.memory[indices[i]].y
        }
        return {xs: tf.concat(xs, 0), ys: tf.concat(ys, 0)}
    })
  }
}

export default ReplayMemory