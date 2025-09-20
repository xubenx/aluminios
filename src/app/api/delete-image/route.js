import { NextResponse } from 'next/server';
import { deleteModelImage } from '../../../utils/imageStorage';

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

    try {
      // Eliminar la imagen de Firebase Storage
      const success = await deleteModelImage(modelId);
      
      if (success) {
        return NextResponse.json({
          message: 'Image deleted successfully from Firebase Storage',
          modelId: modelId
        });
      } else {
        return NextResponse.json({
          message: 'Image not found in Firebase Storage',
          modelId: modelId
        }, { status: 404 });
      }

    } catch (error) {
      console.error('Error deleting image from Firebase Storage:', error);
      return NextResponse.json({
        error: 'Error deleting image from Firebase Storage',
        details: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}
