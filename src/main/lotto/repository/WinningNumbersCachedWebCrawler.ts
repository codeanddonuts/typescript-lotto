import { Round } from "../domain/Round"
import { WinningNumbers } from "../domain/WinningNumbers"
import { Game, PickedNumberCons, PicksCons, PickedNumber } from "../domain/Game"
import axios from "axios"
import { Maybe } from "../../utils/Maybe"
import { PromiseMaybeTransformer } from "../../utils/MaybeT"
import * as iconv from "iconv-lite"
import { injectable } from "inversify"
import { getConnection, Entity, PrimaryColumn, Column } from "typeorm"
import { WinningNumbersRepository } from "./WinningNumbersRepository"

@injectable()
export class WinningNumbersCachedWebCrawler implements WinningNumbersRepository {
  private static readonly FETCH_URL = "https://m.dhlottery.co.kr/gameResult.do?method=byWin"
  private static readonly ROUND_ATTR = "&drwNo="

  private readonly cache = getConnection().getRepository(WinningNumbersEntity)

  public async of(round: Round): Promise<WinningNumbers> | never {
    try {
      return this.retrieveFromCacheOrParseNew(round)
    } catch (e) {
      console.log(e)
      throw new Error(`${round}회차의 당첨 번호를 가져오는 데에 실패하였습니다.`)
    }
  }

  public async recent(): Promise<WinningNumbers> | never {
    try {
      const responseBody = await this.requestFromWeb()
      return Maybe.cons(responseBody.match(/<option value="\d+"  >/)?.shift())
                  .map(str => new Round(parseInt(str.substring(15, str.indexOf("  >")))))
                  .map(round => this.retrieveFromCacheOrParseNew(round, responseBody))
                  .getOrThrow()
    } catch (e) {
      throw new Error("최신 당첨 번호를 가져오는 데에 실패하였습니다.")
    }
  }

  private async retrieveFromCacheOrParseNew(round: Round, responseBody?: string): Promise<WinningNumbers> {
    return PromiseMaybeTransformer.fromNullable(this.cache.findOne({ where: { round: round.val }, cache: true }))
                                  .map(entity => WinningNumbersEntityAdapter.convertEntityToWinningNumbers(entity))
                                  .getOrElse(async () => {
                                    const winningNumbers = this.parseHtml(round, responseBody ?? await this.requestFromWeb(round))
                                    this.cache.save(WinningNumbersEntityAdapter.convertWinningNumbersToEntity(winningNumbers))
                                    return winningNumbers
                                  })
  }

  private async requestFromWeb(round?: Round): Promise<string> | never {
    const url = WinningNumbersCachedWebCrawler.FETCH_URL + (round ? WinningNumbersCachedWebCrawler.ROUND_ATTR + round : "")
    return iconv.decode(
      (await axios.get(url, { responseType: "arraybuffer" })).data,
      "euc-kr"
    ).toString()
  }

  private parseHtml(round: Round, responseBody: string): WinningNumbers | never {
    return Maybe.cons(responseBody.match(/>\d+<\/span>/g)?.map(x => parseInt(x.substring(1, x.indexOf("</span>")))))
                .bind(numbers =>
                  Maybe.cons(numbers.pop())
                       .map(bonus => ({ mains: numbers, bonus: bonus }))
                ).map(winningNumbers =>
                  new WinningNumbers(
                      round,
                      new Game(PicksCons(winningNumbers.mains.map(n => PickedNumberCons(n)))),
                      PickedNumberCons(winningNumbers.bonus)
                  )
                ).getOrThrow()
  }
}

@Entity("winning_numbers")
export class WinningNumbersEntity {
  @PrimaryColumn()
  round!: number
  @Column()
  first!: PickedNumber
  @Column()
  second!: PickedNumber
  @Column()
  third!: PickedNumber
  @Column()
  fourth!: PickedNumber
  @Column()
  fifth!: PickedNumber
  @Column()
  sixth!: PickedNumber
  @Column()
  bonus!: PickedNumber

  private constructor() {}
}

export class WinningNumbersEntityAdapter {
  public static convertEntityToWinningNumbers(entity: WinningNumbersEntity): WinningNumbers {
    return new WinningNumbers(
        new Round(entity.round),
        new Game([entity.first, entity.second, entity.third, entity.fourth, entity.fifth, entity.sixth]),
        entity.bonus
    )
  }

  public static convertWinningNumbersToEntity(winningNumbers: WinningNumbers): WinningNumbersEntity {
    return {
      round: winningNumbers.round.val,
      first: winningNumbers.mains.getNthPick(1),
      second: winningNumbers.mains.getNthPick(2),
      third: winningNumbers.mains.getNthPick(3),
      fourth: winningNumbers.mains.getNthPick(4),
      fifth: winningNumbers.mains.getNthPick(5),
      sixth: winningNumbers.mains.getNthPick(6),
      bonus: winningNumbers.bonus
    }
  }
}
