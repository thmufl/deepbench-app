// eslint-disable-next-line
import React from "react";
import * as d3 from "d3";
import * as htmlColors from "./commons/HTMLColors";
import Card from "react-bootstrap/Card";

import ColorCircleAnimation from "./ColorCircleAnimation";

const ColorCircleCard = () => {
  return (
    <Card style={{ width: "auto" }}>
      <Card.Header>Header</Card.Header>
      <Card.Body>
        <Card.Title>Color Circle</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          A simple animation of circles with random diameters.
        </Card.Subtitle>
        <Card.Text>
          An animation of circles generated from a Tensorflow random normal
          tensor. You can set background an fill color as well as the number of
          circles drawn. Use play to loop the animation.
        </Card.Text>
        <ColorCircleAnimation
          width={1920}
          height={1080}
          margin={{
            top: 40,
            right: 40,
            bottom: 40,
            left: 40,
          }}
          palette={{
            background: htmlColors.extended,
            a: htmlColors.extended,
            b: htmlColors.extended,
            label: htmlColors.extended,
          }}
          colorBackground="grey"
          colorInterpolator={d3.interpolateLab}
          colorA="black"
          colorB="grey"
          opacityA={0.8}
          opacityB={0.35}
          data={[
            { key: 0, value: 0.05 },
            { key: 1, value: 0.1 },
            { key: 2, value: 0.2 },
            { key: 3, value: 0.4 },
            { key: 4, value: 0.8 },
            { key: 5, value: 1.6 },
          ]}
          animate={false}
          animateScale={1.15}
          animateInterval={1000}
          label="deep@cyin.org"
          colorLabel="black"
        />
        <Card.Link href="#">Card Link</Card.Link>
      </Card.Body>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  );
};
export default ColorCircleCard;
