import React, { useState, useEffect } from "react";
import Card from "react-bootstrap/Card";
import AtRandomAnimation from "./AtRandomAnimation";

const AtRandomAnimationCard = () => {
  useEffect(() => {
    //console.log("AtRandomCard: useEffect");
  });

  return (
    <Card style={{ width: "auto" }}>
      <Card.Header>Header</Card.Header>
      <Card.Body>
        <Card.Title>At Random</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          A simple animation of random circles
        </Card.Subtitle>
        <Card.Text>
          Some quick example text to build on the card title and make up the
          bulk of the card's content.
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
