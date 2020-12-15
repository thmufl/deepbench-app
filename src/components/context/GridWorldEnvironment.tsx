import React, { useContext, useState, useEffect } from "react";

type Props = {
    children: React.ReactNode   
    size: number
    positions: number[][]
};

type EnvironmentContextType = {
    size: number
    setSize: (value: number) => void
    positions: number[][]
    setPositions: (value: number[][]) => void
    makeStep: (direction: string) => void
    getReward: () => number
};

const EnvironmentContext = React.createContext<EnvironmentContextType | undefined>(undefined);

export const useEnvironment = () => useContext(EnvironmentContext);

export const GridWorldEnvironment = (props: Props) => {
    const [state, setState] = useState(props);
    const [positions, setPositions] = useState(props.positions);
    const [size, setSize] = useState(props.size);

    //const { size, positions } = state;
    // const [size, setSize] = useState(props.size);
    //const [positions, setPositions] = useState(state);
    // const [reward] = useState(0);

    const isInsideGrid = (position: number[]): boolean => {
        return  position[0] > -1 && position[0] < size && 
                position[1] > -1 && position[1] < size
    }

    const isEqualPosition = (a: number[], b: number[]): boolean => {
        return a && b && a[0] === b[0] && a[1] === b[1];
    }

    const isGoal = (position: number[]): boolean => {
        return isEqualPosition(positions[1], position);
    }

    const isPit = (position: number[]): boolean => {
        return isEqualPosition(positions[2], position);
    }

    const isWall = (position: number[]): boolean => {
        return isEqualPosition(positions[3], position);
    }

    const randomPosition = () => {
        const x = Math.floor(Math.random() * size);
        const y = Math.floor(Math.random() * size);
        return [x, y];
    }

    const isAvailablePosition = (position: number[]): boolean => {
        return  !isEqualPosition(positions[1], position) &&
                !isEqualPosition(positions[2], position) &&
                !isEqualPosition(positions[3], position);
    }

    const findAvailablePosition = (): number[] => {
        let position = randomPosition();
        while(!isAvailablePosition(position)) {
            position = randomPosition();
        }
        return position;
    }

    const makeStep = (direction: string) => {
        const agentPosition = [...positions[0]];
        switch(direction) {
            case "up": agentPosition[0] -= 1; break;
            case "right": agentPosition[1] += 1; break;
            case "down": agentPosition[0] += 1; break;
            case "left": agentPosition[1] -= 1; break;
        }
        if(isInsideGrid(agentPosition) && !isWall(agentPosition))  {
            positions[0] = agentPosition
            setPositions([...positions]);
        }
    }

    const getReward = (): number => {
        if(isGoal(positions[0])) return 10;
        if(isPit(positions[0])) return -10;
        return -1; // Step
    }
  
    return (
        <EnvironmentContext.Provider value={{ size, setSize, positions, setPositions, makeStep, getReward }}>
            { props.children }
        </EnvironmentContext.Provider>
    );
};
