import { Game, PickGroup } from "../domain/Game"
import { Ticket } from "../domain/Ticket"
import { WinningNumbersRepository } from "../repository/WinningNumbersRepository"
import { injectable, inject } from "inversify"
import { Money } from "../domain/Money"
import ContainerUtils from "../../utils/ContainerUtils"
import { Round } from "../domain/Round"

@injectable()
export class LottoMachine {
  public static PRICE_PER_GAME: Money = 1_000
  public static MAX_PURCHASE_AMOUNT = 100

  constructor(@inject(WinningNumbersRepository) private readonly winningNumbersRepository: WinningNumbersRepository) {}

  public async issue(manualPicks: PickGroup[], autoAmount: number, round?: Round): Promise<Ticket> | never {
    if (manualPicks.length + autoAmount <= 0) {
      throw new Error("먼저 번호를 입력하세요.")
    }
    return new Ticket(
        round ?? (await this.winningNumbersRepository.ofRecent()).round,
        [...manualPicks.map(x => new Game(x)), ...ContainerUtils.intRange(0, autoAmount).map(() => Game.autoGen())]
    )
  }
}
