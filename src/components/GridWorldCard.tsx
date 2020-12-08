// eslint-disable-next-line
import React from "react";
import Card from "react-bootstrap/Card";
import GridWorldControl from "./GridWorldControl";
import GridWorld from "../gym/GridWorld";

const GridWorldCard = () => {

    return (
      <Card style={{ width: "auto" }}>
        <Card.Header>Header</Card.Header>
        <Card.Body>
          <Card.Title>Grid World</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            Reinforcement learning of an agent in a simple grid world.
          </Card.Subtitle>
          <Card.Text>Lore ipsum</Card.Text>
          <GridWorldControl
            width = { 520 }
            height = { 520}
            world = { new GridWorld(4, "random") }
            epochs = { 5000 }
          />
          <Card.Link href="#">Card Link</Card.Link>
        </Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    );
  };
  export default GridWorldCard;