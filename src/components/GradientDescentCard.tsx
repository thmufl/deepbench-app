// eslint-disable-next-line
import React from "react";
import { Card } from "react-bootstrap";
import GradientDescentControl from "./GradientDescentControl";

const GradientDescentCard = () => {
  return (
    <Card style={{ width: "auto" }}>
      <Card.Body>
        <Card.Title>Gradient Descent</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">Card Subtitle</Card.Subtitle>
        <GradientDescentControl
          data={{
            xTrain: [-4, -1, 0, 1, 3, 4],
            yTrain: [-8, 3, 4, 5, 7, 8],
            xVal: [0.5, 0.75],
            yVal: [1, 1.125],
          }}
          epochs={3000}
        />
        <Card.Text>
          Some quick example text to build on the card title and make up the
          bulk of the card's content.
        </Card.Text>
        <Card.Link href="#">Card Link</Card.Link>
        <Card.Link href="#">Another Link</Card.Link>
      </Card.Body>
    </Card>
  );
};

export default GradientDescentCard;
