import * as tf from "@tensorflow/tfjs"
import * as d3 from "d3"

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
    historicalData: any[] = []
    callbacks: CryptoWorldCallbacks = {}
    currentPosition = {day: 0, date: "1970-01-01", eur: 0, btc: 0, open: 0, value: 0, action: {type: "HOLD", amount: 1.0}}

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
    ]

    constructor(initialPosition: Position, fees: number = 0.025, callbacks?: CryptoWorldCallbacks) {
        this.initialPosition = initialPosition
        this.fees = fees
        if(callbacks) this.callbacks = callbacks
        this.init()
    }

    init = async() => {
        if(this.callbacks.onBeforeInit) this.callbacks.onBeforeInit()
        this.historicalData = await d3.csv("/assets/BTC-EUR-TRAIN.csv")
        for(let i = 0; i < this.historicalData.length; i++) {
            if(this.historicalData[i].Open === "null" || this.historicalData[i].Open === "0.000000") this.historicalData[i].Open = this.historicalData[i-1].Close
            if(this.historicalData[i].High === "null" || this.historicalData[i].High === "0.000000") this.historicalData[i].High = this.historicalData[i-1].Close
            if(this.historicalData[i].Low === "null" || this.historicalData[i].Low === "0.000000") this.historicalData[i].Low = this.historicalData[i-1].Close
            if(this.historicalData[i].Close === "null" || this.historicalData[i].Close === "0.000000") this.historicalData[i].Close = this.historicalData[i-1].Close
            if(this.historicalData[i]["Adj Close"] === "null" || this.historicalData[i].Open === "0.000000") this.historicalData[i]["Adj Close"] = this.historicalData[i-1].Close
            if(this.historicalData[i].Volume === "null" || this.historicalData[i].Volume === "0.000000") this.historicalData[i].Volume = this.historicalData[i-1].Volume
        }
        for(let i = 0; i < this.historicalData.length; i++) {
            this.historicalData[i].Open = parseFloat(this.historicalData[i].Open)
            this.historicalData[i].High = parseFloat(this.historicalData[i].High)
            this.historicalData[i].Low = parseFloat(this.historicalData[i].Low)
            this.historicalData[i].Close = parseFloat(this.historicalData[i].Close)
            this.historicalData[i]["Adj Close"] = parseFloat(this.historicalData[i]["Adj Close"])
            this.historicalData[i].Volume = parseInt(this.historicalData[i].Volume)
        }
        console.log("Historical Data", this.historicalData)
        const price = this.historicalData[this.initialPosition.day].Open
        this.initialPosition.value = this.initialPosition.eur + price * this.initialPosition.btc
        this.reset()
        if(this.callbacks.onAfterInit) this.callbacks.onAfterInit(this.getState())
    }
    
    makeStep = (action: Action) => {
        //if(this.callbacks.onBeforeMakeStep) this.callbacks.onBeforeMakeStep(this.getState())
        
        this.currentPosition.action = action
        let day = this.currentPosition.day + 1
        const open = this.historicalData[day].Open
        const nextPosition = {...this.currentPosition, day, date: this.historicalData[day].Date, open, action: {type: "NULL", amount: 0}}

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
        let action = this.ACTIONS[index]
        switch(action.type) {
            case "BUY": return this.currentPosition.eur > 0
            case "SELL": return this.currentPosition.btc > 0
            default: return true
        }
    }

    getRandomAction = (): number => {
        let type = Math.floor(Math.random() * 3)
        let index = (type === 0) ? 0 : 1 + Math.floor(Math.random() * this.ACTIONS.length-1)
        return this.isValidAction(index) ? index : this.getRandomAction() 
    }

    getReward = () => {
        return 1e-3 * (this.currentPosition.value - this.initialPosition.value)
    }

    isDone = () => this.currentPosition.day === this.historicalData.length - 1
    getState = () => this.currentPosition

    getStateTensor = (): tf.Tensor2D => {
        let data = this.historicalData[this.currentPosition.day]
        let pos = this.currentPosition
        const buffer = tf.buffer([1, 9])
        buffer.set(pos.eur, 0, 0)
        buffer.set(pos.btc, 0, 1)
        buffer.set(pos.value, 0, 2)
        buffer.set(data.Open, 0, 3)
        buffer.set(data.High, 0, 4)
        buffer.set(data.Low, 0, 5)
        buffer.set(data.Close, 0, 6)
        buffer.set(data.Volume / 5e6, 0, 7)
        // buffer.toTensor().mul(1e-4).print()
        return buffer.toTensor().mul(1e-4) //.div(50000);
    }
}

export default CryptoWorldEnvironment