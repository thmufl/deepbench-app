import * as tf from "@tensorflow/tfjs"
import * as d3 from "d3"

export type CryptoWorldCallbacks = {
    onBeforeMakeStep?: any
    onAfterMakeStep?: any
    onReset?: any
}

export type Trade = {
    day: number
    type: "BUY_BTC" | "SELL_BTC" | "HOLD_BTC"
    amount: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9
}


class CryptoWorldEnvironment {

    historicalData: any[] = []
    day: number
    eurPosition: number[]
    btcPosition: number[]
    eurTotalValue: number[]
    
    callbacks: CryptoWorldCallbacks = {}

    constructor(day: number, eurPosition: number[], btcPosition: number[], callbacks?: CryptoWorldCallbacks) {
        this.day = day
        this.eurPosition = eurPosition
        this.btcPosition = btcPosition
        this.eurTotalValue = []

        if(callbacks) this.callbacks = callbacks
        this.init()
    }

    init = async() => {
        this.historicalData = await d3.csv("/assets/BTC-EUR.csv")
        console.log(this.historicalData)
    }

    makeStep = (trade: Trade) => {
        if(this.callbacks.onBeforeMakeStep) this.callbacks.onBeforeMakeStep({state: null})
        switch(trade.type) {
            case "BUY_BTC":
                const amount = trade.amount
                const avgRate = (this.historicalData[trade.day].hight + this.historicalData[trade.day].low) / 2
                

        }

    }

    getReward = () => {
        return this.eurTotalValue.slice(-1)[0] - this.eurTotalValue[0]
    }

    getState = () => {

    }
}

export default CryptoWorldEnvironment