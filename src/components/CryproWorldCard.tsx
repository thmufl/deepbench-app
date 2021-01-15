// eslint-disable-next-line
import React from "react"
import Card from "react-bootstrap/Card"

import CryptoWorldEnvironment from "../cryptoworld/CryptoWorldEnvironment"

const CryptoWorldCard = () => {

    const environment = new CryptoWorldEnvironment(0, [6], [9])

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

            <br />
            <Card.Link href="#">Card Link</Card.Link>
            </Card.Body>
            <Card.Footer>Footer</Card.Footer>
        </Card>
    )
}

export default CryptoWorldCard