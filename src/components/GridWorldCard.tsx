// eslint-disable-next-line
import React from "react";
import Card from "react-bootstrap/Card";
import GridWorldControl from "./GridWorldControl";

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
            epochs = { 500 }
          />
          <Card.Link href="#">Card Link</Card.Link>
        </Card.Body>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    );
  };
  export default GridWorldCard;