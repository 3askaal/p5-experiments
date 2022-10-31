import Sketch from "react-p5";
import randomColor from "randomcolor";
import { forEach, includes, isEqual, random, sample, shuffle, slice, sortBy, tail, times, uniq } from 'lodash';
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
          angle: Math.atan2(yDiff, xDiff) * (180 / Math.PI),
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

    let lines: number[][][] = []

    // draw lines between points and their surrounding points
    points = points.map((point) => {
      point.surroundingPoints = point.surroundingPoints.reduce((acc: any[], surroundingPoint: any) => {
        if (!includes(surroundingPoint.surroundingPoints, point)) {
          acc.push(surroundingPoint)
        }

        return acc
      }, [])

      point.surroundingPoints.forEach((surroundingPoint: any, surroundingPointIndex: number) => {
        let next = point.surroundingPoints[surroundingPointIndex+1]

        if (!next) {
          next = point.surroundingPoints[0]
        }

        const newLine = [[point.x, point.y], [surroundingPoint.x, surroundingPoint.y]]

        if (!lines.some((line) => checkLinesIntersect(
          newLine[0][0], newLine[0][1], newLine[1][0], newLine[1][1],
          line[0][0], line[0][1], line[1][0], line[1][1],
        ))) {
          lines.push(newLine)
        }

      })

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

    const getNextSurroundingPointCW = (initP: any, p: any): any => {
      const shape: any[] = []

      const sp: [number, number] = [p.x, p.y]
      const point = points.find(({x, y}) => isEqual([x, y], sp))

      const next = point.surroundingPoints.sort((p: any) => p.angle > sp.angle ? 1 : -1)[0]
      console.log(next)

      const shapeComplete = isEqual(next, initP)

      return shapeComplete ? shape : getNextSurroundingPointCW(initP, next)
    }

    // define shapes
    const shapes = points.reduce((acc, point, i) => {

      // console.log(point)
      const p: [number, number] = [point.x, point.y]

      if (!i) {
        p5.stroke('white');
        p5.strokeWeight(10);
        p5.point(...p);
        console.log(point);

        // getNextSurroundingPointCW(point, point)

        point.surroundingPoints.map((surroundingPoint: any) => {
          const sp: [number, number] = [surroundingPoint.x, surroundingPoint.y]
          const point = points.find(({x, y}) => isEqual([x, y], sp))

          p5.stroke('red');
          p5.strokeWeight(5);
          p5.point(...sp);
        })
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
