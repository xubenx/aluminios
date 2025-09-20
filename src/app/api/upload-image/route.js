import { NextResponse } from 'next/server';
import { uploadModelImage } from '../../../utils/imageStorage';

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

    // Validar que sea un archivo de imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validar el tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Subir imagen a Firebase Storage
    const downloadURL = await uploadModelImage(file, modelId);

    return NextResponse.json({
      message: 'Image uploaded successfully to Firebase Storage',
      downloadURL: downloadURL,
      modelId: modelId
    });

  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    return NextResponse.json(
      { error: `Failed to upload image: ${error.message}` },
      { status: 500 }
    );
  }
}
