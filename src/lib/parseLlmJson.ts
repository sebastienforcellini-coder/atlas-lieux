/**
 * Parse un objet JSON renvoyé par un LLM, en tolérant ses erreurs habituelles :
 * - bloc ```json ... ``` ou texte autour de l'objet
 * - guillemets doubles non échappés dans une valeur texte
 *   (ex. "description":"un cadre "Beldi Chic" avec terrasse")
 * - virgule en trop avant } ou ]
 * Renvoie null si rien d'exploitable.
 */
export function parseLlmJson<T = Record<string, unknown>>(raw: string): T | null {
  if (!raw) return null
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  const candidate = cleaned.slice(start, end + 1)

  try { return JSON.parse(candidate) as T } catch { /* on tente une réparation */ }
  try { return JSON.parse(repair(candidate)) as T } catch { return null }
}

function repair(s: string): string {
  let out = ''
  let inString = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (!inString) {
      if (c === '"') inString = true
      out += c
      continue
    }
    if (c === '\\') { out += c + (s[i + 1] ?? ''); i++; continue }
    if (c === '\n') { out += '\\n'; continue }
    if (c === '"') {
      // Fin de chaîne seulement si le prochain caractère significatif est structurel
      let j = i + 1
      while (j < s.length && /\s/.test(s[j])) j++
      const next = s[j]
      if (next === undefined || next === ',' || next === '}' || next === ']' || next === ':') {
        inString = false
        out += c
      } else {
        out += '\\"' // guillemet interne non échappé
      }
      continue
    }
    out += c
  }
  return out.replace(/,\s*([}\]])/g, '$1')
}
