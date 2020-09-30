import React from "react";
import Form from "react-bootstrap/Form";
import * as htmlColors from "./HTMLColors";

const ColorControl = (props: {
  multiple?: boolean | undefined;
  name: string;
  value?: string | string[];
  onChange: any;
  colors: string[];
}) => {
  const { name, value, colors, multiple, onChange } = props;

  return (
    <Form.Control
      as="select"
      multiple={multiple}
      name={name}
      value={value}
      onChange={(e) => onChange(e)}
    >
      {colors.map((c) => (
        <option key={c}>{c}</option>
      ))}
    </Form.Control>
  );
};
export default ColorControl;
