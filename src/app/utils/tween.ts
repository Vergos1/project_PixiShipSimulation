import { Group, Tween, Easing } from "@tweenjs/tween.js";

const tweenGroup = new Group();

type TweenProps = Record<string, number>;

export function tickTweens(time = performance.now()) {
  tweenGroup.update(time);
}

export function tweenTo(
  target: object,
  to: Partial<TweenProps>,
  duration: number,
  easing = Easing.Quadratic.InOut,
  onUpdate?: () => void,
) {
  return new Promise<void>((resolve) => {
    new Tween(target, tweenGroup)
      .to(to, duration)
      .easing(easing)
      .onUpdate(() => onUpdate?.())
      .onComplete(() => resolve())
      .start();
  });
}
