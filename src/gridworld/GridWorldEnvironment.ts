import * as tf from "@tensorflow/tfjs"
import { step } from "@tensorflow/tfjs";

export class Position {
    x: number
    y: number

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    equals = (other: Position) => {
        return this.x === other.x && this.y === other.y
    }

    clone = () => {
        return new Position(this.x, this.y)
    }
}

export type Positions = {
    agent: Position,
    goal: Position,
    pit: Position,
    wall: Position
}

export type GridWorldCallbacks = {
    onBeforeMakeStep?: any
    onAfterMakeStep?: any
    onGoal?: any
    onPit?: any
    onReset?: any
}

class GridWorldEnvironment {

    DEFALUT_POSITIONS = {
        agent: new Position(1, 5),
        goal: new Position(1, 0),
        pit: new Position(2, 1),
        wall: new Position(1,1)
    }

    TRAINING_POSITIONS = [
        { agent: new Position(1, 5), goal: new Position(1, 0), pit: new Position(2, 1), wall: new Position(1, 1) },
        { agent: new Position(5, 5), goal: new Position(1, 0), pit: new Position(2, 1), wall: new Position(1, 1) },
        { agent: new Position(3, 2), goal: new Position(4, 8), pit: new Position(4, 7), wall: new Position(2, 7) },
        { agent: new Position(4, 6), goal: new Position(2, 5), pit: new Position(3, 2), wall: new Position(3, 5) },
        { agent: new Position(3, 6), goal: new Position(3, 4), pit: new Position(1, 3), wall: new Position(3, 5) },
        { agent: new Position(3, 5), goal: new Position(3, 0), pit: new Position(4, 1), wall: new Position(3, 1) },
        { agent: new Position(2, 7), goal: new Position(2, 2), pit: new Position(3, 3), wall: new Position(2, 3) },
        { agent: new Position(4, 8), goal: new Position(4, 3), pit: new Position(5, 4), wall: new Position(4, 4) },
    ]

    sizeX: number
    sizeY: number
    mode: string
    maxSteps: number
    callbacks: GridWorldCallbacks = {}
    positions = this.DEFALUT_POSITIONS
    
    currentStep: number = 0
    wasOutsideGrid = false

    constructor(sizeX: number, sizeY: number, mode: string = "agent", maxSteps?: number, callbacks?: GridWorldCallbacks) {
        this.sizeX = sizeX
        this.sizeY = sizeY
        this.mode = mode
        this.maxSteps = Math.round(maxSteps || sizeX * sizeY * 3)
        if(callbacks) this.callbacks = callbacks
    }

    randomPosition = () => {
        return new Position(
            Math.floor(Math.random() * this.sizeX),
            Math.floor(Math.random() * this.sizeY)
        );
    }

    isEmpty = (position: Position) => {
        return  !position.equals(this.positions.agent) &&
                !position.equals(this.positions.goal) &&
                !position.equals(this.positions.pit) &&
                !position.equals(this.positions.wall)
    }

    findAvailablePosition = () => {
        let position = this.randomPosition()
        while(!this.isEmpty(position)) {
            position = this.randomPosition()
        }
        return position;
    }

    isInsideGrid = (position: Position) => { 
        return  position.x > -1 && position.x < this.sizeX && 
                position.y > -1 && position.y < this.sizeY
    }

    isGoal = (position: Position) => position.equals(this.positions.goal)
    isPit = (position: Position) => position.equals(this.positions.pit)
    isWall = (position: Position) => position.equals(this.positions.wall)

    makeStep = (direction: string) => {
        if(this.callbacks.onBeforeMakeStep) this.callbacks.onBeforeMakeStep({state: this.getState(), reward: this.getReward()})
        this.wasOutsideGrid = false
        const agentPosition =  new Position(this.positions.agent.x, this.positions.agent.y)
        switch(direction) {
            case "up": agentPosition.x -= 1; break
            case "down": agentPosition.x += 1; break
            case "left": agentPosition.y -= 1; break
            case "right": agentPosition.y += 1; break
            default: throw Error(`Invalid direction: ${direction}`)
        }
        if(this.isInsideGrid(agentPosition) && !this.isWall(agentPosition)) this.positions.agent = agentPosition
        if(!this.isInsideGrid(agentPosition)) this.wasOutsideGrid = true

        const state = this.getState()

        if(this.callbacks.onGoal && this.isGoal(agentPosition)) this.callbacks.onGoal(state)
        if(this.callbacks.onPit && this.isPit(agentPosition)) this.callbacks.onPit(state)
        this.currentStep++
        if(this.callbacks.onAfterMakeStep) this.callbacks.onAfterMakeStep(state)
        return { state, done: this.isDone(), reward: this.getReward(), steps: this.currentStep }
    }

    getRandomAction = () => {
        const directions = ["up", "down", "left", "right"]
        let validStep = false
        let direction = "none"
        const agentPosition = new Position(this.positions.agent.x, this.positions.agent.y)
        while(!validStep) {
            agentPosition.x = this.positions.agent.x
            agentPosition.y = this.positions.agent.y
            direction = directions[Math.floor(Math.random() * 4)]
            switch(direction) {
                case "up": agentPosition.x -= 1; break
                case "down": agentPosition.x += 1; break
                case "left": agentPosition.y -= 1; break
                case "right": agentPosition.y += 1; break
                default: throw Error(`Invalid direction: ${direction}`)
            }
            if(this.isInsideGrid(agentPosition) && !this.isWall(agentPosition)) validStep = true
        }
        return directions.indexOf(direction)
    }

    isDone = () => {
        return this.getReward() === 10 || this.getReward() === -10 || this.currentStep > this.maxSteps
    }

    getReward = () => {
        if(this.isGoal(this.positions.agent)) return 10
        if(this.isPit(this.positions.agent)) return -10
        if(this.wasOutsideGrid) return -10
        return -1; // Step
    }

    getState = () => {
        let state = Array(4).fill(null)
            .map(() => Array(this.sizeX).fill(null)
            .map(() => Array(this.sizeY).fill(0)));
  
        state[0][this.positions.agent.x][this.positions.agent.y] = 1
        state[1][this.positions.goal.x][this.positions.goal.y] = 1
        state[2][this.positions.pit.x][this.positions.pit.y] = 1
        state[3][this.positions.wall.x][this.positions.wall.y] = 1
        return state;
    }

    getStateTensor = () => {
        const buffer = tf.buffer([1, this.sizeX, this.sizeY, 2])

        buffer.set(1.0, 0, this.positions.agent.x, this.positions.agent.y, 0)
        buffer.set(0.9, 0, this.positions.goal.x, this.positions.goal.y, 1)
        buffer.set(0.6, 0, this.positions.pit.x, this.positions.pit.y, 1)
        buffer.set(0.3, 0, this.positions.wall.x, this.positions.wall.y, 1)
        //buffer.toTensor().print()
        return buffer.toTensor();
    } 

    reset = () => {
        this.positions = {
            agent: new Position(-1, -1),
            goal: new Position(-1, -1),
            pit: new Position(-1, -1),
            wall: new Position(-1, -1)
        }
        this.currentStep = 0
        this.wasOutsideGrid = false

        switch(this.mode) {
            case "static":
                this.positions = {...this.DEFALUT_POSITIONS}
                break

            case "agent":
                this.positions = {...this.DEFALUT_POSITIONS}
                this.positions.agent.x = -1
                this.positions.agent.y = -1
                this.positions.agent = this.findAvailablePosition();
                break

            case "random":
                this.positions.wall = this.findAvailablePosition()
                this.positions.goal = this.findAvailablePosition()
                this.positions.pit = this.findAvailablePosition()
                this.positions.agent = this.findAvailablePosition()
                break

            case "training":
                this.positions = {...this.TRAINING_POSITIONS[Math.floor(Math.random() * this.TRAINING_POSITIONS.length)]}
                break
                
            default: throw Error("No such mode: " + this.mode);
        }
        const state = {positions: this.positions, state: this.getState(), reward: this.getReward()}
        if(this.callbacks.onReset) this.callbacks.onReset(state)
        return state;
    }

    print = () => {
        const grid = new Array(this.sizeX).fill("O").map(() => new Array(this.sizeY).fill("\u00B7"))
        grid[this.positions.agent.x][this.positions.agent.y] = "A"
        grid[this.positions.goal.x][this.positions.goal.y] = "G"
        grid[this.positions.pit.x][this.positions.pit.y] = "P"
        grid[this.positions.wall.x][this.positions.wall.y] = "W"
        console.log(`${GridWorldEnvironment.name}\n\t${grid.map(e => e.join(" ")).join("\n\t")}`)
    }
}

export default GridWorldEnvironment
