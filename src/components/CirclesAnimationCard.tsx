import React, { useEffect } from "react";
import * as htmlColors from "./commons/HTMLColors";
import Card from "react-bootstrap/Card";
import CirclesAnimation from "./CirclesAnimation";

const CirclesAnimationCard = () => {
  return (
    <Card style={{ width: "auto" }}>
      <Card.Header>Header</Card.Header>
      <Card.Body>
        <Card.Title>Circles Animation</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          A simple animation of random circles
        </Card.Subtitle>
        <Card.Text>
          An animation of circles generated from a Tensorflow random normal
          tensor. You can set background an fill color as well as the number of
          circles drawn. Use play to loop the animation.
        </Card.Text>
        <CirclesAnimation
          width={1920}
          height={1080}
          palette={{
            background: htmlColors.extended,
            a: htmlColors.extended,
            b: htmlColors.extended,
          }}
          background="gainsboro"
          colorA="black"
          colorB="antiquewhite"
          data={[
            { key: 0, value: 0.2 },
            { key: 1, value: 0.4 },
            { key: 2, value: 0.8 },
          ]}
          updateInterval={1500}
          animate={false}
          animateScale={1.15}
          author="deepbench@cyin.org"
        />
        <Card.Link href="#">Card Link</Card.Link>
      </Card.Body>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  );
};
export default CirclesAnimationCard;
