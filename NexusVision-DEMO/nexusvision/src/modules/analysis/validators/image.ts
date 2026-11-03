export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export async function validateImage(file: File): Promise<void> {
  if (!['image/png', 'image/jpeg'].includes(file.type) || !/\.(png|jpe?g)$/i.test(file.name))
    throw new Error('Selecciona una imagen JPG o PNG.');
  if (!file.size || file.size > MAX_IMAGE_SIZE)
    throw new Error('La imagen debe pesar entre 1 byte y 10 MB.');
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if ((file.type === 'image/png' && !png) || (file.type === 'image/jpeg' && !jpg))
    throw new Error('El contenido no coincide con el formato JPG/PNG indicado.');
}
export async function loadImage(file: File): Promise<string> {
  await validateImage(file);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('No se pudo abrir la imagen. Prueba con otro archivo JPG o PNG.');
  }
  const pixels = bitmap.width * bitmap.height;
  bitmap.close();
  if (pixels > 20_000_000)
    throw new Error('La imagen supera 20 megapíxeles. Reduce su resolución e inténtalo otra vez.');
  return URL.createObjectURL(file);
}
