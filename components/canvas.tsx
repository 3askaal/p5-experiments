import Sketch from "react-p5";
import randomColor from "randomcolor";
import { forEach, includes, random, sample, remove, slice, sortBy, tail, times } from 'lodash';
import { useEffect, useRef } from "react";
import type P5 from "p5";

export default function Canvas() {

  const setup = (p5: P5) => {
    const canvasWidth = window.innerWidth * 1
    const canvasHeight = window.innerHeight * 1
    p5.createCanvas(canvasWidth, canvasHeight);
  }

  const draw = (p5: P5) => {
    p5.noLoop();

    const canvasWidth = p5.width
    const canvasHeight = p5.height

    // const colors = randomColor({ hue: hue.value, luminosity: luminosity.value, count: 180 })
    const colors = randomColor({ hue: 'blue', luminosity: undefined, count: 180 })

    let points: any[] = []

    const amountPoints = Math.round((canvasWidth + canvasHeight) / 8)

    times(amountPoints, (i) => {
      const x = random(50, canvasWidth - 50)
      const y = random(50, canvasHeight - 50)
      points.push({ x, y, i })
    })

    // clear all close points
    function clearClosePoints(distance: number) {
      points.forEach((point1) => {
        remove(points, (point2) => {
          const xDistance = Math.abs(point1.x - point2.x)
          const yDistance = Math.abs(point1.y - point2.y)

          const isCurrentPoint = !xDistance && !yDistance
          const xIsToClose = xDistance < distance
          const yIsToClose = yDistance < distance

          return !isCurrentPoint && xIsToClose && yIsToClose
        })
      })
    }

    clearClosePoints(80)

    points.forEach((point) => {
      // get distance and angle of all points compared to current point
      let comparedPoints = forEach(points.concat(), (comparingPoint) => {

        // diff between current point and comparing point
        const xDiff = point.x - comparingPoint.x
        const yDiff = point.y - comparingPoint.y

        // define distance and angle
        comparingPoint.distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff)
        comparingPoint.angle = Math.atan2(yDiff, xDiff) * (180 / Math.PI)
      })

      // sort on distance
      comparedPoints = sortBy(comparedPoints, ['distance'], ['desc'])

      // remove first one because it's the same position
      comparedPoints = tail(comparedPoints)

      // slice only closest points
      point.surroundingPoints = slice(comparedPoints, 0, 6)
    })

    const lines: number[][][] = []

    // draw lines between points and their surrounding points
    points.forEach((point, pointIndex) => {
      remove(point.surroundingPoints, (surroundingPoint: any, surroundingPointIndex) => {
        if (!includes(surroundingPoint.surroundingPoints, point)) {
          return true
        }
      })

      point.surroundingPoints.forEach((surroundingPoint: any, surroundingPointIndex: number) => {
        let next = point.surroundingPoints[surroundingPointIndex+1]

        if (!next) {
          next = point.surroundingPoints[0]
        }

        lines.push([[point.x, point.y], [surroundingPoint.x, surroundingPoint.y]])
      })
    })

    // clear crossing lines
    const linesToDraw = lines.filter((line1) => {
      const [[l1x1, l1y1], [l1x2, l1y2]] = line1

      return !lines.some((line2) => {
        const [[l2x1, l2y1], [l2x2, l2y2]] = line2

        return checkLinesIntersect(l1x1, l1y1, l1x2, l1y2, l2x1, l2y1, l2x2, l2y2)
      })
    })

    linesToDraw.forEach((line) => {
      const [[l1x1, l1y1], [l1x2, l1y2]] = line

      p5.line(l1x1, l1y1, l1x2, l1y2);
      p5.stroke(sample(colors) as string);
    })
  }

  const checkLinesIntersect = (...points: number[]) => {
    const [a,b,c,d,p,q,r,s] = points;

    let det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);

    if (det === 0) {
      return false;
    } else {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
      return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
  }

  return (
    <Sketch setup={setup} draw={draw} />
  )
}
