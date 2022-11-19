import { forEach, includes, isEqual, last, orderBy, random, sample, shuffle, slice, sortBy, tail, times, uniq } from 'lodash';
import { useEffect, useRef } from "react";
import { L, Point, SurroundingPoint } from '../canvas';

export const getActualPoint = (points: Point[], sp: SurroundingPoint): Point => {
  return points.find(({ x, y }) => isEqual([x, y], [sp.x, sp.y]))!
}

export const isSamePosition = (p1: Point | SurroundingPoint, p2: Point | SurroundingPoint): boolean => {
  return isEqual([p1.x, p1.y], [p2.x, p2.y]);
}

export const getClosestSurrounding = (angle: number, points: SurroundingPoint[]) => points.reduce((a, b) => {
  return Math.abs(b.angle - angle) < Math.abs(a.angle - angle) ? b : a;
});

export const getAngleToPoint = (p1: Point, p2: Point) => {
  const xDiff = p1.x - p2.x;
  const yDiff = p1.y - p2.y;
  return 180 + Math.atan2(yDiff, xDiff) * (180 / Math.PI);
}

export const getDistanceToPoint = (p1: Point, p2: Point) => {
  const xDiff = p1.x - p2.x;
  const yDiff = p1.y - p2.y;
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
}

// clear all close points
export const clearClosePoints = (points: Point[], distance: number) => {
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

export const defineSurroundingPoints = (points: Point[]): Point[] => {
  return points.map((point) => {
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
}

export const checkLinesIntersect = (...points: number[]) => {
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

export const defineLines = (points: Point[]): L[] => {
  let lines: L[] = []

  // draw lines between points and their surrounding points
  points = points.map((point, index) => {
    point.surroundingPoints = point.surroundingPoints.reduce((acc: SurroundingPoint[], surroundingPoint: SurroundingPoint) => {
      const newLine: L = [[point.x, point.y], [surroundingPoint.x, surroundingPoint.y]]

      const lineEqualsReversed = lines.find((line) => isEqual(line, newLine.reverse()))
      const lineIntersects = lines.some((line) => checkLinesIntersect(...newLine.flat(), ...line.flat()))

      if (lineEqualsReversed || !lineIntersects) {
        lines.push(newLine)
        acc.push(surroundingPoint)
      }

      return acc
    }, [])

    return point
  })

  return lines
}
