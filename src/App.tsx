import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import "./App.css";

import SideNav from "./components/SideNav";
import Home from "./components/Home";
import CirclesAnimationCard from "./components/CirclesAnimationCard";
import AtRandomAnimationCard from "./components/AtRandomAnimationCard";

function App() {
  return (
    <Container>
      <Row>
        <Col sm={2}>
          <SideNav
            items={[
              { title: "Home", path: "/home" },
              { title: "Circles", path: "/circles" },
              { title: "At Random", path: "/random" },
              { title: "Learning OR", path: "/or" },
              { title: "Learning XOR", path: "/xor" },
            ]}
          />
        </Col>
        <Col sm={10}>
          <Switch>
            <Route path="/home" component={Home} />
            <Route path="/circles" component={CirclesAnimationCard} />
            <Route path="/random" component={AtRandomAnimationCard} />

            <Redirect from="/" exact to="/home" />
            <Redirect to="/not-found" />
          </Switch>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
