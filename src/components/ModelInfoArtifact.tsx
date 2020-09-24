import * as React from "react";

import Form from "react-bootstrap/Form";

//type AppProps = { json: string }; /* could also use interface */

const ModelInfoArtifact = (props: { url: string }) => {
  //const [name, setName] = React.useState<String>("initial");

  const handleOnChange = (e: React.ChangeEvent) => {
    console.log("handleOnChange", e);
  };
  return (
    <React.Fragment>
      <Form.Group controlId="formUrl">
        <Form.Label>url</Form.Label>
        <Form.Control
          type="text"
          value={props.url}
          onChange={(e) => handleOnChange(e)}
          placeholder="Enter url"
        />
      </Form.Group>

      <Form.Group controlId="formItem">
        <Form.Label>item</Form.Label>
        <Form.Control
          as="textarea"
          rows={5}
          value={
            localStorage.getItem("tensorflowjs_models/my-model/info") || ""
          }
          onChange={(e) => handleOnChange(e)}
          placeholder="Enter item"
        />
      </Form.Group>
    </React.Fragment>
  );
};
export default ModelInfoArtifact;

// json={localStorage.getItem("tensorflowjs_models/my-model/info")}
