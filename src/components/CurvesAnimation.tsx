// eslint-disable-next-line
import React, { useState, Fragment } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {
  FaExpand,
  FaCompress,
} from "react-icons/fa";

import * as tf from "@tensorflow/tfjs";
//import * as tfvis from "@tensorflow/tfjs-vis";

import { Point, Path } from "./commons/Types";
import LineChartControl from "./commons/LineChartControl";
import { setTimeout } from "timers";
import Accordion from "react-bootstrap/esm/Accordion";
import { Card } from "react-bootstrap";

const CurvesAnimation = (props: {
  width: number;
  height: number;
  margin: {
    top: number | 0;
    right: number | 0;
    bottom: number | 0;
    left: number | 0;
  };
  colors: {
    background: string;
    trainingData: string;
    predictionHistory: [string, string];
    prediction: string;
    mae: string;
    text: string;
  };
  title: string;
  description: string;
  xs: number[];
  ys: number[];
  model: tf.Sequential;
  modelCompileArgs: tf.ModelCompileArgs;
  epochs: number;
  batchSize: number | undefined;
  yieldEvery: number;
  updateEvery: number;
  maxHistory: number;
  drawAxis?: boolean;
  zoom?: boolean;
}) => {
  const [state, setState] = useState(props);
  const {
    width,
    height,
    margin,
    colors,
    title,
    description,
    xs,
    ys,
    model,
    modelCompileArgs,
    epochs,
    batchSize,
    yieldEvery,
    updateEvery,
    maxHistory,
    zoom = false,
    drawAxis = false,
  } = state;

  const [trainingData, setTrainingData] = useState<{
    epoch: number;
    batch: number;
    logs: any;
    predictions: Path[];
  }>({
    epoch: 0,
    batch: 0,
    logs: {},
    predictions: [],
  });

  const [modelCompiled, setModelCompiled] = useState(false);
  const [modelTraining, setModelTraining] = useState(false);
  const [timeoutBeforeTrain, setTimeoutBeforeTrain] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());

  const toggleTimeoutBeforeTrain = (_event: React.FormEvent) => {
    setTimeoutBeforeTrain(!timeoutBeforeTrain);
  };

  const toggleZoom = (_event: React.MouseEvent) => {
    setState({ ...state, zoom: !zoom });
  };

  const stopTraining = async (event: React.MouseEvent) => {
    event.preventDefault();
    model.stopTraining = true;
    setModelTraining(false);
    console.log(`Training stopped after ${trainingData.epoch} epochs`);
  };

  const compileModel = (event: React.MouseEvent) => {
    event.preventDefault();
    model.compile(modelCompileArgs);
    setModelCompiled(true);
    console.log(model.summary());
  };

  const saveModel = async (event: React.MouseEvent) => {
    event.preventDefault();
    let result = await model.save("localstorage://sine-model");
    console.log(`Saved model: ${JSON.stringify(result)}`);
  };

  const freezeLayers = async (event: React.MouseEvent) => {
    event.preventDefault();

    const layers = model.layers;
    const n = 2;
    for (let i = 0; i < layers.length - n; i++) {
      layers[i].trainable = false;
      console.log(`Freezing layer ${i}`);
    }

    // Set random values to the remaining layers
    for (let i = layers.length - n; i < layers.length; i++) {
      let weights = layers[i].getWeights();
      let newWeigths = [];
      for (let j = 0; j < weights.length; j++) {
        newWeigths.push(tf.randomUniform(weights[j].shape, -0.5, 0.5));
      }
      layers[i].setWeights(newWeigths);
      console.log(`Resetting layer ${i}`);
    }
  };

  const loadModel = async (event: React.MouseEvent) => {
    event.preventDefault();
    const name = "localstorage://sine-model";
    let m = (await tf.loadLayersModel(name)) as tf.Sequential;
    setState({ ...state, model: m });
    console.log(`Loaded model ${name}`);
  };

  const clearTraining = async (event: React.MouseEvent) => {
    event.preventDefault();
    setTrainingData({
      epoch: 0,
      batch: 0,
      logs: {},
      predictions: [],
    });
    model.layers.forEach((layer) => {
      let weights = layer.getWeights();
      weights = weights.map((w) => tf.randomUniform(w.shape, -0.5, 0.5));
      layer.setWeights(weights);
    });
  };

  const updateTrainingData = async (
    epoch: number,
    batch: number,
    logs: tf.Logs
  ) => {
    // Add new mean absolute error
    // trainingData.mae.points.push({
    //   x: epoch / epochs + (batch / epochs) * 0.01,
    //   y: meanAbsoluteError,
    // });

    tf.tidy(() => {
      const xt: number[] = [];
      for (let x = 0; x < 1.01; x += 0.01) {
        xt.push(x);
      }

      let prediction = model.predict(tf.tensor(xt)) as tf.Tensor;

      prediction.data().then((array) => {
        let path: Path = {
          key: `e${epoch}b${batch}`,
          points: [],
        };
        array.forEach((d: number, i: number) =>
          path.points.push({ x: xt[i], y: d })
        );

        trainingData.predictions.push(path);

        setTrainingData({
          ...trainingData,
          epoch,
          batch,
          logs,
        });

        if (trainingData.predictions.length > maxHistory) {
          trainingData.predictions = trainingData.predictions.filter(
            (_, i) =>
              //Number.isInteger(Math.log2(i))
              i > 10 && i % 2 === 0
          );
        }

        prediction.dispose();
      });
    });
  };

  const trainModel = async (event: React.MouseEvent) => {
    if (event) event.preventDefault();
    setModelTraining(true);

    const train = async () => {
      setStartTime(Date.now());
      await model
        .fit(tf.tensor1d(xs), tf.tensor1d(ys), {
          epochs: +epochs,
          batchSize: batchSize ? +batchSize : undefined,
          shuffle: false,
          validationSplit: 0.3,
          yieldEvery: yieldEvery ? +yieldEvery : "auto",
          callbacks: {
            // onYield: async (epoch: number, batch: number, logs: tf.Logs) => {
            //   updateTrainingData(epoch, batch | 0, logs || {});
            // },
            onEpochBegin: async (epoch: number, logs: tf.Logs | undefined) => {
              //console.time("epochs");
              if (epoch % updateEvery === 0) {
                updateTrainingData(epoch, 0, logs || {});
              }
            },

            // onEpochEnd: async (epoch: number, logs: tf.Logs | undefined) => {
            //   if (epoch % updateEvery === 0) {
            //     //console.log(logs);
            //     updateTrainingData(epoch, 0, logs || {});
            //   }
            // },

            //   //console.timeEnd("epochs");
            // },
            // onTrainEnd: async (logs: any) => {
            //   updateTrainingData(epochs, 0, logs.mae);
            // },
          },
        })
        .then((info) => {
          updateTrainingData(info.epoch.slice(-1)[0], 0, {
            mae: info.history.val_mae.slice(-1)[0] as number,
          });
          console.log("Final error: " + info.history.val_mae.slice(-1)[0]);
          setModelTraining(false);
        });
    };

    if (!timeoutBeforeTrain) {
      train();
    } else {
      setTimeout(train, 20000);
    }
  };

  const handleOnChange = (event: any) => {
    const { name, value } = event.currentTarget;
    setState({ ...state, [name]: value });
  };

  /**
   * Convert milliseconds to time string (hh:mm:ss:mss).
   *
   * @param Number ms
   *
   * @return String
   */
  const msToTime = (ms: number) => {
    return new Date(ms).toISOString().slice(11, -1);
  };

  return (
    <Fragment>
      <LineChartControl
        width={width}
        height={height}
        margin={margin}
        colors={colors}
        title={title}
        description={description}
        xs={xs}
        ys={ys}
        epoch={trainingData.epoch}
        batch={trainingData.batch}
        logs={trainingData.logs}
        predictions={trainingData.predictions}
        drawAxis={drawAxis}
        zoom={zoom}
      />

      <div className="d-flex justify-content-start mt-2">
        <Button
          variant="secondary"
          onClick={loadModel}
          disabled={modelTraining}
        >
          Load Model
        </Button>
        <Button
          variant="secondary"
          className="ml-2"
          onClick={freezeLayers}
          disabled={modelTraining}
        >
          Freeze Layers
        </Button>
        <Button
          variant="secondary"
          className="ml-2"
          onClick={compileModel}
          disabled={modelTraining}
        >
          Compile Model
        </Button>
        <Button
          variant="secondary"
          className="ml-1"
          onClick={modelTraining ? stopTraining : trainModel}
          disabled={!modelCompiled}
        >
          {modelTraining ? "Stop Training" : "Train Model"}
        </Button>
        <Button
          variant="secondary"
          className="ml-2"
          onClick={saveModel}
          disabled={modelTraining}
        >
          Save Model
        </Button>
        <Button
          variant="secondary"
          className="ml-2"
          onClick={clearTraining}
          disabled={modelTraining}
        >
          Clear Training
        </Button>
        <Button variant="secondary" className="ml-2" onClick={toggleZoom}>
          {zoom ? <FaCompress /> : <FaExpand />}
        </Button>
      </div>

      <Accordion className="mt-4" defaultActiveKey="0">
        <Card>
          <Card.Header>
            <Accordion.Toggle as={Button} variant="link" eventKey="0">
              Info
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              {" "}
              <Form className="mt-2">
                <Row>
                  <Col className="col-3">
                    Epoch: {trainingData.epoch} of {epochs}
                  </Col>
                  <Col className="col-3">Batch: {trainingData.batch}</Col>
                  <Col className="col-4">
                    Mean Absolute Error:{" "}
                    {(trainingData.logs.mae * 100).toFixed(2)}%
                  </Col>
                </Row>
                <Row>
                  <Col className="col-3">
                    Time: {msToTime(Date.now() - startTime)}
                  </Col>
                  <Col className="col-3">
                    Epochs/Minute:{" "}
                    {trainingData.epoch > 0
                      ? (
                          (trainingData.epoch / (Date.now() - startTime)) *
                          60000
                        ).toFixed(2)
                      : 0}
                  </Col>
                  <Col className="col-2">
                    History: {trainingData.predictions.length}
                  </Col>
                </Row>
                <Row>
                  <Col className="col-3">Layers: {model.layers.length}</Col>
                  <Col className="col-3">Parameters: {model.countParams()}</Col>
                </Row>
              </Form>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>

      <Accordion className="mt-4">
        <Card>
          <Card.Header>
            <Accordion.Toggle as={Button} variant="link" eventKey="0">
              Data
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey="0">
            <Card.Body></Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>

      <Accordion className="mt-4">
        <Card>
          <Card.Header>
            <Accordion.Toggle as={Button} variant="link" eventKey="0">
              Training
            </Accordion.Toggle>
          </Card.Header>
          <Accordion.Collapse eventKey="0">
            <Card.Body>
              {" "}
              <Form className="mt-2">
                <Row>
                  <Col className="col-2">
                    <Form.Group>
                      <Form.Label>Epochs</Form.Label>
                      <Form.Control
                        type="number"
                        name="epochs"
                        value={epochs}
                        disabled={modelTraining}
                        onChange={handleOnChange}
                      ></Form.Control>
                      <Form.Text>Epochs to train</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col className="col-2">
                    <Form.Group>
                      <Form.Label>Batch size</Form.Label>
                      <Form.Control
                        type="number"
                        name="batchSize"
                        value={batchSize}
                        disabled={modelTraining}
                        onChange={handleOnChange}
                      ></Form.Control>
                      <Form.Text>Epochs to train</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col className="col-2">
                    <Form.Group>
                      <Form.Label>Yield every</Form.Label>
                      <Form.Control
                        type="number"
                        name="yieldEvery"
                        value={yieldEvery}
                        disabled={modelTraining}
                        onChange={handleOnChange}
                      ></Form.Control>
                      <Form.Text>Yield every n millis</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col className="col-2">
                    <Form.Group>
                      <Form.Label>Update every</Form.Label>
                      <Form.Control
                        type="number"
                        name="updateEvery"
                        value={updateEvery}
                        disabled={modelTraining}
                        onChange={handleOnChange}
                      ></Form.Control>
                      <Form.Text>Update every n epoch</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col className="col-2">
                    <Form.Group>
                      <Form.Label>History</Form.Label>
                      <Form.Control
                        type="number"
                        name="maxHistory"
                        value={maxHistory}
                        disabled={modelTraining}
                        onChange={handleOnChange}
                      ></Form.Control>
                      <Form.Text>Maximal History</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col className="col-4">
                    <Form.Group>
                      <Form.Label>Timeout</Form.Label>
                      <Form.Check
                        type="checkbox"
                        name="timeoutBeforeTrain"
                        label="Timeout before training in millis"
                        checked={timeoutBeforeTrain}
                        onChange={toggleTimeoutBeforeTrain}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col className="col-8">
                    <Form.Group>
                      <Form.Label>Title</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={title}
                        onChange={handleOnChange}
                      ></Form.Control>
                      <Form.Text>Title of the training</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      </Accordion>
    </Fragment>
  );
};

CurvesAnimation.defaultProps = {
  width: 1920,
  height: 1080,
  label: "deep@cyin.org",
  delay: 0,
  stopTraining: false,
};

export default CurvesAnimation;
