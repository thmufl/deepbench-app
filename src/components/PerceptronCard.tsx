// eslint-disable-next-line
import React from "react";
import * as d3 from "d3";
import * as htmlColors from "./commons/HTMLColors";
import Card from "react-bootstrap/Card";

import * as tf from "@tensorflow/tfjs";

import PerceptronAnimation from "./PerceptronAnimation";

let DATA_POINTS = 800;
let data: any[] = [];

const shuffle = (array: any[]) => {
  var m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

// Line
// let m = Math.random();
// for (let i = 0; i < DATA_POINTS; i++) {
//   let x = Math.random();
//   data.push({ x, y: m * x });
// }

// Sine;
// for (let i = 0; i < DATA_POINTS; i++) {
//   let angle = Math.random();
//   data.push({ x: angle, y: Math.sin(angle * 2 * Math.PI) });
// }

// Cubic
// for (let i = 0; i < DATA_POINTS; i++) {
//   let x = Math.random();
//   data.push({ x, y: x * x * x });
// }

// Random Path
data.push({ x: 0, y: Math.random() });
for (let i = 1; i < DATA_POINTS; i++) {
  let x = i / DATA_POINTS;
  let delta = Math.random() / (1000000 * DATA_POINTS);
  let y = Math.random() > 0.5 ? data[i - 1].y + delta : data[i - 1].y - delta;
  data.push({ x, y });
}

// Curve
// const a = Math.random() * 2 * Math.PI;
// const b = Math.random() * 2 * Math.PI;
// const c = Math.random() * 2 * Math.PI;

// for (let i = 1; i < DATA_POINTS; i++) {
//   let x = i / DATA_POINTS;
//   data.push({
//     x,
//     y:
//       Math.sin(a * x * x) +
//       Math.cos(b * x * x * x) -
//       Math.cos(c * x * x * x * x),
//   });
// }

console.log(data);
data = shuffle(data);

let xs = data.map((d) => d.x);
let ys = data.map((d) => d.y);

let scale: any = d3.scaleLinear().domain([d3.min(ys) || 0, d3.max(ys) || 1]);
ys = ys.map((d) => scale(d));

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
          width={1920 * 0.5} // window.innerWidth
          height={1080 * 0.5}
          margin={{
            top: 80,
            right: 0,
            bottom: 80,
            left: 0,
          }}
          label="deep@cyin.org"
          xs={xs}
          ys={ys}
          epochs={100}
          history={40}
        />
        <Card.Link href="#">Card Link</Card.Link>
      </Card.Body>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  );
};
export default PerceptronCard;
