import Sketch from "react-p5";
import randomColor from "randomcolor";
import { forEach, includes, isEqual, last, orderBy, random, sample, shuffle, slice, sortBy, tail, times, uniq } from 'lodash';
import { useEffect, useRef } from "react";
import P5 from "p5";

type X = number
type Y = number
type P = [X, Y]
type L = [P, P]

type Point = {
  x: number;
  y: number;
  i: number; // index
  surroundingPoints: SurroundingPoint[];
}

type SurroundingPoint = Omit<Point, 'surroundingPoints'> & { distance: number; angle: number; }

const getAngleToPoint = (p1: Point, p2: Point) => {
  const xDiff = p1.x - p2.x;
  const yDiff = p1.y - p2.y;
  return 180 + Math.atan2(yDiff, xDiff) * (180 / Math.PI);
}

const getDistanceToPoint = (p1: Point, p2: Point) => {
  const xDiff = p1.x - p2.x;
  const yDiff = p1.y - p2.y;
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

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

    // clear all close points
    const clearClosePoints = (distance: number) => {
      let closePoints: any[] = []

      return points.filter((point1) => {
        if (closePoints.includes(point1)) return false

        const newClosePoints = points.filter((point2) => {
          const xDistance = Math.abs(point1.x - point2.x)
          const yDistance = Math.abs(point1.y - point2.y)

          const isCurrentPoint = !xDistance && !yDistance
          const xIsToClose = xDistance < distance
          const yIsToClose = yDistance < distance

          return !isCurrentPoint && xIsToClose && yIsToClose
        })

        closePoints = [...closePoints, ...newClosePoints]

        return true
      })
    }

    points = clearClosePoints(70)

    points = points.map((point) => {
      // get distance and angle of all points compared to current point
      let comparedPoints = points.map((comparingPoint) => ({
        ...comparingPoint,
        distance: getDistanceToPoint(point, comparingPoint),
        angle: getAngleToPoint(point, comparingPoint),
      }))

      // sort on distance
      comparedPoints = sortBy(comparedPoints, ['distance'], ['desc'])

      // remove first one because it's the same position
      comparedPoints = tail(comparedPoints)

      return {
        ...point,
        // slice only closest points
        surroundingPoints: slice(comparedPoints, 0, random(5, 6))
      }
    })

    let lines: L[] = []

    // draw lines between points and their surrounding points
    points = points.map((point) => {
      point.surroundingPoints = point.surroundingPoints.reduce((acc: SurroundingPoint[], surroundingPoint: SurroundingPoint) => {
        const newLine: L = [[point.x, point.y], [surroundingPoint.x, surroundingPoint.y]]

        if (!lines.some((line) => checkLinesIntersect(...newLine.flat(), ...line.flat()))) {
          lines.push(newLine)
          acc.push(surroundingPoint)
        }

        if (lines.some((line) => isEqual(line, newLine.reverse()))) {
          acc.push(surroundingPoint)
        }

        return acc
      }, [])

      // point.surroundingPoints = point.surroundingPoints.reduce((acc: any[], surroundingPoint: any) => {
      //   if (!includes(surroundingPoint.surroundingPoints, point)) {
      //     acc.push(surroundingPoint)
      //   }

      //   return acc
      // }, [])

      return point
    })

    lines.forEach((line) => {
      const [[l1x1, l1y1], [l1x2, l1y2]] = line

      p5.line(l1x1, l1y1, l1x2, l1y2);
      p5.stroke(sample(colors) as string);
    })

    const getActualPoint = (sp: SurroundingPoint): Point => {
      return points.find(({ x, y }) => isEqual([x, y], [sp.x, sp.y]))
    }

    const isSamePosition = (p1: Point | SurroundingPoint, p2: Point | SurroundingPoint): boolean => {
      return isEqual([p1.x, p1.y], [p2.x, p2.y]);
    }

    const getClosestSurrounding = (angle: number, points: SurroundingPoint[]) => points.reduce((a, b) => {
      return Math.abs(b.angle - angle) < Math.abs(a.angle - angle) ? b : a;
    });

    const findNext = (shape: Point[]): Point | null => {
      console.log('')
      console.log(`>>>>>> findNext: # ${shape.length + 1}`)
      const [prev, current] = [...shape].slice(-2)
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

      // remove previous point from surrounding
      const remainingSurroundingPoints = orderBy(current.surroundingPoints.filter(({ x, y }) => !isEqual([x, y], [prev.x, prev.y])), 'angle', 'desc')
      console.log('remainingSurroundingPoints: ', remainingSurroundingPoints)

      const firstPoint = remainingSurroundingPoints.find(({ x, y }) => isEqual([x, y], [first.x, first.y]))
      const closestToPreviousAngle = getClosestSurrounding(angleToFirstPoint, remainingSurroundingPoints)
      const closestSurrounding = firstPoint ||
        closestToPreviousAngle ||
        remainingSurroundingPoints[0]

      // if (!getClosestSurrounding) throw new Error('surrounding point not found!')

      return closestSurrounding ? getActualPoint(closestSurrounding) : null
    }

    const getShapes = (p: Point): any[] => {
      const shapes = [p.surroundingPoints[0]].map((sp) => {
        let shapeDefined = false
        const shape = [p, getActualPoint(sp)]

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
