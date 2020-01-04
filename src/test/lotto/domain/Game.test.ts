import fc from "fast-check"
import { Game, PickGroupCons, PICK_RANGE, PickedNumberCons, NUMBER_OF_PICKS } from "../../../main/lotto/domain/Game"

describe("Picked numbers are in range of 1 ~ 45", () => {
  it("Yes", () =>
    fc.assert(
        fc.property(
            fc.integer(PICK_RANGE.MIN, PICK_RANGE.MAX),
            n => expect(PickedNumberCons(n)).toEqual(n)
        )
    )
  )

  it("No: Underflow", () =>
    fc.assert(
        fc.property(
            fc.integer(Number.MIN_SAFE_INTEGER, PICK_RANGE.MIN - 1),
            n => expect(() => PickedNumberCons(n)).toThrow()
        )
    )
  )

  it("No: Overflow", () =>
    fc.assert(
        fc.property(
            fc.integer(PICK_RANGE.MAX + 1, Number.MAX_SAFE_INTEGER),
            n => expect(() => PickedNumberCons(n)).toThrow()
        )
    )
  )
})

describe("Are six numbers?", () => {
  it("Yes", () =>
    fc.assert(
        fc.property(
            fc.array(fc.integer(PICK_RANGE.MIN, PICK_RANGE.MAX), NUMBER_OF_PICKS, NUMBER_OF_PICKS),
            arr => expect(PickGroupCons(arr.map(n => PickedNumberCons(n)))).toEqual(arr)
        )
    )
  )

  it("Yes, but numbers are invalid", () =>
    fc.assert(
        fc.property(
            fc.array(fc.integer(), NUMBER_OF_PICKS, NUMBER_OF_PICKS),
            arr => expect(() => PickGroupCons(arr.map(n => PickedNumberCons(n)))).toThrow()
        )
    )
  )

  it("No: Underflow", () =>
    fc.assert(
      fc.property(
          fc.array(fc.integer(PICK_RANGE.MIN, PICK_RANGE.MAX), NUMBER_OF_PICKS - 1),
          arr => expect(() => PickGroupCons(arr.map(n => PickedNumberCons(n)))).toThrow()
      )
    )
  )

  it("No: Overflow", () =>
    fc.assert(
      fc.property(
          fc.array(fc.integer(PICK_RANGE.MIN, PICK_RANGE.MAX), NUMBER_OF_PICKS + 1, 255),
          arr => expect(() => PickGroupCons(arr.map(n => PickedNumberCons(n)))).toThrow()
      )
    )
  )
})

describe("Are numbers all different?", () => {
  it("Yes", () =>
    fc.assert(
        fc.property(
            fc.set(fc.integer(PICK_RANGE.MIN, PICK_RANGE.MAX), NUMBER_OF_PICKS, NUMBER_OF_PICKS),
            set => expect(() => new Game(PickGroupCons(set.map(n => PickedNumberCons(n))))).not.toThrow()
        )
    )
  )

  it("No", () =>
    fc.assert(
        fc.property(
            fc.array(fc.integer(), NUMBER_OF_PICKS, NUMBER_OF_PICKS),
            arr => expect(() => new Game(PickGroupCons(arr.map(n => PickedNumberCons(n))))).toThrow()
        )
    )
  )
})

describe("Is auto generation valid?", () => {
  it("Yes", () => {
    const picks = (Game.autoGen() as any).picks as ReadonlySet<number>
    expect(() => Array.from(picks.values()).every(n => PickedNumberCons(n))).not.toThrow()
    expect(picks.size).toEqual(NUMBER_OF_PICKS)
  })
})
