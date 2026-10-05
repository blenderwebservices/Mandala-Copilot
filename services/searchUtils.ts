/**
 * Utilidades para búsqueda y filtrado de texto insensible a acentos, diacríticos y mayúsculas/minúsculas.
 */

/**
 * Normaliza una cadena de texto eliminando marcas diacríticas (tildes, diéresis, etc.)
 * y convirtiendo el contenido a minúsculas para comparaciones flexibles.
 * 
 * Ejemplos:
 * - "método" -> "metodo"
 * - "HÁBITOS" -> "habitos"
 * - "operación" -> "operacion"
 * - "diseño" -> "diseno"
 */
export const normalizeText = (text?: string | null): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

/**
 * Evalúa si `targetText` coincide con `queryText` de forma insensible a acentos y mayúsculas.
 * Soporta coincidencia directa de subcadena y coincidencia multi-término (todas las palabras presentes).
 * 
 * @param targetText Texto donde se busca (ej: título de la acción, notas, etc.)
 * @param queryText Término ingresado por el usuario en el buscador
 * @returns true si coincide o si queryText está vacío; false en caso contrario.
 */
export const matchTextAccentInsensitive = (
  targetText?: string | null,
  queryText?: string | null
): boolean => {
  if (!queryText || !queryText.trim()) return true;
  if (!targetText) return false;

  const normTarget = normalizeText(targetText);
  const normQuery = normalizeText(queryText);

  // Coincidencia exacta de subcadena
  if (normTarget.includes(normQuery)) return true;

  // Coincidencia multi-término (todas las palabras ingresadas deben estar en el texto)
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length > 1) {
    return queryTokens.every((token) => normTarget.includes(token));
  }

  return false;
};

/**
 * Evalúa si alguna de las propiedades de texto proporcionadas coincide con `queryText`.
 */
export const matchAnyTextAccentInsensitive = (
  targets: (string | null | undefined)[],
  queryText?: string | null
): boolean => {
  if (!queryText || !queryText.trim()) return true;
  return targets.some((target) => matchTextAccentInsensitive(target, queryText));
};
