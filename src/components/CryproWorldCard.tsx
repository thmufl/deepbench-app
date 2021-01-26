// eslint-disable-next-line
import React from "react"
import Card from "react-bootstrap/Card"

import CryptoWorldEnvironment from "../cryptoworld/CryptoWorldEnvironment"
import CryptoWorldAgent from "../cryptoworld/CryptoWorldAgent"
import CryptoWorldComponent from "./CryptoWorldComponent"

const CryptoWorldCard = () => {

    const environment = new CryptoWorldEnvironment({day: 0, date: "1970-01-01", eur: 10000, btc: 0, open: 0, value: 10000, action: {type: "NULL", amount: 1.0}}, 0.025)
    const agent = new CryptoWorldAgent(environment)
    return (
        <Card style={{ width: "auto" }}>
            <Card.Header>Header</Card.Header>
            <Card.Body>
            <Card.Title>Crypto World</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
            Reinforcement learning of a crypto currency trading agent.
            </Card.Subtitle>
            <Card.Text>
            Lorem ipsum dolor
            </Card.Text>
            <CryptoWorldComponent agent={agent} width={1920/2.2} height={1080/2.2} />
            <br />
            <Card.Link href="#">Card Link</Card.Link>
            </Card.Body>
            <Card.Footer>Footer</Card.Footer>
        </Card>
    )
}

export default CryptoWorldCard