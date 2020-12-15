import React, { useState } from "react";

import { useEnvironment } from "./context/GridWorldEnvironment";

const GridWorldAgent = (props: { color: string }) => {
    const { positions, makeStep, getReward } = useEnvironment()!;
    const [state, setState] = useState(props);
    
    const handleMakeStep = (event: React.MouseEvent) => {
        event.preventDefault();
        let action = event.currentTarget.getAttribute("value")!; //["up", "down", "left", "right"][Math.floor(Math.random() * 4)];
        makeStep(action);
    }

    return (
      <div>
        <span>reward: { getReward() }</span>
        <button onClick={ handleMakeStep } value="left">left</button>
        <button onClick={ handleMakeStep } value="right">right</button>
        <button onClick={ handleMakeStep } value="up">up</button>
        <button onClick={ handleMakeStep } value="down">down</button>
      </div>
    );
};

export default GridWorldAgent;