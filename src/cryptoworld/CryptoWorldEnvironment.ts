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

export type Position = {
    day: number,
    eur: number,
    btc: number
}

export type Action = {
    type: string // "BUY_BTC" | "SELL_BTC" | "HOLD"
    amount: number // 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9
}

class CryptoWorldEnvironment {
    initialPositions: Position
    initialEurValue = 0
    fees: number
    historicalData: any[] = []
    callbacks: CryptoWorldCallbacks = {}

    currentPositions: Position = { day: 0, eur: 0, btc: 0 }
    currentEurValue = 0

    constructor(initialPositions: Position, fees: number = 0.025, callbacks?: CryptoWorldCallbacks) {
        this.initialPositions = initialPositions
        this.fees = fees
        if(callbacks) this.callbacks = callbacks
        this.init()
    }

    init = async() => {
        if(this.callbacks.onBeforeInit) this.callbacks.onBeforeInit()
        this.historicalData = await d3.csv("/assets/BTC-EUR.csv")
        for(let i = 0; i < this.historicalData.length; i++) {
            if(this.historicalData[i].Open === "null" || this.historicalData[i].Open === "0.000000") this.historicalData[i].Open = this.historicalData[i-1].Close
            if(this.historicalData[i].High === "null" || this.historicalData[i].High === "0.000000") this.historicalData[i].High = this.historicalData[i-1].Close
            if(this.historicalData[i].Low === "null" || this.historicalData[i].Low === "0.000000") this.historicalData[i].Low = this.historicalData[i-1].Close
            if(this.historicalData[i].Close === "null" || this.historicalData[i].Close === "0.000000") this.historicalData[i].Close = this.historicalData[i-1].Close
            if(this.historicalData[i]["Adj Close"] === "null" || this.historicalData[i].Open === "0.000000") this.historicalData[i]["Adj Close"] = this.historicalData[i-1].Close
            if(this.historicalData[i].Volume === "null" || this.historicalData[i].Volume === "0.000000") this.historicalData[i].Volume = this.historicalData[i-1].Volume
        }
        console.log("Historical Data", this.historicalData)
        this.reset()
        const avgPrice = (parseFloat(this.historicalData[this.currentPositions.day].High) + parseFloat(this.historicalData[this.currentPositions.day].Low)) / 2
        this.initialEurValue = this.currentPositions.eur + this.currentPositions.btc * avgPrice
        if(this.callbacks.onAfterInit) this.callbacks.onAfterInit(this.getState())
    }

    makeStep = (action: Action) => {
        if(this.callbacks.onBeforeMakeStep) this.callbacks.onBeforeMakeStep(this.getState())

        const day = this.currentPositions.day
        const avgPrice = (parseFloat(this.historicalData[day].High) + parseFloat(this.historicalData[day].Low)) / 2
        let eur = 0, btc = 0

        switch(action.type) {
            case "BUY_BTC":
                eur = action.amount * this.currentPositions.eur
                btc = (eur - this.fees * eur) / avgPrice
                this.currentPositions = { day: day + 1, eur: this.currentPositions.eur - eur, btc: this.currentPositions.btc + btc }
                break

            case "SELL_BTC":
                btc = action.amount * this.currentPositions.btc
                eur = (btc - this.fees * btc) * avgPrice
                this.currentPositions = { day: day + 1, eur: this.currentPositions.eur + eur, btc: this.currentPositions.btc - btc }
                break

            case "HOLD_BTC":
                this.currentPositions = { day: day + 1, eur: this.currentPositions.eur, btc: this.currentPositions.btc }
                break

        }
        this.currentEurValue = this.currentPositions.eur + this.currentPositions.btc * this.historicalData[this.currentPositions.day].Open
        if(this.callbacks.onAfterMakeStep) this.callbacks.onAfterMakeStep(this.getState())
        return { done: this.isDone(), reward: this.getReward(), state: this.getState() }
    }

    reset = () => {
        if(this.callbacks.onBeforeReset) this.callbacks.onBeforeReset(this.getState())
        this.currentPositions = {...this.initialPositions}
        this.currentEurValue = this.initialEurValue
        if(this.callbacks.onAfterReset) this.callbacks.onAfterReset(this.getState())
    }

    getReward = () => {
        return (this.currentEurValue - this.initialEurValue) * 0.1
    }

    isDone = () => {
        return this.currentPositions.day >= this.historicalData.length - 1
    }

    getState = () => {
        const day = this.currentPositions.day
        return day ? 
            { day, date: this.historicalData[day].Date, eur: this.currentPositions.eur, btc: this.currentPositions.btc, eurValue: this.currentEurValue } :
            { day: 0, date: this.historicalData[0].Date, eur: this.initialPositions.eur, btc: this.initialPositions.btc, eurValue: this.initialEurValue }
    }

    getStateTensor = (day: number) => {
        let data = this.historicalData[day]
        const buffer = tf.buffer([1, 6])
        buffer.set(data.Open, 0, 0)
        buffer.set(data.High, 0, 1)
        buffer.set(data.Low, 0, 2)
        buffer.set(data.Close, 0, 3)
        buffer.set(data["Adj Close"], 0, 4)
        buffer.set(data.Volume / 1e6, 0, 5)
        //buffer.toTensor().div(50000).print()
        return buffer.toTensor().div(50000);
    }
}

export default CryptoWorldEnvironment