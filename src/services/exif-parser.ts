// Lightweight EXIF GPS parser - extracts GPS coordinates from JPEG images
// No external dependencies required

export interface GPSCoordinates {
  latitude: number
  longitude: number
}

export interface LocationInfo {
  coordinates: GPSCoordinates
  city?: string
  province?: string
  displayName?: string
}

/**
 * Extract GPS coordinates from a JPEG image file.
 * Parses the EXIF IFD0 to find the GPS IFD, then reads latitude/longitude.
 */
export function extractGPSFromJPEG(arrayBuffer: ArrayBuffer): GPSCoordinates | null {
  const view = new DataView(arrayBuffer)

  // Verify JPEG SOI marker
  if (view.getUint16(0) !== 0xFFD8) return null

  let offset = 2

  while (offset < view.byteLength - 1) {
    const marker = view.getUint16(offset)

    // APP1 marker (EXIF)
    if (marker === 0xFFE1) {
      const length = view.getUint16(offset + 2)
      return parseExifGPS(arrayBuffer, offset + 4, length - 2)
    }

    // Skip non-APP1 markers
    if ((marker & 0xFF00) === 0xFF00) {
      const segLength = view.getUint16(offset + 2)
      offset += 2 + segLength
    } else {
      break
    }
  }

  return null
}

function parseExifGPS(buffer: ArrayBuffer, start: number, length: number): GPSCoordinates | null {
  const view = new DataView(buffer, start, length)

  // Check "Exif\0\0" header
  if (
    view.getUint8(0) !== 0x45 || // E
    view.getUint8(1) !== 0x78 || // x
    view.getUint8(2) !== 0x69 || // i
    view.getUint8(3) !== 0x66 || // f
    view.getUint8(4) !== 0x00 ||
    view.getUint8(5) !== 0x00
  ) {
    return null
  }

  const tiffStart = 6
  const tiffView = new DataView(buffer, start + tiffStart, length - tiffStart)

  // Byte order
  const byteOrder = tiffView.getUint16(0)
  const littleEndian = byteOrder === 0x4949 // "II"
  if (byteOrder !== 0x4949 && byteOrder !== 0x4D4D) return null

  // TIFF magic number
  if (tiffView.getUint16(2, littleEndian) !== 42) return null

  // IFD0 offset
  const ifd0Offset = tiffView.getUint32(4, littleEndian)

  // Find GPS IFD pointer in IFD0
  const gpsIFDOffset = findGPSIFDOffset(tiffView, ifd0Offset, littleEndian)
  if (gpsIFDOffset === null) return null

  // Parse GPS IFD
  return parseGPSIFD(tiffView, gpsIFDOffset, littleEndian)
}

function findGPSIFDOffset(view: DataView, ifdOffset: number, le: boolean): number | null {
  if (ifdOffset + 2 > view.byteLength) return null
  const entryCount = view.getUint16(ifdOffset, le)

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdOffset + 2 + i * 12
    if (entryOffset + 12 > view.byteLength) break

    const tag = view.getUint16(entryOffset, le)
    if (tag === 0x8825) { // GPSInfoIFDPointer
      return view.getUint32(entryOffset + 8, le)
    }
  }

  return null
}

function parseGPSIFD(view: DataView, ifdOffset: number, le: boolean): GPSCoordinates | null {
  if (ifdOffset + 2 > view.byteLength) return null
  const entryCount = view.getUint16(ifdOffset, le)

  let latRef = ''
  let lonRef = ''
  let latValues: number[] | null = null
  let lonValues: number[] | null = null

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdOffset + 2 + i * 12
    if (entryOffset + 12 > view.byteLength) break

    const tag = view.getUint16(entryOffset, le)
    const type = view.getUint16(entryOffset + 2, le)
    const count = view.getUint32(entryOffset + 4, le)
    const valueOffset = view.getUint32(entryOffset + 8, le)

    switch (tag) {
      case 0x0001: // GPSLatitudeRef
        latRef = String.fromCharCode(view.getUint8(entryOffset + 8))
        break
      case 0x0002: // GPSLatitude (3 RATIONAL values)
        if (type === 5 && count === 3) {
          latValues = readRationals(view, valueOffset, 3, le)
        }
        break
      case 0x0003: // GPSLongitudeRef
        lonRef = String.fromCharCode(view.getUint8(entryOffset + 8))
        break
      case 0x0004: // GPSLongitude (3 RATIONAL values)
        if (type === 5 && count === 3) {
          lonValues = readRationals(view, valueOffset, 3, le)
        }
        break
    }
  }

  if (!latValues || !lonValues) return null

  let latitude = latValues[0] + latValues[1] / 60 + latValues[2] / 3600
  let longitude = lonValues[0] + lonValues[1] / 60 + lonValues[2] / 3600

  if (latRef === 'S') latitude = -latitude
  if (lonRef === 'W') longitude = -longitude

  // Sanity check
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null

  return { latitude, longitude }
}

function readRationals(view: DataView, offset: number, count: number, le: boolean): number[] {
  const values: number[] = []
  for (let i = 0; i < count; i++) {
    const pos = offset + i * 8
    if (pos + 8 > view.byteLength) break
    const numerator = view.getUint32(pos, le)
    const denominator = view.getUint32(pos + 4, le)
    values.push(denominator === 0 ? 0 : numerator / denominator)
  }
  return values
}

/**
 * Reverse geocode GPS coordinates to get city/location info.
 * Uses OpenStreetMap Nominatim API (free, no API key required).
 */
export async function reverseGeocode(coords: GPSCoordinates): Promise<LocationInfo> {
  const { latitude, longitude } = coords

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=zh&zoom=10`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'LightAsk-ChromeExtension/0.0.1' },
    })

    if (!response.ok) throw new Error('Geocoding failed')

    const data = await response.json()
    const address = data.address || {}

    return {
      coordinates: coords,
      city: address.city || address.town || address.county || address.state_district || '',
      province: address.state || address.province || '',
      displayName: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    }
  } catch {
    // Fallback: return coordinates only
    return {
      coordinates: coords,
      displayName: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    }
  }
}

/**
 * Extract GPS from a File object and attempt reverse geocoding.
 */
export async function getLocationFromImage(file: File): Promise<LocationInfo | null> {
  const buffer = await file.arrayBuffer()
  const coords = extractGPSFromJPEG(buffer)
  if (!coords) return null
  return reverseGeocode(coords)
}

/**
 * Convert a File to base64 data URL string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
