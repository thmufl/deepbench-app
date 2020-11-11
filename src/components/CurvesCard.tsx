// eslint-disable-next-line
import React from "react";
import * as d3 from "d3";
import * as htmlColors from "./commons/HTMLColors";
import Card from "react-bootstrap/Card";

import * as tf from "@tensorflow/tfjs";

import CurvesAnimation from "./CurvesAnimation";

let DATA_POINTS = 600;
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

//Sine;
// for (let i = 0; i < DATA_POINTS; i++) {
//   let angle = Math.random() * 4 * Math.PI;
//   data.push({ x: angle, y: Math.sin(angle) });
// }

// Variable Sine
// const l = Math.round(Math.random() * 16);
// console.log("l", l);
// for (let i = 0; i < DATA_POINTS; i++) {
//   let angle = Math.random() * l * Math.PI;
//   data.push({ x: angle, y: Math.sin(angle) });
// }

// Quadratic
// for (let i = 0; i < DATA_POINTS; i++) {
//   let x = Math.random();
//   data.push({ x, y: x * x });
// }

// Random Path
// data.push({ x: 0, y: Math.random() });
// for (let i = 1; i < DATA_POINTS; i++) {
//   let x = i / DATA_POINTS;
//   let delta = Math.random() / 100;
//   let y = Math.random() > 0.5 ? data[i - 1].y + delta : data[i - 1].y - delta;
//   data.push({ x, y });
// }

// Trigonometric Waves
// let a = Math.random();
// let b = Math.random();
// let c = Math.random();

// a = a * 22 * Math.PI;
// b = b * 14 * Math.PI;
// c = c * 6 * Math.PI;

// Reference
// const a = 0.36439311720573206 * 22 * Math.PI;
// const b = 0.2115142870470018 * 14 * Math.PI;
// const c = 0.6345657331481362 * 6 * Math.PI;

const a = Math.random() * 2 * Math.PI;
const b = Math.random() * 4 * Math.PI;
const c = Math.random() * 8 * Math.PI;
const d = Math.random() * 16 * Math.PI;
const e = Math.random() * 32 * Math.PI;

console.log("random vars", { a: a, b: b, c: c, d: d, e: e });

for (let i = 0; i < DATA_POINTS; i++) {
  let x = i / DATA_POINTS;
  data.push({
    x,
    y:
      Math.sin(a * x) *
      Math.sin(b * x) *
      Math.sin(c * x) *
      Math.sin(d * x) *
      Math.sin(e * x),
  });
}

//sin(sin(x));
// for (let i = 0; i < DATA_POINTS; i++) {
//   let x = (i / DATA_POINTS + 1) * 18;
//   data.push({
//     x,
//     y: Math.sin(2 * Math.sin(2 * Math.sin(2 * Math.sin(x)))),
//   });
// }

//sin(sin(sin(x)));
// for (let i = 0; i < DATA_POINTS; i++) {
//   let x = (i / DATA_POINTS + 1) * 8;
//   data.push({
//     x,
//     y: Math.sin(3 * Math.sin(3 * Math.sin(2 * Math.sin(x)))),
//   });
// }

data = shuffle(data);

let xs = data.map((d) => d.x);
let ys = data.map((d) => d.y);

let xScale: any = d3.scaleLinear().domain([d3.min(xs) || 0, d3.max(xs) || 1]);
xs = xs.map((d) => xScale(d));

let yScale: any = d3
  .scaleLinear()
  .domain([d3.min(ys) || -1, d3.max(ys) || 1])
  .range([-0.5, 0.5]);
// let yScale: any = d3
//   .scaleLinear()
//   .domain([d3.min(ys) || -1, d3.max(ys) || 1])
//   .range([-0.05, 0.05]);
ys = ys.map((d) => yScale(d));

const CurvesCard = () => {
  return (
    <Card style={{ width: "auto" }}>
      <Card.Header>Header</Card.Header>
      <Card.Body>
        <Card.Title>Curves</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          Learning arbitrary, non-linear curves
        </Card.Subtitle>
        <Card.Text>Lore ipsum</Card.Text>
        <CurvesAnimation
          width={1920 * 0.6}
          height={1080 * 0.6}
          margin={{
            top: 10,
            right: 0,
            bottom: 20,
            left: 0,
          }}
          colors={{
            background: "Gold",
            trainingData: "SteelBlue",
            predictionHistory: ["LightBlue", "SteelBlue"],
            prediction: "Crimson",
            mae: "Yellow",
            text: "Black",
          }}
          title="Curves - Basic Training of a Sine VI"
          description="Learning a random curve with a 2 layer network. Activation tanh, optimizer sgd."
          xs={xs}
          ys={ys}
          epochs={2500}
          batchSize={undefined}
          yieldEvery={0}
          updateEvery={5}
          maxHistory={32}
          drawAxis={false}
          model={tf.sequential({
            layers: [
              tf.layers.dense({
                inputShape: [1],
                units: 100,
                activation: "tanh",
              }),
              // tf.layers.dropout({ rate: 0.05 }),
              tf.layers.dense({ units: 100, activation: "tanh" }),
              tf.layers.dense({ units: 100, activation: "tanh" }),
              tf.layers.dense({ units: 100, activation: "tanh" }),
              tf.layers.dense({ units: 1, activation: "tanh" }),
            ],
          })}
          modelCompileArgs={{
            //optimizer: "adam", // sgd, adam, adamax, adagrad, adadelta, rmsprop
            //optimizer: tf.train.adam(0.001),
            optimizer: "adam",
            loss: "meanAbsoluteError", // meanAbsoluteError, meanSquaredError, categoricalCrossentropy
            metrics: ["mae", "mse", "acc"],
          }}
        />
        <Card.Link href="#">Card Link</Card.Link>
      </Card.Body>
      <Card.Footer>Footer</Card.Footer>
    </Card>
  );
};
export default CurvesCard;
