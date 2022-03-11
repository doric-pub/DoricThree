import * as Three from "Three";
/*********************************/
/********** INTERPOLATION ********/
/*********************************/
export declare class GLTFCubicSplineInterpolant extends Three.Interpolant {
    [x: string]: any;
    constructor(parameterPositions: any, sampleValues: any, sampleSize: number, resultBuffer?: any);
    copySampleValue_(index: number): any;
}
export declare class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {
    interpolate_(i1: number, t0: number, t: number, t1: number): any;
}
