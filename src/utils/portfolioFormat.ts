/** Small text helpers shared by the public pages. */

export const pad2 = (n: number) => String(n).padStart(2, '0')

/** "UNAMSIL - United Nations Mission in Sierra Leone - deployed three times" → parts */
export function parseOperation(operation: string) {
  const [code, ...rest] = operation.split(' - ')
  const name = rest.length > 1 ? rest.slice(0, -1).join(' - ') : rest[0] ?? ''
  const deployment = rest.length > 1 ? rest[rest.length - 1] : ''
  return {
    code: code.trim(),
    name: name.trim() || operation,
    deployment: capitalize(deployment.trim()),
    count: /three|thrice|3/i.test(deployment) ? 3 : /twice|two|2/i.test(deployment) ? 2 : 1,
  }
}

export function capitalize(text: string) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

/** "Henry Kwaku Badasu" → "Badasu" */
export function lastName(name: string) {
  return name.trim().split(/\s+/).pop() ?? name
}

/** ("Col.", "Henry Kwaku Badasu") → "Col. H. K. Badasu" */
export function shortName(shortRank: string, name: string) {
  const parts = name.trim().split(/\s+/)
  const last = parts.pop() ?? ''
  return [shortRank, ...parts.map((p) => `${p.charAt(0)}.`), last].filter(Boolean).join(' ')
}

/** "22 November 1995" → { year: "1995", rest: "22 November" } */
export function splitYear(date: string) {
  const match = date.match(/(\d{4})/)
  if (!match) return { year: date, rest: '' }
  return { year: match[1], rest: date.replace(match[1], '').replace(/[,\s]+$/, '').trim() }
}

const MONTHS = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g

/** "October 1995 - August 1997" → "Oct 1995 – Aug 1997" */
export function shortPeriod(period: string) {
  return period.replace(MONTHS, (m) => m.slice(0, 3)).replace(/\s-\s/g, ' – ')
}

export const isNotStated = (text?: string) => !text || /not stated/i.test(text)

export const isPresent = (period: string) => /present/i.test(period)

/** Pick the sentence of a paragraph that best works as a pull quote. */
export function pullQuote(paragraph: string) {
  const sentences = paragraph.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? []
  return sentences.find((s) => /commitment|dedication/i.test(s)) ?? sentences[sentences.length - 1] ?? paragraph
}
