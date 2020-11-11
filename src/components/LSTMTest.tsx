import React from "react";
import Card from "react-bootstrap/Card";
import * as tf from "@tensorflow/tfjs";

const LSTMTest = () => {
  const DATA_POINTS = 100;

  //Sine;
  let data = [];
  for (let i = 0; i < DATA_POINTS; i++) {
    let angle = Math.random() * 16 * Math.PI;
    data.push({ x: angle, y: Math.sin(angle) });
  }

  let xTrain = tf.tensor1d(data.map((d) => d.x));
  let yTrain = tf.tensor1d(data.map((d) => d.y));

  const training = [
    [[2019.1, 10]],
    [[2019.2, 2]],
    [[2019.4], [11]],
    [[2019.5], [31]],
  ];
  const xs = tf.tensor(training).reshape([-1, 1, 2]);
  console.log("xs shape:", xs.shape, xs.arraySync()); // [4,1,2]

  const model = tf.sequential();
  model.add(
    tf.layers.lstm({ units: 128, returnSequences: false, inputShape: [1, 2] })
  );
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: 20, activation: "softmax" }));
  model.summary();
  model.compile({
    loss: "categoricalCrossentropy",
    optimizer: tf.train.rmsprop(0.002),
  });
  model.summary();

  model
    .fit(xs, tf.ones([4, 20]), {
      epochs: 500,
      callbacks: {
        onEpochEnd: async (epoch: number, logs: any) => {
          if (epoch % 50 === 0) console.log(`Epoch ${epoch}, ${logs.loss}`);
        },
      },
    })
    .then((info) => {
      console.log("Final error: " + info.history.loss.slice(-1)[0]);
    });

  //model.predict(tf.ones([1, 1, 2])).print();

  /*
  xTrain = xTrain.reshape([25, 4, 1]);
  yTrain = yTrain.reshape([25, 4, 1]);

  const model = tf.sequential({
    layers: [
      tf.layers.lstm({
        units: 20,
        returnSequences: false,
        inputShape: [100, 1],
      }), // (timesteps, n_features)
      //tf.layers.dense({ units: 1, activation: "linear" }),
    ],
  });

  model.compile({
    optimizer: "adam",
    loss: "meanAbsoluteError", // meanAbsoluteError, meanSquaredError, categoricalCrossentropy
    metrics: ["mae", "mse", "acc"],
  });

  console.log(model.summary());

  model
    .fit(xTrain, yTrain, {
      epochs: 100,
      batchSize: undefined,
      shuffle: false,
      validationSplit: 0.3,
      yieldEvery: "auto",
      callbacks: {
        // onYield: async (epoch: number, batch: number, logs: tf.Logs) => {
        //   //if (batch % updateEvery === 0)
        //   updateTrainingData(epoch, batch | 0, logs.mae);
        // },
        onEpochEnd: async (epoch: number, logs: any) => {
          if (epoch % 10 === 0) console.log(`Epoch ${epoch}, ${logs.mae}`);
        },
      },
    })
    .then((info) => {
      console.log("Final error: " + info.history.val_mae.slice(-1)[0]);
    });
*/
  return (
    <Card style={{ width: "auto" }}>
      <Card.Header>Header</Card.Header>
      <Card.Body>
        <Card.Title>LSTM Test</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">A basic LSTM</Card.Subtitle>
        <Card.Text>Lore ipsum</Card.Text>
      </Card.Body>
    </Card>
  );
};

export default LSTMTest;
