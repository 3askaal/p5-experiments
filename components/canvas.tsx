import Sketch from "react-p5";
import randomColor from "randomcolor";
import { forEach, includes, isEqual, last, orderBy, random, sample, shuffle, slice, sortBy, tail, times, uniq } from 'lodash';
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
      let comparedPoints = points.map((comparingPoint) => {
        // diff between current point and comparing point
        const xDiff = point.x - comparingPoint.x
        const yDiff = point.y - comparingPoint.y

        // define distance and angle
        return {
          ...comparingPoint,
          distance: Math.sqrt(xDiff * xDiff + yDiff * yDiff),
          angle: 180 + Math.atan2(yDiff, xDiff) * (180 / Math.PI),
        }
      })

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

    let lines: L[] = []

    // draw lines between points and their surrounding points
    points = points.map((point) => {
      // point.surroundingPoints = point.surroundingPoints.reduce((acc: any[], surroundingPoint: any) => {
      //   if (!includes(surroundingPoint.surroundingPoints, point)) {
      //     acc.push(surroundingPoint)
      //   }

      //   return acc
      // }, [])

      point.surroundingPoints = point.surroundingPoints.reduce((acc: any, surroundingPoint: any, surroundingPointIndex: number) => {
        // let next = point.surroundingPoints[surroundingPointIndex + 1]

        // if (!next) {
        //   next = point.surroundingPoints[0]
        // }

        const newLine: L = [[point.x, point.y], [surroundingPoint.x, surroundingPoint.y]]

        if (!lines.some((line) => checkLinesIntersect(...newLine.flat(), ...line.flat()))) {
          lines.push(newLine)
          acc.push(surroundingPoint)
        }

        return acc
      }, [])

      return point
    })

    lines.forEach((line) => {
      const [[l1x1, l1y1], [l1x2, l1y2]] = line

      p5.line(l1x1, l1y1, l1x2, l1y2);
      p5.stroke(sample(colors) as string);
    })

    const getActualPoint = (sp: Point | SurroundingPoint): Point => {
      return points.find(({ x, y }) => isEqual([x, y], [sp.x, sp.y]))
    }

    const isSamePosition = (p1: Point | SurroundingPoint, p2: Point | SurroundingPoint): boolean => {
      return isEqual([p1.x, p1.y], [p2.x, p2.y]);
    }

    const findNext = (prevP: Point | SurroundingPoint, currentP: Point | SurroundingPoint): Point => {
      console.log('prev: ', prevP)
      console.log('current: ', currentP)

      // get actual point
      const p = getActualPoint(currentP)
      // get angle of previous point
      const previousAngle = (p.surroundingPoints.find(({ x, y }) => isEqual([x, y], [prevP.x, prevP.y]))?.angle || 0)
      const remainingSps = p.surroundingPoints.filter(({ x, y }) => !isEqual([x, y], [prevP.x, prevP.y]))
      const spsOrderedByAngle = orderBy(remainingSps, 'angle', 'desc')
      const getClosestSurrounding = spsOrderedByAngle.find((item) => item.angle < previousAngle) || spsOrderedByAngle[0]

      if (!getClosestSurrounding) throw new Error('surrounding point not found!')

      return getActualPoint(getClosestSurrounding)
    }

    const getShapes = (p: Point): any[] => {

      const shapes = [p.surroundingPoints[0]].map((sp) => {
        console.log('> for each surroundingPoint')

        let shapeDefined = false
        const shape: (Point | SurroundingPoint)[] = [p, getActualPoint(sp)]

        let tries = 1

        while (!shapeDefined) {
          console.log('> while !shapeDefined')
          tries++

          const [prevPoint, currentPoint] = shape.slice(-2)
          const newPoint: Point = findNext(prevPoint, currentPoint)
          const samePosition = isSamePosition(newPoint, p)
          console.log('samePosition: ', samePosition)

          if (!newPoint || samePosition || tries > 10) {
            shapeDefined = true
          } else {
            shape.push(newPoint)
          }
        }

        return shape
      })

      shapes.forEach((shape) => {
        p5.fill('rgba(0, 255, 0, 0.25)');

        p5.beginShape()
        shape.forEach((point) => {
          p5.vertex(point.x, point.y)
        })
        p5.endShape();
      })

      return shapes
    }

    // define shapes
    const shapes = points.reduce((acc, point, i) => {
      if (!i) {
        getShapes(point)
      }
    }, [])
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
