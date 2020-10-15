// eslint-disable-next-line
import React from "react";
import * as d3 from "d3";
import * as htmlColors from "./commons/HTMLColors";
import Card from "react-bootstrap/Card";

import PerceptronAnimation from "./PerceptronAnimation";

const PerceptronCard = () => {
  return (
    <Card style={{ width: "auto" }}>
      <Card.Header>Header</Card.Header>
      <Card.Body>
        <Card.Title>Perceptron</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          Play around with a single Perceptron.
        </Card.Subtitle>
        <Card.Text>Lore ipsum</Card.Text>
        <PerceptronAnimation
          width={960}
          height={540}
          margin={{
            top: 40,
            right: 40,
            bottom: 40,
            left: 40,
          }}
          label="thmf@cyin.org"
          xs={[-1, -0.5, -0.1, 0, 0.25, 0.3, 0.5, 0.75, 1]}
          ys={[-1, -0.5, -0.1, 0, 0.25, 0.3, 0.5, 0.75, 1]}
          epochs={500}
        />
        <Card.Link href="#">Card Link</Card.Link>
      </Card.Body>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  );
};
export default PerceptronCard;
