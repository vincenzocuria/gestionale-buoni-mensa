export class ErroreCsv extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ErroreCsv"
  }
}
