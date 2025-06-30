import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const modelId = formData.get('modelId');

    if (!file || !modelId) {
      return NextResponse.json(
        { error: 'File and modelId are required' },
        { status: 400 }
      );
    }

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Definir la ruta donde se guardará la imagen
    const publicPath = path.join(process.cwd(), 'public', 'images');
    const filePath = path.join(publicPath, `${modelId}.png`);

    // Crear el directorio si no existe
    try {
      await mkdir(publicPath, { recursive: true });
    } catch (error) {
      // El directorio ya existe, continuar
    }

    // Escribir el archivo
    await writeFile(filePath, buffer);

    return NextResponse.json({
      message: 'Image uploaded successfully',
      path: `/images/${modelId}.png`
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
