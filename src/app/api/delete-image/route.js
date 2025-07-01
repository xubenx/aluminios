import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json(
        { error: 'ModelId is required' },
        { status: 400 }
      );
    }

    // Definir la ruta de la imagen a eliminar
    const publicPath = path.join(process.cwd(), 'public', 'images');
    const filePath = path.join(publicPath, `${modelId}.png`);

    try {
      // Intentar eliminar el archivo
      await unlink(filePath);
      
      return NextResponse.json({
        message: 'Image deleted successfully',
        path: `/images/${modelId}.png`
      });
    } catch (error) {
      // Si el archivo no existe, no es un problema crítico
      if (error.code === 'ENOENT') {
        return NextResponse.json({
          message: 'Image not found, nothing to delete',
          path: `/images/${modelId}.png`
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
