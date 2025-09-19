/**
 * Carga un archivo JSON y devuelve su contenido.
 * @param {string} url - La URL del archivo JSON.
 * @returns {Promise<Object|null>} Una promesa que resuelve con el objeto JSON o null en caso de error.
 */
async function loadJson (url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error al cargar el JSON:', error)
    return null
  }
}

/**
 * Extrae los idiomas disponibles del objeto de datos.
 * @param {Object} data - El objeto de datos.
 * @returns {Array<Object>} Un array de objetos con el nombre y el ID de cada idioma.
 */
function getAvailableLanguages (data) {
  if (!data || typeof data !== 'object') {
    return []
  }

  const languages = Object.values(data).map(lang => ({
    name: lang.name,
    language_id: lang.language_id
  }))

  return languages
}

/**
 * Extrae las voces disponibles para un idioma específico.
 * @param {Object} data - El objeto de datos.
 * @param {string} languageName - El nombre del idioma (por ejemplo, 'English').
 * @returns {Array<Object>} Un array de objetos con los detalles importantes de cada voz.
 */
function getVoicesByLanguage (data, languageName) {
  if (!data || typeof data !== 'object' || !languageName) {
    return []
  }

  const languageKey = Object.keys(data).find(key => data[key].name === languageName)

  if (!languageKey || !data[languageKey].voices) {
    console.warn(`No se encontraron voces para el idioma: ${languageName}`)
    return []
  }

  const voicesData = data[languageKey].voices

  const voices = Object.values(voicesData).map(voice => ({
    name: voice.voice_name,
    gender: voice.gender,
    engine_id: voice.engine_id,
    language_id: voice.language_id,
    voice_id: voice.voice_id
  }))

  return voices
}

/**
 * Obtiene la información de una voz por su nombre.
 * @param {Object} data - El objeto de datos completo.
 * @param {string} voiceName - El nombre de la voz a buscar.
 * @returns {Object|null} El objeto de la voz o null si no se encuentra.
 */
function getVoiceByName (data, voiceName) {
  if (!data || typeof data !== 'object' || !voiceName) {
    return null
  }

  for (const lang of Object.values(data)) {
    if (lang.voices) {
      const voice = Object.values(lang.voices).find(
        (v) => v.voice_name === voiceName
      )

      if (voice) {
        return {
          name: voice.voice_name,
          gender: voice.gender,
          engine_id: voice.engine_id,
          language_id: voice.language_id,
          voice_id: voice.voice_id
        }
      }
    }
  }

  return null
}

/**
 * Genera una URL para el servicio de texto a voz (TTS).
 * @param {string|number} engineId - El ID del motor TTS.
 * @param {string|number} languageId - El ID del idioma.
 * @param {string|number} voiceId - El ID de la voz.
 * @param {string} text - El texto a convertir a voz.
 * @returns {string} La URL completa para la solicitud TTS.
 */
function generateTtsUrl (engineId, languageId, voiceId, text) {
  const fixedParams = {
    ACC: '9066743',
    SceneID: '2770536',
    EXT: 'mp3'
  }

  const encodedText = text;

  const queryString = new URLSearchParams({
    EID: engineId,
    LID: languageId,
    VID: voiceId,
    TXT: encodedText,
    ...fixedParams
  }).toString()

  const baseUrl = 'https://cache-a.oddcast.com/tts/genC.php'

  return `${baseUrl}?${queryString}`
}

/**
 * Realiza una solicitud fetch a la URL del servicio TTS y devuelve un Blob
 * de la respuesta de audio.
 * @param {string|number} engineId - El ID del motor TTS.
 * @param {string|number} languageId - El ID del idioma.
 * @param {string|number} voiceId - El ID de la voz.
 * @param {string} text - El texto a convertir a voz.
 * @returns {Promise<Blob|null>} Una Promesa que resuelve a un objeto Blob o null si hay un error.
 */
async function generateAudio (engineId, languageId, voiceId, text) {
  try {
    const url = generateTtsUrl(engineId, languageId, voiceId, text)

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`)
    }

    // El Blob es ideal para datos de archivos como el audio en el navegador
    return await response.blob()
  } catch (error) {
    console.error('Ha ocurrido un error al generar el audio:', error)
    return null
  }
}