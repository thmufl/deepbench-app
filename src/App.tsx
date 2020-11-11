// eslint-disable-next-line
import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import "./App.css";

import SideNav from "./components/SideNav";
import Home from "./components/Home";
import GradientDescentCard from "./components/GradientDescentControl";
import CurvesCard from "./components/CurvesCard";
import ColorCircleCard from "./components/ColorCircleCard";
import AtRandomAnimationCard from "./components/AtRandomAnimationCard";
import LSTMTest from "./components/LSTMTest";

function App() {
  return (
    <Container>
      <Row>
        <Col sm={2}>
          <SideNav
            items={[
              { title: "Home", path: "/home" },
              { title: "Gradient Descent", path: "/gradient-descent" },
              { title: "Curves", path: "/curves" },
              { title: "Color Circle", path: "/color-circle" },
              { title: "At Random", path: "/random" },
              { title: "Learning OR", path: "/or" },
              { title: "Learning XOR", path: "/xor" },
              { title: "LSTM Test", path: "/lstm" },
            ]}
          />
        </Col>
        <Col sm={10}>
          <Switch>
            <Route path="/home" component={Home} />
            <Route path="/gradient-descent" component={GradientDescentCard} />
            <Route path="/curves" component={CurvesCard} />
            <Route path="/color-circle" component={ColorCircleCard} />
            <Route path="/random" component={AtRandomAnimationCard} />
            <Route path="/lstm" component={LSTMTest} />

            <Redirect from="/" exact to="/home" />
            <Redirect to="/not-found" />
          </Switch>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
