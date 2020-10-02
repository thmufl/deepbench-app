// eslint-disable-next-line
import React, { useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import ColorControl from "./ColorControl";

const AnimationSettingsForm = (props: {
  onChange: any;
  palette: {
    background: string[];
    a: string[];
    b: string[];
    label: string[];
  };
  colorBackground: string;
  colorA: string;
  colorB: string;
  opacityA: number;
  opacityB: number;
  animateScale: number;
  animateInterval: number;
  label?: string;
  colorLabel?: string;
}) => {
  return (
    <Form className="mt-3">
      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Background</Form.Label>
            <ColorControl
              name="colorBackground"
              value={props.colorBackground}
              onChange={props.onChange}
              colors={props.palette.background.concat(["random"])}
            />
            <Form.Text>Background color.</Form.Text>
          </Form.Group>
        </Col>

        <Col>
          <Form.Group>
            <Form.Label>Color A</Form.Label>
            <ColorControl
              name="colorA"
              value={props.colorA}
              onChange={props.onChange}
              colors={props.palette.a.concat(["random"])}
            />
            <Form.Text>First color</Form.Text>
          </Form.Group>
        </Col>

        <Col>
          <Form.Group>
            <Form.Label>Color B</Form.Label>
            <ColorControl
              name="colorB"
              value={props.colorB}
              onChange={props.onChange}
              colors={props.palette.b.concat(["random"])}
            />
            <Form.Text>Second color</Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col></Col>
        <Col>
          <Form.Group>
            <Form.Label>Opacity A</Form.Label>
            <Form.Control
              type="number"
              step={0.01}
              name="opacityA"
              value={props.opacityA}
              onChange={props.onChange}
            />
            <Form.Text>First opacity</Form.Text>
          </Form.Group>
        </Col>
        <Col>
          <Form.Group>
            <Form.Label>Opacity B</Form.Label>
            <Form.Control
              type="number"
              step={0.01}
              name="opacityB"
              value={props.opacityB}
              onChange={props.onChange}
            />
            <Form.Text>Second opacity</Form.Text>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col></Col>
        <Col>
          <Form.Group>
            <Form.Label>Animate Scale</Form.Label>
            <Form.Control
              type="number"
              step={0.01}
              name="animateScale"
              value={props.animateScale}
              onChange={props.onChange}
            ></Form.Control>
            <Form.Text>Scale per animation cycle.</Form.Text>
          </Form.Group>
        </Col>

        <Col>
          <Form.Group>
            <Form.Label>Animation Interval</Form.Label>
            <Form.Control
              type="number"
              step={100}
              name="animateInterval"
              value={props.animateInterval}
              onChange={props.onChange}
            ></Form.Control>
            <Form.Text>The animation interval in milliseconds.</Form.Text>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col className="col-8">
          <Form.Group>
            <Form.Label>Label</Form.Label>
            <Form.Control
              type="text"
              name="label"
              value={props.label}
              onChange={props.onChange}
            ></Form.Control>
            <Form.Text>Label of the animation.</Form.Text>
          </Form.Group>
        </Col>
        <Col>
          <Form.Group>
            <Form.Label>Label Color</Form.Label>
            <ColorControl
              name="colorLabel"
              value={props.colorLabel}
              onChange={props.onChange}
              colors={props.palette.label}
            />
            <Form.Text>Color of the label.</Form.Text>
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};
export default AnimationSettingsForm;
