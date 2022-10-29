import { useRef } from "react";
import Sketch from "react-p5";

export default function Canvas() {
  const setup = (p5: any, parentRef: any) => {
    p5.createCanvas(400, 400);
  }

  const draw = (p5: any) => {
    let x = 100;
    let y = 100;

    p5.background(0);
    p5.fill(255);
    p5.rect(x,y,50,50);
  }

  return (
    <Sketch setup={setup} draw={draw} />
  )
}
