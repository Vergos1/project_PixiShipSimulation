import { Group, Tween, Easing } from "@tweenjs/tween.js";

const tweenGroup = new Group();

type Tweenable = { x: number; y: number; alpha: number };
type TweenProps = Partial<Pick<Tweenable, "x" | "y" | "alpha">>;

export function tickTweens(time = performance.now()) {
    tweenGroup.update(time);
}

export function tweenTo(
    target: Tweenable,
    to: TweenProps,
    duration: number,
    easing = Easing.Quadratic.InOut
) {
    return new Promise<void>((resolve) => {
        new Tween(target, tweenGroup)
            .to(to, duration)
            .easing(easing)
            .onComplete(() => resolve())
            .start();
    });
}
