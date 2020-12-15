interface IGridWorldEnvironment {
    size: number
    positions: number[][]
    reward: number
}

type GridWorldEnvironmentContext = {
    size: number
    state: IGridWorldEnvironment
    stepUp: () => void
    stepDown: () => void
    stepLeft: () => void
    stepRight: () => void
}