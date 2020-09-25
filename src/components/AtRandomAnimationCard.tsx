import React, { useEffect } from "react";
import Card from "react-bootstrap/Card";
import AtRandomAnimation from "./AtRandomAnimation";

const AtRandomAnimationCard = () => {
  return (
    <Card style={{ width: "auto" }}>
      <Card.Header>Header</Card.Header>
      <Card.Body>
        <Card.Title>At Random</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          A simple animation of random circles
        </Card.Subtitle>
        <Card.Text>
          An animation of circles generated from a Tensorflow random normal
          tensor. You can set background an fill color as well as the number of
          circles drawn. Use play to loop the animation.
        </Card.Text>
        <AtRandomAnimation
          width={1920}
          height={1080}
          background="lightgrey"
          fill="black"
          circles={5}
          zoom={false}
        />
        <Card.Link href="#">Card Link</Card.Link>
      </Card.Body>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  );
};
export default AtRandomAnimationCard;
