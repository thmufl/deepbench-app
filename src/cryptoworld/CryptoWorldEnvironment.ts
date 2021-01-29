import * as tf from "@tensorflow/tfjs"
import * as d3 from "d3"
import DataRepository from "./DataRepository"

export type CryptoWorldCallbacks = {
    onBeforeInit?: any
    onAfterInit?: any
    onBeforeMakeStep?: any
    onAfterMakeStep?: any
    onBeforeReset?: any
    onAfterReset?: any
}

export type Action = {
    type: string // "BUY" | "SELL" | "HOLD"
    amount: number // 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9
}

export type Position = {
    day: number
    date: string
    eur: number
    btc: number
    open: number
    value: number
    action: Action
}

class CryptoWorldEnvironment {
    initialPosition: Position
    fees: number
    dataRepository: DataRepository
    data: any[] = []
    callbacks: CryptoWorldCallbacks = {}
    previousPosition = {day: 0, date: "1970-01-01", eur: 0, btc: 0, open: 0, value: 0, action: {type: "HOLD", amount: 1.0}}
    currentPosition = {day: 0, date: "1970-01-01", eur: 0, btc: 0, open: 0, value: 0, action: {type: "HOLD", amount: 1.0}}

    ACTIONS = [
        { type: "HOLD", amount: 1.0 },
        { type: "BUY", amount: 0.2 },
        { type: "BUY", amount: 0.4 },
        { type: "BUY", amount: 0.6 },
        { type: "BUY", amount: 0.8 },
        { type: "BUY", amount: 1.0 },
        { type: "SELL", amount: 0.2 },
        { type: "SELL", amount: 0.4 },
        { type: "SELL", amount: 0.6 },
        { type: "SELL", amount: 0.8 },
        { type: "SELL", amount: 1.0 },
    ]

    constructor(initialPosition: Position, fees: number = 0.025, callbacks?: CryptoWorldCallbacks) {
        this.initialPosition = initialPosition
        this.fees = fees
        if(callbacks) this.callbacks = callbacks
        this.dataRepository = new DataRepository("/assets/BTC-EUR-1Y.csv")
        this.init()
    }

    init = async() => {
        if(this.callbacks.onBeforeInit) this.callbacks.onBeforeInit()
        await this.dataRepository.load()
        console.log("DataRepository", this.dataRepository.data)
        this.data = this.dataRepository.getData("2020-03-15", "2020-06-15")
        console.log("Environment Data", this.data)
        const open = this.data[this.initialPosition.day].Open
        this.initialPosition.open = open
        this.initialPosition.value = this.initialPosition.eur + open * this.initialPosition.btc
        this.reset()
        if(this.callbacks.onAfterInit) this.callbacks.onAfterInit(this.getState())
    }
    
    makeStep = (action: Action) => {
        //if(this.callbacks.onBeforeMakeStep) this.callbacks.onBeforeMakeStep(this.getState())
        
        this.currentPosition.action = action
        let day = this.currentPosition.day + 1
        const open = this.data[day].Open
        const nextPosition = {...this.currentPosition, day, date: this.data[day].Date, open, action: {type: "NULL", amount: 0}}

        let eur = 0
        let btc = 0

        switch(action.type) {
            case "HOLD":
                break

            case "BUY":
                eur = action.amount * this.currentPosition.eur
                btc = (eur - this.fees * eur) / open
                nextPosition.eur =  this.currentPosition.eur - eur
                nextPosition.btc = this.currentPosition.btc + btc
                break

            case "SELL":
                btc = action.amount * this.currentPosition.btc
                eur = (btc - this.fees * btc) * open
                nextPosition.eur =  this.currentPosition.eur + eur
                nextPosition.btc = this.currentPosition.btc - btc
                break

        }
        nextPosition.value = nextPosition.eur + open * nextPosition.btc
        this.previousPosition = {...this.currentPosition}
        this.currentPosition = {...nextPosition}
        if(this.callbacks.onAfterMakeStep) this.callbacks.onAfterMakeStep(this.getState())
        return { done: this.isDone(), reward: this.getReward(), state: this.getState() }
    }

    reset = () => {
        if(this.callbacks.onBeforeReset) this.callbacks.onBeforeReset(this.getState())
        this.currentPosition = {...this.initialPosition}
        if(this.callbacks.onAfterReset) this.callbacks.onAfterReset(this.getState())
    }

    isValidAction = (index: number) => {
        const action = this.ACTIONS[index]
        switch(action.type) {
            case "BUY": return this.currentPosition.eur > 0
            case "SELL": return this.currentPosition.btc > 0
            default: return true
        }
    }

    getRandomAction = (): number => {
        const randomAction = () => { 
            let type = Math.floor(Math.random() * 3)
            return type === 0 ? 0 : 1 + Math.floor(Math.random() * this.ACTIONS.length-1)
        }
        let action = randomAction()
        while(!this.isValidAction(action)) {
            action = randomAction()
        }
        return action;
    }

    isDone = () => this.currentPosition.day === this.data.length - 1

    getReward = () => {
        const x = 100 * (this.currentPosition.value - this.previousPosition.value) / this.previousPosition.value
        if (x === 0) return -1
        if (this.isDone()) return 5 * x
        return x
    }

    getState = () => this.currentPosition

    getStateTensor = (): tf.Tensor2D => {
        const buffer = tf.buffer([1, 6])
        const pos = this.currentPosition
        // buffer.set(pos.eur, 0, 0)
        // buffer.set(pos.btc, 0, 1)
        // buffer.set(pos.value, 0, 2)
        const data = this.data[this.currentPosition.day]
        buffer.set(data.Open, 0, 0)
        buffer.set(data.High, 0, 1)
        buffer.set(data.Low, 0, 2)
        buffer.set(data.Close, 0, 3)
        buffer.set(data.Volume * 1e-7, 0, 4)
        buffer.set(1 - (pos.value - pos.eur) / (pos.eur + 1), 0, 5) // btc investment ratio
        //buffer.toTensor().mul(1e-4).print()
        return buffer.toTensor().mul(1e-4)
    }
}

export default CryptoWorldEnvironment