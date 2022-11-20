import Sketch from "react-p5";
import randomColor from "randomcolor";
import { forEach, includes, isEqual, last, orderBy, random, sample, shuffle, slice, sortBy, tail, times, uniq } from 'lodash';
import { useEffect, useRef } from "react";
import P5 from "p5";
import { clearClosePoints, defineLines, defineSurroundingPoints, getActualPoint, getAngleToPoint, getClosestSurrounding, getClosestSurroundingBasedOnDirection, isSamePosition } from "./helpers/points";

export type X = number
export type Y = number
export type P = [X, Y]
export type L = [P, P]

export type Point = {
  x: number;
  y: number;
  i: number; // index
  surroundingPoints: SurroundingPoint[];
}

export type SurroundingPoint = Omit<Point, 'surroundingPoints'> & { distance: number; angle: number; }

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
    const colors = randomColor({ hue: 'blue', luminosity: 'bright', count: 180, format: 'rgba', alpha: 0.25 })

    const amountPoints = Math.round((canvasWidth + canvasHeight) / 8)

    let points: any[] = times(amountPoints, (i) => {
      const x = random(50, canvasWidth - 50)
      const y = random(50, canvasHeight - 50)

      return { x, y, i }
    })

    points = clearClosePoints(points, 70)
    points = defineSurroundingPoints(points)

    const lines = defineLines(points)

    lines.forEach((line) => {
      const [[p1x, p1y], [p2x, p2y]] = line

      p5.line(p1x, p1y, p2x, p2y);
      p5.stroke(sample(colors) as string);
    })

    const findNext = (shape: Point[]): Point | null => {
      console.log('')
      console.log(`>>>>>> findNext @ ${shape.length}`)
      const [prev, current] = shape.slice(-2)
      const first = shape[0]

      console.log(`first: `, [shape[0].x, shape[0].y])
      if (shape.length > 2) {
        console.log(`prev: `, [prev.x, prev.y])
      }

      console.log(`current: `, [current.x, current.y])

      // get angle of previous point
      const angleToPreviousPoint = getAngleToPoint(current, prev)

      const angleToFirstPoint = getAngleToPoint(current, first)
      console.log('angleToFirstPoint: ', angleToFirstPoint)

      const actualSurroundingPointAmount = [...current.surroundingPoints].length
      console.log('actualSurroundingPointAmount: ', actualSurroundingPointAmount);

      // remove previous point from surrounding
      const remainingSurroundingPoints = orderBy(current.surroundingPoints.filter(({ x, y }) => !isEqual([x, y], [prev.x, prev.y])), 'angle', 'desc')
      console.log('remainingSurroundingPoints: ', remainingSurroundingPoints)

      const firstPoint = remainingSurroundingPoints.find(({ x, y }) => isEqual([x, y], [first.x, first.y]))
      const closestToPreviousAngle = getClosestSurroundingBasedOnDirection(angleToFirstPoint, remainingSurroundingPoints, 'CW')
      const closestSurrounding = firstPoint ||
        closestToPreviousAngle ||
        remainingSurroundingPoints[0]

      // if (!getClosestSurrounding) throw new Error('surrounding point not found!')

      return closestSurrounding ? getActualPoint(points, closestSurrounding) : null
    }

    const getShapes = (p: Point): any[] => {
      const shapes = [p.surroundingPoints[0]].map((sp) => {
        let shapeDefined = false
        const shape = [p, getActualPoint(points, sp)]

        let tries = 1

        while (!shapeDefined) {
          tries++
          const newPoint: Point | null = findNext(shape)
          const samePosition = newPoint && isSamePosition(newPoint, p)

          if (!newPoint || samePosition || tries > 10) {
            shapeDefined = true
          }

          if (newPoint) {
            shape.push(newPoint)
          }
        }

        return shape
      }).flat()

      return shapes
    }

    // define shapes
    const shapes = points.map((point, i) => {
      if (!i) return getShapes(point);
      return [];
    })

    console.log('shapes: ', shapes)

    p5.strokeWeight(0)

    shapes.forEach((shape) => {
      p5.beginShape()
      p5.fill(sample(colors) || '');

      shape.forEach((point, index) => {
        p5.vertex(point.x, point.y)
        p5.stroke('white');
        p5.strokeWeight(10 - (2 * index));
        p5.point(point.x, point.y);
        p5.strokeWeight(0)
      })

      p5.endShape();
    })
  }

  return (
    <Sketch setup={setup} draw={draw} />
  )
}
