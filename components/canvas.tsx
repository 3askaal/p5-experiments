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

    // const uniquePoints: number[][] = uniq(lines.flat().map((point) => sortBy(point)))

    // console.log(uniquePoints)

    // points.forEach((p: any) => {
    //   console.log(p)

    //   p.surroundingPoints.map((surroundingPoint: any) => {

    //   })
    // })

    // const getNextSurroundingPointCW = (initP: Point, sp: SurroundingPoint): any => {

    //   // const sps = p.surroundingPoints
    //   //   .map(({ x: spx, y: spy }) => {
    //   //     return points.find(({ x, y }) => isEqual([x, y], [sp.x, sp.y]))
    //   //   })
    //   //   .sort((p) => p.angle > point.angle ? 1 : -1)[0]

    //   const point = points.find(({ x, y }) => isEqual([x, y], [sp.x, sp.y]))


    //   // const next = point.surroundingPoints
    //   // console.log(next)

    //   const shapeComplete = isEqual(next, initP)

    //   return shapeComplete ? shape : getNextSurroundingPointCW(initP, next)
    // }

    const dotColors = ['yellow', 'green', 'blue', 'red', 'purple', 'cyan']

    const getActualPoint = (sp: Point | SurroundingPoint): Point => {
      return points.find(({ x, y }) => isEqual([x, y], [sp.x, sp.y]))
    }

    const getNewSurroundingPoints = (sp: SurroundingPoint): SurroundingPoint[] => {
      return getActualPoint(sp).surroundingPoints
    }

    const getClosestSp = (sps: SurroundingPoint[], x: number): SurroundingPoint => {
      return sps.reduce((acc, current) => (current.angle >= x && (!acc || current.angle < acc.angle)) ? current : acc, sps[0]);
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
      // console.log('previousAngle: ', previousAngle);
      // get remaining surrounding points
      const remainingSps = p.surroundingPoints.filter(({ x, y }) => !isEqual([x, y], [prevP.x, prevP.y]))
      // console.log('remainingSps: ', remainingSps);
      // find surrounding point based on angle of previous
      // const getClosestSurrounding = getClosestSp(remainingSps, previousAngle)
      // const getClosestSurrounding = getClosestSp(remainingSps, previousAngle)
      const getClosestSurrounding = orderBy(remainingSps, 'angle', 'desc').find((item) => item.angle < previousAngle)!

      return getActualPoint(getClosestSurrounding)
    }

    const getShapes = (p: Point): any[] => {

      const shapes = [p.surroundingPoints[0]].map((sp) => {
        console.log('> for each surroundingPoint')

        let shapeDefined = false
        const shape: (Point | SurroundingPoint)[] = [p, getActualPoint(sp)]

        let tries = 1

        p5.stroke('red');
        p5.strokeWeight(5);
        p5.point(p.x, p.y);

        p5.stroke('green');
        p5.strokeWeight(5);
        p5.point(sp.x, sp.y);

        while (!shapeDefined) {
          console.log('> while !shapeDefined')
          tries++

          const [prevPoint, currentPoint] = shape.slice(-2)
          const newPoint: Point = findNext(prevPoint, currentPoint)
          const samePosition = isSamePosition(newPoint, p)
          console.log('samePosition: ', samePosition)

          if (samePosition || tries > 10) {
            shapeDefined = true
          } else {
            p5.stroke('white');
            p5.strokeWeight(2 * tries);
            p5.point(newPoint.x, newPoint.y);
            shape.push(newPoint)
          }
        }

        return shape
      })

      console.log('shapes: ', shapes)


      // p.surroundingPoints.forEach((sp, index) => {

      // const testSp = p.surroundingPoints[0]
      // p5.stroke('red');
      // p5.strokeWeight(10);
      // p5.point(testSp.x, testSp.y);

      // const nextPoint = getPointForSurroundingPoint(testSp);
      // const previousAngle = nextPoint.surroundingPoints.filter(({ x, y }) => isEqual([x, y], [p.x, p.y]))[0]?.angle
      // const remainingSps = nextPoint.surroundingPoints.filter(({ x, y }) => !isEqual([x, y], [p.x, p.y]))

      // const nextSurrounding = findClosest(remainingSps, previousAngle)

      // console.log('nextSurrounding: ', nextSurrounding)

      // if (nextSurrounding) {
      //   p5.stroke('green');
      //   p5.strokeWeight(5);
      //   p5.point(nextSurrounding.x, nextSurrounding.y);
      // }

      // const nextPoint2 = getPointForSurroundingPoint(nextSurrounding);
      // const previousAngle2 = nextPoint2.surroundingPoints.filter(({ x, y }) => isEqual([x, y], [p.x, p.y]))[0]?.angle
      // const remainingSps2 = nextPoint2.surroundingPoints.filter(({ x, y }) => !isEqual([x, y], [p.x, p.y]))

      // const nextSurrounding2 = findClosest(remainingSps2, previousAngle2)

      // if (nextSurrounding2) {
      //   p5.stroke('blue');
      //   p5.strokeWeight(5);
      //   p5.point(nextSurrounding2.x, nextSurrounding2.y);
      // }

        // console.log('sp: #', nextPoint.i, dotColors[index], sp.angle, previousAngle)
      // })

      return shapes
    }

    // define shapes
    const shapes = points.reduce((acc, point, i) => {

      // console.log(point)
      const p: [number, number] = [point.x, point.y];


      if (!i) {
        getShapes(point)

        // draw dots on surrounding points
        // point.surroundingPoints.forEach((surroundingPoint: any, index: number) => {
        //   const sp: [number, number] = [surroundingPoint.x, surroundingPoint.y]

        //   if (!index) {
        //     p5.stroke(dotColors[index]);
        //     p5.strokeWeight(10);
        //     p5.point(...sp);
        //   }
        // })
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
