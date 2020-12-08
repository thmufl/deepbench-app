class GridWorld {
    size: number;
    mode: string;
    positions: number[][];
    actions: string[] = [];

    defaultPositions = [[0,3], [0,0], [0,1], [1,1]]; // P, +, -, W

    constructor(size: number = 4, mode: string = "static") {
        this.size = size;
        this.mode = mode;
        this.positions = new Array(4);
        this.init();
    }

    init = () => {
        switch(this.mode) {
            case "player":
                this.positions = this.defaultPositions;
                this.positions[0] = this.findAvailablePosition();
                break;

            case "random":
                this.positions = new Array(4);
                [1, 2, 3, 0].forEach(i => this.positions[i] = this.findAvailablePosition());
                break;

            default:
                this.positions = this.defaultPositions;
        }
        this.actions = [];
    }

    move = (direction: string) => {
        this.actions.push(direction);
        const newPosition = {...this.positions[0]};

        switch(direction) {
            case "up": newPosition[0] -= 1; break;
            case "right": newPosition[1] += 1; break;
            case "down": newPosition[0] += 1; break;
            case "left": newPosition[1] -= 1; break;
        }

        if(this.isInsideWorld(newPosition) && !this.isWall(newPosition))  {
            this.positions[0] = newPosition;
        }
        return this.state();
    }

    calculateReward = (): number => {
        if(this.isGoal(this.positions[0])) return 10;
        if(this.isPit(this.positions[0])) return -10;
        return -1; // Step
    }

    randomPosition = () => {
        const x = Math.floor(Math.random() * this.size);
        const y = Math.floor(Math.random() * this.size);
        return [x, y];
    }

    isInsideWorld = (position: number[]): boolean => {
        return  position[0] > -1 && position[0] < this.size && 
                position[1] > -1 && position[1] < this.size
    }

    isGoal = (position: number[]): boolean => {
        return this.isEqualPosition(this.positions[1], position);
    }

    isPit = (position: number[]): boolean => {
        return this.isEqualPosition(this.positions[2], position);
    }

    isWall = (position: number[]): boolean => {
        return this.isEqualPosition(this.positions[3], position);
    }

    isAvailablePosition = (position: number[]): boolean => {
        return  !this.isEqualPosition(this.positions[1], position) &&
                !this.isEqualPosition(this.positions[2], position) &&
                !this.isEqualPosition(this.positions[3], position);
    }

    isEqualPosition = (a: number[], b: number[]) => {
        return a && b && a[0] === b[0] && a[1] === b[1];
    }

    findAvailablePosition = (): number[] => {
        let position = this.randomPosition();
        while(!this.isAvailablePosition(position)) {
            position = this.randomPosition();
        }
        return position;
    }

    state = () => {
        let state = Array(4).fill(null)
            .map(() => Array(this.size).fill(null)
            .map(() => Array(this.size).fill(0)));

        // defaultPositions = [[0,3], [0,0], [0,1], [1,1]]; // P, +, -, W
        
        state[0][this.positions[0][0]][this.positions[0][1]] = 1;
        state[1][this.positions[1][0]][this.positions[1][1]] = 1;
        state[2][this.positions[2][0]][this.positions[2][1]] = 1;
        state[3][this.positions[3][0]][this.positions[3][1]] = 1;
        return state;
    }

    print = () => {
        let state = Array(this.size).fill(null)
            .map(() => Array(this.size).fill("o"));

        state[this.positions[0][0]][this.positions[0][1]] = "A";
        state[this.positions[1][0]][this.positions[1][1]] = "+";
        state[this.positions[2][0]][this.positions[2][1]] = "-";
        state[this.positions[3][0]][this.positions[3][1]] = "W";

        let s = new String();

        for(let i = 0; i < this.size; i++) {
            for(let j = 0; j < this.size; j++) {
                s += state[i][j];
            } 
            s += "\n"
        }
        console.log(s + ", actions: " + this.actions.join() + ", reward: " + this.calculateReward() + ", [GridWorld]");
    }
}

export default GridWorld;
