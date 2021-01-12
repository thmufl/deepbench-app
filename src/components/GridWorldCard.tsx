// eslint-disable-next-line
import React from "react"
import Card from "react-bootstrap/Card"

import GridWorldEnvironment from "../gridworld/GridWorldEnvironment"
import GridWorldAgent from "../gridworld/GridWorldAgent"
import GridWorldComponent from "./GridWorldComponent"

const GridWorldCard = () => {

    const environment = new GridWorldEnvironment(6, 9, "training")
    const agent = new GridWorldAgent(environment)

    return (
        <Card style={{ width: "auto" }}>
            <Card.Header>Header</Card.Header>
            <Card.Body>
            <Card.Title>Grid World</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
            Reinforcement learning of an agent in a simple grid world.
            </Card.Subtitle>
            <Card.Text>
            The player can move up, down, left, and right. It receives a reward of 10 when arriving 
            at the goal (<b>+</b>). When reaching the pit (<b>-</b>) the player receives a "reward" 
            of -10 and the game is over. Every step counts as -1.
            <br /><b>P</b> Player, <b>+</b> Goal, <b>-</b> Pit, <b>W</b> Wall
            </Card.Text>

            <GridWorldComponent agent={agent} width={1920/3.7} height={1080/3.7} />

            <br />
            <Card.Link href="#">Card Link</Card.Link>
            </Card.Body>
            <Card.Footer>Footer</Card.Footer>
        </Card>
    );
};
export default GridWorldCard;