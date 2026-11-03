/**
 * Utilitário para redimensionar e comprimir imagens no navegador via Canvas.
 * Reduz imagens de vários megabytes para ~20KB-80KB, evitando estouro de cota
 * de armazenamento (ex: QuotaExceededError) e acelerando a renderização.
 */
export async function optimizeImage(
  fileOrDataUrl: File | string,
  maxWidth: number,
  maxHeight: number,
  quality = 0.85,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        if (!width || !height) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '')
          return
        }

        // Calcula proporções mantendo o aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '')
          return
        }

        // Desenha imagem redimensionada
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Tenta WebP com fallback para JPEG
        let dataUrl = canvas.toDataURL('image/webp', quality)
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(dataUrl)
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      reject(new Error('Não foi possível carregar a imagem para processamento.'))
    }

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl
    } else {
      const reader = new FileReader()
      reader.onload = () => {
        img.src = reader.result as string
      }
      reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem.'))
      reader.readAsDataURL(fileOrDataUrl)
    }
  })
}
