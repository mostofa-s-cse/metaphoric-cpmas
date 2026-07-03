import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import {
  apiSuccess,
  apiError,
  apiBadRequest,
  apiUnauthorized,
} from '@/lib/apiResponse';

const PATH = '/api/upload';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized(PATH);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiBadRequest('No file received.', PATH);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create a safe, unique filename
    const filename = Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    // Ensure public/uploads exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Ignore if directory exists
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    return apiSuccess({ url: `/uploads/${filename}` }, 'File uploaded successfully', PATH);
  } catch (error) {
    console.error('Error uploading file:', error);
    return apiError('Failed to upload file', PATH);
  }
}
