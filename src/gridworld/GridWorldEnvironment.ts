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
        agent: new Position(0, 3),
        goal: new Position(0, 0),
        pit: new Position(0, 1),
        wall: new Position(1, 1)
    }

    size: number
    mode: string
    callbacks: GridWorldCallbacks = {}
    positions = this.DEFALUT_POSITIONS
    history: number[] = []

    constructor(size: number = 4, mode: string = "agent", callbacks?: GridWorldCallbacks) {
        this.size = size
        this.mode = mode
        if(callbacks) this.callbacks = callbacks
        this.reset()
    }

    randomPosition = () => {
        return new Position(
            Math.floor(Math.random() * this.size),
            Math.floor(Math.random() * this.size)
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
        return  position.x > -1 && position.x < this.size && 
                position.y > -1 && position.y < this.size
    }

    isGoal = (position: Position) => position.equals(this.positions.goal)
    isPit = (position: Position) => position.equals(this.positions.pit)
    isWall = (position: Position) => position.equals(this.positions.wall)

    makeStep = (direction: string) => {
        if(this.callbacks.onBeforeMakeStep) this.callbacks.onBeforeMakeStep({state: this.getState(), reward: this.getReward()})

        const agentPosition =  new Position(this.positions.agent.x, this.positions.agent.y)
        switch(direction) {
            case "up": agentPosition.x -= 1; break
            case "down": agentPosition.x += 1; break
            case "left": agentPosition.y -= 1; break
            case "right": agentPosition.y += 1; break
            default: throw Error(`Invalid direction: ${direction}`)
        }
        if(this.isInsideGrid(agentPosition) && !this.isWall(agentPosition)) this.positions.agent = agentPosition
        const state = {state: this.getState(), reward: this.getReward()}
        if(state.reward !== -1) this.history.push(state.reward);

        if(this.callbacks.onGoal && this.isGoal(agentPosition)) this.callbacks.onGoal(state)
        if(this.callbacks.onPit && this.isPit(agentPosition)) this.callbacks.onPit(state)
        if(this.callbacks.onAfterMakeStep) this.callbacks.onAfterMakeStep(state)
        return state
    }

    getReward = () => {
        if(this.isGoal(this.positions.agent)) return 10
        if(this.isPit(this.positions.agent)) return -10
        return -1; // Step
    }

    getState = () => {
        let state = Array(4).fill(null)
            .map(() => Array(this.size).fill(null)
            .map(() => Array(this.size).fill(0)));
  
        state[0][this.positions.agent.x][this.positions.agent.y] = 1
        state[1][this.positions.goal.x][this.positions.goal.y] = 1
        state[2][this.positions.pit.x][this.positions.pit.y] = 1
        state[3][this.positions.wall.x][this.positions.wall.y] = 1
        return state;
    }

    reset = () => {
        this.positions = {
            agent: new Position(-1, -1),
            goal: new Position(-1, -1),
            pit: new Position(-1, -1),
            wall: new Position(-1, -1)
        }

        switch(this.mode) {
            case "static":
                this.positions = {...this.DEFALUT_POSITIONS}
                break

            case "agent":
                this.positions = {...this.DEFALUT_POSITIONS}
                this.positions.agent.x = -1
                this.positions.agent.y = -1
                this.positions.agent = this.findAvailablePosition();
                break;

            case "random":
                this.positions.wall = this.findAvailablePosition()
                this.positions.goal = this.findAvailablePosition()
                this.positions.pit = this.findAvailablePosition()
                this.positions.agent = this.findAvailablePosition()
                break;
                
            default: throw Error("No such mode: " + this.mode);
        }
        const state = {positions: this.positions, state: this.getState(), reward: this.getReward()}
        if(this.callbacks.onReset) this.callbacks.onReset(state)
        return state;
    }

    print = () => {
        const grid = new Array(this.size).fill("O").map(() => new Array(this.size).fill("\u00B7"))
        grid[this.positions.agent.x][this.positions.agent.y] = "A"
        grid[this.positions.goal.x][this.positions.goal.y] = "G"
        grid[this.positions.pit.x][this.positions.pit.y] = "P"
        grid[this.positions.wall.x][this.positions.wall.y] = "W"
        console.log(`${GridWorldEnvironment.name}\n\t${grid.map(e => e.join(" ")).join("\n\t")}`)
    }
}

export default GridWorldEnvironment
