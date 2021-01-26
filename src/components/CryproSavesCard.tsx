// eslint-disable-next-line
import React from "react"
import Card from "react-bootstrap/Card"

import CryptoSavesEnvironment from "../cryptosaves/CryptoSavesEnvironment"
import CryptoSavesAgent from "../cryptosaves/CryptoSavesAgent"
import CryptoSavesComponent from "./CryptoSavesComponent"

const CryptoSavesCard = () => {

    const environment = new CryptoSavesEnvironment({day: 0, date: "1970-01-01", eur: 10000, btc: 0, saves: 0, value: 10000, action: {type: "HOLD", amount: 1.0}}, 0.025)
    const agent = new CryptoSavesAgent(environment)

    return (
        <Card style={{ width: "auto" }}>
            <Card.Header>Header</Card.Header>
            <Card.Body>
            <Card.Title>Crypto Saves</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
            Reinforcement learning of an agent for crypto currency trading and saving.
            </Card.Subtitle>
            <Card.Text>
            Lorem ipsum dolor
            </Card.Text>
            <CryptoSavesComponent agent={agent} width={1920/2.2} height={1080/2.2} />
            <br />
            <Card.Link href="#">Card Link</Card.Link>
            </Card.Body>
            <Card.Footer>Footer</Card.Footer>
        </Card>
    )
}

export default CryptoSavesCard