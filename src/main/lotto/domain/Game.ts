import ContainerUtils from "../../utils/ContainerUtils"
import { UserInputError } from "apollo-server-koa"

export const enum PICK_RANGE {
  MIN = 1,
  MAX = 45
}

export type PickedNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
    | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27
    | 28 | 29 | 30 | 31 | 32 | 33 | 34 | 35 | 36
    | 37 | 38 | 39 | 40 | 41 | 42 | 43 | 44 | 45

export const PickedNumberCons = (n: number): PickedNumber | never => {
  if (PICK_RANGE.MIN <= n && n <= PICK_RANGE.MAX) {
    return n as PickedNumber
  }
  throw new UserInputError("1에서 45 범위의 숫자를 입력해주시기 바랍니다.")
}

export const NUMBER_OF_PICKS = 6

type IndicesOfPicks = 1 | 2 | 3 | 4 | 5 | 6

export type NumberOfMatches = 0 | IndicesOfPicks

type ArrayOfSixElements<T> = [T, T, T, T, T, T]

export type PickGroup = ArrayOfSixElements<PickedNumber>

export const PickGroupCons = (pickedNumbers: PickedNumber[]): PickGroup | never => {
  if (pickedNumbers.length === NUMBER_OF_PICKS) {
    return pickedNumbers as PickGroup
  }
  throw new UserInputError("6개의 숫자만을 입력해주시기 바랍니다.")
}

export class Game {
  private static readonly BALLS: PickedNumber[] = ContainerUtils.intRangeClosed(PICK_RANGE.MIN, PICK_RANGE.MAX)
                                                                .map(n => PickedNumberCons(n))
  
  private readonly picks: ReadonlySet<PickedNumber>

  public static autoGen(): Game {
    return new Game(PickGroupCons(ContainerUtils.shuffle(this.BALLS).slice(0, NUMBER_OF_PICKS)))
  }

  constructor(pickGroup: PickGroup) {
    if (ContainerUtils.hasOnlyDistinctElements(pickGroup)) {
      this.picks = new Set(pickGroup.sort((a, b) => a - b))
    } else {
      throw new UserInputError("각기 다른 번호를 입력해주세요.")
    }
  }

  public numberOfMatchesTo(rhs: Game): NumberOfMatches {
    return ContainerUtils.intersection(this.picks, rhs.picks).size as NumberOfMatches
  }
  
  public contains(n: PickedNumber): boolean {
    return this.picks.has(n)
  }

  public getNthPick(i: IndicesOfPicks): PickedNumber {
    return [...this.picks.values()][i - 1]
  }
}
