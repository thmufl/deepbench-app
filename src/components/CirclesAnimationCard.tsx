// eslint-disable-next-line
import React from "react";
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
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
          palette={{
            background: htmlColors.extended,
            inner: htmlColors.extended,
            outer: htmlColors.extended,
            label: htmlColors.extended,
          }}
          colorBackground="gainsboro"
          colorInner="black"
          colorOuter="antiquewhite"
          opacityInner={0.8}
          opacityOuter={0.2}
          data={[
            { key: 0, value: 0.05 },
            { key: 1, value: 0.1 },
            { key: 2, value: 0.2 },
            { key: 3, value: 0.4 },
            { key: 4, value: 0.8 },
          ]}
          animate={false}
          animateScale={1.15}
          animateInterval={1000}
          label="deepbench@cyin.org"
          labelColor="grey"
        />
        <Card.Link href="#">Card Link</Card.Link>
      </Card.Body>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  );
};
export default CirclesAnimationCard;
